import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, writeFile, access} from 'node:fs/promises';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {prepareMix,validateAudioPlan,inspectEncodedAudio} from '../lib/audio.mjs';
import {samplesToTime, splitClip, compileSequence} from '../../motion-timeline-core/lib/timeline.mjs';
import {sandbox, fixture, decode, fileHash, available, almost} from './fixtures.mjs';

const s = n => samplesToTime(n, 48000);
const range = (a, b) => ({start: s(a), end: s(b)});
const skip = !available() && 'Separately installed FFmpeg/ffprobe unavailable';
const clip = (id, a, b, start = 0, extra = {}) => ({id, sourceId: 'source', sourceRange: range(a,b), timelineRange: range(start,start+b-a), outputId: 'music', ...extra});
function document(source, duration, clips, extra = {}) {
  return {schemaVersion: 1, project: {sampleRate: 48000, frameRate: {n: 24, d: 1}, channelLayout: 'mono', duration: s(duration)},
    sources: [{id: 'source', path: source.localPath, streamIndex: 0, expectedSha256: source.expectedSha256}],
    clips, stems: [{id: 'music', outputId: 'master'}], buses: [], master: {}, views: [], ...extra};
}
async function mix(t, dir, doc, name = 'work', options = {}) {
  const prepared = await prepareMix(doc, {sourceRoots: [dir], workDir: join(dir,name), ...options});
  t.after(() => prepared.close());
  return {prepared, report: await prepared.render()};
}
const pcm = report => decode(report.outputs.master.path);

test('trim and placement use exact sample boundaries; gaps are intentional silence', {skip}, async t => {
  const dir = await sandbox(t), source = await fixture(dir,'impulses',[0,0.25,0.5,0.75,0,0]);
  const {report} = await mix(t,dir,document(source,8,[clip('cut',1,4,2)]));
  assert.deepEqual(pcm(report),[0,0,0.25,0.5,0.75,0,0,0]);
  assert.equal(report.review.listening.status,'NOT_RUN'); assert.equal(report.review.owner.status,'NOT_RUN');
});

test('overlap sums without normalization; declared stem and bus gains contribute exactly', {skip}, async t => {
  const dir = await sandbox(t), source = await fixture(dir,'constant',Array(8).fill(0.25));
  const doc = document(source,8,[clip('a',0,8),clip('b',0,8,0,{outputId:'effects'})],{
    stems:[{id:'music',outputId:'sum'},{id:'effects',outputId:'sum'}], buses:[{id:'sum',outputId:'master'}]});
  const {report} = await mix(t,dir,doc);
  assert.deepEqual(pcm(report),Array(8).fill(0.5));
  assert.deepEqual(decode(report.outputs.music.path),Array(8).fill(0.25));
  assert.deepEqual(decode(report.outputs.effects.path),Array(8).fill(0.25));
});

test('sample-aware fades hit endpoints and survive a split without new fades', {skip}, async t => {
  const dir = await sandbox(t), source = await fixture(dir,'fades',Array(8).fill(0.5));
  const doc = document(source,8,[clip('a',0,8,0,{fades:[{direction:'in',duration:s(4),curve:'linear'},{direction:'out',duration:s(4),curve:'linear'}]})]);
  const a = await mix(t,dir,doc,'uncut'), b = await mix(t,dir,splitClip(doc,{clipId:'a',at:s(3),rightId:'right'}),'split');
  almost(pcm(a.report),[0,1/6,1/3,0.5,0.5,1/3,1/6,0]);
  assert.deepEqual(pcm(a.report),pcm(b.report));
});

test('automation interpolates amplitude for every sample with endpoint hold', {skip}, async t => {
  const dir = await sandbox(t), source = await fixture(dir,'automation',Array(8).fill(0.5));
  const doc = document(source,8,[clip('a',0,8,0,{automation:[{at:s(2),gainDb:-6.020599913279624},{at:s(6),gainDb:0}]})]);
  const {report} = await mix(t,dir,doc);
  almost(pcm(report),[0.25,0.25,0.25,0.3125,0.375,0.4375,0.5,0.5]);
});

test('pause/resume consumes only played source samples', {skip}, async t => {
  const dir = await sandbox(t), source = await fixture(dir,'cursor',[0.125,0.25,0.375,0.5]);
  const clips = compileSequence({sourceId:'source',outputId:'music',idPrefix:'sequence',segments:[{kind:'play',duration:s(2)},{kind:'pause',duration:s(2)},{kind:'play',duration:s(2)}]});
  const {report} = await mix(t,dir,document(source,6,clips));
  assert.deepEqual(pcm(report),[0.125,0.25,0,0,0.375,0.5]);
});

test('silence and stereo are preserved, without cross-channel leakage', {skip}, async t => {
  const dir = await sandbox(t), source = await fixture(dir,'stereo',[0.5,0,0,0.25,0,0,0,0],{channels:2});
  const doc = document(source,6,[clip('a',0,4)]); doc.project.channelLayout='stereo';
  const {report} = await mix(t,dir,doc);
  assert.deepEqual(decode(report.outputs.master.path,{channels:2}),[0.5,0,0,0.25,0,0,0,0,0,0,0,0]);
  const silentDoc = document(source,6,[]); silentDoc.project.channelLayout='stereo';
  const silent = await mix(t,dir,silentDoc,'silence'); assert.deepEqual(decode(silent.report.outputs.master.path,{channels:2}),Array(12).fill(0));
});

test('preview crops processed output then fades; creative identity and full master remain unchanged', {skip}, async t => {
  const dir = await sandbox(t), source = await fixture(dir,'view',Array(12).fill(0.5));
  const doc = document(source,12,[clip('a',0,12)],{views:[{id:'excerpt',range:range(2,10),outputs:['master'],boundaryFade:{duration:s(3),curve:'linear'}}]});
  const {prepared,report} = await mix(t,dir,doc); const before = await fileHash(report.outputs.master.path);
  const view = await prepared.render({viewId:'excerpt'});
  assert.equal(await fileHash(report.outputs.master.path),before);
  assert.equal(view.identities.creativePlan,report.identities.creativePlan);
  assert.notEqual(view.identities.view,report.identities.view);
  assert.deepEqual(pcm(view),[0,0.25,0.5,0.5,0.5,0.5,0.25,0]);
});

test('same-runtime fresh-workdir PCM repeats exactly', {skip}, async t => {
  const dir = await sandbox(t), source = await fixture(dir,'repeat',Array.from({length:64},(_,i)=>Math.sin(i)*0.25));
  const doc = document(source,64,[clip('a',0,64,0,{gainDb:-3})]);
  const a = await mix(t,dir,doc,'a'), b = await mix(t,dir,doc,'b');
  assert.deepEqual(pcm(a.report),pcm(b.report)); assert.equal(a.report.identities.creativePlan,b.report.identities.creativePlan);
});

test('invalid routing, unsupported processors, unapproved paths and hash mismatch reject', {skip}, async t => {
  const dir = await sandbox(t), source = await fixture(dir,'invalid',[0.25,0.5]);
  const base = document(source,2,[clip('a',0,2)]);
  const bad = structuredClone(base); bad.buses=[{id:'cycle',outputId:'cycle'}];
  await assert.rejects(prepareMix(bad,{sourceRoots:[dir],workDir:join(dir,'cycle')}),/cycle/i);
  const dsp = structuredClone(base); dsp.master.processors=[{type:'limiter'}];
  await assert.rejects(prepareMix(dsp,{sourceRoots:[dir],workDir:join(dir,'dsp')}),/unknown|unsupported|processor/i);
  await assert.rejects(prepareMix(base,{sourceRoots:[join(dir,'other')],workDir:join(dir,'roots')}));
  const mismatch = structuredClone(base); mismatch.sources[0].expectedSha256='0'.repeat(64);
  await assert.rejects(prepareMix(mismatch,{sourceRoots:[dir],workDir:join(dir,'hash')}),/hash|sha256|identity/i);
});

test('source exhaustion rejects rather than padding and source mutation invalidates identity', {skip}, async t => {
  const dir = await sandbox(t), source = await fixture(dir,'exhaust',[0.25,0.5]);
  await assert.rejects(async()=>{const p=await prepareMix(document(source,4,[clip('a',0,4)]),{sourceRoots:[dir],workDir:join(dir,'exhaust')});try{await p.render();}finally{await p.close();}},/source|exhaust|range|samples/i);
  const p=await prepareMix(document(source,2,[clip('a',0,2)]),{sourceRoots:[dir],workDir:join(dir,'mutation')}); t.after(()=>p.close());
  const bytes=await readFile(source.localPath); bytes.writeFloatLE(0.75,44); await writeFile(source.localPath,bytes);
  await assert.rejects(p.verifyIdentity(),/changed|mutation|identity|hash|sha256/i);
  await assert.rejects(p.render(),/changed|mutation|identity|hash|sha256/i);
});

test('aborted work cannot promote a successful master', {skip}, async t => {
  const dir=await sandbox(t), source=await fixture(dir,'cancel',[0.25,0.5]), controller=new AbortController(); controller.abort();
  const workDir=join(dir,'cancel');
  await assert.rejects(prepareMix(document(source,2,[clip('a',0,2)]),{sourceRoots:[dir],workDir,signal:controller.signal}),/abort|cancel/i);
  assert.equal(await access(join(workDir,'result/master.wav')).then(()=>true,()=>false),false);
});

// Resampler/codec behavior is NOT asserted as exact equality to source sample values.
test('44.1 kHz preparation establishes 48 kHz duration without retiming', {skip}, async t => {
  const dir=await sandbox(t), source=await fixture(dir,'resample',Array.from({length:4410},(_,i)=>Math.sin(i*2*Math.PI*440/44100)*0.25),{rate:44100});
  const {report}=await mix(t,dir,document(source,4800,[clip('a',0,4800)])); const out=pcm(report);
  assert.equal(out.length,4800); assert.ok(Math.max(...out)>0.24&&Math.max(...out)<0.26);
});

async function fakeEncoder(dir, mode) {
  const executable=join(dir,`ffmpeg-${mode}.mjs`), pidPath=join(dir,`pid-${mode}`);
  await writeFile(executable,`#!${process.execPath}\nimport {writeFileSync} from 'node:fs';\nimport {spawnSync} from 'node:child_process';\nconst args=process.argv.slice(2);\nif(args.includes('aac')&&args.includes('-c:a')){writeFileSync(${JSON.stringify(pidPath)},String(process.pid));${mode==='exit'?'process.exit(23);':'setInterval(()=>{},1000);'}}\nelse {const result=spawnSync('ffmpeg',args,{stdio:'inherit'});process.exit(result.status??1);}\n`,{mode:0o755});
  return {executable,pidPath};
}
function alive(pid){try{process.kill(pid,0);return true;}catch(e){if(e.code==='ESRCH')return false;throw e;}}
async function waitForFile(path){const deadline=Date.now()+10000;while(Date.now()<deadline){try{return await readFile(path,'utf8');}catch{}await new Promise(r=>setTimeout(r,20));}throw Error('Timed out waiting for synthetic encoder');}

test('AAC encoder failure rejects without promoting encoded output', {skip,timeout:30000}, async t => {
  const dir=await sandbox(t),source=await fixture(dir,'encoder-fail',Array(4800).fill(0.125)), fake=await fakeEncoder(dir,'exit');
  const p=await prepareMix(document(source,4800,[clip('a',0,4800)]),{sourceRoots:[dir],workDir:join(dir,'work'),ffmpeg:fake.executable});t.after(()=>p.close());
  await assert.rejects(p.render({encodeAAC:true}),/failed|23|encoder/i);
  assert.equal(await access(join(dir,'work/result/master.m4a')).then(()=>true,()=>false),false);
  assert.equal(await access(join(dir,'work/result/master.wav')).then(()=>true,()=>false),false);
  assert.equal(alive(Number(await readFile(fake.pidPath,'utf8'))),false);
});

test('active AAC cancellation reaps the owned child and does not promote encode', {skip,timeout:30000}, async t => {
  const dir=await sandbox(t),source=await fixture(dir,'encoder-cancel',Array(4800).fill(0.125)), fake=await fakeEncoder(dir,'stall'), controller=new AbortController();
  const p=await prepareMix(document(source,4800,[clip('a',0,4800)]),{sourceRoots:[dir],workDir:join(dir,'work'),ffmpeg:fake.executable,signal:controller.signal});t.after(()=>p.close());
  const rendering=p.render({encodeAAC:true}); rendering.catch(()=>{});
  const pid=Number(await waitForFile(fake.pidPath));controller.abort();
  await assert.rejects(rendering,/cancel|abort/i);assert.equal(alive(pid),false);
  assert.equal(await access(join(dir,'work/result/master.m4a')).then(()=>true,()=>false),false);
  assert.equal(await access(join(dir,'work/result/master.wav')).then(()=>true,()=>false),false);
});

test('one-sample export fades affect only the first and last sample', {skip}, async t => {
  const dir=await sandbox(t),source=await fixture(dir,'one-sample-fade',Array(6).fill(0.5));
  const doc=document(source,6,[clip('a',0,6)],{views:[{id:'one',range:range(0,6),outputs:['master'],boundaryFade:{duration:s(1),curve:'linear'}}]});
  const {prepared}=await mix(t,dir,doc); const report=await prepared.render({viewId:'one'});
  assert.deepEqual(pcm(report),[0,0.5,0.5,0.5,0.5,0]);
});

test('AAC playback gets independent full-decode and post-encode measurements with explicit padding tolerance', {skip,timeout:30000}, async t => {
  const dir=await sandbox(t),source=await fixture(dir,'aac-tone',Array.from({length:24000},(_,i)=>Math.sin(i*2*Math.PI*440/48000)*0.25));
  const p=await prepareMix(document(source,24000,[clip('a',0,24000)]),{sourceRoots:[dir],workDir:join(dir,'work')});t.after(()=>p.close());
  const report=await p.render({encodeAAC:true}), output=report.outputs.master, encoded=output.aac;
  assert.equal(output.frames,24000);assert.equal(encoded.fullDecode,'PASS');
  assert.ok(encoded.decodedPaddingSamples>=0&&encoded.decodedPaddingSamples<=1024);
  assert.equal(encoded.frames,24000+encoded.decodedPaddingSamples);
  assert.equal(encoded.measurements.frames,encoded.frames);
  assert.notEqual(encoded.sha256,output.sha256);
  assert.equal(encoded.measurements.truePeakStatus,'MEASURED');
  assert.equal(encoded.measurements.loudnessStatus,'MEASURED');
  const inspection=await inspectEncodedAudio(encoded.path,{sourceRoots:[dir],workDir:join(dir,'inspection'),expectedFrames:24000,channels:1});
  assert.equal(inspection.fullDecode,'PASS');assert.equal(inspection.sha256,encoded.sha256);
  assert.equal(inspection.frames,encoded.frames);assert.equal(inspection.measurements.truePeakStatus,'MEASURED');
  assert.equal(inspection.review.avSync.status,'NOT_RUN');
  await assert.rejects(inspectEncodedAudio(encoded.path,{sourceRoots:[dir],workDir:join(dir,'bad-duration'),expectedFrames:12000,channels:1}),/duration|padding/i);
  await assert.rejects(inspectEncodedAudio(encoded.path,{sourceRoots:[dir],workDir:join(dir,'bad-channels'),expectedFrames:24000,channels:2}),/declared|mono|stereo|channel/i);
  await assert.rejects(inspectEncodedAudio(output.path,{sourceRoots:[dir],workDir:join(dir,'not-aac'),expectedFrames:24000,channels:1}),/AAC/i);
  const actual=decode(encoded.path);assert.equal(actual.length,encoded.frames);
  // Lossy samples are intentionally compared with a codec tolerance, never equality.
  let squareError=0;for(let i=2048;i<22000;i++)squareError+=(actual[i]-Math.sin(i*2*Math.PI*440/48000)*0.25)**2;
  assert.ok(Math.sqrt(squareError/(22000-2048))<0.02);
  assert.equal(report.review.listening.status,'NOT_RUN');assert.equal(report.review.owner.status,'NOT_RUN');
});

test('close cancels an active owned encoder and is safe to repeat', {skip,timeout:30000}, async t => {
  const dir=await sandbox(t),source=await fixture(dir,'close-cancel',Array(4800).fill(0.125)), fake=await fakeEncoder(dir,'stall');
  const p=await prepareMix(document(source,4800,[clip('a',0,4800)]),{sourceRoots:[dir],workDir:join(dir,'work'),ffmpeg:fake.executable});t.after(()=>p.close());
  const rendering=p.render({encodeAAC:true});rendering.catch(()=>{});const pid=Number(await waitForFile(fake.pidPath));
  await p.close();await assert.rejects(rendering,/cancel|abort|closed/i);await p.close();assert.equal(alive(pid),false);
  assert.equal(await access(join(dir,'work/result')).then(()=>true,()=>false),false);
});

test('selected audio stream and prepared-PCM identity cannot silently change', {skip}, async t => {
  const dir=await sandbox(t),source=await fixture(dir,'identity',[0.125,0.25]);
  const wrongStream=document(source,2,[clip('a',0,2)]);wrongStream.sources[0].streamIndex=9;
  await assert.rejects(prepareMix(wrongStream,{sourceRoots:[dir],workDir:join(dir,'stream')}),/stream/i);
  const p=await prepareMix(document(source,2,[clip('a',0,2)]),{sourceRoots:[dir],workDir:join(dir,'work')});t.after(()=>p.close());
  const path=p.preparedSources[0].preparedPath,bytes=await readFile(path);bytes.writeFloatLE(0.5,0);await writeFile(path,bytes);
  await assert.rejects(p.render(),/mutation|identity|hash/i);
  assert.equal(await access(join(dir,'work/result')).then(()=>true,()=>false),false);
});

test('fractional-origin split preserves equal-power fades plus automation bit-for-bit', {skip}, async t => {
  const dir=await sandbox(t),source=await fixture(dir,'fractional',Array(12).fill(0.25));
  const frac=tenthSamples=>({n:String(tenthSamples),d:'480000'});
  const c=clip('a',0,8,0,{sourceRange:{start:frac(4),end:frac(84)},timelineRange:{start:frac(4),end:frac(84)},
    fades:[{direction:'in',duration:s(6),curve:'equalPower'},{direction:'out',duration:s(4),curve:'equalPower'}],
    automation:[{at:s(0),gainDb:-6},{at:s(7),gainDb:0}]});
  const doc=document(source,10,[c]),split=splitClip(doc,{clipId:'a',at:frac(8),rightId:'right'});
  const a=await mix(t,dir,doc,'uncut'),b=await mix(t,dir,split,'split');
  assert.deepEqual(pcm(a.report),pcm(b.report));
});

test('absolute selected stream is decoded, not silently replaced with the first audio stream', {skip}, async t => {
  const dir=await sandbox(t),first=await fixture(dir,'stream-first',Array(4800).fill(0.125)),second=await fixture(dir,'stream-second',Array(4800).fill(0.5)),path=join(dir,'two-streams.mov');
  execFileSync('ffmpeg',['-v','error','-nostdin','-i',first.localPath,'-i',second.localPath,'-map','0:a:0','-map','1:a:0','-c:a','pcm_f32le',path],{timeout:10000});
  const doc=document({localPath:path,expectedSha256:await fileHash(path)},4800,[clip('a',0,4800)]);doc.sources[0].streamIndex=1;
  const {prepared,report}=await mix(t,dir,doc);assert.equal(prepared.preparedSources[0].streamIndex,1);assert.deepEqual(pcm(report),Array(4800).fill(0.5));
});

test('cached AAC is revalidated before a repeated render returns success', {skip,timeout:30000}, async t => {
  const dir=await sandbox(t),source=await fixture(dir,'aac-mutation',Array(4800).fill(0.125));
  const p=await prepareMix(document(source,4800,[clip('a',0,4800)]),{sourceRoots:[dir],workDir:join(dir,'work')});t.after(()=>p.close());
  const report=await p.render({encodeAAC:true});await writeFile(report.outputs.master.aac.path,'corrupt encoded output');
  await assert.rejects(p.render({encodeAAC:true}),/mutation|identity|hash|changed/i);
});

test('view report metadata cannot mutate internal source-identity verification', {skip}, async t => {
  const dir=await sandbox(t),source=await fixture(dir,'report-isolation',Array(6).fill(0.25));
  const doc=document(source,6,[clip('a',0,6)],{views:[{id:'review',range:range(1,5),outputs:['master']}]});
  const {prepared}=await mix(t,dir,doc);const view=await prepared.render({viewId:'review'});
  view.preparedSources.length=0;
  const bytes=await readFile(source.localPath);bytes.writeFloatLE(0.5,44);await writeFile(source.localPath,bytes);
  await assert.rejects(prepared.verifyIdentity(),/mutation|identity|hash|changed/i);
});

test('staged output mutation during later measurements prevents atomic promotion', {skip,timeout:30000}, async t => {
  const dir=await sandbox(t),source=await fixture(dir,'staged-mutation',Array(4800).fill(0.125)),executable=join(dir,'mutating-ffmpeg.mjs');
  await writeFile(executable,`#!${process.execPath}\nimport {writeFileSync} from 'node:fs';import {dirname,join,basename} from 'node:path';import {spawnSync} from 'node:child_process';\nconst args=process.argv.slice(2),r=spawnSync('ffmpeg',args,{stdio:'inherit'});\nconst input=args[args.indexOf('-i')+1];if(args.includes('ebur128=peak=true')&&input&&basename(input)==='music.wav')writeFileSync(join(dirname(input),'master.wav'),'changed staged master');\nprocess.exit(r.status??1);\n`,{mode:0o755});
  const p=await prepareMix(document(source,4800,[clip('a',0,4800)]),{sourceRoots:[dir],workDir:join(dir,'work'),ffmpeg:executable});t.after(()=>p.close());
  await assert.rejects(p.render(),/mutation|identity|hash|changed/i);
  assert.equal(await access(join(dir,'work/result')).then(()=>true,()=>false),false);
});

test('positive project duration that quantizes to zero samples rejects before preparation', () => {
  const doc={schemaVersion:1,project:{sampleRate:48000,frameRate:{n:24,d:1},channelLayout:'mono',duration:{n:'1',d:'192000'}},sources:[],clips:[],stems:[],buses:[],master:{},views:[]};
  assert.throws(()=>validateAudioPlan(doc),/sample|duration|empty|resource/i);
});

function fullOriginPCM(path,channels=1){
 const bytes=execFileSync('ffmpeg',['-v','error','-nostdin','-i',path,'-map','0:a:0','-af','aresample=48000:resampler=swr:dither_method=none','-ac',String(channels),'-ar','48000','-c:a','pcm_f32le','-f','f32le','pipe:1'],{maxBuffer:32*1024*1024,timeout:15000});
 return Array.from({length:bytes.length/4},(_,i)=>bytes.readFloatLE(i*4));
}

test('short selections from two 180-second stereo sources fit the prepared-span budget', {skip,timeout:60000}, async t=>{
 const dir=await sandbox(t),sources=[];
 for(let i=0;i<2;i++){
  const path=join(dir,`long-${i}.flac`);
  execFileSync('ffmpeg',['-v','error','-nostdin','-f','lavfi','-i',`sine=frequency=${440+i*110}:sample_rate=48000:duration=180`,'-af','volume=0.001','-ac','2','-c:a','flac',path],{timeout:20000});
  sources.push({id:i?'second':'source',path,streamIndex:0,expectedSha256:await fileHash(path)});
 }
 const doc=document({localPath:sources[0].path,expectedSha256:sources[0].expectedSha256},4800,[clip('a',48000*10,48000*10+4800),clip('b',48000*170,48000*170+4800,0,{sourceId:'second'})],{sources});doc.project.channelLayout='stereo';
 const {prepared,report}=await mix(t,dir,doc);
 assert.equal(report.outputs.master.frames,4800);
 assert.deepEqual(prepared.preparedSources.map(p=>p.frames),[4800,4800]);
 assert.deepEqual(prepared.preparedSources.map(p=>p.preparedStartSample),[480000,8160000]);
 assert.deepEqual(prepared.preparedSources.map(p=>p.preparedEndSample),[484800,8164800]);
 assert.equal(decode(report.outputs.master.path,{channels:2}).length,9600);
});

for(const kind of ['48000','44100','aac'])test(`nonzero ${kind} selection equals slicing full-origin canonical decode`, {skip,timeout:30000},async t=>{
 const dir=await sandbox(t),rate=kind==='44100'?44100:48000;
 let source=await fixture(dir,'origin',Array.from({length:rate},(_,i)=>Math.sin(i*2*Math.PI*997/rate)*0.125),{rate});
 if(kind==='aac'){
  const path=join(dir,'primed.m4a');execFileSync('ffmpeg',['-v','error','-nostdin','-i',source.localPath,'-c:a','aac','-b:a','128k',path],{timeout:10000});
  source={localPath:path,expectedSha256:await fileHash(path)};
 }
 const start=12345,end=16789,reference=fullOriginPCM(source.localPath);
 const {prepared,report}=await mix(t,dir,document(source,end-start,[clip('a',start,end)]));
 assert.deepEqual(pcm(report),reference.slice(start,end));
 assert.equal(prepared.preparedSources[0].preparedStartSample,start);
 assert.equal(prepared.preparedSources[0].preparedEndSample,end);
 assert.equal(prepared.preparedSources[0].frames,end-start);
});

test('nonzero source cursor supports paused reuse and split without changing source samples', {skip},async t=>{
 const dir=await sandbox(t),source=await fixture(dir,'offset-cursor',Array.from({length:20},(_,i)=>i/32));
 const clips=compileSequence({sourceId:'source',outputId:'music',idPrefix:'cursor',sourceStart:s(7),segments:[{kind:'play',duration:s(3)},{kind:'pause',duration:s(2)},{kind:'play',duration:s(3)}]});
 const doc=document(source,8,clips),a=await mix(t,dir,doc,'uncut');
 const split=splitClip(doc,{clipId:'cursor-0',at:s(1),rightId:'right'}),b=await mix(t,dir,split,'split');
 assert.deepEqual(pcm(a.report),[7/32,8/32,9/32,0,0,10/32,11/32,12/32]);assert.deepEqual(pcm(a.report),pcm(b.report));
 assert.equal(a.prepared.preparedSources[0].preparedStartSample,7);assert.equal(a.prepared.preparedSources[0].frames,6);
});

test('contiguous prepared span budget includes gaps between reused ranges', {skip},async t=>{
 const dir=await sandbox(t),source=await fixture(dir,'span-budget',[0.125,0.25]);
 const doc=document(source,2,[clip('a',0,1),clip('b',20_000_000,20_000_001,1)]);
 await assert.rejects(prepareMix(doc,{sourceRoots:[dir],workDir:join(dir,'work')}),/span|budget|resource|20M|limit/i);
});

test('unreferenced sources are identified but allocate no prepared PCM', {skip},async t=>{
 const dir=await sandbox(t),source=await fixture(dir,'unused',[0.125,0.25]);
 const {prepared,report}=await mix(t,dir,document(source,6,[]));
 const metadata=prepared.preparedSources[0];assert.equal(metadata.preparationStatus,'UNREFERENCED');assert.equal(metadata.preparedPath,null);assert.equal(metadata.preparedSha256,null);assert.equal(metadata.frames,0);
 assert.deepEqual(pcm(report),Array(6).fill(0));
 const bytes=await readFile(source.localPath);bytes.writeFloatLE(0.5,44);await writeFile(source.localPath,bytes);
 await assert.rejects(prepared.verifyIdentity(),/mutation|identity|hash|changed/i);
});
