// Native Canvas source-to-video entrypoint. No browser or fallback backend.
import {readFile,writeFile,mkdir,rename,access,mkdtemp} from 'node:fs/promises';
import {resolve,join,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const args=process.argv.slice(2),allowed=new Set(['--work','--scene','--audio','--audio-timeline','--source-root','--canvas-module','--ffmpeg','--ffprobe','--chunk-frames']);
for(let i=0;i<args.length;i+=2)if(!allowed.has(args[i])||args[i+1]===undefined)throw Error('Expected supported option/value pairs; see references/engine-use.md');
for(const key of allowed)if(key!=='--source-root'&&args.filter(a=>a===key).length>1)throw Error('Duplicate option: '+key);
const opt=k=>args.includes(k)?args[args.indexOf(k)+1]:undefined;
if(opt('--audio')&&opt('--audio-timeline'))throw Error('--audio and --audio-timeline are mutually exclusive');
if(args.includes('--source-root')&&!opt('--audio-timeline'))throw Error('--source-root requires --audio-timeline');
if(!opt('--work'))throw Error('--work required');
const skill=resolve(dirname(fileURLToPath(import.meta.url)),'..'),work=resolve(opt('--work')),out=join(work,'output');
if(work===skill||work.startsWith(skill+sep))throw Error('Work must be outside Skill source');
const locator=JSON.parse(await readFile(join(skill,'runtime-source.json'),'utf8'));
if(!['workspace','bundled'].includes(locator.mode)||locator.relativePath!==(locator.mode==='workspace'?'../../engine/motion-render-core':'runtime/motion-render-core'))throw Error('Unexpected canonical engine pointer');
const engine=resolve(skill,locator.relativePath),scene=resolve(opt('--scene')||join(engine,'fixture/native-scene.mjs'));
for(const p of [join(out,'shot-report.json'),join(out,'native-frame-report.json'),join(out,'shot.mp4'),join(out,'shot.partial.mp4')]){try{await access(p);throw Error('Work output already exists; choose a fresh --work');}catch(e){if(e.code!=='ENOENT')throw e;}}
await mkdir(out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const ffmpeg=opt('--ffmpeg')||'ffmpeg',ffprobe=opt('--ffprobe')||'ffprobe';
const chunkText=opt('--chunk-frames');
if(chunkText!==undefined){const {chunkSize}=await import(join(engine,'lib/stream.mjs'));chunkSize(chunkText);}
const runChecked=(await import(join(engine,'lib/stream.mjs'))).runChecked;
const controller=new AbortController();const cancel=()=>controller.abort();
const execute=async(exe,argv)=>{if(controller.signal.aborted)throw Error('Render canceled');const result=await runChecked(exe,argv);if(controller.signal.aborted)throw Error('Render canceled');return result;};
process.on('SIGINT',cancel);process.on('SIGTERM',cancel);
let mix,mixReport,timelineBytes,timelinePath;
const audioTimeline=opt('--audio-timeline');
const report={schema:1,backend:'native-canvas',status:'running',startedAt:new Date().toISOString(),scene,artisticAcceptance:'not_checked',audioListening:'not_checked'};
try{
 await execute(ffmpeg,['-version']);await execute(ffprobe,['-version']);
 let frames,c;
 const audio=opt('--audio'),hasAudio=Boolean(audio||audioTimeline);let aa=[];
 const prepareAudio=async config=>{
  if(audioTimeline){
   timelinePath=resolve(audioTimeline);timelineBytes=await readFile(timelinePath);
   const {prepareMix,validateAudioPlan}=await import(join(dirname(engine),'motion-audio-core/lib/audio.mjs'));
   const {compare,framesToTime,rational}=await import(join(dirname(engine),'motion-timeline-core/lib/timeline.mjs'));
   const plan=validateAudioPlan(JSON.parse(timelineBytes));
   if(compare(plan.project.frameRate,rational(config.fpsNum,config.fpsDen))!==0)throw Error('Audio timeline frameRate does not match video exact rational fps');
   if(compare(plan.project.duration,framesToTime(config.frameCount,rational(config.fpsNum,config.fpsDen)))!==0)throw Error('Audio timeline duration does not match video frameCount/fps');
   const roots=args.flatMap((a,i)=>a==='--source-root'?[resolve(args[i+1])]:[]);
   const privateDir=await mkdtemp(join(out,'audio-mix-'));
   mix=await prepareMix(plan,{sourceBaseDir:dirname(timelinePath),sourceRoots:roots.length?roots:[dirname(timelinePath)],workDir:join(privateDir,'mix'),ffmpeg,ffprobe,signal:controller.signal});
   mixReport=await mix.render({encodeAAC:false});
   aa=['-i',mixReport.outputs.master.path];
   report.audio={mode:'audio-timeline',timelinePath,timelineSHA256:sha(timelineBytes),identities:mixReport.identities,master:mixReport.outputs.master,mixReport,sourceRoots:roots.length?roots:[dirname(timelinePath)]};
  }else
  if(audio){const p=resolve(audio),bytes=await readFile(p),copy=join(out,'audio-source'+(p.match(/\.[a-z0-9]+$/i)?.[0]||'.wav'));await writeFile(copy,bytes);aa=['-i',copy];report.audio={sha256:sha(bytes),mode:'provided audio; listening not checked'};}else report.audio={mode:'intentional silent technical output'};
 };
 const partial=join(out,'shot.partial.mp4'),final=join(out,'shot.mp4');
 const encodeArgs=(config,stream=false)=>['-v','error','-y',...(stream?['-f','image2pipe','-vcodec','png']:[]),'-framerate',`${config.fpsNum}/${config.fpsDen}`,'-i',stream?'pipe:0':join(out,'frames','%06d.png'),...aa,'-frames:v',String(config.frameCount),'-t',String(config.duration),'-map','0:v:0',...(hasAudio?['-map','1:a:0','-c:a','aac','-ar','48000','-b:a','192k']:['-an']),'-c:v','libx264','-threads','1','-preset','veryfast','-crf','16','-pix_fmt','yuv420p','-movflags','+faststart',partial];
 if(chunkText!==undefined){
  const {renderStream}=await import(join(engine,'lib/stream.mjs'));
  frames=await renderStream({scenePath:scene,canvasModulePath:opt('--canvas-module'),out,chunkFrames:chunkText,ffmpeg,makeEncoderArgs:async config=>{await prepareAudio(config);return encodeArgs(config,true);}});c=frames.config;
  report.mode='sequential-png-stream';report.chunkFrames=Number(chunkText);report.streamIdentity=frames.streamIdentity;
 }else{
  await execute(process.execPath,[join(engine,'scripts/render.mjs'),'--scene',scene,'--work',work,...(opt('--canvas-module')?['--canvas-module',opt('--canvas-module')]:[])]);
  frames=JSON.parse(await readFile(join(out,'native-frame-report.json'),'utf8'));c=frames.config;
  if(frames.status!=='passed'||frames.frames.length!==c.frameCount)throw Error('Incomplete native frames');
  for(let i=0;i<c.frameCount;i++){const f=frames.frames[i];if(f.frame!==i||sha(await readFile(join(out,'frames',String(i).padStart(6,'0')+'.png')))!==f.sha256)throw Error('Frame identity mismatch');}
  if(sha(await readFile(join(engine,'lib/native.mjs')))!==frames.identity.engineHash)throw Error('Engine changed before encode');
  // Native report hashes and source checks bind encoding; do not use old-backend frames.
  for(const source of frames.identity.sources)if(sha(await readFile(source.path))!==source.sha256)throw Error('Scene changed before encode');
  await prepareAudio(c);await execute(ffmpeg,encodeArgs(c));
 }
 const probe=JSON.parse(await execute(ffprobe,['-v','error','-count_frames','-show_streams','-show_format','-of','json',partial])),v=probe.streams.find(s=>s.codec_type==='video');
 const [n,d]=v.avg_frame_rate.split('/').map(Number);
 if(v.width!==c.width||v.height!==c.height||Number(v.nb_read_frames)!==c.frameCount||BigInt(n)*BigInt(c.fpsDen)!==BigInt(d)*BigInt(c.fpsNum)||Math.abs(Number(probe.format.duration)-c.duration)>.05)throw Error('Encoded config mismatch');
 await execute(ffmpeg,['-v','error','-i',partial,'-f','null','-']);
 if(mix){
  await mix.verifyIdentity();
  if(sha(await readFile(timelinePath))!==sha(timelineBytes))throw Error('Audio timeline changed during render');
  if(sha(await readFile(mixReport.outputs.master.path))!==mixReport.outputs.master.sha256)throw Error('Mixed master changed during encode');
  const {inspectEncodedAudio}=await import(join(dirname(engine),'motion-audio-core/lib/audio.mjs'));
  report.audio.finalEncodedQC=await inspectEncodedAudio(partial,{sourceRoots:[out],workDir:join(dirname(dirname(mixReport.outputs.master.path)),'final-qc'),expectedFrames:mixReport.outputs.master.frames,channels:mixReport.outputs.master.channels,ffmpeg,ffprobe,signal:controller.signal});
  await mix.verifyIdentity();
  report.audio.finalEncodedQC.measuredPath=partial;report.audio.finalEncodedQC.path=final;
 }
 if(controller.signal.aborted)throw Error('Render canceled');
 report.fingerprint=frames.fingerprint;report.config=c;report.probe=probe;report.fullDecode='passed';report.mp4SHA256=sha(await readFile(partial));if(mix&&report.mp4SHA256!==report.audio.finalEncodedQC.sha256)throw Error('Encoded MP4 changed after audio QC');await rename(partial,final);report.status='passed';report.file=final;
}catch(e){report.status='failed';report.error=String(e.stack||e);process.exitCode=1;}finally{await mix?.close();process.removeListener('SIGINT',cancel);process.removeListener('SIGTERM',cancel);}
report.finishedAt=new Date().toISOString();await writeFile(join(out,'shot-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
