import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
import {compileFlowHandoff as compile,sampleFlowHandoff as sample} from '../lib/recipes/flow-handoff.mjs';
import {layeredDagLayout} from '../lib/layered-dag.mjs';import {rational as T} from '../lib/time.mjs';
const links=(b,c)=>[{linkId:'ab',fromId:'a',toId:'b',value:b},{linkId:'ac',fromId:'a',toId:'c',value:c},{linkId:'bd',fromId:'b',toId:'d',value:b},{linkId:'cd',fromId:'c',toId:'d',value:c}];
const spec=()=>({nodes:layeredDagLayout({nodes:['a','b','c','d'].map(itemId=>({itemId,width:20,height:60})),links:links(20,30).map(({value,...l})=>l),layerGap:60,nodeGap:20}).items,from:links(20,30),to:links(40,10),range:{start:T(1),end:T(3)},unitsToPixels:1,portGap:4,samples:24});
test('exact endpoints, smooth midpoint, stable topology, conservation and reduced temporal identity',()=>{
 const p=compile(spec()),values=at=>sample(p,at).flow.links.map(l=>l.value);
 assert.deepEqual(values(T(0)),[20,30,20,30]);assert.deepEqual(values(T(2)),[30,20,30,20]);assert.deepEqual(values(T(3)),[40,10,40,10]);
 assert.deepEqual(values(T(1,2)),[20,30,20,30]);assert.deepEqual(values(T(99)),[40,10,40,10]);
 const reduced=sample(p,T(2),{reducedMotion:true});assert.equal(reduced.phase,'active');assert.equal(reduced.progress,.5);assert.deepEqual(reduced.flow.links.map(l=>l.value),[40,10,40,10]);
 for(let n=0;n<=200;n++){const s=sample(p,T(n,50));assert.ok(s.flow.balances.filter(b=>['b','c'].includes(b.itemId)).every(b=>Math.abs(b.net)<1e-9));assert.equal(s.flow.balances[0].outgoing,50);}
});
test('permanently inactive reserved links preserve topology and endpoints retain exact values',()=>{
 const p=spec();p.from=links(50,0);p.to=links(40,0);const plan=compile(p);assert.ok(sample(plan,T(3)).flow.links.filter(l=>['ac','cd'].includes(l.linkId)).every(l=>l.band.degenerate));
 const x=sample(plan,T('2999999999','1000000000'));assert.ok(x.flow.links.every(l=>Number.isFinite(l.value)&&l.value>=0));
 const q=spec();q.to.reverse();assert.deepEqual(sample(compile(q),T(2)).flow.links.map(l=>l.linkId),['cd','bd','ac','ab']);
});
test('compile rejects zero crossings and unsafe positive widths before any frame is sampled',()=>{
 const node=(itemId,x)=>({itemId,rect:{x:0,y:0,width:1,height:1},matrix:[1,0,0,1,x,10000],zIndex:0,geometryBounds:{x,y:10000,width:1,height:1}});
 const edge=value=>[{linkId:'ab',fromId:'a',toId:'b',value}];
 const p={nodes:[node('a',0),node('b',10)],from:edge(0),to:edge(1e-6),range:{start:T(0),end:T(14)},unitsToPixels:.001,portGap:0,samples:2};
 assert.throws(()=>compile(p),/activate or deactivate/);assert.throws(()=>compile({...p,from:p.to,to:p.from}),/activate or deactivate/);
 assert.throws(()=>compile({...p,from:edge(1e-8)}),/robust positive widths/);
 const plan=compile({...p,from:edge(1e-6),to:edge(3e-6)});
 for(const at of [T(0),T(1,'100000000000000000000000000000'),T(1,30),T(7),T(14)])assert.doesNotThrow(()=>sample(plan,at));
 for(let n=0;n<=420;n++)assert.doesNotThrow(()=>sample(plan,T(n,30)));
});
test('strict contract rejects changing topology, nonconservative internals and invalid timing/fields',()=>{
 for(const bad of [null,[],{}, {...spec(),bad:1},{...spec(),[Symbol('x')]:1}])assert.throws(()=>compile(bad));
 for(const key of Object.keys(spec()))for(const mode of ['missing','null']){const p=structuredClone(spec());if(mode==='missing')delete p[key];else p[key]=null;assert.throws(()=>compile(p));}
 for(const mutate of [p=>p.to.pop(),p=>p.to[0].linkId='other',p=>p.to[0].toId='c',p=>p.to[2].value+=1,p=>p.from[2].value-=1,p=>p.range.end=T(1),p=>p.range.start=T(-1),p=>p.range.end=T(86401)]){const p=structuredClone(spec());mutate(p);assert.throws(()=>compile(p));}
 const p=compile(spec());assert.throws(()=>sample(structuredClone(p),T(2)));for(const context of [null,{unknown:1},{reducedMotion:null},{reducedMotion:0}])assert.throws(()=>sample(p,T(2),context));
 assert.throws(()=>sample(p,{n:2,d:1}));
});
test('detached frozen plans, shuffled seek and independent processes reproduce complete data geometry',()=>{
 const p=spec(),copy=structuredClone(p),plan=compile(p);p.from[0].value=0;assert.equal(plan.values[0].from,20);assert.ok(Object.isFrozen(plan.settings.nodes[0].matrix));
 const times=[0,1,1.5,2,2.5,3,4],states=times.map(t=>sample(plan,T(t*2,2)));
 for(const t of [4,1,2.5,0,3,1.5,2])assert.deepEqual(sample(plan,T(t*2,2)),states[times.indexOf(t)]);
 const url=new URL('../lib/recipes/flow-handoff.mjs',import.meta.url).href,code=`import {compileFlowHandoff as c,sampleFlowHandoff as s} from ${JSON.stringify(url)};console.log(JSON.stringify(s(c(${JSON.stringify(copy)}),{n:'2',d:'1'})));`;
 const run=()=>spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});const a=run(),b=run();assert.equal(a.status,0,a.stderr);assert.equal(a.stdout,b.stdout);
});
test('proposed order story genuinely calls the candidates and keeps displayed batch counts coupled',async()=>{
 const {createOrderFlowPlan,sampleOrderFlow}=await import('../examples/order-flow-data.mjs');
 const {layout,plan}=createOrderFlowPlan();assert.equal(layout.items.length,6);
 for(let frame=0;frame<=840;frame+=7){const s=sampleOrderFlow(plan,T(frame,60));assert.equal(s.display.held+s.display.fulfilled,100);assert.equal(s.display.received,100);assert.ok(s.flow.balances.filter(b=>['auto','review','ready'].includes(b.itemId)).every(b=>Math.abs(b.net)<1e-9));}
 assert.deepEqual(sampleOrderFlow(plan,T(0)).display,{received:100,held:40,fulfilled:60});
 assert.deepEqual(sampleOrderFlow(plan,T(14)).display,{received:100,held:5,fulfilled:95});
});
test('Native state frames survive shuffled seeks and a fresh process without drawing-state leaks',async()=>{
 const {loadNativeCanvas}=await import('../../motion-render-core/lib/native.mjs');const {drawSampledBand}=await import('../adapters/sampled-band.mjs');const {createHash}=await import('node:crypto');
 const {api}=loadNativeCanvas(),canvas=api.createCanvas(180,140),ctx=canvas.getContext('2d'),plan=compile(spec());ctx.globalAlpha=.6;const alpha=ctx.globalAlpha;
 const render=t=>{ctx.clearRect(0,0,180,140);for(const l of sample(plan,T(t*2,2)).flow.links)drawSampledBand(ctx,l.band,{fill:'#159f8b'},{Path2D:api.Path2D});assert.equal(ctx.globalAlpha,alpha);assert.equal(ctx.getTransform().e,0);return createHash('sha256').update(canvas.toBuffer('image/png')).digest('hex');};
 const times=[0,1,1.5,2,2.5,3,4],hashes=times.map(render);for(const t of [4,0,2.5,1.5,3,1,2])assert.equal(render(t),hashes[times.indexOf(t)]);
 const urls={recipe:new URL('../lib/recipes/flow-handoff.mjs',import.meta.url).href,native:new URL('../../motion-render-core/lib/native.mjs',import.meta.url).href,adapter:new URL('../adapters/sampled-band.mjs',import.meta.url).href};
 const code=`import {compileFlowHandoff as c,sampleFlowHandoff as s} from ${JSON.stringify(urls.recipe)};import {loadNativeCanvas} from ${JSON.stringify(urls.native)};import {drawSampledBand as draw} from ${JSON.stringify(urls.adapter)};import {createHash} from 'node:crypto';const {api}=loadNativeCanvas(),canvas=api.createCanvas(180,140),ctx=canvas.getContext('2d');ctx.globalAlpha=.6;for(const l of s(c(${JSON.stringify(spec())}),{n:'2',d:'1'}).flow.links)draw(ctx,l.band,{fill:'#159f8b'},{Path2D:api.Path2D});console.log(createHash('sha256').update(canvas.toBuffer('image/png')).digest('hex'));`;
 const result=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),hashes[times.indexOf(2)]);
});


test('conservation tolerance scales with actual tiny throughput, never a unit-size floor',()=>{
 const edge=(linkId,fromId,toId,value)=>({linkId,fromId,toId,value});
 const links=(a,b)=>[edge('ab','a','b',a),edge('bc','b','c',b)];
 const nodes=layeredDagLayout({nodes:['a','b','c'].map(itemId=>({itemId,width:.001,height:.001})),links:links(1,1).map(({value,...l})=>l),layerGap:1,nodeGap:0}).items;
 const make=(a,b)=>({nodes,from:links(a,b),to:links(a,b),range:{start:T(0),end:T(1)},unitsToPixels:1000,portGap:0,samples:2});
 for(const v of [1e-16,1e-15,1e-12,1e-9,1e-7]){
  assert.throws(()=>compile(make(v,2*v)),/not conserved/);
  assert.throws(()=>compile(make(2*v,v)),/not conserved/);
  assert.doesNotThrow(()=>compile(make(v,v)));
  assert.doesNotThrow(()=>compile(make(v,v*(1+Number.EPSILON))));
  assert.throws(()=>compile(make(v,v*(1+128*Number.EPSILON))),/not conserved/);
 }
 const p=compile(make(0,0));assert.ok(sample(p,T(1,2)).flow.balances.every(b=>b.net===0));
});


test('shared rational clock exposes its bounded intermediate arithmetic instead of promising all legal combinations',()=>{
 const p=spec();p.range={start:T(1,3),end:T(2,3)};const plan=compile(p);
 assert.doesNotThrow(()=>sample(plan,T(1,2)));
 const at=T('499999999999999999999999999994','999999999999999999999999999989');
 assert.throws(()=>sample(plan,at),/Rational exceeds 30-digit bound/);
});
