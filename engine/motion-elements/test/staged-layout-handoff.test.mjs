import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import {compileStagedLayoutHandoff as compile,sampleStagedLayoutHandoff as sample} from '../lib/recipes/staged-layout-handoff.mjs';
import {compileLayoutHandoff,sampleLayoutHandoff} from '../lib/recipes/layout-handoff.mjs';
import {rational as T} from '../lib/time.mjs';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
const item=(itemId,x,y)=>({itemId,rect:{x:0,y:0,width:8,height:6},matrix:[1,0,0,1,x,y],zIndex:3,geometryBounds:{x,y,width:8,height:6}});
const fixture=()=>({snapshots:[[item('a',0,0),item('b',20,0)],[item('b',30,0),item('a',10,0)],[item('a',10,20),item('b',30,20)]],ranges:[{start:T(1),end:T(2)},{start:T(2),end:T(4)}]});
test('normal exact stage selection, first-order identity and old evaluator equivalence',()=>{
 const p=compile(fixture());
 for(const t of [T(0),T(1),T(3,2),T(2),T(3),T(4),T(10)]){
  const result=sample(p,t),i=Number(t.n)/Number(t.d)>=2?1:0;
  const old=sampleLayoutHandoff(compileLayoutHandoff({from:p.snapshots[i],to:p.snapshots[i+1],range:p.ranges[i]}),t);
  assert.equal(result.stageIndex,i);assert.equal(result.stageProgress,old.progress);assert.deepEqual(result.items,old.items);
  assert.deepEqual(result.items.map(v=>[v.itemId,v.zIndex,v.opacity,v.role]),[['a',0,1,'shared'],['b',1,1,'shared']]);
 }
 assert.equal(sample(p,T(2)).stageProgress,0);assert.equal(sample(p,T(4)).stageProgress,1);
});
test('reduced means global final geometry even before start, original clocks unchanged',()=>{
 const p=compile(fixture()),final=sample(p,T(4)).items;
 for(const t of [T(0),T(3,2),T(2),T(4)]){
  const normal=sample(p,t),reduced=sample(p,t,{reducedMotion:true});
  assert.deepEqual(reduced.items,final);
  for(const k of ['phase','progress','stageIndex','stageProgress'])assert.equal(reduced[k],normal[k]);
 }
});
test('deep snapshot isolation, state freezing, interleaving and foreign brands',()=>{
 const input=fixture(),before=structuredClone(input),p=compile(input);input.snapshots[0][0].matrix[4]=999;
 const states=new Map([0,1.5,2,4].map(t=>[t,sample(p,T(t*10,10))]));
 for(const t of [4,0,2,1.5]){sample(compile(before),T(3));assert.deepEqual(sample(p,T(t*10,10)),states.get(t));}
 assert.ok(Object.isFrozen(p.snapshots[0][0].matrix));assert.ok(Object.isFrozen(states.get(1.5).items[0]));
 assert.throws(()=>sample(structuredClone(p),T(3)));assert.throws(()=>sample(p,T(3),{reducedMotion:null}));assert.throws(()=>sample(p,T(3),{bad:1}));
});
test('strict fields, ID sets, contiguous positive timing and translation validation',()=>{
 const edits=[p=>p.snapshots[1].pop(),p=>p.snapshots[1][0].itemId='a',p=>p.snapshots[1][0].itemId='other',p=>p.ranges[1].start=T(5,2),p=>p.ranges[1].start=T(3,2),p=>p.ranges[0].end=p.ranges[0].start,p=>p.snapshots[0][0].matrix[0]=2,p=>p.snapshots[0][0].geometryBounds.x=1,p=>p.snapshots[0][0].rect.width=NaN];
 for(const edit of edits){const p=fixture();edit(p);assert.throws(()=>compile(p));}
 for(const path of [[],['ranges',0],['snapshots',0,0],['snapshots',0,0,'rect']]){
  const source=path.reduce((v,k)=>v[k],fixture());
  for(const key of Object.keys(source))for(const mode of ['delete','null']){const p=fixture(),o=path.reduce((v,k)=>v[k],p);if(mode==='delete')delete o[key];else o[key]=null;assert.throws(()=>compile(p));}
  const p=fixture();path.reduce((v,k)=>v[k],p).bad=1;assert.throws(()=>compile(p));
 }
});
test('ordinary dense array gates block subclass, foreign realm, holes and own methods',()=>{
 for(const path of [['snapshots'],['ranges'],['snapshots',0],['snapshots',0,0,'matrix']])for(const kind of ['subclass','foreign','hole','method','symbol']){
  const p=fixture(),o=path.slice(0,-1).reduce((v,k)=>v[k],p),key=path.at(-1),a=o[key];
  if(kind==='subclass')o[key]=new(class extends Array{})(...a);
  if(kind==='foreign')o[key]=vm.runInNewContext('[]').concat(a);
  if(kind==='hole')delete a[0];if(kind==='method')a.map=()=>[];if(kind==='symbol')a[Symbol('x')]=1;
  assert.throws(()=>compile(p),`${path}/${kind}`);
 }
});
test('stage and item resource bounds, zero and excess rejected',()=>{
 const snapshots=Array.from({length:17},(_,j)=>Array.from({length:128},(_,i)=>item(`i${i}`,i,j)));
 const ranges=Array.from({length:16},(_,i)=>({start:T(i),end:T(i+1)}));
 const p=compile({snapshots,ranges});assert.equal(sample(p,T(8)).items.length,128);
 for(const bad of [{snapshots:snapshots.slice(0,2),ranges:ranges.slice(0,1)},{snapshots:[...snapshots,snapshots[0]],ranges:[...ranges,{start:T(16),end:T(17)}]},{snapshots:[[],[],[]],ranges:ranges.slice(0,2)}])assert.throws(()=>compile(bad));
 const excess=fixture();excess.snapshots[0]=Array.from({length:129},(_,i)=>item(`i${i}`,i,0));assert.throws(()=>compile(excess));
});
test('shared clock 30-digit input and intermediate arithmetic bounds are not bypassed',()=>{
 const p=compile(fixture());assert.throws(()=>sample(p,{n:'1',d:'1'+'0'.repeat(30)}),/integer|bound/i);
 const a='999999999999999999999999999989',b='999999999999999999999999999961';
 const bad=fixture();bad.ranges=[{start:T(1,a),end:T(1,b)},{start:T(1,b),end:T(1)}];assert.throws(()=>compile(bad),/30-digit/);
 const aa=a.slice(1),bb=b.slice(1);
 const s=fixture();s.ranges=[{start:T(1,aa),end:T(1)},{start:T(1),end:T(2)}];const plan=compile(s);assert.throws(()=>sample(plan,T(1,bb)),/30-digit/);
});
test('Native pixels equal manual stages, seek replay and fresh process results',()=>{
 const {api}=loadNativeCanvas(),canvas=api.createCanvas(50,35),ctx=canvas.getContext('2d'),p=compile(fixture());
 const draw=items=>{ctx.clearRect(0,0,50,35);for(const v of items){ctx.save();try{ctx.transform(...v.matrix);ctx.fillRect(v.rect.x,v.rect.y,v.rect.width,v.rect.height);}finally{ctx.restore();}}return canvas.toBuffer('image/png');};
 const times=[T(0),T(3,2),T(2),T(3),T(4)],images=times.map(t=>draw(sample(p,t).items));
 for(let j=times.length-1;j>=0;j--){const t=times[j],s=sample(p,t),old=compileLayoutHandoff({from:p.snapshots[s.stageIndex],to:p.snapshots[s.stageIndex+1],range:p.ranges[s.stageIndex]});assert.deepEqual(draw(sampleLayoutHandoff(old,t).items),images[j]);}
 assert.equal(ctx.getTransform().e,0);
 const url=new URL('../lib/recipes/staged-layout-handoff.mjs',import.meta.url).href,code=`import {compileStagedLayoutHandoff as c,sampleStagedLayoutHandoff as s} from ${JSON.stringify(url)};console.log(JSON.stringify(s(c(${JSON.stringify(fixture())}),{n:'3',d:'1'})))`;
 const run=()=>spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'}),a=run(),b=run();assert.equal(a.status,0,a.stderr);assert.equal(a.stdout,b.stdout);
});
