// SPDX-License-Identifier: MIT
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readFileSync,existsSync} from 'node:fs';
import {prepareNative,sha256} from '../../../../../motion-render-core/lib/native.mjs';
import * as archive from '../examples/archive-scene.mjs';
import * as orbit from '../examples/orbit-scene.mjs';
const frames=[0,30,60,90,119];
for(const name of ['archive','orbit'])test(name+': actual Native consumer repeated, reverse, fresh-process hashes',async()=>{
 const path=fileURLToPath(new URL('../examples/'+name+'-scene.mjs',import.meta.url));
 const renderer=await prepareNative({scenePath:path});
 try{
  const run=async seq=>{const out={};for(const frame of seq){await renderer.renderFrame(frame);out[frame]=sha256(renderer.png())}return out};
  const expected=await run(frames);assert.equal(new Set(Object.values(expected)).size,frames.length);
  assert.deepEqual(await run([...frames].reverse()),expected);assert.deepEqual(await run(frames),expected);
  await renderer.verifyIdentity();
  const core=new URL('../../../../../motion-render-core/lib/native.mjs',import.meta.url).href;
  const source=`import {prepareNative,sha256} from ${JSON.stringify(core)};const r=await prepareNative({scenePath:${JSON.stringify(path)}});const out={};for(const f of ${JSON.stringify(frames)}){await r.renderFrame(f);out[f]=sha256(r.png())}await r.verifyIdentity();await r.close();console.log(JSON.stringify(out));`;
  const fresh=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',source],{encoding:'utf8'}));assert.deepEqual(fresh,expected);
 }finally{await renderer.close()}
});
test('both actual aim paths attach emitter and receiver; independent staging',()=>{
 for(const scene of [archive,orbit])for(const t of [0,.6,2,3,3.96]){
  const s=scene.sampleLighting(t);assert.deepEqual(s.target,s.receiver.center);
  assert.ok(Math.abs(Math.hypot(s.emitter.x-s.mount.x,s.emitter.y-s.mount.y)-s.emitterOffset)<1e-10);
  assert.ok(Math.abs(Math.atan2(s.target.y-s.mount.y,s.target.x-s.mount.x)-s.angle)<1e-10);
 }
 assert.notDeepEqual(archive.sampleLighting(1).mount,orbit.sampleLighting(1).mount);
 assert.notEqual(archive.sampleLighting(1).receiver.rotation,orbit.sampleLighting(1).receiver.rotation);
 assert.ok(archive.sampleLighting(1).target.x>archive.sampleLighting(3).target.x);
});
test('manifest, public entry and source-only navigation resolve',()=>{
 const base=new URL('../',import.meta.url),manifest=JSON.parse(readFileSync(new URL('candidate.json',base)));
 for(const file of [manifest.entry,manifest.guidance,manifest.design,manifest.rights,...manifest.examples,...manifest.tests])assert.ok(existsSync(new URL(file,base)),file);
 assert.equal(manifest.registeredFamily,false);assert.equal(manifest.physicalLighting,false);
 for(const file of ['README.md','design.md','RIGHTS.md']){
  const text=readFileSync(new URL(file,base),'utf8');assert.doesNotMatch(text,/\/workspace\/|\/mnt\/|sediment:\/\/|file_[0-9a-f]{16}/);
  for(const match of text.matchAll(/\]\(([^)]+)\)/g))assert.ok(existsSync(new URL(match[1],base)),match[1]);
 }
});
