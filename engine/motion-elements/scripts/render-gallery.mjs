import {mkdir,writeFile,readFile,rename,unlink} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';

const args=process.argv.slice(2);let out,reducedMotion=false,frame,demo='gallery';
for(let i=0;i<args.length;i++){if(args[i]==='--out')out=args[++i];else if(args[i]==='--reduced-motion')reducedMotion=true;else if(args[i]==='--demo')demo=args[++i];else if(args[i]==='--frame')frame=Number(args[++i]);else throw Error('Unknown argument '+args[i]);}
if(!['gallery','path','settle-reveal','tiles'].includes(demo))throw Error('demo must be gallery, path, settle-reveal or tiles');
const {createGalleryScene,config}=await import(demo==='tiles'?'../examples/tiles-scene.mjs':demo==='path'?'../examples/path-scene.mjs':demo==='settle-reveal'?'../examples/settle-reveal-scene.mjs':'../examples/gallery-scene.mjs');
if(!out)throw Error('Usage: node scripts/render-gallery.mjs --out NEW_DIRECTORY [--frame 0..239] [--reduced-motion] [--demo gallery|path|settle-reveal|tiles]');
if(frame!==undefined&&(!Number.isSafeInteger(frame)||frame<0||frame>=240))throw Error('frame must be 0..239');
out=resolve(out);await mkdir(out,{recursive:false});
const {api,version}=loadNativeCanvas(),canvas=api.createCanvas(config.width,config.height),ctx=canvas.getContext('2d');
const scene=await createGalleryScene({canvas,ctx,GlobalFonts:api.GlobalFonts,canvasApi:api,config},{reducedMotion});
if(frame!==undefined){scene.renderFrame(frame);await writeFile(join(out,'frame.png'),canvas.toBuffer('image/png'));console.log(JSON.stringify({out,frame,demo,reducedMotion,font:scene.font}));}
else {
  const output=join(out,'motion-elements-gallery.mp4'),partial=join(out,'gallery.partial.mp4');
  const proc=spawn('ffmpeg',['-nostdin','-v','error','-f','rawvideo','-pix_fmt','rgba','-s',`${config.width}x${config.height}`,'-r','30','-i','pipe:0','-an','-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart','-n',partial],{stdio:['pipe','ignore','pipe']});
  let error='',spawnError;proc.stderr.on('data',x=>{error=(error+x.toString()).slice(-65536);});
  proc.on('error',e=>{spawnError=e;});proc.stdin.on('error',()=>{});
  const done=new Promise(resolve=>proc.once('close',(code,signal)=>resolve({code,signal})));
  try{
    await once(proc,'spawn');
    for(let f=0;f<240;f++){
      scene.renderFrame(f);
      const bytes=Buffer.from(ctx.getImageData(0,0,config.width,config.height).data);
      await new Promise((resolve,reject)=>proc.stdin.write(bytes,e=>e?reject(e):resolve()));
    }
    proc.stdin.end();const result=await done;
    if(spawnError||result.code!==0)throw Error(`FFmpeg failed: ${spawnError?.message||result.code}: ${error}`);
    await rename(partial,output);
  }catch(e){
    proc.stdin.destroy();if(proc.exitCode===null)proc.kill('SIGTERM');
    await done;await unlink(partial).catch(()=>{});throw e;
  }
  const sha256=createHash('sha256').update(await readFile(output)).digest('hex');
  const verification={demo,frames:240,fps:30,duration:8,width:1280,height:720,reducedMotion,canvas:version,font:scene.font,sha256,audio:'none',artisticReview:'NOT_RUN'};
  await writeFile(join(out,'render.json'),JSON.stringify(verification,null,2)+'\n');console.log(JSON.stringify({out,...verification}));
}
