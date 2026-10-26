// Opt-in worker recycling for absolute-time, stateless scenes. Not a hard RSS cap.
import {spawn} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {sha256} from './native.mjs';

export function chunkSize(value){
 if(!/^[1-9]\d*$/.test(String(value))||!Number.isSafeInteger(Number(value)))throw Error('--chunk-frames must be a positive safe integer');
 return Number(value);
}

// Async owned commands for opt-in preflight and verification, including cancellation.
export function runChecked(exe,args){
 return new Promise((resolve,reject)=>{
  const child=spawn(exe,args,{stdio:['ignore','pipe','pipe']});
  let stdout='',stderr='',failure,timer;
  const stop=error=>{
   failure ||= error;child.kill('SIGTERM');
   timer ||= setTimeout(()=>child.kill('SIGKILL'),1000);timer.unref();
  };
  const onInt=()=>stop(Error('Render canceled: SIGINT')),onTerm=()=>stop(Error('Render canceled: SIGTERM'));
  process.on('SIGINT',onInt);process.on('SIGTERM',onTerm);
  child.stdout.on('data',data=>{if(failure)return;stdout+=data.toString();if(Buffer.byteLength(stdout)>8*1024*1024)stop(Error('Command output exceeded limit'));});
  child.stderr.on('data',data=>{stderr=(stderr+data.toString()).slice(-4000);});
  child.once('error',error=>{failure ||= error;});
  child.once('close',(code,signal)=>{
   clearTimeout(timer);process.removeListener('SIGINT',onInt);process.removeListener('SIGTERM',onTerm);
   if(failure)reject(failure);else if(code!==0)reject(Error(`${exe} failed (${signal||code}): ${stderr}`));else resolve(stdout);
  });
 });
}

// makeEncoderArgs keeps encoding/audio policy in the existing video wrapper.
export async function renderStream({scenePath,canvasModulePath,out,chunkFrames,ffmpeg,makeEncoderArgs}){
 chunkFrames=chunkSize(chunkFrames);
 const report={schema:1,backend:'native-canvas',mode:'sequential-png-stream',chunkFrames,startedAt:new Date().toISOString(),frames:[],status:'running'};
 const children=new Set();let encoder,encoderDone,finishing=false,failed,abortReject;
 const aborted=new Promise((_,reject)=>{abortReject=reject;});aborted.catch(()=>{});
 const fail=error=>{if(!failed){failed=error instanceof Error?error:Error(String(error));abortReject(failed);}};
 const wait=promise=>Promise.race([promise,aborted]);
 const interrupt=signal=>fail(Error('Render canceled: '+signal));
 const onInt=()=>interrupt('SIGINT'),onTerm=()=>interrupt('SIGTERM');
 process.on('SIGINT',onInt);process.on('SIGTERM',onTerm);
 const workerURL=new URL('../scripts/render-stream-worker.mjs',import.meta.url);
 const launch=(exe,args,options,label)=>{
  const child=spawn(exe,args,options);children.add(child);let stderr='';
  child.stderr?.on('data',data=>{stderr=(stderr+data.toString()).slice(-4000);});
  const done=new Promise((resolve,reject)=>{
   child.once('error',reject);
   child.once('close',(code,signal)=>{children.delete(child);if(code===0)resolve();else reject(Error(`${label} failed (${signal||code}): ${stderr}`));});
  });
  done.catch(fail);return {child,done};
 };
 try {
  report.streamIdentity={coordinatorSHA256:sha256(await readFile(new URL(import.meta.url))),workerSHA256:sha256(await readFile(workerURL))};
  for(let start=0;!report.config||start<report.config.frameCount;start+=chunkFrames){
   const {child:worker,done}=launch(process.execPath,[fileURLToPath(workerURL),scenePath,canvasModulePath||'',String(start),String(chunkFrames)],{stdio:['ignore','pipe','pipe','ipc']},'Render worker');
   let readyResolve,complete=false,received=0,expectedBytes=0,next=start;
   const ready=new Promise(resolve=>{readyResolve=resolve;});
   worker.on('message',message=>{
    if(message.type==='ready')readyResolve(message);
    else if(message.type==='frame'){
     if(message.frame!==next||!Number.isSafeInteger(message.bytes)||message.bytes<1||! /^[a-f0-9]{64}$/.test(message.sha256)){fail(Error('Invalid streamed frame report'));return;}
     next++;expectedBytes+=message.bytes;report.frames.push({frame:message.frame,sha256:message.sha256,bytes:message.bytes});
    }else if(message.type==='complete')complete=message.start===start&&message.end===Math.min(start+chunkFrames,report.config.frameCount);
   });
   // A clean but premature worker exit must not leave a pending ready promise.
   done.then(()=>{if(!complete)fail(Error('Incomplete render worker'));},()=>{});
   const metadata=await wait(ready);
   if(metadata.workerSHA256!==report.streamIdentity.workerSHA256)throw Error('Worker entry source identity mismatch');
   if(!report.config){
    report.config=metadata.config;report.identity=metadata.identity;report.fingerprint=metadata.fingerprint;
    const args=await wait(Promise.resolve(makeEncoderArgs(report.config)));
    const launched=launch(ffmpeg,args,{stdio:['pipe','ignore','pipe']},'FFmpeg');encoder=launched.child;encoderDone=launched.done;
    encoder.stdin.on('error',fail);
    encoderDone.then(()=>{if(!finishing)fail(Error('FFmpeg exited before stream completion'));},()=>{});
   }else if(metadata.fingerprint!==report.fingerprint)throw Error('Worker source identity mismatch');
   worker.stdout.on('data',bytes=>{received+=bytes.length;});
   worker.stdout.on('error',fail);
   worker.stdout.pipe(encoder.stdin,{end:false});
   worker.send({type:'start'},error=>{if(error)fail(error);});
   await wait(done);
   worker.stdout.unpipe(encoder.stdin);
   if(!complete||next!==Math.min(start+chunkFrames,report.config.frameCount)||received!==expectedBytes)throw Error('Incomplete streamed frames');
  }
  finishing=true;encoder.stdin.end();await wait(encoderDone);
  // Recheck declared sources, engine, and the new orchestration entrypoints.
  if(sha256(await readFile(new URL(import.meta.url)))!==report.streamIdentity.coordinatorSHA256||sha256(await readFile(workerURL))!==report.streamIdentity.workerSHA256)throw Error('Stream orchestration source changed during render');
  for(const source of report.identity.sources)if(sha256(await readFile(source.path))!==source.sha256)throw Error('Scene changed during stream');
  if(sha256(await readFile(new URL('./native.mjs',import.meta.url)))!==report.identity.engineHash)throw Error('Engine changed during stream');
  if(failed)throw failed;
  report.status='passed';return report;
 }catch(error){report.status='failed';report.error=String(error.stack||error);throw error;}
 finally {
  // Reap every owned child on failure/cancellation, escalating only our children.
  const pending=[...children];
  await Promise.all(pending.map(child=>new Promise(resolve=>{
   const timer=setTimeout(()=>child.kill('SIGKILL'),1000);timer.unref();
   child.once('close',()=>{clearTimeout(timer);resolve();});child.kill('SIGTERM');
  })));
  process.removeListener('SIGINT',onInt);process.removeListener('SIGTERM',onTerm);
  report.finishedAt=new Date().toISOString();
  await writeFile(join(out,'native-frame-report.json'),JSON.stringify(report,null,2)+'\n');
 }
}
