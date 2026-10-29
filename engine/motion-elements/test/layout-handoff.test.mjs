import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {compileLayoutHandoff as compile,sampleLayoutHandoff as sample} from '../lib/recipes/layout-handoff.mjs';
import {rational as T} from '../lib/time.mjs';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
const item=(itemId,x)=>({itemId,rect:{x:0,y:0,width:10,height:10},matrix:[1,0,0,1,x,0],zIndex:0,geometryBounds:{x,y:0,width:10,height:10}});
const input=()=>({from:[item('a',0),item('exit',20)],to:[item('a',40),item('enter',60)],range:{start:T(1),end:T(3)}});
test('identity, endpoints, midpoint, fade and frozen input isolation',()=>{
 const src=input(),before=structuredClone(src),p=compile(src);src.from[0].matrix[4]=99;
 const mid=sample(p,T(2));assert.deepEqual(mid.items.map(v=>[v.itemId,v.matrix[4],v.opacity,v.role]),[['a',20,1,'shared'],['enter',60,.5,'enter'],['exit',20,.5,'exit']]);
 assert.ok(Object.isFrozen(mid.items[0].matrix));assert.deepEqual(p.from,before.from);
 assert.equal(sample(p,T(0)).items[0].matrix[4],0);assert.equal(sample(p,T(4)).items[0].matrix[4],40);
 for(const t of [3,1,2,0,4])assert.deepEqual(sample(p,T(t)),sample(compile(before),T(t)));
 const reduced=sample(p,T(2),{reducedMotion:true});assert.equal(reduced.items[0].matrix[4],40);assert.equal(reduced.progress,.5);assert.equal(reduced.items[1].opacity,.5);
});
test('reject invalid specs, sparse/unknown arrays, duplicates, nontranslation and stale bounds',()=>{
 for(const bad of [null,{}, {...input(),unknown:1},{...input(),from:[],to:[]},{...input(),from:Array(1)},{...input(),from:[item('a',0),item('a',1)]}])assert.throws(()=>compile(bad));
 for(const edit of [p=>p.from[0].matrix[0]=2,p=>p.from[0].rect.width=0,p=>p.from[0].geometryBounds.x=1,p=>p.from.extra=1,p=>p.from[0].matrix[4]=NaN,p=>p.range.end=T(1)]){const p=input();edit(p);assert.throws(()=>compile(p));}
 const p=compile(input());assert.throws(()=>sample(structuredClone(p),T(2)));assert.throws(()=>sample(p,T(2),{reducedMotion:null}));assert.throws(()=>sample(p,T(2),{unknown:1}));
 assert.equal(sample(compile({...input(),from:[]}),T(1)).items[0].opacity,0);
});
test('Native pixels seek repeatably without contaminating drawing state',()=>{
 const {api}=loadNativeCanvas(),canvas=api.createCanvas(90,20),ctx=canvas.getContext('2d'),p=compile(input());
 const draw=t=>{ctx.clearRect(0,0,90,20);for(const v of sample(p,T(t)).items){ctx.save();try{ctx.transform(...v.matrix);ctx.globalAlpha=v.opacity;ctx.fillRect(v.rect.x,v.rect.y,v.rect.width,v.rect.height);}finally{ctx.restore();}}return canvas.toBuffer('image/png');};
 const frames=[1,2,3].map(draw);for(const t of [3,1,2])assert.deepEqual(draw(t),frames[t-1]);assert.equal(ctx.globalAlpha,1);assert.equal(ctx.getTransform().e,0);
});
test('fresh processes agree',()=>{
 const url=new URL('../lib/recipes/layout-handoff.mjs',import.meta.url).href;
 const code=`import {compileLayoutHandoff as c,sampleLayoutHandoff as s} from ${JSON.stringify(url)};console.log(JSON.stringify(s(c(${JSON.stringify(input())}),{n:'2',d:'1'})))`;
 const run=()=>spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});const a=run(),b=run();assert.equal(a.status,0,a.stderr);assert.equal(a.stdout,b.stdout);
});
test('every structured field rejects missing/null/unknown and numeric nonfinite',()=>{
 for(const path of [[],['from',0],['from',0,'rect'],['from',0,'geometryBounds'],['range']]){
  const original=path.reduce((v,k)=>v[k],input());
  for(const key of Object.keys(original))for(const mode of ['missing','null']){
   const p=input(),obj=path.reduce((v,k)=>v[k],p);if(mode==='missing')delete obj[key];else obj[key]=null;assert.throws(()=>compile(p),`${path}/${key}/${mode}`);
  }
  const p=input();path.reduce((v,k)=>v[k],p).unknown=1;assert.throws(()=>compile(p));
 }
 for(const value of [NaN,Infinity,-Infinity])for(const target of ['rect','geometryBounds'])for(const key of ['x','y','width','height']){
  const p=input();p.from[0][target][key]=value;assert.throws(()=>compile(p));
 }
});
test('union limits, enter/exit only, stable target order and size reduced policy',()=>{
 const many=Array.from({length:128},(_,i)=>item(`i${i}`,i));
 assert.equal(sample(compile({...input(),from:many,to:[]}),T(2)).items.length,128);
 assert.throws(()=>compile({...input(),from:many,to:[item('new',1)]}));
 assert.throws(()=>compile({...input(),from:[...many,item('extra',0)],to:[]}));
 const enter=sample(compile({...input(),from:[]}),T(2));assert.ok(enter.items.every(x=>x.role==='enter'&&x.opacity===.5));
 const exit=sample(compile({...input(),to:[]}),T(2));assert.ok(exit.items.every(x=>x.role==='exit'&&x.opacity===.5));
 const p=input();p.to.reverse();p.to[1].rect.width=30;p.to[1].geometryBounds.width=30;
 const plan=compile(p);for(const t of [1,2,3])assert.deepEqual(sample(plan,T(t)).items.map(x=>x.itemId),['enter','a','exit']);
 assert.equal(sample(plan,T(2)).items[1].rect.width,20);
 assert.equal(sample(plan,T(2),{reducedMotion:true}).items[1].rect.width,30);
 const extreme=item('bound',1e6);extreme.rect.width=1e6;extreme.geometryBounds.width=1e6;
 assert.doesNotThrow(()=>compile({...input(),from:[],to:[extreme]}));
 extreme.matrix[4]=1e6+1;assert.throws(()=>compile({...input(),from:[],to:[extreme]}));
});
test('all legal maximum structured stack coordinates fit handoff domain',async()=>{
 const {constraintStackLayout}=await import('../lib/structured-layouts.mjs');
 const from=constraintStackLayout({items:Array.from({length:128},(_,i)=>({itemId:`i${i}`,width:10000,height:10000})),axis:'y',gap:10000});
 const p=compile({from,to:from,range:{start:T(0),end:T(1)}});
 assert.equal(sample(p,T(1)).items.at(-1).matrix[5],2540000);
});
test('large-to-small endpoint dimensions and translation remain exact',()=>{
 const sized=(x,width)=>({itemId:'a',rect:{x:0,y:0,width,height:1},matrix:[1,0,0,1,x,0],zIndex:0,geometryBounds:{x,y:0,width,height:1}});
 const from=sized(1e7,1e7),to=sized(.001,.001),p=compile({from:[from],to:[to],range:{start:T(0),end:T(1)}});
 for(const state of [sample(p,T(1)),sample(p,T(2)),sample(p,T(0),{reducedMotion:true})]){
  assert.deepEqual(state.items[0].matrix,to.matrix);assert.deepEqual(state.items[0].rect,to.rect);
 }
 assert.deepEqual(sample(p,T(-1)).items[0].rect,from.rect);
});
test('minimum multi-item layouts and summed coordinate limits compose without narrowing input domains',async()=>{
 const {gridLayout,constraintStackLayout}=await import('../lib/structured-layouts.mjs');
 const {transformBounds}=await import('../lib/matrix.mjs');
 const range={start:T(0),end:T(1)};
 const layouts=[gridLayout({itemIds:['a','b'],width:.001,height:.001,columns:2,gap:1}),
  ...['x','y'].map(axis=>constraintStackLayout({items:[{itemId:'a',width:.001,height:.001},{itemId:'b',width:.001,height:.001}],axis,gap:1}))];
 for(const layout of layouts){
  const p=compile({from:layout,to:layout,range});
  // Motion matrices can normalize signed zero; all geometric values must match.
  for(const at of [T(0),T(1,2),T(1)])assert.equal(JSON.stringify(sample(p,at).items.map(({opacity,role,...item})=>item)),JSON.stringify(layout));
 }
 for(const x of [-1e7,1e7])for(const y of [-1e7,1e7])for(const size of [.001,1e7]){
  const rect={x,y,width:size,height:size},matrix=[1,0,0,1,x,y];
  const v={itemId:'edge',rect,matrix,zIndex:0,geometryBounds:transformBounds(matrix,rect)};
  assert.doesNotThrow(()=>compile({from:[v],to:[v],range}));
  const stale=structuredClone(v);stale.geometryBounds.width+=.001;
  assert.throws(()=>compile({from:[stale],to:[v],range}));
 }
});
