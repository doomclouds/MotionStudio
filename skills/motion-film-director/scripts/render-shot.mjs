// Native Canvas source-to-video entrypoint. No browser or fallback backend.
import {readFile,writeFile,mkdir,rename,access} from 'node:fs/promises';
import {resolve,join,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const args=process.argv.slice(2),allowed=new Set(['--work','--scene','--audio','--canvas-module','--ffmpeg','--ffprobe','--chunk-frames']);
for(let i=0;i<args.length;i+=2)if(!allowed.has(args[i])||args[i+1]===undefined)throw Error('Expected supported option/value pairs; see references/engine-use.md');
const opt=k=>args.includes(k)?args[args.indexOf(k)+1]:undefined;
if(!opt('--work'))throw Error('--work required');
const skill=resolve(dirname(fileURLToPath(import.meta.url)),'..'),work=resolve(opt('--work')),out=join(work,'output');
if(work===skill||work.startsWith(skill+sep))throw Error('Work must be outside Skill source');
const locator=JSON.parse(await readFile(join(skill,'runtime-source.json'),'utf8'));
if(!['workspace','bundled'].includes(locator.mode)||locator.relativePath!==(locator.mode==='workspace'?'../../engine/motion-render-core':'runtime/motion-render-core'))throw Error('Unexpected canonical engine pointer');
const engine=resolve(skill,locator.relativePath),scene=resolve(opt('--scene')||join(engine,'fixture/native-scene.mjs'));
for(const p of [join(out,'native-frame-report.json'),join(out,'shot.mp4'),join(out,'shot.partial.mp4')]){try{await access(p);throw Error('Work output already exists; choose a fresh --work');}catch(e){if(e.code!=='ENOENT')throw e;}}
await mkdir(out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const run=(exe,argv)=>{const r=spawnSync(exe,argv,{encoding:'utf8',maxBuffer:8*1024*1024});if(r.error||r.status!==0)throw Error(exe+' failed: '+String(r.error||r.stderr||r.stdout).slice(-4000));return r.stdout;};
const ffmpeg=opt('--ffmpeg')||'ffmpeg',ffprobe=opt('--ffprobe')||'ffprobe';
const chunkText=opt('--chunk-frames');
if(chunkText!==undefined){const {chunkSize}=await import(join(engine,'lib/stream.mjs'));chunkSize(chunkText);}
const execute=chunkText===undefined?run:(await import(join(engine,'lib/stream.mjs'))).runChecked;
const report={schema:1,backend:'native-canvas',status:'running',startedAt:new Date().toISOString(),scene,artisticAcceptance:'not_checked',audioListening:'not_checked'};
try{
 await execute(ffmpeg,['-version']);await execute(ffprobe,['-version']);
 let frames,c;
 const audio=opt('--audio');let aa=[];
 const prepareAudio=async()=>{
  if(audio){const p=resolve(audio),bytes=await readFile(p),copy=join(out,'audio-source'+(p.match(/\.[a-z0-9]+$/i)?.[0]||'.wav'));await writeFile(copy,bytes);aa=['-i',copy];report.audio={sha256:sha(bytes),mode:'provided audio; listening not checked'};}else report.audio={mode:'intentional silent technical output'};
 };
 const partial=join(out,'shot.partial.mp4'),final=join(out,'shot.mp4');
 const encodeArgs=(config,stream=false)=>['-v','error','-y',...(stream?['-f','image2pipe','-vcodec','png']:[]),'-framerate',`${config.fpsNum}/${config.fpsDen}`,'-i',stream?'pipe:0':join(out,'frames','%06d.png'),...aa,'-frames:v',String(config.frameCount),'-t',String(config.duration),'-map','0:v:0',...(audio?['-map','1:a:0','-c:a','aac','-ar','48000','-b:a','192k']:['-an']),'-c:v','libx264','-threads','1','-preset','veryfast','-crf','16','-pix_fmt','yuv420p','-movflags','+faststart',partial];
 if(chunkText!==undefined){
  const {renderStream}=await import(join(engine,'lib/stream.mjs'));
  frames=await renderStream({scenePath:scene,canvasModulePath:opt('--canvas-module'),out,chunkFrames:chunkText,ffmpeg,makeEncoderArgs:async config=>{await prepareAudio();return encodeArgs(config,true);}});c=frames.config;
  report.mode='sequential-png-stream';report.chunkFrames=Number(chunkText);report.streamIdentity=frames.streamIdentity;
 }else{
  run(process.execPath,[join(engine,'scripts/render.mjs'),'--scene',scene,'--work',work,...(opt('--canvas-module')?['--canvas-module',opt('--canvas-module')]:[])]);
  frames=JSON.parse(await readFile(join(out,'native-frame-report.json'),'utf8'));c=frames.config;
  if(frames.status!=='passed'||frames.frames.length!==c.frameCount)throw Error('Incomplete native frames');
  for(let i=0;i<c.frameCount;i++){const f=frames.frames[i];if(f.frame!==i||sha(await readFile(join(out,'frames',String(i).padStart(6,'0')+'.png')))!==f.sha256)throw Error('Frame identity mismatch');}
  if(sha(await readFile(join(engine,'lib/native.mjs')))!==frames.identity.engineHash)throw Error('Engine changed before encode');
  // Native report hashes and source checks bind encoding; do not use old-backend frames.
  for(const source of frames.identity.sources)if(sha(await readFile(source.path))!==source.sha256)throw Error('Scene changed before encode');
  await prepareAudio();run(ffmpeg,encodeArgs(c));
 }
 const probe=JSON.parse(await execute(ffprobe,['-v','error','-count_frames','-show_streams','-show_format','-of','json',partial])),v=probe.streams.find(s=>s.codec_type==='video');
 const [n,d]=v.avg_frame_rate.split('/').map(Number);
 if(v.width!==c.width||v.height!==c.height||Number(v.nb_read_frames)!==c.frameCount||Math.abs(n/d-c.fps)>1e-8||Math.abs(Number(probe.format.duration)-c.duration)>.05)throw Error('Encoded config mismatch');
 await execute(ffmpeg,['-v','error','-i',partial,'-f','null','-']);
 report.fingerprint=frames.fingerprint;report.config=c;report.probe=probe;report.fullDecode='passed';report.mp4SHA256=sha(await readFile(partial));await rename(partial,final);report.status='passed';report.file=final;
}catch(e){report.status='failed';report.error=String(e.stack||e);process.exitCode=1;}
report.finishedAt=new Date().toISOString();await writeFile(join(out,'shot-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
