import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
import {weightedFlowLayout as layout} from '../lib/weighted-flow.mjs';
import {layeredDagLayout} from '../lib/layered-dag.mjs';import {drawSampledBand} from '../adapters/sampled-band.mjs';import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
const spec=()=>({nodes:layeredDagLayout({nodes:['a','b','c','d'].map(itemId=>({itemId,width:20,height:60})),links:[{linkId:'ab',fromId:'a',toId:'b'},{linkId:'ac',fromId:'a',toId:'c'},{linkId:'bd',fromId:'b',toId:'d'},{linkId:'cd',fromId:'c',toId:'d'}],layerGap:60,nodeGap:20}).items,links:[{linkId:'ab',fromId:'a',toId:'b',value:20},{linkId:'ac',fromId:'a',toId:'c',value:30},{linkId:'bd',fromId:'b',toId:'d',value:20},{linkId:'cd',fromId:'c',toId:'d',value:30}],unitsToPixels:1,portGap:4,samples:32});
test('global weight scale, stable port packing, fixed endpoint bands and explicit balances',()=>{
 const s=layout(spec()),a=s.ports.find(n=>n.itemId==='a');assert.deepEqual(a.outputs.map(p=>[p.linkId,p.thickness]),[['ab',20],['ac',30]]);assert.equal(a.outputs[1].y-a.outputs[0].y,29);
 for(const link of s.links){assert.equal(link.band.samples.length,32);assert.equal(link.band.samples[0].y,link.source.y);assert.equal(link.band.samples.at(-1).y,link.target.y);assert.equal(link.band.samples[10].halfWidth,link.value/2);}
 assert.deepEqual(s.balances.map(b=>[b.itemId,b.net]),[['a',-50],['b',0],['c',0],['d',50]]);
});
test('input order does not change ports or same-link geometry; zero identity reserves gaps',()=>{
 const p=spec(),s=layout(p),q=layout({...p,nodes:[...p.nodes].reverse(),links:[...p.links].reverse()});for(const l of s.links)assert.deepEqual(l,q.links.find(x=>x.linkId===l.linkId));
 const z=layout({...p,links:p.links.map(l=>({...l,value:0}))});assert.ok(z.links.every(l=>l.band.degenerate));assert.equal(z.ports.find(n=>n.itemId==='a').outputs[1].y-z.ports.find(n=>n.itemId==='a').outputs[0].y,4);
 assert.deepEqual(layout({...p,nodes:[],links:[]}),{links:[],ports:[],balances:[]});
});
test('strict graph, schema, arrays, numerical, domain and capacity rejection',()=>{
 for(const bad of [null,[],{}, {...spec(),x:1},{...spec(),[Symbol('x')]:1}])assert.throws(()=>layout(bad));
 for(const key of Object.keys(spec()))for(const mode of ['missing','null']){const p=structuredClone(spec());if(mode==='missing')delete p[key];else p[key]=null;assert.throws(()=>layout(p));}
 for(const mutate of [p=>p.nodes.extra=1,p=>p.links[Symbol('x')]=1,p=>delete p.nodes[0],p=>delete p.links[0],p=>p.nodes.push(p.nodes[0]),p=>p.links.push(p.links[0]),p=>p.links[0].fromId='missing',p=>p.links[0].toId='a',p=>p.links[0].value=-1,p=>p.links[0].value=NaN,p=>p.links[0].value=1e6+1,p=>p.nodes[0].matrix[0]=2,p=>p.nodes[0].geometryBounds.x=1,p=>p.portGap=61,p=>p.unitsToPixels=2,p=>p.samples=1,p=>p.samples=257,p=>p.samples=2.5]){const p=structuredClone(spec());mutate(p);assert.throws(()=>layout(p));}
 const p=structuredClone(spec());p.links[0]={...p.links[0],fromId:'b',toId:'a'};assert.throws(()=>layout(p));
 const many={...spec(),links:Array.from({length:128},(_,i)=>({linkId:`l${i}`,fromId:'a',toId:'b',value:0})),portGap:0};assert.equal(layout(many).links.length,128);assert.throws(()=>layout({...many,links:[...many.links,{...many.links[0],linkId:'extra'}]}));
});
test('detached immutable states and same native band adapter preserve current path and drawing state',()=>{
 const p=spec(),copy=structuredClone(p),s=layout(p);assert.deepEqual(p,copy);assert.ok(Object.isFrozen(s.links[0].band.samples[0]));p.links[0].value=1;assert.equal(s.links[0].value,20);
 const {api}=loadNativeCanvas(),c=api.createCanvas(180,140),ctx=c.getContext('2d');
 const draw=()=>{ctx.clearRect(0,0,180,140);for(const l of s.links)drawSampledBand(ctx,l.band,{fill:'#23c9aa'},{Path2D:api.Path2D});return c.toBuffer('image/png');};assert.deepEqual(draw(),draw());assert.equal(ctx.globalAlpha,1);assert.equal(ctx.getTransform().e,0);
 ctx.beginPath();ctx.rect(1,1,5,5);drawSampledBand(ctx,s.links[0].band,{fill:'#23c9aa'},{Path2D:api.Path2D});ctx.fillStyle='#f00';ctx.fill();assert.deepEqual([...ctx.getImageData(2,2,1,1).data],[255,0,0,255]);
});
test('separate processes return identical complete weighted bands',()=>{
 const url=new URL('../lib/weighted-flow.mjs',import.meta.url).href,code=`import {weightedFlowLayout as f} from ${JSON.stringify(url)};console.log(JSON.stringify(f(${JSON.stringify(spec())})));`;
 const run=()=>spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});const a=run(),b=run();assert.equal(a.status,0,a.stderr);assert.equal(a.stdout,b.stdout);
});
test('positive weights that underflow thickness or half-width are rejected instead of drawn as zero',()=>{
 for(const unitsToPixels of [.001,1]){
  const p=spec();p.unitsToPixels=unitsToPixels;p.links[0].value=Number.MIN_VALUE;
  assert.throws(()=>layout(p),/numerically unrepresentable/);
 }
 const p=spec();p.links[0].value=1e-20;assert.throws(()=>layout(p),/numerically unrepresentable/);
});
test('each nested layout/link field is required and rejects unknown/symbol/non-plain structure',()=>{
 for(const path of [['nodes',0],['nodes',0,'rect'],['nodes',0,'geometryBounds'],['links',0]]){
  const original=path.reduce((p,k)=>p[k],spec());
  for(const key of Object.keys(original))for(const mode of ['missing','null']){
   const p=structuredClone(spec()),v=path.reduce((p,k)=>p[k],p);if(mode==='missing')delete v[key];else v[key]=null;assert.throws(()=>layout(p),`${path.join('.')}.${key}/${mode}`);
  }
  for(const key of ['unknown',Symbol('unknown')]){const p=structuredClone(spec());path.reduce((p,k)=>p[k],p)[key]=1;assert.throws(()=>layout(p));}
  const p=structuredClone(spec());Object.setPrototypeOf(path.reduce((p,k)=>p[k],p),Date.prototype);assert.throws(()=>layout(p));
 }
 for(let i=0;i<6;i++){const p=structuredClone(spec());delete p.nodes[0].matrix[i];assert.throws(()=>layout(p));}
 const p=structuredClone(spec());p.nodes[0].matrix[Symbol('x')]=1;assert.throws(()=>layout(p));
 const many={...spec(),nodes:Array.from({length:65},(_,i)=>({...spec().nodes[0],itemId:`n${i}`})),links:[]};assert.throws(()=>layout(many));
 const open=spec();open.links[2].value=19;assert.equal(layout(open).balances.find(b=>b.itemId==='b').net,1,'base layout reports imbalance; recipe owns conservation validation');
});
