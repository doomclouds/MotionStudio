import test from'node:test';import assert from'node:assert/strict';import{compileHingedPanel as compile,sampleHingedPanel as sample,transformHingedPoint as tx}from'../lib/foundations/geometry/hinged-panel.mjs';
const p=(x,y,z)=>({x,y,z}),spec=()=>({vertices:[p(-2,0,0),p(2,0,0),p(2,0,3),p(-2,0,3)],hinge:{from:p(-2,0,0),to:p(2,0,0)}}),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
test('identity, endpoint, hinge, normal and distances',()=>{let plan=compile(spec());for(let i=0;i<=100;i++){let q=sample(plan,{angle:-Math.PI*i/100}),r=tx(q,p(1,0,2));near(Math.hypot(r.y,r.z),2);near(r.x,1);near(q.hinge.from.x,-2);near(q.hinge.from.y,0);near(Math.hypot(q.normal.x,q.normal.y,q.normal.z),1);}let q=sample(plan,{angle:-Math.PI/2});near(q.vertices[2].y,3);near(q.vertices[2].z,0);});
test('child hierarchy and seam continuity',()=>{let a=compile(spec()),b=compile({vertices:[p(-2,0,3),p(2,0,3),p(0,0,5)],hinge:{from:p(-2,0,3),to:p(2,0,3)}});for(let i=0;i<100;i++){let parent=sample(a,{angle:-i*.01}),child=sample(b,{angle:-i*.005,parent});for(let k of['x','y','z'])near(child.vertices[0][k],parent.vertices[3][k]);} });
test('absolute seek, input isolation, deep freeze',()=>{let input=spec(),a=compile(input);input.vertices[0].x=99;let first=sample(a,{angle:.7});for(let x of[3,-1,0,2])sample(a,{angle:x});assert.deepEqual(sample(a,{angle:.7}),first);assert.equal(a.vertices[0].x,-2);assert.ok(Object.isFrozen(first.vertices[0]));});
test('reject uncompiled, foreign, null, unknown, nonfinite and domain',()=>{let a=compile(spec());for(let o of[{angle:NaN},{angle:7},{angle:0,foo:1},{angle:0,parent:null}])assert.throws(()=>sample(a,o));assert.throws(()=>sample({}, {angle:0}));assert.throws(()=>tx({},p(0,0,0)));assert.throws(()=>compile({...spec(),extra:1}));});
test('reject non-planar, concave, duplicate, collinear, off-plane axis',()=>{for(const alter of[s=>s.vertices[3].y=1,s=>s.vertices[2]=p(0,0,1),s=>s.vertices[2]=s.vertices[1],s=>s.hinge.to.y=1,s=>s.hinge.to=s.hinge.from]){let s=spec();alter(s);assert.throws(()=>compile(s));}});
test('arbitrary oriented plane and hinge',()=>{let a=compile({vertices:[p(0,0,0),p(1,1,0),p(1,1,1),p(0,0,1)],hinge:{from:p(0,0,0),to:p(1,1,0)}});let q=sample(a,{angle:Math.PI});near(q.vertices[2].z,-1);near(q.vertices[2].x,1);near(q.vertices[2].y,1);});
test('seeded rotated-plane property cases preserve edges and hinge endpoints',()=>{let seed=991;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};for(let j=0;j<300;j++){const z=(rnd()-.5)*1000,w=1+rnd()*900,h=1+rnd()*900,x=(rnd()-.5)*1000;let sp={vertices:[p(x-w,0,z),p(x+w,0,z),p(x+w,0,z+h),p(x-w,0,z+h)],hinge:{from:p(x-w,0,z),to:p(x+w,0,z)}};let a=compile(sp),s=sample(a,{angle:(rnd()-.5)*Math.PI*4});for(let k of['x','y','z']){near(s.hinge.from[k],sp.hinge.from[k]);near(s.hinge.to[k],sp.hinge.to[k]);}for(let i=0;i<4;i++){let v=s.vertices[i],u=s.vertices[(i+1)%4];near(Math.hypot(v.x-u.x,v.y-u.y,v.z-u.z),i%2?h:2*w);}}});
test('reject cloned state/plan and keep caller decorations in same matrix',()=>{let a=compile(spec()),q=sample(a,{angle:-.78});assert.throws(()=>sample(JSON.parse(JSON.stringify(a)),{angle:0}));assert.throws(()=>sample(a,{angle:0,parent:JSON.parse(JSON.stringify(q))}));assert.deepEqual(tx(q,a.vertices[2]),q.vertices[2]);assert.throws(()=>tx(q,p(Infinity,0,0)));assert.throws(()=>compile({vertices:[p(0,0,0),p(2,0,2),p(2,0,0),p(0,0,2)],hinge:{from:p(0,0,0),to:p(1,0,0)}}));});

test('all object boundaries reject hidden and symbol own fields, missing own and non-plain records',async()=>{
 const {runInNewContext}=await import('node:vm');
 const select=[s=>s,s=>s.hinge,s=>s.hinge.from,s=>s.hinge.to,s=>s.vertices[0]];
 for(const get of select)for(const key of ['extra',Symbol('extra')]){const s=spec();Object.defineProperty(get(s),key,{value:1});assert.throws(()=>compile(s),/unknown/);}
 for(const [get,keys]of [[s=>s,['vertices','hinge']],[s=>s.hinge,['from','to']],[s=>s.vertices[0],['x','y','z']]])for(const key of keys){const s=spec();delete get(s)[key];assert.throws(()=>compile(s),/missing/);}
 for(const v of [null,[],new Date(),Object.assign(Object.create(null),spec()),Object.assign(new(class{})(),spec()),runInNewContext('('+JSON.stringify(spec())+')')])assert.throws(()=>compile(v));
 const plan=compile(spec()),state=sample(plan,{angle:0});
 for(const key of ['extra',Symbol('extra')]){
  assert.throws(()=>sample(plan,Object.defineProperty({angle:0},key,{value:1})),/unknown/);
  assert.throws(()=>tx(state,Object.defineProperty(p(0,0,0),key,{value:1})),/unknown/);
 }
 assert.throws(()=>sample(plan,{}),/missing/);
 for(const parent of [undefined,null,{},plan,structuredClone(state)])assert.throws(()=>sample(plan,{angle:0,parent}),/parent/);
 const hidden=spec();Object.defineProperty(hidden.vertices[0],'x',{value:-2,enumerable:false});assert.doesNotThrow(()=>compile(hidden));
});
test('vertices reject holes, added keys, overridden map, subclass and cross-realm arrays',async()=>{
 const {runInNewContext}=await import('node:vm');
 const extra=spec().vertices;extra.extra=0;
 const hidden=spec().vertices;Object.defineProperty(hidden,'hidden',{value:0});
 const symbolic=spec().vertices;symbolic[Symbol('x')]=0;
 const overridden=spec().vertices;let called=false;overridden.map=()=>{called=true;return spec().vertices;};
 const sparse=spec().vertices;delete sparse[1];
 const subclass=new(class extends Array{})(...spec().vertices);
 for(const vertices of [null,{},[],spec().vertices.slice(0,2),Array(65).fill(p(0,0,0)),extra,hidden,symbolic,overridden,sparse,subclass,runInNewContext(JSON.stringify(spec().vertices))])assert.throws(()=>compile({...spec(),vertices}));
 assert.equal(called,false);
});
test('prototype properties cannot satisfy required fields or inject optional parent (isolated process)',async()=>{
 const {spawnSync}=await import('node:child_process');
 const url=new URL('../lib/foundations/geometry/hinged-panel.mjs',import.meta.url).href;
 const code=`import assert from 'node:assert/strict';import{compileHingedPanel as c,sampleHingedPanel as s}from ${JSON.stringify(url)};const input=${JSON.stringify(spec())};const plan=c(input);Object.prototype.angle=0;assert.throws(()=>s(plan,{}),/missing/);Object.prototype.parent={matrix:[]};assert.deepEqual(s(plan,{angle:0}).vertices,input.vertices);delete input.hinge;Object.prototype.hinge=${JSON.stringify(spec().hinge)};assert.throws(()=>c(input),/missing/);`;
 const result=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
});
test('finite numeric bounds are strict on every coordinate and angle; derived coordinates need not be legal inputs',()=>{
 for(const invalid of [NaN,Infinity,-Infinity,10000.00001,-10000.00001,'1',null,undefined])for(const k of ['x','y','z']){
  const s=spec();s.vertices[0][k]=invalid;assert.throws(()=>compile(s));
  const a=compile(spec());assert.throws(()=>tx(sample(a,{angle:0}),{...p(0,0,0),[k]:invalid}));
 }
 const plan=compile(spec());for(const angle of [-2*Math.PI,2*Math.PI,-0])assert.doesNotThrow(()=>sample(plan,{angle}));
 for(const angle of [-2*Math.PI-1e-14,2*Math.PI+1e-14,NaN,Infinity,'0',null,undefined])assert.throws(()=>sample(plan,{angle}));
 const s=sample(compile({vertices:[p(-10000,0,0),p(10000,0,0),p(10000,0,10000),p(-10000,0,10000)],hinge:{from:p(10000,0,0),to:p(10000,0,1)}}),{angle:Math.PI});
 assert.ok(s.vertices[0].x>10000);assert.throws(()=>tx(s,s.vertices[0]));
});
test('triangle and 64-vertex convex boundary; order reversal flips normal without changing rotation',()=>{
 const vertices=Array.from({length:64},(_,i)=>p(100*Math.cos(i*2*Math.PI/64),0,100*Math.sin(i*2*Math.PI/64))),hinge={from:p(-100,0,0),to:p(100,0,0)};
 const a=compile({vertices,hinge}),b=compile({vertices:vertices.toReversed(),hinge});
 const sa=sample(a,{angle:.73}),sb=sample(b,{angle:.73});assert.deepEqual(sa.vertices,sb.vertices.toReversed());
 for(const k of ['x','y','z'])near(sa.normal[k],-sb.normal[k]);
 assert.doesNotThrow(()=>compile({vertices:[p(0,0,0),p(2,0,0),p(0,0,3)],hinge}));
});
test('hinge may be interior or outside panel; helper points need not lie on panel',()=>{
 const input=spec();input.hinge={from:p(-5,0,10),to:p(5,0,10)};
 const plan=compile(input),s=sample(plan,{angle:Math.PI/2});
 for(const k of ['x','y','z']){near(s.hinge.from[k],input.hinge.from[k]);near(s.hinge.to[k],input.hinge.to[k]);}
 const q=tx(s,p(1,4,7));near(q.x,1);near(q.y,3);near(q.z,14);
});
test('tolerance is a floating acceptance rule, not flattening; tiny or near-collinear panels reject',()=>{
 const perturbed=spec();perturbed.vertices[3].y=1e-10;const plan=compile(perturbed);assert.equal(plan.vertices[3].y,1e-10);
 const bent=spec();bent.vertices[3].y=1e-5;assert.throws(()=>compile(bent),/plane/);
 for(const vertices of [[p(0,0,0),p(1e-5,0,0),p(0,0,1e-5)],[p(0,0,0),p(1,0,0),p(2,0,1e-10)]])assert.throws(()=>compile({...spec(),vertices}));
 const axis=spec();axis.hinge.to=p(-2+1e-9,0,0);assert.throws(()=>compile(axis),/degenerate/);
});
test('parent order is parent times local and unchanged parent remains reusable',()=>{
 const a=compile(spec()),b=compile({vertices:[p(0,0,0),p(0,0,3),p(0,2,3),p(0,2,0)],hinge:{from:p(0,0,0),to:p(0,0,3)}});
 const parent=sample(a,{angle:.4}),saved=JSON.stringify(parent),local=sample(b,{angle:.8}),child=sample(b,{angle:.8,parent});
 for(let i=0;i<b.vertices.length;i++){const sequential=tx(parent,local.vertices[i]);for(const k of ['x','y','z'])near(child.vertices[i][k],sequential[k]);}
 assert.equal(JSON.stringify(parent),saved);assert.deepEqual(sample(b,{angle:.8,parent}),child);
});
test('fresh-process state equality and duplicate module brands are intentionally isolated',async()=>{
 const {spawnSync}=await import('node:child_process');const url=new URL('../lib/foundations/geometry/hinged-panel.mjs',import.meta.url).href;
 const expected=sample(compile(spec()),{angle:.71});
 const result=spawnSync(process.execPath,['--input-type=module','-e',`import{compileHingedPanel as c,sampleHingedPanel as s}from ${JSON.stringify(url)};console.log(JSON.stringify(s(c(${JSON.stringify(spec())}),{angle:.71})))`],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),JSON.stringify(expected));
 const other=await import(url+'?duplicate-brand');assert.throws(()=>other.sampleHingedPanel(compile(spec()),{angle:0}));assert.throws(()=>sample(compile(spec()),{angle:0,parent:other.sampleHingedPanel(other.compileHingedPanel(spec()),{angle:0})}));
});
test('bounded hierarchy is per ancestry, not a global sample counter',()=>{
 const plan=compile(spec());let state=sample(plan,{angle:.0125});for(let i=2;i<=128;i++)state=sample(plan,{angle:.0125,parent:state});
 assert.throws(()=>sample(plan,{angle:0,parent:state}),/128/);
 const root=sample(plan,{angle:.4});for(let i=0;i<256;i++)assert.deepEqual(sample(plan,{angle:.8,parent:root}),sample(plan,{angle:.8,parent:root}));
 assert.doesNotThrow(()=>sample(plan,{angle:0}));
 for(const v of state.vertices)for(const x of Object.values(v))assert.ok(Number.isFinite(x));
 for(let i=0;i<state.vertices.length;i++){const a=state.vertices[i],b=state.vertices[(i+1)%state.vertices.length];assert.ok(Math.abs(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)-(i%2?3:4))<1e-11);}
});
test('independent axis decomposition agrees with sampled points across arbitrary planes',()=>{
 // Rotate a point as axial component + rotated perpendicular basis, rather than the 3x4 formula.
 const rotate=(q,a,axis,angle)=>{const d={x:q.x-a.x,y:q.y-a.y,z:q.z-a.z},along=d.x*axis.x+d.y*axis.y+d.z*axis.z,rad={x:d.x-along*axis.x,y:d.y-along*axis.y,z:d.z-along*axis.z},side={x:axis.y*rad.z-axis.z*rad.y,y:axis.z*rad.x-axis.x*rad.z,z:axis.x*rad.y-axis.y*rad.x};return Object.fromEntries(['x','y','z'].map(k=>[k,a[k]+along*axis[k]+Math.cos(angle)*rad[k]+Math.sin(angle)*side[k]]));};
 for(let i=0;i<100;i++){
  const slope=i/17,unit={x:1/Math.hypot(1,slope),y:slope/Math.hypot(1,slope),z:0},origin=p(i-50,20-i,13),make=(u,v)=>p(origin.x+unit.x*u,origin.y+unit.y*u,origin.z+v);
  const plan=compile({vertices:[make(-13,0),make(22,0),make(22,51),make(-13,51)],hinge:{from:make(-100,11),to:make(100,11)}});
  for(const angle of [-2*Math.PI,-Math.PI/2,-.01,0,.4,Math.PI,2*Math.PI]){const s=sample(plan,{angle});for(let j=0;j<4;j++){const ref=rotate(plan.vertices[j],plan.hinge.from,unit,angle);for(const k of ['x','y','z'])assert.ok(Math.abs(ref[k]-s.vertices[j][k])<2e-12);}}
 }
});
test('caller-owned Native projection stays deterministic in reverse and a fresh Node',async()=>{
 const {loadNativeCanvas}=await import('../../motion-render-core/lib/native.mjs');const {createHash}=await import('node:crypto');const {spawnSync}=await import('node:child_process');
 function draw(api,state){const c=api.createCanvas(160,140),ctx=c.getContext('2d');ctx.fillStyle='#eee9dd';ctx.fillRect(0,0,160,140);const project=p=>({x:80+12*p.x-4*p.z,y:100-12*p.y+3*p.z});ctx.beginPath();state.vertices.map(project).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle='#c76041';ctx.fill();return createHash('sha256').update(c.toBuffer('image/png')).digest('hex');}
 const {api}=loadNativeCanvas(),plan=compile(spec()),angles=[0,.2,.7,1.5,-.4],hashes=angles.map(angle=>draw(api,sample(plan,{angle})));
 for(let i=angles.length-1;i>=0;i--)assert.equal(draw(api,sample(plan,{angle:angles[i]})),hashes[i]);
 const url=new URL('../lib/foundations/geometry/hinged-panel.mjs',import.meta.url).href,native=new URL('../../motion-render-core/lib/native.mjs',import.meta.url).href;
 const code=`import{createHash}from'node:crypto';import{loadNativeCanvas}from ${JSON.stringify(native)};import{compileHingedPanel as compile,sampleHingedPanel as sample}from ${JSON.stringify(url)};const draw=${draw.toString()},api=loadNativeCanvas().api,plan=compile(${JSON.stringify(spec())});console.log(JSON.stringify(${JSON.stringify(angles)}.map(angle=>draw(api,sample(plan,{angle})))));`;
 const r=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.deepEqual(JSON.parse(r.stdout),hashes);
});
test('near-plane endpoint tolerance does not promise the short hinge axis lies in that plane',()=>{
 const plan=compile({vertices:[p(-5000,-5000,0),p(5000,-5000,0),p(5000,5000,0),p(-5000,5000,0)],hinge:{from:p(0,0,-1e-6),to:p(0,0,1e-6)}});
 assert.deepEqual(plan.axis,p(0,0,1));assert.deepEqual(plan.normal,p(0,0,1));assert.ok(plan.tolerance>1e-6);
 const state=sample(plan,{angle:Math.PI/2});assert.ok(state.vertices.every(v=>v.z===0));
 assert.ok(Math.abs(state.vertices[0].x-5000)<1e-10);assert.ok(Math.abs(state.vertices[0].y+5000)<1e-10);
});
