import {prepareNative,sha256} from '../lib/native.mjs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const args=process.argv.slice(2),allowed=new Set(['--scene','--work','--frames','--width','--height','--fps','--duration','--canvas-module']);
for(let i=0;i<args.length;i+=2)if(!allowed.has(args[i])||args[i+1]===undefined)throw Error('Expected supported --option value pairs');
const opt=k=>args.includes(k)?args[args.indexOf(k)+1]:undefined,root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const scenePath=resolve(opt('--scene')||join(root,'fixture/native-scene.mjs')),work=resolve(opt('--work')||join(root,'tmp/native-smoke')),out=join(work,'output');await mkdir(join(out,'frames'),{recursive:true});
const manifest={schema:1,backend:'native-canvas',startedAt:new Date().toISOString(),frames:[],status:'running'};let renderer;
try{renderer=await prepareNative({scenePath,canvasModulePath:opt('--canvas-module'),...Object.fromEntries(['width','height','fps','duration'].map(k=>[k,opt('--'+k)]))});manifest.identity=renderer.identity;manifest.fingerprint=renderer.fingerprint;manifest.config=renderer.info;
 const raw=opt('--frames');if(raw!==undefined&&!/^\d+(,\d+)*$/.test(raw))throw Error('Invalid --frames');const frames=raw?raw.split(',').map(Number):Array.from({length:renderer.info.frameCount},(_,i)=>i);
 for(const frame of frames){await renderer.renderFrame(frame);const data=renderer.png(),file=join(out,'frames',String(frame).padStart(6,'0')+'.png');await writeFile(file,data);manifest.frames.push({frame,sha256:sha256(data),bytes:data.length});}
 await renderer.verifyIdentity();manifest.status='passed';
}catch(e){manifest.status='failed';manifest.error=e.stack;process.exitCode=1;}finally{await renderer?.close();manifest.finishedAt=new Date().toISOString();await writeFile(join(out,'native-frame-report.json'),JSON.stringify(manifest,null,2));console.log(JSON.stringify({status:manifest.status,frames:manifest.frames.length,report:join(out,'native-frame-report.json'),error:manifest.error}));}
