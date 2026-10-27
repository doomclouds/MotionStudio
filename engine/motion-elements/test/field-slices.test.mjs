import test from 'node:test';
import assert from 'node:assert/strict';
import * as m from '../lib/index.mjs';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
const {api}=loadNativeCanvas(),backend={Path2D:api.Path2D};
const field={bounds:{x:0,y:0,width:120,height:80},columns:6,rows:4};
const slices={width:101,height:67,bands:9,maxOffset:35,seed:'synthetic',instanceId:'panel',range:{start:m.rational(1),end:m.rational(4)},jitterCycles:4};
const draw=c=>{c.fillStyle='#9382ad';c.fillRect(0,0,101,67);c.clearRect(20,12,17,29);c.globalAlpha=.4;c.fillStyle='#f9dd73';c.fillRect(50,0,29,67);};
const make=()=>api.createCanvas(180,140).getContext('2d');
const bytes=c=>c.getImageData(0,0,180,140).data;
test('field orientation, stable IDs, singularity and zero coefficients',()=>{
 const plan=m.compileAttractorField(field),a=plan.cells[0].position;
 for(const [radial,tangential] of [[1,0],[0,1],[.4,-.8],[Number.MIN_VALUE,Number.MIN_VALUE]]){
  const state=m.sampleAttractorField(plan,{attractor:a,radial,tangential});assert.equal(state.cells[0].defined,false);assert.deepEqual(state.cells[0].direction,{x:0,y:0});
  for(const cell of state.cells.slice(1)){assert.ok(Math.abs(Math.hypot(cell.direction.x,cell.direction.y)-1)<1e-12);assert.ok(Number.isFinite(cell.angle));}
 }
 const zero=m.sampleAttractorField(plan,{attractor:a,radial:0,tangential:0});assert.ok(zero.cells.every(c=>!c.defined));
 const toward=m.sampleAttractorField(plan,{attractor:{x:20,y:10},radial:1,tangential:0}).cells[0];assert.deepEqual(toward.direction,{x:1,y:0});
 const tangent=m.sampleAttractorField(plan,{attractor:{x:20,y:10},radial:0,tangential:1}).cells[0];assert.deepEqual(tangent.direction,{x:0,y:1});
 assert.ok(Object.isFrozen(plan.cells[0]));assert.equal(new Set(plan.cells.map(c=>c.cellId)).size,24);
});
test('field independent shuffled samples and no parent transform option',()=>{
 const plan=m.compileAttractorField(field),inputs=[0,1,2,3].map(i=>({attractor:{x:i*30,y:20},radial:.7,tangential:.3}));
 const original=inputs.map(v=>m.sampleAttractorField(plan,v));for(const i of [3,1,0,2])assert.deepEqual(m.sampleAttractorField(plan,inputs[i]),original[i]);
 assert.throws(()=>m.sampleAttractorField(plan,{...inputs[0],parentMatrix:m.identity()}));
});
test('strict null, unknown, nonfinite, resource and forged-plan rejection',()=>{
 for(const bad of [null,{...field,extra:1},{...field,columns:129},{...field,columns:128,rows:128},{...field,bounds:{...field.bounds,width:NaN}},{...field,bounds:{...field.bounds,x:null}}])assert.throws(()=>m.compileAttractorField(bad));
 const plan=m.compileAttractorField(field);for(const bad of [null,{attractor:{x:0,y:Infinity},radial:1,tangential:0},{attractor:{x:0,y:0},radial:null,tangential:0}])assert.throws(()=>m.sampleAttractorField(plan,bad));
 assert.throws(()=>m.sampleAttractorField({...plan},{}));
 for(const bad of [null,{...slices,extra:1},{...slices,bands:1},{...slices,width:8193},{...slices,width:8192,height:8192},{...slices,maxOffset:NaN},{...slices,jitterCycles:null},{...slices,seed:null},{...slices,range:{start:m.rational(2),end:m.rational(1)}}])assert.throws(()=>m.compileSliceDisplacement(bad));
 const p=m.compileSliceDisplacement(slices);assert.throws(()=>m.sampleSliceDisplacement({...p},m.rational(2)));for(const c of [null,{reducedMotion:null},{extra:1}])assert.throws(()=>m.sampleSliceDisplacement(p,m.rational(2),c));
 assert.throws(()=>m.withSliceDisplacement(make(),{},draw,backend));
});
test('slice seek/seed determinism, bilateral bound, integer partition, exact home',()=>{
 const p=m.compileSliceDisplacement(slices),times=[0,1,1.01,1.5,2.3,3.9,4,5].map(x=>m.rational(Math.round(x*100),100));
 const states=times.map(t=>m.sampleSliceDisplacement(p,t));for(const i of [7,3,0,6,2,1,5,4])assert.deepEqual(m.sampleSliceDisplacement(p,times[i]),states[i]);
 assert.equal(p.bands.reduce((n,b)=>n+b.height,0),67);assert.equal(p.bands.at(-1).y+p.bands.at(-1).height,67);
 for(const s of states){assert.equal(new Set(s.bands.map(b=>b.bandId)).size,9);for(const b of s.bands)assert.ok(Math.abs(b.offset)<=35);}
 for(const i of [0,1,6,7])assert.ok(states[i].atHome&&states[i].bands.every(b=>Object.is(b.offset,0)));
 assert.ok(states[4].bands.some(b=>b.offset<0)&&states[4].bands.some(b=>b.offset>0));
 assert.deepEqual(m.sampleSliceDisplacement(m.compileSliceDisplacement(slices),times[4]),states[4]);
 assert.notDeepEqual(m.sampleSliceDisplacement(m.compileSliceDisplacement({...slices,seed:'other'}),times[4]),states[4]);
 assert.ok(m.sampleSliceDisplacement(p,times[4],{reducedMotion:true}).atHome);
});
test('native identity exactly equals unsliced raster under arbitrary parent transform and alpha',()=>{
 const p=m.compileSliceDisplacement(slices);
 for(const [at,context] of [[m.rational(1),{}],[m.rational(4),{}],[m.rational(2),{reducedMotion:true}]]){
  const a=make(),b=make();for(const c of [a,b]){c.translate(25.3,20.7);c.rotate(.23);c.scale(1.1,.8);c.globalAlpha=.7;}
  draw(a);let calls=0;m.withSliceDisplacement(b,m.sampleSliceDisplacement(p,at,context),c=>{calls++;draw(c);},backend);assert.equal(calls,1);assert.deepEqual(bytes(b),bytes(a));
 }
});
test('adapter restores clip/style/transform on errors, preserves own current path, rejects async',()=>{
 const p=m.compileSliceDisplacement(slices),s=m.sampleSliceDisplacement(p,m.rational(2)),c=make();
 c.beginPath();c.rect(150,110,10,10);c.translate(2,3);c.globalAlpha=.7;c.fillStyle='blue';const before=c.getTransform();
 assert.throws(()=>m.withSliceDisplacement(c,s,x=>{x.translate(40,50);x.globalAlpha=.2;x.fillStyle='red';throw Error('expected');},backend),/expected/);
 assert.deepEqual(c.getTransform(),before);assert.ok(Math.abs(c.globalAlpha-.7)<.01);// Native backend getters can retain the last assigned style after restore; test actual raster below.
 c.resetTransform();c.globalAlpha=1;c.fill();assert.deepEqual([...c.getImageData(155,115,1,1).data],[0,0,255,255]);
 c.fillRect(170,0,10,10);assert.equal(c.getImageData(175,5,1,1).data[3],255);
 assert.throws(()=>m.withSliceDisplacement(c,s,async()=>{},backend));assert.throws(()=>m.withSliceDisplacement(c,s,()=>Promise.resolve(),backend));assert.deepEqual(c.getTransform(),make().getTransform());
});
test('native shuffled slice raster deterministic',()=>{
 const p=m.compileSliceDisplacement(slices),render=t=>{const c=make();m.withSliceDisplacement(c,m.sampleSliceDisplacement(p,m.rational(t,10)),draw,backend);return bytes(c);};
 const expected=[15,23,31].map(render);for(const i of [2,0,1])assert.deepEqual(render([15,23,31][i]),expected[i]);
});

test('field normalizes subnormal spatial deltas',()=>{
 const p=m.compileAttractorField({bounds:{x:-.5,y:-.5,width:1,height:1},columns:1,rows:1});
 const c=m.sampleAttractorField(p,{attractor:{x:Number.MIN_VALUE,y:Number.MIN_VALUE},radial:1,tangential:0}).cells[0];
 assert.ok(c.defined);assert.ok(Math.abs(Math.hypot(c.direction.x,c.direction.y)-1)<1e-15);
});
test('field continuous away from singularity and slice envelope approaches home',()=>{
 const p=m.compileAttractorField(field),a=m.sampleAttractorField(p,{attractor:{x:60,y:40},radial:.4,tangential:.6}),b=m.sampleAttractorField(p,{attractor:{x:60+1e-7,y:40},radial:.4,tangential:.6});
 for(let i=0;i<a.cells.length;i++)assert.ok(Math.hypot(a.cells[i].direction.x-b.cells[i].direction.x,a.cells[i].direction.y-b.cells[i].direction.y)<1e-6);
 const s=m.compileSliceDisplacement(slices);for(const at of [m.rational(1000001,1000000),m.rational(3999999,1000000)]){
  const state=m.sampleSliceDisplacement(s,at);assert.equal(state.atHome,false);assert.ok(state.bands.every(b=>Math.abs(b.offset)<1e-9));
 }
});
test('four semantic examples render deterministic normal/reduced frames',async()=>{
 const {config,createGalleryScene}=await import('../examples/field-slices-scene.mjs');
 for(const reducedMotion of [false,true]){
  const canvas=api.createCanvas(config.width,config.height),ctx=canvas.getContext('2d'),scene=await createGalleryScene({ctx,canvasApi:api,config},{reducedMotion});
  const render=f=>{scene.renderFrame(f);return ctx.getImageData(0,0,config.width,config.height).data;};
  const a=render(75);render(120);render(0);assert.deepEqual(render(75),a);
  if(reducedMotion)assert.deepEqual(render(0),a);
 }
});

// Regression: object-shape rejection covers every own key, not only enumerable strings.
test('unknown symbol and nonenumerable own keys rejected at every field/slice boundary',()=>{
 const fp=m.compileAttractorField(field),sp=m.compileSliceDisplacement(slices);
 for(const key of [Symbol('unknown'), 'hiddenUnknown']){
  const extra=value=>Object.defineProperty({...value},key,{value:123,enumerable:false});
  const checks=[
   ()=>m.compileAttractorField(extra(field)),
   ()=>m.compileAttractorField({...field,bounds:extra(field.bounds)}),
   ()=>m.sampleAttractorField(fp,extra({attractor:{x:0,y:0},radial:1,tangential:0})),
   ()=>m.sampleAttractorField(fp,{attractor:extra({x:0,y:0}),radial:1,tangential:0}),
   ()=>m.compileSliceDisplacement(extra(slices)),
   ()=>m.compileSliceDisplacement({...slices,range:extra(slices.range)}),
   ()=>m.compileSliceDisplacement({...slices,range:{...slices.range,start:extra(slices.range.start)}}),
   ()=>m.sampleSliceDisplacement(sp,extra(m.rational(2))),
   ()=>m.sampleSliceDisplacement(sp,m.rational(2),extra({reducedMotion:false}))
  ];
  for(const run of checks)assert.throws(run,/Unknown field:/);
 }
});
test('plain null-prototype and nonenumerable known fields remain supported',()=>{
 const input=Object.create(null,Object.fromEntries(Object.entries(field).map(([key,value])=>[key,{value,enumerable:false}])));
 assert.deepEqual(m.compileAttractorField(input),m.compileAttractorField(field));
});
