import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {masonryLayout as layout} from '../lib/foundations/layout/masonry.mjs';
import {compileLayoutHandoff,sampleLayoutHandoff} from '../lib/recipes/layout-handoff.mjs';
import {rational as T} from '../lib/time.mjs';
import {transformBounds,transformPoint} from '../lib/matrix.mjs';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
const item=(itemId,height)=>({itemId,height});
const base=()=>({items:[item('a',90),item('b',40),item('c',70),item('d',30),item('e',20)],columns:3,columnWidth:50,columnGap:8,rowGap:6});
function frozen(v){if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));Object.values(v).forEach(frozen);}}
test('intrinsic heights choose current shortest column in source order with no trailing gap',()=>{
 const s=layout(base());assert.deepEqual(s.items.map(v=>v.matrix.slice(4)),[[0,0],[58,0],[116,0],[58,46],[116,76]]);
 assert.deepEqual(s.columns,[{itemIds:['a'],x:0,width:50,height:90},{itemIds:['b','d'],x:58,width:50,height:76},{itemIds:['c','e'],x:116,width:50,height:96}]);
 assert.equal(s.width,166);assert.equal(s.height,96);assert.equal(s.columnCount,3);
 for(const v of s.items){assert.deepEqual(Object.keys(v),['itemId','rect','matrix','zIndex','geometryBounds']);assert.deepEqual(v.geometryBounds,transformBounds(v.matrix,v.rect));}
});
test('equal occupied heights choose leftmost; source permutation deliberately may change assignment',()=>{
 const input={...base(),columns:2,items:[item('z',20),item('a',20),item('b',5)]};assert.deepEqual(layout(input).columns.map(c=>c.itemIds),[['z','b'],['a']]);
 assert.deepEqual(layout({...input,items:[...input.items].reverse()}).columns.map(c=>c.itemIds),[['b','z'],['a']]);
 const near={...input,items:[item('a',1.0000000000000002),item('b',1),item('c',1)]};assert.deepEqual(layout(near).columns.map(c=>c.itemIds),[['a'],['b','c']]);
});
test('empty and unoccupied requested columns remain explicit; single column is an intrinsic stack',()=>{
 const s=layout({...base(),items:[]});assert.equal(s.height,0);assert.equal(s.width,166);assert.equal(s.columnCount,3);assert.deepEqual(s.columns.map(c=>[c.itemIds,c.height]),[[[],0],[[],0],[[],0]]);
 const one=layout({...base(),items:[item('a',.001)],columns:128,columnWidth:.001,columnGap:0});assert.equal(one.columns.length,128);assert.equal(one.items.length,1);assert.equal(one.height,.001);
 const stack=layout({...base(),columns:1,columnGap:10000,rowGap:0});assert.equal(stack.width,50);assert.equal(stack.height,250);assert.deepEqual(stack.items.map(v=>v.matrix[5]),[0,90,130,200,230]);
});
test('strict required fields, plain/null-prototype records, unknown strings/symbols/nonenumerables',()=>{
 const s=base();for(const k of Object.keys(s)){const v={...s};delete v[k];assert.throws(()=>layout(v));}
 for(const k of ['itemId','height']){const i={...s.items[0]};delete i[k];assert.throws(()=>layout({...s,items:[i]}));}
 for(const v of [null,[],new Date(),new(class {})()]){assert.throws(()=>layout(v));assert.throws(()=>layout({...s,items:[v]}));}
 for(const k of ['extra',Symbol('x')]){assert.throws(()=>layout({...s,[k]:1}));assert.throws(()=>layout({...s,items:[{...s.items[0],[k]:1}]}));}
 assert.throws(()=>layout(Object.defineProperty({...s},'hidden',{value:1})));assert.throws(()=>layout({...s,items:[Object.defineProperty({...s.items[0]},'hidden',{value:1})]}));
 const n=Object.assign(Object.create(null),s);n.items=[Object.assign(Object.create(null),s.items[0])];assert.doesNotThrow(()=>layout(n));assert.doesNotThrow(()=>layout(Object.defineProperty({...s},'columns',{value:3,enumerable:false})));
 assert.throws(()=>layout(vm.runInNewContext('({items:[],columns:1,columnWidth:1,columnGap:0,rowGap:0})')));
});
test('finite numbers, integral column count, IDs and ordinary dense arrays are strict',()=>{
 for(const v of [0,129,1.1,NaN,Infinity,null,'2',undefined])assert.throws(()=>layout({...base(),columns:v}));
 for(const v of [0,.0009,10001,NaN,Infinity,null,'2',undefined]){assert.throws(()=>layout({...base(),columnWidth:v}));assert.throws(()=>layout({...base(),items:[item('a',v)]}));}
 for(const k of ['columnGap','rowGap'])for(const v of [-1,10001,NaN,Infinity,null,'2',undefined])assert.throws(()=>layout({...base(),[k]:v}));
 for(const id of ['',null,2,'a b','é','x'.repeat(65)])assert.throws(()=>layout({...base(),items:[item(id,1)]}));assert.doesNotThrow(()=>layout({...base(),items:[item('x'.repeat(64),1)]}));assert.throws(()=>layout({...base(),items:[item('a',1),item('a',2)]}));
 const a=[];a.x=1;const b=[];b[Symbol('x')]=1;for(const items of [null,{},a,b,Array(1),new(class extends Array {})(),vm.runInNewContext('[]'),Array.from({length:129},(_,i)=>item('i'+i,1))])assert.throws(()=>layout({...base(),items}));
});
test('input copy, recursive freeze and repeated/permuted evaluation keep states isolated',()=>{
 const input=base(),saved=structuredClone(input),first=layout(input);assert.deepEqual(input,saved);frozen(first);input.items[0].height=1;input.items[0].itemId='new';assert.equal(first.items[0].rect.height,90);assert.equal(first.columns[0].itemIds[0],'a');assert.throws(()=>first.columns[0].itemIds.push('bad'));assert.throws(()=>{first.items[0].matrix[4]=9;});
 const specs=[saved,{...saved,columns:1},{...saved,columns:4}],states=specs.map(layout);for(const i of [2,0,1,0])assert.deepEqual(layout(specs[i]),states[i]);
});
function oracle(s){const groups=Array.from({length:s.columns},()=>[]),placements=[];for(const v of s.items){const heights=groups.map(g=>g.reduce((n,v)=>n+BigInt(v.height),0n)+BigInt(Math.max(0,g.length-1))*BigInt(s.rowGap));const min=heights.reduce((a,b)=>a<b?a:b),column=heights.indexOf(min),y=min+(groups[column].length?BigInt(s.rowGap):0n);groups[column].push(v);placements.push([column,Number(y)]);}return placements;}
test('exhaustive small integer-height words match independent BigInt greedy oracle and nonoverlap',()=>{
 let checked=0;for(let n=0;n<=6;n++){const count=3**n;for(let code=0;code<count;code++){let k=code;const items=Array.from({length:n},(_,i)=>{const h=1+k%3;k=Math.floor(k/3);return item('i'+i,h);});for(const columns of [1,2,3,4])for(const rowGap of [0,2]){const s={items,columns,columnWidth:7,columnGap:3,rowGap},actual=layout(s),expected=oracle(s);assert.deepEqual(actual.items.map(v=>[v.matrix[4]/10,v.matrix[5]]),expected);for(const c of actual.columns)for(let j=1;j<c.itemIds.length;j++){const prev=actual.items.find(v=>v.itemId===c.itemIds[j-1]),next=actual.items.find(v=>v.itemId===c.itemIds[j]);assert.ok(next.geometryBounds.y>=prev.geometryBounds.y+prev.geometryBounds.height+rowGap);}checked++;}}}assert.equal(checked,8744);
});
test('greedy does not promise globally minimal total height',()=>{
 const s=layout({...base(),columns:2,rowGap:0,items:[item('a',2),item('b',2),item('c',3)]});assert.equal(s.height,5);assert.equal(Math.max(2+2,3),4,'a reordered partition can be shorter');
});
test('128 items across every allowed column count stay bounded and old-handoff compatible',()=>{
 for(let columns=1;columns<=128;columns++)for(const size of [.001,10000]){const input={items:Array.from({length:128},(_,i)=>item('i'+i,size)),columns,columnWidth:size,columnGap:10000,rowGap:10000},s=layout(input);assert.equal(s.columns.length,columns);assert.equal(s.items.length,128);assert.ok(s.width<=2550000);assert.ok(s.height<=2550000);for(const v of s.items)assert.doesNotThrow(()=>transformPoint(v.matrix,{x:0,y:0}));assert.doesNotThrow(()=>compileLayoutHandoff({from:s.items,to:s.items,range:{start:T(0),end:T(1)}}));}
 const max=layout({items:Array.from({length:128},(_,i)=>item('i'+i,10000)),columns:1,columnWidth:10000,columnGap:10000,rowGap:10000});assert.equal(max.height,2550000);assert.equal(max.items.at(-1).matrix[5],2540000);
});
test('IEEE tiny positive gaps may round away; no hidden epsilon or integer snapping',()=>{
 const s=layout({...base(),columns:1,items:[item('a',1),item('b',.001)],rowGap:Number.MIN_VALUE});assert.equal(s.items[1].matrix[5],1);assert.equal(s.height,1.001);
 const fractional=layout({...base(),columns:2,columnWidth:.25,columnGap:.125,items:[item('a',.125),item('b',.25),item('c',.125)],rowGap:.0625});assert.deepEqual(fractional.items.map(v=>v.matrix.slice(4)),[[0,0],[.375,0],[0,.1875]]);
});
test('old handoff consumes exact snapshots, reduced policy and empty behavior remain unchanged',()=>{
 const a=layout(base()),b=layout({...base(),columns:2}),p=compileLayoutHandoff({from:a.items,to:b.items,range:{start:T(0),end:T(1)}});for(const [t,s]of [[T(0),a],[T(1),b]])assert.deepEqual(sampleLayoutHandoff(p,t).items.map(v=>v.matrix),s.items.map(v=>v.matrix));assert.equal(sampleLayoutHandoff(p,T(1,2)).items.length,5);const reduced=sampleLayoutHandoff(p,T(1,2),{reducedMotion:true});assert.equal(reduced.progress,.5);assert.deepEqual(reduced.items.map(v=>v.matrix),b.items.map(v=>v.matrix));assert.throws(()=>compileLayoutHandoff({from:[],to:[],range:{start:T(0),end:T(1)}}));
});
function draw(api,state){const canvas=api.createCanvas(200,300),c=canvas.getContext('2d');c.fillStyle='#eae4d8';c.fillRect(0,0,200,300);for(const v of state.items){c.save();c.translate(10,10);c.transform(...v.matrix);c.fillStyle=['#43605e','#b26b48','#b5a05c','#686070','#334a54'][v.zIndex%5];c.fillRect(0,0,v.rect.width,v.rect.height);c.restore();}return createHash('sha256').update(canvas.toBuffer('image/png')).digest('hex');}
test('Native repeated/reverse and fresh-process rendering and serialized states match',()=>{
 const inputs=[base(),{...base(),columns:2},{...base(),items:[]}],states=inputs.map(layout),{api}=loadNativeCanvas(),hashes=states.map(s=>draw(api,s));for(const i of [2,0,1,0])assert.equal(draw(api,layout(inputs[i])),hashes[i]);
 const code=`import{masonryLayout as layout}from ${JSON.stringify(new URL('../lib/foundations/layout/masonry.mjs',import.meta.url).href)};import{loadNativeCanvas}from ${JSON.stringify(new URL('../../motion-render-core/lib/native.mjs',import.meta.url).href)};import{createHash}from'node:crypto';const states=${JSON.stringify(inputs)}.map(layout),draw=${draw.toString()};const{api}=loadNativeCanvas();console.log(JSON.stringify({states,hashes:states.map(s=>draw(api,s))}));`;
 const p=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);assert.equal(p.stdout.trim(),JSON.stringify({states,hashes}));
});
