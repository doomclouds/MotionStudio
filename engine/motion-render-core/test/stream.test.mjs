import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, readFile, rm, access, mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {spawn, execFileSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {prepareNative, sha256} from '../lib/native.mjs';

const wrapper=fileURLToPath(new URL('../../../skills/motion-film-director/scripts/render-shot.mjs',import.meta.url));
const exists=async p=>access(p).then(()=>true,()=>false);
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const decodedHash=path=>sha256(execFileSync('ffmpeg',['-v','error','-i',path,'-map','0:v:0','-an','-f','rawvideo','-pix_fmt','rgba','pipe:1'],{maxBuffer:1024*1024,timeout:10000}));
async function sandbox(t){const dir=await mkdtemp(join(tmpdir(),'motion-stream-test-'));t.after(()=>rm(dir,{recursive:true,force:true}));return dir;}
function launch(scene,work,extra=[]){const child=spawn(process.execPath,[wrapper,'--scene',scene,'--work',work,...extra],{stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);const done=new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal,output}));});return {child,done};}
async function run(scene,work,extra=[]){const {child,done}=launch(scene,work,extra);const timer=setTimeout(()=>child.kill('SIGKILL'),30000);try{return await done;}finally{clearTimeout(timer);}}
async function sceneFile(dir,{config='{width:32,height:24,fps:5,duration:1}',body="ctx.fillStyle=`rgb(${frame*37%255},${Math.round(time*41)%255},90)`;ctx.fillRect(0,0,config.width,config.height);",setup='',close='',dependencies='[]'}={}){
 const path=join(dir,'scene.mjs');await writeFile(path,`import {appendFileSync,writeFileSync,existsSync} from 'node:fs';
export const config=${config};export const dependencies=${dependencies};
export function createScene({ctx,config}){${setup}return {async renderFrame(frame,time){${body}},async close(){${close}}};}\n`);return path;
}
async function failed(work,result){assert.notEqual(result.code,0,result.output);assert.equal(await exists(join(work,'output/shot.mp4')),false);const report=await json(join(work,'output/shot-report.json'));assert.equal(report.status,'failed');return report;}
async function waitFor(predicate,label){const until=Date.now()+10000;while(Date.now()<until){if(await predicate())return;await delay(30);}throw Error('Timed out: '+label);}
function alive(pid){try{process.kill(pid,0);return true;}catch(e){if(e.code==='ESRCH')return false;throw e;}}
async function logs(path){return readFile(path,'utf8').then(s=>s.trim().split('\n').filter(Boolean).map(JSON.parse),()=>[]);}
async function fakeEncoder(dir,mode){const path=join(dir,'fake-ffmpeg.mjs'),pidLog=join(dir,'encoder-pids.jsonl');await writeFile(path,`#!${process.execPath}\nimport {appendFileSync,writeFileSync} from 'node:fs';
if(process.argv.includes('-version'))process.exit(0);
appendFileSync(${JSON.stringify(pidLog)},JSON.stringify({pid:process.pid})+'\\n');
writeFileSync(process.argv.at(-1),'partial synthetic output');
${mode==='exit'?'process.exit(23);':'process.stdin.pause();setInterval(()=>{},1000);'}\n`,{mode:0o755});return {path,pidLog};}

test('streamed chunks preserve every native PNG hash, global time, rational FPS, and default output', {timeout:60000},async t=>{
 const dir=await sandbox(t),lifecycle=join(dir,'lifecycle.jsonl'),scene=await sceneFile(dir,{config:'{width:32,height:24,fps:"30000/1001",duration:1001/6000}',setup:`appendFileSync(${JSON.stringify(lifecycle)},JSON.stringify({pid:process.pid,event:'start'})+'\\n');process.on('exit',()=>appendFileSync(${JSON.stringify(lifecycle)},JSON.stringify({pid:process.pid,event:'exit'})+'\\n'));`});
 const defaultWork=join(dir,'default'),baseline=await run(scene,defaultWork);assert.equal(baseline.code,0,baseline.output);
 const expectedDecoded=decodedHash(join(defaultWork,'output/shot.mp4'));
 const expected=await json(join(defaultWork,'output/native-frame-report.json'));assert.equal(expected.frames.length,5);assert.ok(await exists(join(defaultWork,'output/frames/000004.png')));
 for(const chunk of [1,2,20]){const work=join(dir,'chunk-'+chunk),r=await run(scene,work,['--chunk-frames',String(chunk)]);assert.equal(r.code,0,r.output);assert.equal(decodedHash(join(work,'output/shot.mp4')),expectedDecoded,'decoded pixels differ from default encode');const actual=await json(join(work,'output/native-frame-report.json'));assert.deepEqual(actual.frames,expected.frames);assert.equal(actual.fingerprint,expected.fingerprint);assert.equal(await exists(join(work,'output/frames')),false);const report=await json(join(work,'output/shot-report.json'));assert.equal(report.status,'passed');assert.equal(report.fullDecode,'passed');assert.equal(report.config.frameCount,5);assert.equal(report.probe.streams.find(s=>s.codec_type==='video').nb_read_frames,'5');}
 let active=0;for(const entry of await logs(lifecycle)){active+=entry.event==='start'?1:-1;assert.ok(active>=0&&active<=1,'renderer workers overlap');}assert.equal(active,0);
});

test('stateful incremental RNG violates restart equivalence despite identical identity',async t=>{
 const dir=await sandbox(t),scene=await sceneFile(dir,{setup:'let seed=1;',body:'seed=(Math.imul(seed,1664525)+1013904223)>>>0;ctx.fillStyle=`rgb(${seed%256},${(seed>>>8)%256},0)`;ctx.fillRect(0,0,32,24);'});
 const a=await prepareNative({scenePath:scene});let first,second;try{await a.renderFrame(0);first=sha256(a.png());await a.renderFrame(1);second=sha256(a.png());}finally{await a.close();}
 const b=await prepareNative({scenePath:scene});try{await b.renderFrame(1);assert.equal(b.fingerprint,a.fingerprint);assert.equal(sha256(b.png()),first);assert.notEqual(sha256(b.png()),second);}finally{await b.close();}
});

test('worker exception cannot promote partial output',async t=>{const dir=await sandbox(t),scene=await sceneFile(dir,{body:"if(frame===2)throw Error('synthetic worker failure');ctx.fillRect(0,0,32,24);"}),work=join(dir,'work');const report=await failed(work,await run(scene,work,['--chunk-frames','2']));assert.match(report.error,/synthetic worker failure|worker/i);});

test('changed source between rendered chunks cannot be accepted',async t=>{
 const dir=await sandbox(t),dep=join(dir,'dep.txt');await writeFile(dep,'original');const marker=join(dir,'mutated');
 const scene=await sceneFile(dir,{dependencies:"['dep.txt']",setup:'let rendered=false;',body:'rendered=true;ctx.fillRect(0,0,32,24);',close:`if(rendered&&!existsSync(${JSON.stringify(marker)})){writeFileSync(${JSON.stringify(marker)},'yes');writeFileSync(${JSON.stringify(dep)},'changed');}`});
 const work=join(dir,'work'),report=await failed(work,await run(scene,work,['--chunk-frames','2']));assert.match(report.error,/identity|fingerprint|changed|source/i);
});

test('early encoder failure reaps renderer and never promotes partial output',{timeout:15000},async t=>{
 const dir=await sandbox(t),events=join(dir,'workers.jsonl'),fake=await fakeEncoder(dir,'exit');
 const scene=await sceneFile(dir,{setup:`appendFileSync(${JSON.stringify(events)},JSON.stringify({pid:process.pid})+'\\n');`,body:'await new Promise(r=>setTimeout(r,100));ctx.fillRect(0,0,32,24);'}),work=join(dir,'work');
 await failed(work,await run(scene,work,['--chunk-frames','2','--ffmpeg',fake.path]));for(const row of [...await logs(events),...await logs(fake.pidLog)])assert.equal(alive(row.pid),false,'child remains alive');
});

for(const signal of ['SIGINT','SIGTERM'])test(`${signal} under encoder backpressure bounds frame production and reaps owned children`,{timeout:20000},async t=>{
 const dir=await sandbox(t),events=join(dir,'workers.jsonl'),fake=await fakeEncoder(dir,'stall');
 const scene=await sceneFile(dir,{config:'{width:512,height:512,fps:10,duration:10}',setup:`appendFileSync(${JSON.stringify(events)},JSON.stringify({pid:process.pid})+'\\n');`,body:`const im=ctx.createImageData(512,512);let n=frame+1;for(let i=0;i<im.data.length;i++){n=(Math.imul(n,1664525)+1013904223)>>>0;im.data[i]=n>>>24;}ctx.putImageData(im,0,0);appendFileSync(${JSON.stringify(events)},JSON.stringify({pid:process.pid,frame})+'\\n');`});
 const work=join(dir,'work'),{child,done}=launch(scene,work,['--chunk-frames','100','--ffmpeg',fake.path]);t.after(async()=>{if(child.exitCode===null&&child.signalCode===null){child.kill('SIGTERM');await Promise.race([done,delay(2000)]);if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');}for(const row of [...await logs(events),...await logs(fake.pidLog)])if(alive(row.pid))process.kill(row.pid,'SIGKILL');});
 await waitFor(async()=> (await logs(events)).some(e=>e.frame!==undefined),'first rendered frame');await delay(400);
 const before=await logs(events);assert.ok(before.filter(e=>e.frame!==undefined).length<10,'producer ignored blocked stream');child.kill(signal);const result=await done;await failed(work,result);
 const pids=new Set([...await logs(events),...await logs(fake.pidLog)].map(r=>r.pid));assert.ok(pids.size>=2);for(const pid of pids)assert.equal(alive(pid),false,'owned child remains alive after '+signal);
});

test('invalid chunk counts reject before any successful output',async t=>{const dir=await sandbox(t),scene=await sceneFile(dir);for(const n of ['0','-1','1.5','NaN','9007199254740992']){const work=join(dir,'bad-'+n),r=await run(scene,work,['--chunk-frames',n]);assert.notEqual(r.code,0);assert.equal(await exists(join(work,'output/shot.mp4')),false);}});

test('worker nonzero exit cannot promote partial output',async t=>{const dir=await sandbox(t),scene=await sceneFile(dir,{body:'if(frame===2)process.exit(19);ctx.fillRect(0,0,32,24);'}),work=join(dir,'work');await failed(work,await run(scene,work,['--chunk-frames','2']));});

test('optional provided audio retains the existing encode policy',async t=>{
 const dir=await sandbox(t),scene=await sceneFile(dir),audio=join(dir,'tone.wav'),bytes=Buffer.alloc(44+8000*2);bytes.write('RIFF');bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVEfmt ',8);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(8000,24);bytes.writeUInt32LE(16000,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(16000,40);for(let i=0;i<8000;i++)bytes.writeInt16LE(Math.round(Math.sin(i*2*Math.PI*440/8000)*1000),44+i*2);await writeFile(audio,bytes);
 for(const chunk of [null,2]){const work=join(dir,'audio-'+chunk),result=await run(scene,work,['--audio',audio,...(chunk?['--chunk-frames',String(chunk)]:[])]);assert.equal(result.code,0,result.output);const report=await json(join(work,'output/shot-report.json'));assert.equal(report.audio.sha256,sha256(bytes));const a=report.probe.streams.find(s=>s.codec_type==='audio');assert.equal(a.codec_name,'aac');assert.equal(a.sample_rate,'48000');}
});

for(const stage of ['preflight','probe','decode'])for(const signal of ['SIGINT','SIGTERM'])test(`${signal} during ${stage} reaps validation child and never promotes output`,{timeout:20000},async t=>{
 const dir=await sandbox(t),scene=await sceneFile(dir),pidLog=join(dir,'stage-pids.jsonl'),fake=join(dir,'fake-stage.mjs');
 await writeFile(fake,`#!${process.execPath}\nimport {appendFileSync} from 'node:fs';import {spawnSync} from 'node:child_process';
const args=process.argv.slice(2),stage=${JSON.stringify(stage)};
const block=stage==='preflight'||(stage==='probe'&&!args.includes('-version'))||(stage==='decode'&&args.includes('null'));
if(block){appendFileSync(${JSON.stringify(pidLog)},JSON.stringify({pid:process.pid})+'\\n');setInterval(()=>{},1000);}
else if(args.includes('-version'))process.exit(0);
else {const r=spawnSync('ffmpeg',args,{stdio:'inherit'});process.exit(r.status??1);}
`,{mode:0o755});
 const work=join(dir,'work'),{child,done}=launch(scene,work,['--chunk-frames','2',stage==='probe'?'--ffprobe':'--ffmpeg',fake]);
 let pids=[];
 try {
  await waitFor(async()=>{pids=(await logs(pidLog)).map(r=>r.pid);return pids.length>0;},stage+' started');
  if(stage!=='preflight')assert.equal(await exists(join(work,'output/shot.partial.mp4')),true,'validation stage must follow encode');
  child.kill(signal);const result=await Promise.race([done,delay(5000).then(()=>{throw Error('cancel did not finish');})]);
  const report=await failed(work,result);assert.match(report.error,/cancel|SIGINT|SIGTERM/i);
  for(const pid of pids)assert.equal(alive(pid),false,'validation child remains alive');
 } finally {
  if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');
  for(const pid of pids)if(alive(pid))process.kill(pid,'SIGKILL');
  await done;
 }
});

for(const target of ['scripts/render-stream-worker.mjs','lib/stream.mjs'])test(`stream identity rejects changed ${target} in an isolated engine copy`,async t=>{
 const dir=await sandbox(t),engine=join(dir,'engine'),out=join(dir,'output');await mkdir(join(engine,'lib'),{recursive:true});await mkdir(join(engine,'scripts'));await mkdir(out);
 for(const rel of ['lib/native.mjs','lib/stream.mjs','scripts/render-stream-worker.mjs'])await writeFile(join(engine,rel),await readFile(new URL('../'+rel,import.meta.url)));
 const changed=join(engine,target),marker=join(dir,'changed');
 const scene=await sceneFile(dir,{setup:'let rendered=false;',body:'rendered=true;ctx.fillRect(0,0,32,24);',close:`if(rendered&&!existsSync(${JSON.stringify(marker)})){writeFileSync(${JSON.stringify(marker)},'yes');appendFileSync(${JSON.stringify(changed)},'\\n// synthetic identity mutation\\n');}`});
 const {renderStream}=await import(pathToFileURL(join(engine,'lib/stream.mjs')).href);
 await assert.rejects(renderStream({scenePath:scene,out,chunkFrames:2,ffmpeg:'ffmpeg',makeEncoderArgs:c=>['-v','error','-f','image2pipe','-framerate',String(c.fps),'-i','pipe:0','-f','null','-']}),/identity|source|changed/i);
 const report=await json(join(out,'native-frame-report.json'));assert.equal(report.status,'failed');assert.match(report.error,/identity|source|changed/i);
});
