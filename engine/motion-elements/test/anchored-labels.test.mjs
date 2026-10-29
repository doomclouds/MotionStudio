import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {placeAnchoredLabels as place} from '../lib/foundations/layout/anchored-labels.mjs';
import {compileLayoutHandoff,sampleLayoutHandoff} from '../lib/recipes/layout-handoff.mjs';
import {rational as T} from '../lib/time.mjs';
import {transformBounds} from '../lib/matrix.mjs';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
const label=(itemId,priority=0)=>({itemId,anchor:{x:20,y:20},width:30,height:20,priority,offsets:[{x:0,y:0},{x:50,y:0}]});
const base=()=>({labels:[label('lower',0),label('upper',10)],obstacles:[],viewport:{x:0,y:0,width:200,height:100},clearance:0});
const choices=s=>Object.fromEntries(s.placements.map(x=>[x.itemId,x.candidateIndex]).sort());
function frozen(v){if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));Object.values(v).forEach(frozen);}}
test('priority first-fit preserves source output order and detached standard layout items',()=>{
 const input=base(),copy=structuredClone(input),s=place(input);assert.deepEqual(input,copy);assert.deepEqual(choices(s),{lower:1,upper:0});assert.equal(s.placedCount,2);assert.equal(s.unplacedCount,0);assert.deepEqual(s.items.map(x=>[x.itemId,x.matrix[4],x.matrix[5],x.zIndex]),[['lower',70,20,0],['upper',20,20,1]]);
 for(const item of s.items){assert.deepEqual(Object.keys(item),['itemId','rect','matrix','zIndex','geometryBounds']);assert.deepEqual(item.geometryBounds,transformBounds(item.matrix,item.rect));}frozen(s);input.labels[0].anchor.x=99;assert.equal(s.placements[0].anchor.x,20);assert.ok(!Object.isFrozen(input.labels[0]));
});
test('obstacles and already placed boxes reject candidates, with explicit unplaced result',()=>{
 const x=base();x.obstacles=[{x:15,y:15,width:40,height:30}];const s=place(x);assert.deepEqual(choices(s),{lower:null,upper:1});assert.equal(s.unplacedCount,1);assert.deepEqual(s.placements[0],{itemId:'lower',status:'unplaced',candidateIndex:null,anchor:{x:20,y:20}});assert.deepEqual(s.items.map(x=>x.itemId),['upper']);assert.equal(s.items[0].zIndex,1);
});
test('touching edges are allowed at zero clearance; an exact requested gap remains allowed',()=>{
 const a={...label('a',1),anchor:{x:10,y:10},width:10,height:10,offsets:[{x:0,y:0}]};const b={...label('b'),anchor:{x:20,y:10},width:10,height:10,offsets:[{x:0,y:0},{x:1,y:0}]};
 assert.deepEqual(choices(place({...base(),labels:[a,b]})),{a:0,b:0});assert.deepEqual(choices(place({...base(),labels:[a,b],clearance:1})),{a:0,b:1});assert.deepEqual(choices(place({...base(),labels:[a,b],clearance:1.0000000000000002})),{a:0,b:null});
 assert.equal(place({...base(),labels:[b],obstacles:[{x:10,y:10,width:10,height:10}],clearance:1}).placements[0].candidateIndex,1);
});
test('viewport uses containment only, includes edge-touch and applies no epsilon or clearance gutter',()=>{
 const l={...label('a'),anchor:{x:170,y:80},offsets:[{x:0,y:0}]};assert.equal(place({...base(),labels:[l],clearance:10000}).placedCount,1);
 assert.equal(place({...base(),labels:[{...l,anchor:{x:170.00000000000003,y:80}}]}).placedCount,0);
 assert.equal(place({...base(),labels:[{...l,anchor:{x:-100,y:-100}}],viewport:{x:-100,y:-100,width:30,height:20}}).placedCount,1);
 const decimal={...l,anchor:{x:.1,y:0},width:.2,height:1};assert.equal(place({...base(),labels:[decimal],viewport:{x:0,y:0,width:.3,height:1}}).placedCount,0);
});
test('ASCII tie-break is permutation-stable for assignments, but output/z follow each input',()=>{
 const ls=[label('a'),label('A'),label('z')];const a=place({...base(),labels:ls}),b=place({...base(),labels:[...ls].reverse()});assert.deepEqual(choices(a),{A:0,a:1,z:null});assert.deepEqual(choices(a),choices(b));assert.deepEqual(b.placements.map(x=>x.itemId),['z','A','a']);assert.deepEqual(b.items.map(x=>[x.itemId,x.zIndex]),[['A',1],['a',2]]);
});
test('first-fit does not backtrack to maximize placed count or move caller anchors',()=>{
 const high={...label('high',1),offsets:[{x:0,y:0},{x:50,y:0}]},low={...label('low'),offsets:[{x:0,y:0}]};const s=place({...base(),labels:[high,low]});assert.equal(s.placedCount,1);assert.equal(s.placements[0].candidateIndex,0);assert.equal(s.placements[1].status,'unplaced');assert.equal(place({...base(),labels:[{...high,offsets:[{x:50,y:0}]},low]}).placedCount,2);
});
test('empty and fully blocked sets are bounded valid states, not a partial-error result',()=>{
 assert.deepEqual(place({...base(),labels:[]}),{items:[],placements:[],placedCount:0,unplacedCount:0});const s=place({...base(),obstacles:[{x:0,y:0,width:200,height:100}]});assert.equal(s.items.length,0);assert.equal(s.unplacedCount,2);assert.throws(()=>compileLayoutHandoff({from:[],to:[],range:{start:T(0),end:T(1)}}));
});
function locations(){return [s=>s,s=>s.viewport,s=>s.obstacles[0],s=>s.labels[0],s=>s.labels[0].anchor,s=>s.labels[0].offsets[0]];}
function complete(){return {...base(),obstacles:[{x:100,y:70,width:5,height:5}]};}
test('records reject missing/unknown/hidden/symbol/accessor fields without invoking value getters',()=>{
 for(const get of locations()){
  for(const key of Object.keys(get(complete()))){const s=complete();delete get(s)[key];assert.throws(()=>place(s));}
  for(const key of ['unexpected',Symbol('bad')]){const s=complete();Object.defineProperty(get(s),key,{value:0});assert.throws(()=>place(s));}
  const s=complete(),obj=get(s),key=Object.keys(obj)[0];let calls=0;Object.defineProperty(obj,key,{get(){calls++;return 1}});assert.throws(()=>place(s));assert.equal(calls,0);
 }
 const inherited=Object.assign(Object.create({clearance:0}),base());delete inherited.clearance;assert.throws(()=>place(inherited));const known=base();Object.defineProperty(known.labels[0],'width',{value:30,enumerable:false});assert.equal(place(known).placedCount,2);
});
test('plain/null-prototype records accepted; foreign realms, classes and malformed arrays rejected',()=>{
 const np=Object.assign(Object.create(null),base());np.viewport=Object.assign(Object.create(null),np.viewport);np.labels[0]=Object.assign(Object.create(null),np.labels[0]);assert.equal(place(np).placedCount,2);
 for(const value of [null,[],new Date(),new(class{})(),vm.runInNewContext('({})')])assert.throws(()=>place(value));
 for(const field of ['labels','obstacles'])for(const a of [null,{},Array(1),new(class extends Array{})(),vm.runInNewContext('[]')])assert.throws(()=>place({...base(),[field]:a}));
 for(const field of ['labels','obstacles']){const a=[];a[Symbol('x')]=1;assert.throws(()=>place({...base(),[field]:a}));}
 for(const offsets of [[],Array(1),new Float32Array(2),new(class extends Array{})(),vm.runInNewContext('[]'),Array.from({length:17},()=>({x:0,y:0}))])assert.throws(()=>place({...base(),labels:[{...label('a'),offsets}]}));
 let reads=0;const a=[label('a')];Object.defineProperty(a,'0',{get(){reads++;return label('a')}});assert.throws(()=>place({...base(),labels:a}));assert.equal(reads,0);
 const b=[label('a')];Object.defineProperty(b,'0',{value:b[0],enumerable:false});assert.throws(()=>place({...base(),labels:b}));
});
test('IDs, finite dimensions, priorities, offsets, bounds and resource limits reject invalid inputs',()=>{
 for(const v of ['',null,12,'bad id','x'.repeat(65),'ä'])assert.throws(()=>place({...base(),labels:[label(v)]}));assert.throws(()=>place({...base(),labels:[label('same'),label('same')]}));
 for(const k of ['width','height'])for(const v of [0,.0009,10001,NaN,Infinity,'1',null,undefined])assert.throws(()=>place({...base(),labels:[{...label('a'),[k]:v}]}));
 for(const v of [-1000001,1000001,NaN,Infinity,'1',null])assert.throws(()=>place({...base(),labels:[{...label('a'),priority:v}]}));
 for(const v of [-1,10001,NaN,Infinity,'1',null])assert.throws(()=>place({...base(),clearance:v}));
 for(const k of ['x','y'])for(const v of [-1000001,1000001,NaN,Infinity,'1',null]){assert.throws(()=>place({...base(),viewport:{...base().viewport,[k]:v}}));assert.throws(()=>place({...base(),labels:[{...label('a'),anchor:{x:0,y:0,[k]:v}}]}));assert.throws(()=>place({...base(),labels:[{...label('a'),offsets:[{x:0,y:0,[k]:v}]}]}));}
 for(const k of ['width','height'])for(const v of [0,.0009,1000001,NaN,Infinity])assert.throws(()=>place({...base(),viewport:{...base().viewport,[k]:v}}));
 assert.throws(()=>place({...base(),labels:Array.from({length:129},(_,i)=>label('i'+i))}));assert.throws(()=>place({...base(),obstacles:Array.from({length:129},()=>({x:0,y:0,width:1,height:1}))}));
});
function oracle(input){
 const b=x=>Object.fromEntries(Object.entries(x).map(([k,v])=>[k,BigInt(v)])),v=b(input.viewport),gap=BigInt(input.clearance),obstacles=input.obstacles.map(b),done=[],remaining=[...input.labels],choices={};
 while(remaining.length){let best=0;for(let i=1;i<remaining.length;i++)if(remaining[i].priority>remaining[best].priority||(remaining[i].priority===remaining[best].priority&&remaining[i].itemId<remaining[best].itemId))best=i;const l=remaining.splice(best,1)[0];let chosen=null;
  for(let k=0;k<l.offsets.length;k++){const a={x:BigInt(l.anchor.x)+BigInt(l.offsets[k].x),y:BigInt(l.anchor.y)+BigInt(l.offsets[k].y),width:BigInt(l.width),height:BigInt(l.height)};if(a.x<v.x||a.y<v.y||a.x+a.width>v.x+v.width||a.y+a.height>v.y+v.height)continue;
   const collision=[...obstacles,...done].some(o=>a.x-gap<o.x+o.width&&o.x<a.x+a.width+gap&&a.y-gap<o.y+o.height&&o.y<a.y+a.height+gap);if(collision)continue;done.push(a);chosen=k;break;
  }choices[l.itemId]=chosen;
 }return Object.fromEntries(Object.entries(choices).sort());
}
test('independent BigInt box oracle matches finite candidate/priority decisions across 2500 integer scenes',()=>{
 let seed=9371;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
 for(let n=0;n<2500;n++){const input={labels:Array.from({length:rand()%9},(_,i)=>({itemId:'item'+i,anchor:{x:rand()%61-10,y:rand()%61-10},width:rand()%12+1,height:rand()%12+1,priority:rand()%5,offsets:Array.from({length:rand()%4+1},()=>({x:rand()%21-10,y:rand()%21-10}))})),obstacles:Array.from({length:rand()%5},()=>({x:rand()%50,y:rand()%50,width:rand()%15+1,height:rand()%15+1})),viewport:{x:0,y:0,width:60,height:60},clearance:rand()%4};assert.deepEqual(choices(place(input)),oracle(input));assert.deepEqual(choices(place({...input,labels:[...input.labels].reverse(),obstacles:[...input.obstacles].reverse()})),oracle(input));}
});
test('maximum candidates/obstacles and accepted extreme/minimum boxes remain compatible with old handoff',()=>{
 const blocked={labels:Array.from({length:128},(_,i)=>({...label('i'+i),offsets:Array.from({length:16},()=>({x:0,y:0}))})),obstacles:[...Array.from({length:127},()=>({x:-1000,y:-1000,width:1,height:1})),{x:0,y:0,width:200,height:100}],viewport:base().viewport,clearance:0};assert.equal(place(blocked).unplacedCount,128);
 for(const size of [.001,10000]){const input={labels:[{itemId:'edge',anchor:{x:1e6,y:1e6},offsets:[{x:1e6-size,y:1e6-size}],width:size,height:size,priority:1e6}],viewport:{x:1e6,y:1e6,width:1e6,height:1e6},obstacles:[],clearance:10000},s=place(input);assert.equal(s.placedCount,1);assert.ok(s.items[0].matrix[4]>1e6);const p=compileLayoutHandoff({from:s.items,to:s.items,range:{start:T(0),end:T(1)}});assert.deepEqual(JSON.parse(JSON.stringify(sampleLayoutHandoff(p,T(1,2)).items[0].matrix)),JSON.parse(JSON.stringify(s.items[0].matrix)));}
});
function draw(api,s){const c=api.createCanvas(240,140),ctx=c.getContext('2d');ctx.fillStyle='#ece7dc';ctx.fillRect(0,0,240,140);for(const item of s.items){ctx.save();ctx.translate(15,15);ctx.transform(...item.matrix);ctx.fillStyle=item.zIndex%2?'#275057':'#c55b3c';ctx.fillRect(0,0,item.rect.width,item.rect.height);ctx.restore()}return createHash('sha256').update(c.toBuffer('image/png')).digest('hex');}
test('states are history-free; repeated/reverse Native rendering and fresh Node hashes match',()=>{
 const inputs=[base(),{...base(),obstacles:[{x:0,y:0,width:200,height:100}]},{...base(),clearance:1},{...base(),labels:[]}],states=inputs.map(place),{api}=loadNativeCanvas(),hashes=states.map(s=>draw(api,s));for(const i of [3,1,0,2,0]){assert.deepEqual(place(inputs[i]),states[i]);assert.equal(draw(api,place(inputs[i])),hashes[i]);}
 const code=`import{placeAnchoredLabels as place}from ${JSON.stringify(new URL('../lib/foundations/layout/anchored-labels.mjs',import.meta.url).href)};import{loadNativeCanvas}from ${JSON.stringify(new URL('../../motion-render-core/lib/native.mjs',import.meta.url).href)};import{createHash}from'node:crypto';const inputs=${JSON.stringify(inputs)},states=inputs.map(place),draw=${draw.toString()};const{api}=loadNativeCanvas();console.log(JSON.stringify({states,hashes:states.map(s=>draw(api,s))}));`;const p=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);assert.equal(p.stdout.trim(),JSON.stringify({states,hashes}));
});
