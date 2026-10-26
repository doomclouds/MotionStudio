import test from 'node:test';
import assert from 'node:assert/strict';
import {compileTileSignature as compile,sampleTileSignature as sample,rational as T,sampleTileScatter} from '../lib/index.mjs';
const input={type:'recipe.tile-signature',version:1,sourceId:'source',signatureId:'signature',sourceRect:{x:0,y:0,width:641,height:359},grid:'8x5',seed:'demo',instanceId:'study',start:T(0),displacement:{x:60,y:35},maxRotation:.16};
test('tile signature reverse reuses one plan and mirrors staggered global trajectory',()=>{
 const p=compile(input);
 for(const n of [0,1,10,30,60,90,119,120]){
  const out=sample(p,T(100+n,100)),back=sample(p,T(375-n,100));
  assert.strictEqual(out.source.tilePlan,p.tilePlan);assert.strictEqual(back.source.tilePlan,p.tilePlan);
  assert.deepEqual(out.source.tileState,back.source.tileState);
 }
 assert.equal(sample(p,T(255,100)).source.tileState.atHome,false);
 assert.equal(sample(p,T(3749,1000)).source.tileState.atHome,false);
 assert.equal(sample(p,T(375,100)).source.tileState.atHome,true);
});
test('source parent remains locked through aggregation and exact home precedes whole-source settling',()=>{
 const p=compile(input),base=sample(p,T(0)).source.matrix;
 for(const n of [0,100,150,220,254,255,300,374,375,400,455])assert.deepEqual(sample(p,T(n,100)).source.matrix,base);
 for(const n of [456,480,505,515,565,800])assert.equal(sample(p,T(n,100)).source.tileState.atHome,true);
 const final=sample(p,T(8));assert.equal(final.source.geometryBounds.width,720);
 assert.ok(Math.abs(final.source.geometryBounds.y+final.source.geometryBounds.height/2-420)<1e-10);
 assert.ok(final.source.geometryBounds.y+final.source.geometryBounds.height<final.signature.geometryBounds.y);
 assert.equal(final.signature.reveal,1);
});
test('tile signature phase continuity, offset start and deterministic seeks',()=>{
 const p=compile(input),shift=compile({...input,start:T(17)});
 for(const n of [0,100,220,255,375,455,505,515,535,565,800]){
 const a=sample(p,T(n*1000-1,100000)),b=sample(p,T(n*1000+1,100000));
 for(let i=0;i<6;i++)assert.ok(Math.abs(a.source.matrix[i]-b.source.matrix[i])<.01);
 const current=sample(p,T(n,100)),later=sample(shift,T(n+1700,100));assert.deepEqual(current.source.tileState,later.source.tileState);assert.deepEqual(current.source.matrix,later.source.matrix);
 }
 const expected=new Map([0,1,2,3,4,5,6,8].map(n=>[n,sample(p,T(n))]));for(const n of [8,2,5,0,3,1,6,4])assert.deepEqual(sample(p,T(n)),expected.get(n));
});
test('reduced source remains explicit whole content, cues/read holds unchanged and signature cut timed',()=>{
 const p=compile(input);
 for(const n of [0,100,150,220,255,300,375,455,515,800]){
  const a=sample(p,T(n,100)),b=sample(p,T(n,100),{reducedMotion:true});
  assert.deepEqual(a.cueTimes,b.cueTimes);assert.equal(b.source.tileState.atHome,true);assert.equal(b.reducedMode,'static-source-no-fragment-narrative');
 }
 assert.equal(sample(p,T(5349,1000),{reducedMotion:true}).signature.reveal,0);
 assert.equal(sample(p,T(535,100),{reducedMotion:true}).signature.reveal,1);
});
test('tile signature rejects invalid shape, resource, safe-area and parent contracts',()=>{
 for(const bad of [null,{...input,extra:1},{...input,signatureId:'source'},{...input,grid:'9x9'},{...input,sourceRect:{x:0,y:0,width:100,height:100}},{...input,maxRotation:.4},{...input,displacement:{x:129,y:35}},{...input,start:T(-1)}])assert.throws(()=>compile(bad));
 const p=compile(input);assert.throws(()=>sample(JSON.parse(JSON.stringify(p)),T(1)));
 assert.throws(()=>sample(p,T(1),{parentMatrix:[1,0,0,2,0,0]}));assert.throws(()=>sample(p,T(1),{typo:1}));
 assert.equal(sample(p,T(8),{parentMatrix:[.5,0,0,.5,20,30]}).source.geometryBounds.width,360);
 assert.equal(compile({...input,grid:'5x3'}).tilePlan.tiles.length,15);
 assert.deepEqual(sample(p,T(375,100)).source.tileState,sampleTileScatter(p.tilePlan,T(1),{direction:'out'}));
});
