import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {flowWrapLayout as layout} from '../lib/foundations/layout/flow-wrap.mjs';
import {compileLayoutHandoff, sampleLayoutHandoff} from '../lib/recipes/layout-handoff.mjs';
import {rational as T} from '../lib/time.mjs';
import {transformBounds, transformPoint, multiply, identity} from '../lib/matrix.mjs';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
const item=(itemId,width,height)=>({itemId,width,height});
const base=()=>({items:[item('a',35,20),item('b',25,40),item('c',45,12),item('d',20,18)],width:90,columnGap:5,rowGap:7});
const xy=s=>s.items.map(v=>v.matrix.slice(4));
function frozen(v){if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));Object.values(v).forEach(frozen);}}

test('intrinsic widths form source-order top-aligned rows with maximum heights and no trailing gap',()=>{
 const s=layout(base());assert.deepEqual(xy(s),[[0,0],[40,0],[0,47],[50,47]]);
 assert.deepEqual(s.rows,[{itemIds:['a','b'],y:0,width:65,height:40},{itemIds:['c','d'],y:47,width:70,height:18}]);
 assert.equal(s.width,90);assert.equal(s.height,65);
 assert.deepEqual(s.items.map(v=>v.itemId),['a','b','c','d']);
 assert.deepEqual(s.items.map(v=>v.zIndex),[0,1,2,3]);
 for(const v of s.items){assert.deepEqual(Object.keys(v),['itemId','rect','matrix','zIndex','geometryBounds']);assert.deepEqual(v.geometryBounds,transformBounds(v.matrix,v.rect));}
});
test('empty, singleton and zero gaps have explicit extents',()=>{
 assert.deepEqual(layout({...base(),items:[]}),{items:[],rows:[],width:90,height:0});
 const one=layout({...base(),items:[item('one',.001,.001)],width:.001});assert.equal(one.height,.001);assert.equal(one.rows[0].width,.001);
 const zero=layout({...base(),columnGap:0,rowGap:0,width:60});assert.deepEqual(xy(zero),[[0,0],[35,0],[0,40],[0,52]]);assert.equal(zero.height,70);
});
test('exact equality fits; next representable item width wraps without epsilon',()=>{
 const spec={items:[item('a',.5,1),item('b',.5,2)],width:1,columnGap:0,rowGap:0};
 assert.equal(layout(spec).rows.length,1);
 assert.equal(layout({...spec,items:[spec.items[0],item('b',.5000000000000002,2)]}).rows.length,2);
 // IEEE addition can round a mathematically oversized sum back to equality.
 const rounded=layout({...spec,items:[spec.items[0],item('b',.5000000000000001,2)]});assert.equal(rounded.rows.length,1);assert.equal(rounded.rows[0].width,1);
 assert.equal(layout({...spec,columnGap:1e-300}).rows.length,1);
});
test('all inputs required; plain/null-prototype records accepted but unknown own fields reject',()=>{
 const s=base();for(const k of Object.keys(s)){const bad={...s};delete bad[k];assert.throws(()=>layout(bad));}
 for(const k of ['itemId','width','height']){const i={...s.items[0]};delete i[k];assert.throws(()=>layout({...s,items:[i]}));}
 for(const bad of [null,[],new Date(),new(class {})(),{...s,other:1},{...s,[Symbol('extra')]:1},Object.defineProperty({...s},'hidden',{value:1})])assert.throws(()=>layout(bad));
 for(const i of [null,[],{...s.items[0],other:1},{...s.items[0],[Symbol('x')]:1},Object.defineProperty({...s.items[0]},'hidden',{value:1})])assert.throws(()=>layout({...s,items:[i]}));
 const n=Object.assign(Object.create(null),s);n.items=[Object.assign(Object.create(null),s.items[0])];assert.doesNotThrow(()=>layout(n));
 const known=Object.defineProperty({...s},'width',{value:90,enumerable:false});assert.doesNotThrow(()=>layout(known));
});
test('strict number ranges and per-item oversized rejection do not return a partial layout',()=>{
 for(const k of ['width','columnGap','rowGap'])for(const v of [NaN,Infinity,-Infinity,null,'2',undefined,-1])assert.throws(()=>layout({...base(),[k]:v}));
 for(const v of [0,.0009,10001])assert.throws(()=>layout({...base(),width:v}));
 for(const k of ['columnGap','rowGap'])assert.throws(()=>layout({...base(),[k]:10001}));
 for(const k of ['width','height'])for(const v of [0,.0009,10001,NaN,Infinity,null,'2',undefined,-1])assert.throws(()=>layout({...base(),items:[{...base().items[0],[k]:v}]}));
 assert.throws(()=>layout({...base(),items:[item('a',20,20),item('b',91,10)]}),/wider/);
});
test('IDs and arrays enforce bounded unique ordinary dense same-realm input',()=>{
 for(const v of ['', 'has space','é','a'.repeat(65),null,2])assert.throws(()=>layout({...base(),items:[item(v,1,1)]}));
 assert.doesNotThrow(()=>layout({...base(),items:[item('a'.repeat(64),1,1)]}));
 assert.throws(()=>layout({...base(),items:[item('a',1,1),item('a',1,1)]}));
 const sparse=Array(1),extra=[item('a',1,1)];extra.extra=1;
 const sym=[item('a',1,1)];sym[Symbol('x')]=1;
 const sub=new(class extends Array {})(item('a',1,1));
 const foreign=vm.runInNewContext('[{itemId:"a",width:1,height:1}]');
 for(const v of [null,{},sparse,extra,sym,sub,foreign,Array.from({length:129},(_,i)=>item('i'+i,1,1))])assert.throws(()=>layout({...base(),items:v}));
 assert.throws(()=>layout(vm.runInNewContext('({items:[],width:1,columnGap:0,rowGap:0})')));
});
test('128 maximum rows remain inside matrix and old handoff domains at extremes',()=>{
 for(const h of [.001,10000])for(const gap of [0,10000]){
  const s=layout({items:Array.from({length:128},(_,i)=>item('i'+i,.001,h)),width:.001,columnGap:gap,rowGap:gap});
  assert.equal(s.items.length,128);assert.ok(s.height<=2550000);
  for(const v of s.items){assert.ok(multiply(identity(),v.matrix).every((x,i)=>x===v.matrix[i]));assert.doesNotThrow(()=>transformPoint(v.matrix,{x:0,y:0}));}
  const p=compileLayoutHandoff({from:s.items,to:s.items,range:{start:T(0),end:T(1)}});assert.equal(sampleLayoutHandoff(p,T(1,2)).items.length,128);
 }
 const max=layout({items:Array.from({length:128},(_,i)=>item('i'+i,10000,10000)),width:10000,columnGap:10000,rowGap:10000});assert.equal(max.rows.length,128);assert.equal(max.height,2550000);assert.equal(max.items.at(-1).matrix[5],2540000);
});
test('input-copy/deep-freeze, independent calls and arbitrary re-evaluation have no cross-state writes',()=>{
 const input=base(),saved=structuredClone(input),first=layout(input);assert.deepEqual(input,saved);frozen(first);
 input.items[0].width=80;input.items[0].itemId='new';assert.equal(first.items[0].rect.width,35);assert.equal(first.rows[0].itemIds[0],'a');
 assert.throws(()=>{first.rows[0].itemIds.push('oops');});assert.throws(()=>{first.items[0].matrix[4]=100;});
 const widths=[90,50,150,70,90],states=widths.map(width=>layout({...saved,width}));for(const i of [4,0,3,1,2])assert.deepEqual(layout({...saved,width:widths[i]}),states[i]);
});
// Integer independent oracle uses a pending row, flushing groups before calculating coordinates.
function oracle(spec){const groups=[];let group=[];for(const v of spec.items){const sum=group.reduce((n,x)=>n+x.width,0)+group.length*spec.columnGap+v.width;if(group.length&&sum>spec.width){groups.push(group);group=[];}group.push(v);}if(group.length)groups.push(group);let y=0;const result=[];for(const group of groups){let x=0;for(const v of group){result.push([v.itemId,x,y]);x+=v.width+spec.columnGap;}y+=Math.max(...group.map(v=>v.height))+spec.rowGap;}return result;}
test('independent integer row oracle and translation-free geometric nonoverlap across deterministic input families',()=>{
 let seed=35291;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
 for(let trial=0;trial<1000;trial++){
  const width=1+random()%500,items=Array.from({length:random()%129},(_,i)=>item('i'+i,1+random()%width,1+random()%100)),s={items,width,columnGap:random()%31,rowGap:random()%31},actual=layout(s);
  assert.deepEqual(actual.items.map(v=>[v.itemId,...v.matrix.slice(4)]),oracle(s));
  for(const row of actual.rows){assert.ok(row.width<=width);assert.equal(row.height,Math.max(...row.itemIds.map(id=>items.find(x=>x.itemId===id).height)));}
 }
});
test('old shared identity handoff consumes snapshots directly with exact endpoints and reduced endpoint policy',()=>{
 const a=layout(base()),b=layout({...base(),width:50}),plan=compileLayoutHandoff({from:a.items,to:b.items,range:{start:T(0),end:T(2)}});
 for(const [at,expected]of [[T(0),a],[T(2),b]]){const s=sampleLayoutHandoff(plan,at);for(let i=0;i<s.items.length;i++){assert.deepEqual(s.items[i].matrix,expected.items[i].matrix);assert.deepEqual(s.items[i].rect,expected.items[i].rect);assert.equal(s.items[i].role,'shared');}}
 const mid=sampleLayoutHandoff(plan,T(1));assert.equal(mid.items[1].matrix[4],20);assert.equal(mid.items[1].matrix[5],13.5);
 const reduced=sampleLayoutHandoff(plan,T(1),{reducedMotion:true});assert.equal(reduced.progress,.5);assert.deepEqual(reduced.items.map(v=>v.matrix),b.items.map(v=>v.matrix));
 const empty=layout({...base(),items:[]});assert.doesNotThrow(()=>compileLayoutHandoff({from:empty.items,to:a.items,range:{start:T(0),end:T(1)}}));
});
test('fresh Node process computes byte-equivalent serialized snapshots',()=>{
 const inputs=[base(),{...base(),width:50},{...base(),items:[]}],expected=inputs.map(layout);
 const code=`import {flowWrapLayout} from ${JSON.stringify(new URL('../lib/foundations/layout/flow-wrap.mjs',import.meta.url).href)};console.log(JSON.stringify(${JSON.stringify(inputs)}.map(flowWrapLayout)));`;
 const p=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);assert.equal(p.stdout.trim(),JSON.stringify(expected));
});
function draw(api,state){const c=api.createCanvas(180,180),ctx=c.getContext('2d');ctx.fillStyle='#eee9dd';ctx.fillRect(0,0,180,180);for(const v of state.items){ctx.save();ctx.translate(10,10);ctx.transform(...v.matrix);ctx.fillStyle=['#c94b31','#1d5457','#e5b95c','#65725c'][v.zIndex%4];ctx.fillRect(v.rect.x,v.rect.y,v.rect.width,v.rect.height);ctx.restore();}return createHash('sha256').update(c.toBuffer('image/png')).digest('hex');}
test('Native representative rendering is repeated/reversed and fresh-process identical',()=>{
 const {api}=loadNativeCanvas(),inputs=[base(),{...base(),width:50},{...base(),width:150},{...base(),items:[]}],states=inputs.map(layout),expected=states.map(s=>draw(api,s));
 for(const i of [3,1,0,2,1])assert.equal(draw(api,layout(inputs[i])),expected[i]);
 const code=`import {flowWrapLayout} from ${JSON.stringify(new URL('../lib/foundations/layout/flow-wrap.mjs',import.meta.url).href)};import{loadNativeCanvas}from ${JSON.stringify(new URL('../../motion-render-core/lib/native.mjs',import.meta.url).href)};import{createHash}from'node:crypto';const draw=${draw.toString()};const{api}=loadNativeCanvas();console.log(JSON.stringify(${JSON.stringify(inputs)}.map(s=>draw(api,flowWrapLayout(s)))));`;
 const p=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);assert.deepEqual(JSON.parse(p.stdout),expected);
});

test('empty flow snapshot does not silently widen the old handoff empty-plan contract',()=>{
 const empty=layout({...base(),items:[]}),full=layout(base()),range={start:T(0),end:T(1)};
 assert.throws(()=>compileLayoutHandoff({from:empty.items,to:empty.items,range}),/Empty handoff/);
 const enter=compileLayoutHandoff({from:empty.items,to:full.items,range});
 const exit=compileLayoutHandoff({from:full.items,to:empty.items,range});
 for(const [plan,role,a,b]of [[enter,'enter',0,1],[exit,'exit',1,0]]){
  const start=sampleLayoutHandoff(plan,T(0)),end=sampleLayoutHandoff(plan,T(1));
  assert.ok(start.items.every(i=>i.role===role&&i.opacity===a));
  assert.ok(end.items.every(i=>i.role===role&&i.opacity===b));
  assert.equal(end.items.length,full.items.length);
 }
});
