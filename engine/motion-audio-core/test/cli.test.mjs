import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile,readFile,access} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';
import {prepareMix} from '../lib/audio.mjs';
import {creativeIdentity,samplesToTime} from '../../motion-timeline-core/lib/timeline.mjs';
import {sandbox,fixture,available,decode} from './fixtures.mjs';
const cli=fileURLToPath(new URL('../scripts/audio.mjs',import.meta.url));
const time=n=>samplesToTime(n,48000);
function plan(source){return {schemaVersion:1,project:{sampleRate:48000,frameRate:{n:24,d:1},channelLayout:'mono',duration:time(4)},sources:[{id:'tone',path:'tone.wav',expectedSha256:source.expectedSha256}],clips:[{id:'clip',sourceId:'tone',sourceRange:{start:time(0),end:time(4)},timelineRange:{start:time(0),end:time(4)},outputId:'music'}],stems:[{id:'music',outputId:'master'}],buses:[],master:{},views:[]};}
const skip=!available()&&'FFmpeg/ffprobe unavailable';
test('CLI resolves validated relative assets from timeline directory, not caller cwd', {skip}, async t=>{
 const root=await sandbox(t),foreign=await sandbox(t),source=await fixture(root,'tone',[0.125,0.25,0.5,0.75]),doc=plan(source),timeline=join(root,'timeline.json'),work=join(root,'run');await writeFile(timeline,JSON.stringify(doc));
 const report=JSON.parse(execFileSync(process.execPath,[cli,'render','--timeline',timeline,'--source-root',root,'--work',work],{cwd:foreign,encoding:'utf8',timeout:30000}));
 assert.deepEqual(decode(report.outputs.master.path),[0.125,0.25,0.5,0.75]);assert.equal(report.identities.creativePlan,creativeIdentity(doc));
 assert.equal(JSON.parse(await readFile(join(work,'resolved-plan.json'),'utf8')).sources[0].path,'tone.wav');assert.equal(report.preparedSources[0].declaredPath,'tone.wav');
});
test('CLI rejects traversal before resolution even when target would be inside authorized root', {skip}, async t=>{
 const root=await sandbox(t),foreign=await sandbox(t),source=await fixture(root,'tone',[0.25,0.25,0.25,0.25]),doc=plan(source);doc.sources[0].path='unused/../tone.wav';const timeline=join(root,'timeline.json'),work=join(root,'run');await writeFile(timeline,JSON.stringify(doc));
 const result=spawnSync(process.execPath,[cli,'render','--timeline',timeline,'--source-root',root,'--work',work],{cwd:foreign,encoding:'utf8'});assert.notEqual(result.status,0);assert.match(result.stderr,/traversal|POSIX|local/i);assert.equal(await access(work).then(()=>true,()=>false),false);
});
test('library relative assets require an explicit absolute sourceBaseDir', {skip}, async t=>{
 const root=await sandbox(t),source=await fixture(root,'tone',[0.25,0.25,0.25,0.25]),doc=plan(source);
 await assert.rejects(prepareMix(doc,{sourceRoots:[root],workDir:join(root,'missing-base')}),/sourceBaseDir/);
 await assert.rejects(prepareMix(doc,{sourceRoots:[root],sourceBaseDir:'.',workDir:join(root,'relative-base')}),/absolute/);
 const prepared=await prepareMix(doc,{sourceRoots:[root],sourceBaseDir:root,workDir:join(root,'explicit-base')});t.after(()=>prepared.close());const report=await prepared.render();assert.equal(report.identities.creativePlan,creativeIdentity(doc));assert.deepEqual(decode(report.outputs.master.path),[0.25,0.25,0.25,0.25]);
});
