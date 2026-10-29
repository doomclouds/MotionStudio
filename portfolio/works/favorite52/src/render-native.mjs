// Original V4 scene code -> canonical native Canvas -> raw RGBA -> FFmpeg.
import {prepareNative,sha256} from '../../../../engine/motion-render-core/lib/native.mjs';
import {mkdir,writeFile,readFile,rename,access} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
const project=resolve(dirname(fileURLToPath(import.meta.url)),'..'),args=process.argv.slice(2);
for(let i=0;i<args.length;i+=2)if(!['--range','--name'].includes(args[i])||!args[i+1])throw Error('Expected --range start:end and --name label');
const opt=(k,d)=>args.includes(k)?args[args.indexOf(k)+1]:d,name=opt('--name','native-batch');if(!/^[a-zA-Z0-9_-]+$/.test(name))throw Error('Invalid label');
const range=opt('--range','0:1560');if(!/^\d+:\d+$/.test(range))throw Error('Invalid range');const[start,end]=range.split(':').map(Number);if(start>=end||end>1560)throw Error('Invalid frame bounds');
const work=process.env.FAVORITE52_WORK;if(!work)throw Error('Explicit external FAVORITE52_WORK required');
const out=join(work,'tmp/native-batches',name),partial=join(out,'video.partial.mp4'),target=join(out,'video.mp4');
try{await access(out);throw Error('Refusing to overwrite existing batch '+out);}catch(e){if(e.code!=='ENOENT')throw e;}
await mkdir(join(out,'keyframes'),{recursive:true});
const report={schema:1,status:'running',start,end,frames:[],startedAt:new Date().toISOString(),backend:'native-canvas',normalSpeedWatching:'not performed'};let r,ff;
try{
 r=await prepareNative({scenePath:join(project,'src/scene-native.mjs')});report.identity=r.identity;report.fingerprint=r.fingerprint;report.adapterSHA256=sha256(await readFile(fileURLToPath(import.meta.url)));
 ff=spawn('ffmpeg',['-v','error','-f','rawvideo','-pixel_format','rgba','-video_size','1920x1080','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','18','-vf','scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-g','30','-threads','2','-movflags','+faststart',partial],{stdio:['pipe','ignore','pipe']});let stderr='';ff.stderr.on('data',b=>stderr=(stderr+b).slice(-16384));ff.stdin.on('error',()=>{});const exit=new Promise((ok,bad)=>{ff.once('error',bad);ff.once('exit',(code,signal)=>code===0?ok():bad(Error('FFmpeg '+code+'/'+signal+': '+stderr)));});exit.catch(()=>{});
 for(let f=start;f<end;f++){
  await r.renderFrame(f);const data=Buffer.from(r.canvas.data());if(data.length!==1920*1080*4)throw Error('RGBA byte count');report.frames.push({frame:f,rgbaSHA256:sha256(data)});
  if(f===start||f===end-1||f===Math.floor((start+end)/2))await writeFile(join(out,'keyframes',String(f).padStart(6,'0')+'.png'),r.png());
  if(!ff.stdin.write(data))await Promise.race([once(ff.stdin,'drain'),exit.then(()=>{throw Error('Encoder exited early');})]);
  if((f-start+1)%30===0){console.log(JSON.stringify({frame:f,end}));await writeFile(join(out,'progress.json'),JSON.stringify({lastFrame:f,start,end,at:new Date().toISOString()}));}
 }
 ff.stdin.end();await exit;ff=null;
 report.reverse=[];for(const f of [...new Set([end-1,Math.floor((start+end)/2),start])]){await r.renderFrame(f);const equal=sha256(r.canvas.data())===report.frames.find(x=>x.frame===f).rgbaSHA256;report.reverse.push({frame:f,equal});if(!equal)throw Error('Reverse seek mismatch '+f);}
 await r.verifyIdentity();await r.close();r=null;
 const probe=spawnSync('ffprobe',['-v','error','-count_frames','-show_streams','-of','json',partial],{encoding:'utf8'});if(probe.status!==0)throw Error(probe.stderr);report.probe=JSON.parse(probe.stdout);const v=report.probe.streams[0];if(+v.nb_read_frames!==end-start||v.width!==1920||v.height!==1080||v.avg_frame_rate!=='30/1')throw Error('Encoded contract mismatch');
 if(sha256(await readFile(fileURLToPath(import.meta.url)))!==report.adapterSHA256)throw Error('Adapter changed during capture');
 await rename(partial,target);report.status='passed';report.file=target;report.mp4SHA256=sha256(await readFile(target));
}catch(e){report.status='failed';report.error=e.stack;process.exitCode=1;}finally{if(ff)ff.kill('SIGTERM');await r?.close();report.finishedAt=new Date().toISOString();await writeFile(join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,file:report.file,frames:report.frames.length,error:report.error}));}
