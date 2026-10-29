import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
import {layeredDagLayout as layout} from '../lib/layered-dag.mjs';
import {compileLayoutHandoff} from '../lib/recipes/layout-handoff.mjs';
import {rational as T} from '../lib/time.mjs';import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
const node=(itemId,width=40,height=40)=>({itemId,width,height}),link=(linkId,fromId,toId)=>({linkId,fromId,toId});
const spec=()=>({nodes:[node('a'),node('b',40,20),node('c',40,30),node('d')],links:[link('ab','a','b'),link('ac','a','c'),link('bd','b','d'),link('cd','c','d')],layerGap:10,nodeGap:10});
test('branch and merge longest-path layers and centered intrinsic node geometry',()=>{
 const s=layout(spec());assert.deepEqual(s.placements,[{itemId:'a',layer:0,order:0},{itemId:'b',layer:1,order:0},{itemId:'c',layer:1,order:1},{itemId:'d',layer:2,order:0}]);
 assert.deepEqual(s.items.map(n=>n.geometryBounds),[{x:0,y:10,width:40,height:40},{x:50,y:0,width:40,height:20},{x:50,y:30,width:40,height:30},{x:100,y:10,width:40,height:40}]);assert.deepEqual(s.extent,{width:140,height:60});
 const p=spec();p.links.push(link('ad','a','d'));assert.equal(layout(p).placements.at(-1).layer,2);
});
test('input permutation and parallel links preserve identity geometry; output order is explicit',()=>{
 const p=spec(),s=layout(p),q={...p,nodes:[...p.nodes].reverse(),links:[...p.links].reverse()};q.links.push(link('ab2','a','b'));
 const t=layout(q);for(const n of s.items)assert.deepEqual(n.geometryBounds,t.items.find(v=>v.itemId===n.itemId).geometryBounds);
 assert.deepEqual(t.items.map(n=>n.itemId),['d','c','b','a']);assert.deepEqual(t.items.map(n=>n.zIndex),[0,1,2,3]);
});
test('empty, isolated, minimal and maximum legal layouts compose with existing handoff',()=>{
 assert.deepEqual(layout({nodes:[],links:[],layerGap:.001,nodeGap:0}),{items:[],placements:[],extent:{width:0,height:0}});
 for(const size of [.001,4096])for(const chained of [false,true]){
  const p={nodes:Array.from({length:64},(_,i)=>node(`n${i}`,size,size)),links:chained?Array.from({length:63},(_,i)=>link(`l${i}`,`n${i}`,`n${i+1}`)):[],layerGap:size,nodeGap:size};
  const s=layout(p);assert.equal(s.items.length,64);assert.ok(s.items.every(n=>n.rect.width>0&&n.rect.height>0));
  assert.doesNotThrow(()=>compileLayoutHandoff({from:s.items,to:s.items,range:{start:T(0),end:T(1)}}));
 }
});
test('strict graph, field, array, numeric and capacity rejection',()=>{
 for(const bad of [null,[],{}, {...spec(),extra:1},{...spec(),[Symbol('x')]:1}])assert.throws(()=>layout(bad));
 for(const key of Object.keys(spec()))for(const mode of ['missing','null']){const p=spec();if(mode==='missing')delete p[key];else p[key]=null;assert.throws(()=>layout(p));}
 for(const path of [['nodes',0],['links',0]])for(const key of Object.keys(path.reduce((p,k)=>p[k],spec())))for(const mode of ['missing','null']){const p=spec(),v=path.reduce((p,k)=>p[k],p);if(mode==='missing')delete v[key];else v[key]=null;assert.throws(()=>layout(p));}
 for(const mutate of [p=>p.nodes[0].extra=1,p=>p.links[0][Symbol('x')]=1,p=>p.nodes.extra=1,p=>p.links[Symbol('x')]=1,p=>delete p.nodes[0],p=>delete p.links[0],p=>p.nodes.push(node('a')),p=>p.links.push(p.links[0]),p=>p.links[0].fromId='missing',p=>p.links.push(link('self','a','a')),p=>p.links.push(link('cycle','d','a')),p=>p.layerGap=0,p=>p.nodeGap=-1]){const p=spec();mutate(p);assert.throws(()=>layout(p));}
 for(const value of [NaN,Infinity,-Infinity,0,4096.01])for(const key of ['width','height']){const p=spec();p.nodes[0][key]=value;assert.throws(()=>layout(p));}
 assert.throws(()=>layout({...spec(),nodes:Array.from({length:65},(_,i)=>node(`n${i}`))}));
 const p=spec();p.links=Array.from({length:128},(_,i)=>link(`l${i}`,'a','b'));assert.doesNotThrow(()=>layout(p));p.links.push(link('extra','a','b'));assert.throws(()=>layout(p));
 assert.throws(()=>layout({...spec(),nodes:[]}));
});
test('input isolation, deep freeze, fresh-process determinism and Native state/pixels',()=>{
 const p=spec(),copy=structuredClone(p),s=layout(p);assert.deepEqual(p,copy);assert.ok(Object.isFrozen(s.items[0].matrix));assert.ok(Object.isFrozen(s.placements[0]));p.nodes[0].width=1;assert.equal(s.items[0].rect.width,40);
 const {api}=loadNativeCanvas(),c=api.createCanvas(140,60),ctx=c.getContext('2d');
 const draw=()=>{ctx.clearRect(0,0,140,60);for(const n of s.items){ctx.save();try{ctx.transform(...n.matrix);ctx.fillRect(n.rect.x,n.rect.y,n.rect.width,n.rect.height);}finally{ctx.restore();}}return c.toBuffer('image/png');};assert.deepEqual(draw(),draw());assert.equal(ctx.getImageData(45,20,1,1).data[3],0);assert.equal(ctx.getImageData(5,20,1,1).data[3],255);assert.equal(ctx.getTransform().e,0);assert.equal(ctx.globalAlpha,1);
 const url=new URL('../lib/layered-dag.mjs',import.meta.url).href,code=`import {layeredDagLayout as f} from ${JSON.stringify(url)};console.log(JSON.stringify(f(${JSON.stringify(copy)})));`;
 const run=()=>spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});const a=run(),b=run();assert.equal(a.status,0,a.stderr);assert.equal(a.stdout,b.stdout);
});
test('seeded DAG oracle verifies longest paths and permutation-stable geometry',()=>{
 let seed=9137;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
 for(let trial=0;trial<200;trial++){
  const n=2+Math.floor(rand()*30),nodes=Array.from({length:n},(_,i)=>node(`n${String(i).padStart(2,'0')}`,1+Math.floor(rand()*100),1+Math.floor(rand()*80))),links=[];
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(rand()<.16&&links.length<128)links.push(link(`l${i}_${j}`,nodes[i].itemId,nodes[j].itemId));
  const p={nodes,links,layerGap:15,nodeGap:5},s=layout(p),oracle=Array(n).fill(0);
  for(let i=0;i<n;i++)for(const edge of links.filter(l=>l.fromId===nodes[i].itemId)){const j=nodes.findIndex(x=>x.itemId===edge.toId);oracle[j]=Math.max(oracle[j],oracle[i]+1);}
  assert.deepEqual(s.placements.map(x=>x.layer),oracle);
  const q=layout({...p,nodes:[...nodes].reverse(),links:[...links].reverse()});for(const x of s.items)assert.deepEqual(x.geometryBounds,q.items.find(y=>y.itemId===x.itemId).geometryBounds);
  for(const edge of links){const a=s.items.find(x=>x.itemId===edge.fromId).geometryBounds,b=s.items.find(x=>x.itemId===edge.toId).geometryBounds;assert.ok(a.x+a.width<b.x);}
 }
});
