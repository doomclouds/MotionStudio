// Internal isolated worker. stdout is exclusively a PNG stream; control uses IPC.
import {prepareNative,sha256} from '../lib/native.mjs';
import {readFile} from 'node:fs/promises';
const [scenePath,canvasModulePath,startText,countText]=process.argv.slice(2);
const start=Number(startText),count=Number(countText);
const send=value=>new Promise((resolve,reject)=>process.send(value,error=>error?reject(error):resolve()));
const write=bytes=>new Promise((resolve,reject)=>process.stdout.write(bytes,error=>error?reject(error):resolve()));
let renderer;
try {
 if(!process.send||!Number.isSafeInteger(start)||start<0||!Number.isSafeInteger(count)||count<1)throw Error('Invalid internal worker arguments');
 const workerSHA256=sha256(await readFile(new URL(import.meta.url)));
 renderer=await prepareNative({scenePath,canvasModulePath:canvasModulePath||undefined});
 // Register before sending ready so a fast parent cannot race the start message.
 const begin=new Promise(resolve=>process.once('message',resolve));
 await send({type:'ready',workerSHA256,config:renderer.info,identity:renderer.identity,fingerprint:renderer.fingerprint});
 if((await begin)?.type!=='start')throw Error('Expected start message');
 const end=Math.min(start+count,renderer.info.frameCount);
 if(start>=end)throw Error('Empty worker range');
 for(let frame=start;frame<end;frame++){
  await renderer.renderFrame(frame);
  const bytes=renderer.png();
  await write(bytes);
  await send({type:'frame',frame,sha256:sha256(bytes),bytes:bytes.length});
 }
 await renderer.verifyIdentity();
 if(sha256(await readFile(new URL(import.meta.url)))!==workerSHA256)throw Error('Worker entry source changed during render');
 await renderer.close();renderer=undefined;
 await send({type:'complete',start,end});
}catch(error){console.error(error.stack||error);process.exitCode=1;}
finally {try{await renderer?.close();}catch(error){console.error(error);process.exitCode=1;}if(process.connected)process.disconnect();}
