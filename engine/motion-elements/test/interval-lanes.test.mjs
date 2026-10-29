import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {intervalLaneLayout as layout} from '../lib/foundations/layout/interval-lanes.mjs';
import {compileLayoutHandoff,sampleLayoutHandoff} from '../lib/recipes/layout-handoff.mjs';
import {rational as T} from '../lib/time.mjs';
import {transformBounds,transformPoint} from '../lib/matrix.mjs';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
const e=(itemId,start,end)=>({itemId,start,end});
const base=()=>({items:[e('a',0,4),e('b',2,6),e('c',3,8),e('d',6,10)],domain:{start:0,end:12},width:240,laneHeight:20,laneGap:5});
const assignments=s=>Object.fromEntries(s.lanes.flatMap((l,i)=>l.itemIds.map(id=>[id,i])).sort());
function frozen(v){if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));Object.values(v).forEach(frozen);}}
test('half-open fixed intervals use minimum lanes without editing times or dropping input',()=>{
 const input=base(),before=structuredClone(input),s=layout(input);assert.deepEqual(input,before);assert.equal(s.laneCount,3);assert.equal(s.height,70);
 assert.deepEqual(s.lanes,[{itemIds:['a','d'],y:0,height:20},{itemIds:['b'],y:25,height:20},{itemIds:['c'],y:50,height:20}]);
 assert.deepEqual(s.items.map(x=>x.itemId),['a','b','c','d']);assert.deepEqual(s.items.map(x=>x.rect.width),[80,80,100,80]);assert.deepEqual(s.items.map(x=>x.matrix[4]),[0,40,60,120]);
 for(const v of s.items){assert.deepEqual(Object.keys(v),['itemId','rect','matrix','zIndex','geometryBounds']);assert.deepEqual(v.geometryBounds,transformBounds(v.matrix,v.rect));}
});
test('endpoint touch reuses lane but immediate predecessor floating endpoint still overlaps',()=>{
 const s={...base(),domain:{start:0,end:2},width:200,items:[e('a',0,1),e('b',1,2)]};assert.equal(layout(s).laneCount,1);
 assert.equal(layout({...s,items:[s.items[0],e('b',.9999999999999999,2)]}).laneCount,2);
 assert.equal(layout({...s,items:[s.items[0],e('b',1.0000000000000002,2)]}).laneCount,1);
});
test('same-start ties use end then ASCII ID, independent of input ordering',()=>{
 const input={...base(),items:[e('z',0,8),e('a',0,4),e('B',0,4),e('A',0,4)]},s=layout(input);
 assert.deepEqual(assignments(s),{A:0,B:1,a:2,z:3});
 for(const items of [[...input.items].reverse(),[input.items[2],input.items[0],input.items[3],input.items[1]]]){
  const p=layout({...input,items});assert.deepEqual(assignments(p),assignments(s));assert.deepEqual(p.lanes,s.lanes);assert.deepEqual(p.items.map(v=>v.itemId),items.map(v=>v.itemId));assert.deepEqual(p.items.map(v=>v.zIndex),[0,1,2,3]);
 }
});
test('smallest free lane is chosen, not earliest finished or previous snapshot identity',()=>{
 const s=layout({...base(),items:[e('a',0,5),e('b',1,3),e('c',6,7)]});assert.deepEqual(assignments(s),{a:0,b:1,c:0});
 const changed=layout({...base(),items:[e('a',2,5),e('b',1,3),e('c',6,7)]});assert.deepEqual(assignments(changed),{a:1,b:0,c:0});
});
test('empty, singleton, negative domain and minimum subnormal domain have explicit behavior',()=>{
 assert.deepEqual(layout({...base(),items:[]}),{items:[],lanes:[],laneCount:0,width:240,height:0,domain:{start:0,end:12}});
 const n=layout({...base(),items:[e('n',-5,0)],domain:{start:-10,end:10}});assert.equal(n.items[0].matrix[4],60);assert.equal(n.items[0].rect.width,60);
 const tiny=layout({...base(),items:[e('t',0,Number.MIN_VALUE)],domain:{start:0,end:Number.MIN_VALUE},width:.001,laneHeight:.001,laneGap:0});assert.equal(tiny.items[0].rect.width,.001);
 const zero=layout({...base(),items:[e('z',-0,1)],domain:{start:-0,end:1}});assert.equal(zero.items[0].matrix[4],0);assert.ok(Object.is(zero.domain.start,-0));
});
test('projected width minimum uses actual IEEE endpoint mapping, with no epsilon or clamp',()=>{
 const input={...base(),domain:{start:0,end:1},width:1,items:[e('a',0,.001)]};assert.equal(layout(input).items[0].rect.width,.001);
 assert.throws(()=>layout({...input,items:[e('a',0,.0009999999999999998)]}),/Projected/);
 assert.throws(()=>layout({...input,items:[e('a',1-Number.EPSILON,1)]}),/Projected/);
 assert.throws(()=>layout({...input,items:[e('a',0,.2),e('b',.9999999999999999,1)]}),/Projected/);
});
test('strict required/plain/unknown fields apply at all record levels',()=>{
 const s=base();for(const key of Object.keys(s)){const v={...s};delete v[key];assert.throws(()=>layout(v));}
 for(const key of ['start','end']){const d={...s.domain};delete d[key];assert.throws(()=>layout({...s,domain:d}));}
 for(const key of ['itemId','start','end']){const i={...s.items[0]};delete i[key];assert.throws(()=>layout({...s,items:[i]}));}
 for(const v of [null,[],new Date(),new(class {})()]){assert.throws(()=>layout(v));assert.throws(()=>layout({...s,domain:v}));assert.throws(()=>layout({...s,items:[v]}));}
 for(const key of ['extra',Symbol('extra')]){assert.throws(()=>layout({...s,[key]:1}));assert.throws(()=>layout({...s,domain:{...s.domain,[key]:1}}));assert.throws(()=>layout({...s,items:[{...s.items[0],[key]:1}]}));}
 assert.throws(()=>layout(Object.defineProperty({...s},'hidden',{value:1})));
 const np=Object.assign(Object.create(null),s);np.domain=Object.assign(Object.create(null),s.domain);np.items=[Object.assign(Object.create(null),s.items[0])];assert.doesNotThrow(()=>layout(np));
 assert.throws(()=>layout(vm.runInNewContext('({items:[],domain:{start:0,end:1},width:10,laneHeight:1,laneGap:0})')));
});
test('finite bounds, positive intervals and domain containment reject invalid units',()=>{
 for(const k of ['width','laneHeight'])for(const v of [0,.0009,10001,NaN,Infinity,null,'1',undefined])assert.throws(()=>layout({...base(),[k]:v}));
 for(const v of [-1,10001,NaN,Infinity,null,'1',undefined])assert.throws(()=>layout({...base(),laneGap:v}));
 for(const k of ['start','end'])for(const v of [-1000001,1000001,NaN,Infinity,null,'1',undefined]){assert.throws(()=>layout({...base(),domain:{...base().domain,[k]:v}}));assert.throws(()=>layout({...base(),items:[{...base().items[0],[k]:v}]}));}
 for(const d of [{start:1,end:1},{start:2,end:1}])assert.throws(()=>layout({...base(),domain:d}));
 for(const v of [e('a',1,1),e('a',2,1),e('a',-1,2),e('a',10,13)])assert.throws(()=>layout({...base(),items:[v]}));
});
test('arrays, resources and unique IDs are bounded and detached',()=>{
 const extra=[];extra.x=1;const sy=[];sy[Symbol('x')]=1;const sparse=Array(1);
 for(const items of [null,{},extra,sy,sparse,new(class extends Array {})(),vm.runInNewContext('[]'),Array.from({length:129},(_,i)=>e('i'+i,0,1))])assert.throws(()=>layout({...base(),items}));
 for(const id of ['',null,3,'bad id','x'.repeat(65),'é'])assert.throws(()=>layout({...base(),items:[e(id,0,1)]}));
 assert.throws(()=>layout({...base(),items:[e('a',0,1),e('a',1,2)]}));assert.doesNotThrow(()=>layout({...base(),items:[e('x'.repeat(64),0,1)]}));
 const input=base(),first=layout(input);frozen(first);input.items[0].start=2;input.domain.end=100;assert.equal(first.domain.end,12);assert.equal(first.items[0].matrix[4],0);assert.throws(()=>first.lanes[0].itemIds.push('bad'));
});
function depth(items){const points=items.flatMap(v=>[[BigInt(v.start),1],[BigInt(v.end),-1]]).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:a[1]-b[1]);let active=0,max=0;for(const [,d]of points){active+=d;max=Math.max(max,active);}return max;}
test('independent BigInt endpoint-sweep clique oracle verifies minimum count and same-lane separation',()=>{
 let seed=7183;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
 for(let t=0;t<1600;t++){const items=Array.from({length:rand()%129},(_,i)=>{const start=rand()%99;return e('i'+i,start,start+1+rand()%(100-start));}),input={...base(),items,domain:{start:0,end:100},width:1000},s=layout(input);assert.equal(s.laneCount,depth(items));
  for(const lane of s.lanes)for(let i=1;i<lane.itemIds.length;i++){const a=items.find(v=>v.itemId===lane.itemIds[i-1]),b=items.find(v=>v.itemId===lane.itemIds[i]);assert.ok(a.end<=b.start);}
  assert.deepEqual(assignments(layout({...input,items:[...items].reverse()})),assignments(s));
 }
});
test('maximum geometry and minimum local dimensions compose with existing handoff without changing core',()=>{
 for(const h of [.001,10000])for(const gap of [0,10000]){const s=layout({items:Array.from({length:128},(_,i)=>e('i'+i,-1e6,1e6)),domain:{start:-1e6,end:1e6},width:.001,laneHeight:h,laneGap:gap});assert.equal(s.laneCount,128);assert.ok(s.height<=2550000);for(const v of s.items)assert.doesNotThrow(()=>transformPoint(v.matrix,{x:0,y:0}));const p=compileLayoutHandoff({from:s.items,to:s.items,range:{start:T(0),end:T(1)}});assert.equal(sampleLayoutHandoff(p,T(1,2)).items.length,128);}
});
test('old handoff exact endpoints, reduced policy and empty handling remain explicit',()=>{
 const a=layout(base()),b=layout({...base(),items:base().items.map(v=>v.itemId==='c'?e('c',8,12):v)}),p=compileLayoutHandoff({from:a.items,to:b.items,range:{start:T(0),end:T(1)}});
 assert.equal(a.laneCount,3);assert.equal(b.laneCount,2);
 for(const [at,s]of [[T(0),a],[T(1),b]])assert.deepEqual(sampleLayoutHandoff(p,at).items.map(v=>v.matrix),s.items.map(v=>v.matrix));
 const reduced=sampleLayoutHandoff(p,T(1,2),{reducedMotion:true});assert.equal(reduced.progress,.5);assert.deepEqual(reduced.items.map(v=>v.matrix),b.items.map(v=>v.matrix));
 assert.throws(()=>compileLayoutHandoff({from:[],to:[],range:{start:T(0),end:T(1)}}));
 const expected=[base(),{...base(),items:[]},{...base(),width:480}].map(layout);for(const i of [2,0,1,0])assert.deepEqual(layout([base(),{...base(),items:[]},{...base(),width:480}][i]),expected[i]);
});
function draw(api,s){const c=api.createCanvas(280,120),ctx=c.getContext('2d');ctx.fillStyle='#e9e2d5';ctx.fillRect(0,0,280,120);for(const v of s.items){ctx.save();ctx.translate(10,10);ctx.transform(...v.matrix);ctx.fillStyle=['#bf5138','#22545b','#ac8739','#6b6679'][v.zIndex%4];ctx.fillRect(0,0,v.rect.width,v.rect.height);ctx.restore();}return createHash('sha256').update(c.toBuffer('image/png')).digest('hex');}
test('fresh Node state and Native repeated/reversed samples match without history',()=>{
 const inputs=[base(),{...base(),items:[]},{...base(),items:base().items.map(v=>v.itemId==='c'?e('c',8,12):v)}],states=inputs.map(layout),{api}=loadNativeCanvas(),hashes=states.map(s=>draw(api,s));for(const i of [2,0,1,2])assert.equal(draw(api,layout(inputs[i])),hashes[i]);
 const code=`import{intervalLaneLayout as layout}from ${JSON.stringify(new URL('../lib/foundations/layout/interval-lanes.mjs',import.meta.url).href)};import{loadNativeCanvas}from ${JSON.stringify(new URL('../../motion-render-core/lib/native.mjs',import.meta.url).href)};import{createHash}from'node:crypto';const inputs=${JSON.stringify(inputs)},states=inputs.map(layout),draw=${draw.toString()};const{api}=loadNativeCanvas();console.log(JSON.stringify({states,hashes:states.map(s=>draw(api,s))}));`;
 const p=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);assert.equal(p.stdout.trim(),JSON.stringify({states,hashes}));
});
