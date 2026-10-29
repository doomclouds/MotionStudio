import test from 'node:test';
import assert from 'node:assert/strict';
import * as m from '../lib/index.mjs';
const T=m.rational, range={start:T(1),end:T(3)};
const base={type:'motion.transform',version:1,range,params:{from:{x:0,y:0,scaleX:1,scaleY:1,rotation:0},to:{x:100,y:50,scaleX:2,scaleY:3,rotation:0}}};
const opacity={type:'motion.opacity',version:1,range,params:{from:0,to:1}};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('rational endpoints and half-open active phase; no N-1 remap',()=>{
  assert.equal(m.sampleMotion(base,T(0)).phase,'before');assert.equal(m.sampleMotion(base,T(1)).phase,'active');
  assert.equal(m.sampleMotion(base,T(3)).phase,'after');assert.equal(m.sampleMotion(base,T(4)).progress,1);
  assert.equal(m.sampleMotion(base,T(2)).matrix[4],50);
  assert.equal(m.sampleMotion({...base,range:{start:T(0),end:T(1)}},m.framesToTime(29,{n:30,d:1})).progress,29/30);
});
test('strict version, time shape, nulls, unknown fields and zero duration reject',()=>{
  for(const bad of [{...base,extra:1},{...base,version:2},{...base,range:{start:T(1),end:T(1)}},{...base,range:{start:{n:0,d:1},end:T(2)}},{...base,params:null},{...base,curve:null},{...base,params:{...base.params,extra:1}}])assert.throws(()=>m.sampleMotion(bad,T(2)));
  assert.throws(()=>m.sampleMotion(base,T(2),{reducedMotion:null}));assert.throws(()=>m.sampleMotion(base,{n:'0',d:'0'}));
});
test('transform property values, mirrored and zero scales are explicit',()=>{
  assert.throws(()=>m.sampleMotion({...base,params:{...base.params,to:{...base.params.to,x:NaN}}},T(2)));
  const state=m.sampleMotion({...base,params:{from:base.params.from,to:{...base.params.to,scaleX:-1,scaleY:0}}},T(3));assert.equal(state.matrix[0],-1);assert.equal(state.matrix[3],0);
});
test('origin remains fixed during squash, area is conserved',()=>{
  const spec={type:'motion.anchored-squash',version:1,range,params:{amount:.4,axis:'y',origin:{x:30,y:80}}};
  const s=m.sampleMotion(spec,T(2));const p=m.transformPoint(s.matrix,{x:30,y:80});close(p.x,30);close(p.y,80);close(s.matrix[0]*s.matrix[3],1);
  assert.deepEqual(m.sampleMotion(spec,T(3)).matrix,m.identity());
});
test('parent and pivot matrix order and transformed bounds agree',()=>{
  const child=m.composeTransform({x:10,y:0,rotation:Math.PI/2,pivot:{x:5,y:5}}),parent=m.composeTransform({x:100,y:20,scaleX:2,scaleY:2});
  const world=m.multiply(parent,child);const p=m.transformPoint(world,{x:5,y:5});close(p.x,130);close(p.y,30);
  const b=m.transformBounds(world,{x:0,y:0,width:10,height:10});close(b.width,20);close(b.height,20);
});
test('curve solves x rather than substituting t as x',()=>{
  close(m.curve({type:'cubic-bezier',values:[0,0,1,1]},.3),.3);
  assert.ok(m.curve({type:'cubic-bezier',values:[0,0,0,1]},.5)>.8);
  assert.throws(()=>m.curve({type:'cubic-bezier',values:[.9,0,.1,1]},.5));
  assert.throws(()=>m.curve({type:'linear',values:[0,0,1,1]},.5));
});
test('seeded shake evaluates identically forward, backward and permuted',()=>{
  const spec={type:'motion.shake',version:1,range,params:{amplitudeX:8,amplitudeY:4,rotation:.03,frequencyHz:12,seed:'test',elementId:'box'}};
  const times=[T(1),T(5,4),T(3,2),T(2),T(11,4),T(3)],baseline=times.map(t=>m.sampleMotion(spec,t));
  for(const i of [5,2,0,4,1,3])assert.deepEqual(m.sampleMotion(spec,times[i]),baseline[i]);
  assert.deepEqual(baseline[0].matrix,m.identity());assert.deepEqual(baseline[5].matrix,m.identity());
  assert.notDeepEqual(m.sampleMotion({...spec,params:{...spec.params,elementId:'other'}},T(2)).matrix,baseline[3].matrix);
});
test('reduced motion does not alter timing and suppresses motion not opacity',()=>{
  const a=m.sampleMotion(base,T(2),{reducedMotion:true});assert.equal(a.phase,'active');assert.equal(a.progress,.5);assert.deepEqual(a.matrix,m.sampleMotion(base,T(3)).matrix);
  assert.equal(m.sampleMotion(opacity,T(2),{reducedMotion:true}).opacity,.5);
});
test('state composition rejects implicit double writers',()=>{
  const x=m.sampleMotion(base,T(2)),o=m.sampleMotion(opacity,T(2));
  assert.equal(m.composeMotionStates([{channel:'transform',state:x},{channel:'opacity',state:o}]).opacity,.5);
  assert.throws(()=>m.composeMotionStates([{channel:'transform',state:x},{channel:'transform',state:x}]));
  assert.throws(()=>m.composeMotionStates([{channel:'opacity',state:x}]));
});
test('stagger compiles exact absolute offsets and rejects duplicate ids',()=>{
  const a=m.compileStagger({itemIds:['a','b','c'],start:T(1),duration:T(1),step:T(1,3)});assert.deepEqual(a[2].range.start,T(5,3));assert.deepEqual(a[2].range.end,T(8,3));
  assert.throws(()=>m.compileStagger({itemIds:['a','a'],start:T(0),duration:T(1),step:T(0)}));
});
test('layouts expose stable identity and geometric bounds',()=>{
  const cards=m.offsetCards({itemIds:['a','b'],origin:{x:20,y:30},card:{width:100,height:80},offset:{x:30,y:-10},rotationStep:.1});
  assert.equal(cards[1].itemId,'b');assert.equal(cards[1].zIndex,1);assert.ok(cards[1].geometryBounds.width>100);
  const panels=m.splitPanels({itemIds:['a','b'],viewport:{width:300,height:100},axis:'x',gap:10});assert.equal(panels[0].rect.width,145);assert.equal(panels[1].matrix[4],155);
  assert.throws(()=>m.splitPanels({itemIds:['a','b'],viewport:{width:300,height:100},axis:'x',gap:300}));
});
test('transitions begin A and end B, reduced-motion static cut preserves duration',()=>{
  for(const type of ['transition.push','transition.rect-wipe'])for(const direction of ['left','right','up','down']){
    const s={type,version:1,range,params:{width:100,height:80,direction}};
    assert.equal(m.sampleTransition(s,T(1)).layers[1].opacity,0);assert.equal(m.sampleTransition(s,T(3)).layers[0].opacity,0);
    const r=m.sampleTransition(s,T(2),{reducedMotion:true});assert.equal(r.progress,.5);assert.deepEqual(r.layers[1].matrix,m.identity());assert.equal(r.layers[1].opacity,1);
  }
});
test('offset reassembly uses layouts and stagger, exact final and parent bounds',()=>{
  const spec={type:'recipe.offset-reassembly',version:1,range,params:{itemIds:['a','b','c'],origin:{x:10,y:20},card:{width:50,height:30},offset:{x:30,y:5},step:T(1,4),travel:{x:0,y:100}}};
  const end=m.sampleOffsetReassembly(spec,T(3));assert.equal(end[2].opacity,1);assert.equal(end[2].matrix[4],70);
  const mid=m.sampleOffsetReassembly(spec,T(2),{parentMatrix:m.composeTransform({x:100})});close(mid[0].geometryBounds.x,mid[0].matrix[4]);assert.ok(mid[0].matrix[4]>100);
  assert.deepEqual(m.sampleOffsetReassembly(spec,T(2)),m.sampleOffsetReassembly(spec,T(2)));
  assert.throws(()=>m.sampleOffsetReassembly({...spec,params:{...spec.params,step:T(1)}},T(2)));
});
test('nonplain params and compose options are rejected',()=>{
 class P {constructor(){this.from=0;this.to=1;}}
 assert.throws(()=>m.sampleMotion({...opacity,params:new P()},T(2)));
 assert.throws(()=>m.composeMotionStates([],{typo:1}));
});
test('all catalog examples remain executable and stable IDs unique',async()=>{
 const {readFile}=await import('node:fs/promises');const catalog=JSON.parse(await readFile(new URL('../catalog.json',import.meta.url)));
 assert.equal(catalog.elements.length,67);assert.equal(new Set(catalog.elements.map(e=>e.id)).size,67);
 for(const e of catalog.elements){const m=await import(new URL('../'+e.entry,import.meta.url));if(e.api==='morphologyCoverage'){m.morphologyCoverage({...e.example,data:Uint8Array.from(e.example.data)});continue;}if(e.api==='compileGridTransport'){m.compileGridTransport(m.compileVelocityGrid(e.exampleSetup.velocityGrid),e.example);continue;}assert.equal(e.status,'experimental');assert.equal(typeof m[e.api],'function');if(e.api==='layoutGlyphRunOnPath'){m.layoutGlyphRunOnPath(m.compileCubicPath(e.exampleSetup.path),e.example);continue;}if(e.api==='withLocalReveal'){const {loadNativeCanvas}=await import('../../motion-render-core/lib/native.mjs');const {api}=loadNativeCanvas();m.withLocalReveal(api.createCanvas(320,180).getContext('2d'),e.example,()=>{},{Path2D:api.Path2D});continue;}m[e.api](e.example,...(e.exampleArgs??(['sampleMotion','sampleTransition','sampleOffsetReassembly','sampleKeyframeTrack'].includes(e.api)?[T(1)]:[])));}
});
