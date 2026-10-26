// Deterministic native Canvas backend. No browser, sockets, CDP or downloads.
import {createRequire} from 'node:module';
import {readFile,realpath,stat} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
export const sha256=x=>createHash('sha256').update(x).digest('hex');
export function nativeConfig(values={}) {
 const c={width:1280,height:720,fps:30,duration:6,...values};
 for(const k of ['width','height'])if(!Number.isSafeInteger(Number(c[k]))||c[k]<=0||c[k]>16384)throw Error('Invalid '+k);else c[k]=Number(c[k]);
 let num,den; const text=String(c.fps),m=/^(\d+)(?:\/(\d+))?$/.exec(text);
 if(m){num=Number(m[1]);den=Number(m[2]||1);}else if(/^\d+\.\d+$/.test(text)){den=10**text.split('.')[1].length;num=Number(text.replace('.',''));}else throw Error('Invalid fps');
 if(!Number.isSafeInteger(num)||!Number.isSafeInteger(den)||num<=0||den<=0)throw Error('Invalid fps');
 c.fps=num/den;c.fpsNum=num;c.fpsDen=den;c.duration=Number(c.duration);const n=c.fps*c.duration;
 if(!Number.isFinite(n)||!Number.isSafeInteger(Math.round(n))||n<=0||Math.abs(n-Math.round(n))>1e-6)throw Error('duration * fps must be a positive integer');
 c.frameCount=Math.round(n);return c;
}
export function loadNativeCanvas(explicit) {
 const path=explicit||process.env.MOTIONSTUDIO_CANVAS_MODULE;
 const candidates=path?[path]:['@napi-rs/canvas','/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas'];
 let last;for(const candidate of candidates){try{const entry=require.resolve(candidate);const api=require(entry);const pkg=require(join(dirname(entry),'package.json'));return{api,entry,version:pkg.version};}catch(e){last=e;}}
 throw Error('Installed @napi-rs/canvas unavailable; set MOTIONSTUDIO_CANVAS_MODULE. No automatic installation. '+last?.message);
}
export async function prepareNative({scenePath,canvasModulePath,...overrides}={}) {
 if(!scenePath)throw Error('scenePath required');scenePath=await realpath(scenePath);
 const entryBefore=sha256(await readFile(scenePath));
 const scene=await import(pathToFileURL(scenePath).href+'?source='+entryBefore);if(typeof scene.createScene!=='function')throw Error('Scene must export createScene');
 const clean=Object.fromEntries(Object.entries(overrides).filter(([k,v])=>['width','height','fps','duration'].includes(k)&&v!==undefined));
 const config=nativeConfig({...scene.config,...clean});
 for(const k of ['width','height','fps','duration'])if(scene.config?.[k]!==undefined&&clean[k]!==undefined&&nativeConfig(scene.config)[k]!==config[k])throw Error('Override conflicts with scene '+k+'; adapt source explicitly');
 const {api,entry,version}=loadNativeCanvas(canvasModulePath);const canvas=api.createCanvas(config.width,config.height),ctx=canvas.getContext('2d');
 const sources=[];for(const p of [scenePath,...(scene.dependencies||[]).map(p=>resolve(dirname(scenePath),p))]){const file=await realpath(p);if(!(await stat(file)).isFile())throw Error('Dependency must be file');sources.push({path:file,sha256:sha256(await readFile(file))});}
 if(sources[0].sha256!==entryBefore)throw Error('Scene changed while importing');
 const verifyIdentity=async()=>{for(const source of sources)if(sha256(await readFile(source.path))!==source.sha256)throw Error('Scene dependency changed during render: '+source.path);};
 const instance=await scene.createScene({canvas,ctx,canvasApi:api,config,createCanvas:api.createCanvas,GlobalFonts:api.GlobalFonts});
 if(!instance||!(typeof instance.renderFrame==='function'||typeof instance.render==='function'))throw Error('Scene must return render(t) or renderFrame(frame,t)');
 await verifyIdentity();
 const engineHash=sha256(await readFile(fileURLToPath(import.meta.url)));
 const identity={backend:'native-canvas',node:process.version,canvas:version,platform:process.platform,arch:process.arch,engineHash,config,sources};
 const fingerprint=sha256(JSON.stringify(identity));let closed=false;
 return {info:config,identity,fingerprint,canvas,ctx,canvasModule:entry,verifyIdentity,
  async renderFrame(frame){if(closed)throw Error('Renderer closed');if(!Number.isSafeInteger(frame)||frame<0||frame>=config.frameCount)throw Error('Frame outside [0,frameCount)');ctx.reset();ctx.clearRect(0,0,config.width,config.height);if(instance.renderFrame)await instance.renderFrame(frame,frame/config.fps);else await instance.render(frame/config.fps);return canvas;},
  png(){if(closed)throw Error('Renderer closed');return canvas.toBuffer('image/png');},
  async close(){if(!closed){closed=true;await instance.close?.();}}
 };
}
