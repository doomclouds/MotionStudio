import test from 'node:test';
import assert from 'node:assert/strict';
import {actionStatusExamples,createActionStatusExample} from '../examples/action-status-usage.mjs';
import {sampleStagedLayoutHandoff} from '../lib/recipes/staged-layout-handoff.mjs';
import {rational as T} from '../lib/time.mjs';
for(const config of actionStatusExamples) {
 test(`${config.name}: existing staged API is the geometry authority; seek and state are independent`,()=>{
  const example=createActionStatusExample(config),states=[];
  for(let frame=0;frame<=120;frame++) {
   const seconds=frame/30,s=example.sample(seconds),at=T(Math.round(seconds*1000),1000);
   assert.deepEqual(s.container,sampleStagedLayoutHandoff(example.plan,at).items[0]);
   assert.equal(s.container.itemId,'action');assert.equal(s.container.opacity,1);
   assert.ok(s.radius<=Math.min(s.container.rect.width,s.container.rect.height)/2);
   for(const key of ['shellOpacity','iconOpacity','labelOpacity'])assert.ok(s[key]>=0&&s[key]<=1);
   assert.equal(s.icon,seconds<config.busyAt?'submit':'busy');
   assert.ok(Math.abs(s.iconOpacity+s.labelOpacity-1)<1e-12);
   states.push(s);
  }
  for(let frame=120;frame>=0;frame--)assert.deepEqual(example.sample(frame/30),states[frame]);
  for(const seconds of [0,...config.times,4]){
   const s=example.sample(seconds,{reducedMotion:true});
   assert.deepEqual(s.container,states.at(-1).container);
   assert.equal(s.icon,example.sample(seconds).icon);
   assert.equal(s.labelOpacity,example.sample(seconds).labelOpacity);
  }
  assert.equal(states[0].labelOpacity,0);assert.equal(states.at(-1).labelOpacity,1);
  assert.equal(states.at(-1).shellOpacity,0);
 });
 test(`${config.name}: geometry continuous across stage boundary`,()=>{
  const example=createActionStatusExample(config),t=config.times[1];
  const before=example.sample(t-.001).container.geometryBounds;
  const after=example.sample(t+.001).container.geometryBounds;
  for(const key of ['x','y','width','height'])assert.ok(Math.abs(before[key]-after[key])<.01);
 });
}

test('two-size Native rendering fits visible labels and replay is pixel-identical',async()=>{
 const {loadNativeCanvas}=await import('../../motion-render-core/lib/native.mjs');
 const {drawActionStatusExample}=await import('../examples/action-status-usage.mjs');
 const {createHash}=await import('node:crypto');
 const {api}=loadNativeCanvas();
 for(const config of actionStatusExamples){
  const example=createActionStatusExample(config),canvas=api.createCanvas(config.width,config.height),ctx=canvas.getContext('2d');
  const hash=()=>createHash('sha256').update(canvas.toBuffer('image/png')).digest('hex');
  const hashes=[];
  for(let frame=0;frame<=120;frame++){
   drawActionStatusExample(ctx,example,frame/30);hashes.push(hash());
  }
  for(const frame of [120,60,0,90,45,119]){
   drawActionStatusExample(ctx,example,frame/30);assert.equal(hash(),hashes[frame]);
  }
  const overflow=createActionStatusExample({...config,label:'x'.repeat(500)});
  assert.throws(()=>drawActionStatusExample(ctx,overflow,4),RangeError);
  // Renderer restores context even when rejecting a too-wide label.
  assert.equal(ctx.globalAlpha,1);
 }
});
