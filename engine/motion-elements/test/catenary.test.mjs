import{test}from'node:test';import assert from'node:assert/strict';import{compileCatenary,sampleCatenary,sampleCatenaryPolyline}from'../lib/foundations/geometry/catenary.mjs';
const spec=(a={x:0,y:0},b={x:800,y:0},length=1000,gravity={x:0,y:1})=>({from:a,to:b,length,gravity}),near=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
test('horizontal symmetric sag and unit tangents',()=>{const p=compileCatenary(spec()),s=sampleCatenary(p,.5);near(s.position.x,400);assert.ok(s.position.y>250);near(s.tangent.x,1);near(s.tangent.y,0);for(let q=0;q<=1;q+=.03125){const a=sampleCatenary(p,q),b=sampleCatenary(p,1-q);near(a.position.y,b.position.y);near(Math.hypot(a.tangent.x,a.tangent.y),1);}});
test('analytic arc length matches dense independent polyline and derivative',()=>{for(const [b,L]of[[{x:700,y:200},1000],[{x:200,y:-500},700],[{x:1,y:0},31],[{x:1,y:999},1100]]){const p=compileCatenary(spec({x:0,y:0},b,L)),pts=sampleCatenaryPolyline(p,{segments:4096});let len=0;for(let i=1;i<pts.length;i++)len+=Math.hypot(pts[i].position.x-pts[i-1].position.x,pts[i].position.y-pts[i-1].position.y);assert.ok(len<=L+1e-8);near(len,L,L*5e-5);let integral=0,N=65536;for(let i=0;i<N;i++){const x=(i+.5)*p.transverse/N;integral+=Math.cosh((x-p.transverse/2)/p.a-p.w)*p.transverse/N;}near(integral,L,L*1e-8);for(const q of[.1,.4,.6,.9]){let a=sampleCatenary(p,q-1e-5),b=sampleCatenary(p,q+1e-5),s=sampleCatenary(p,q);near((b.position.x-a.position.x)/2e-5/L,s.tangent.x,2e-6);near((b.position.y-a.position.y)/2e-5/L,s.tangent.y,2e-6);}}});
test('endpoints exact, reversed input same locus and reversed tangent',()=>{const p=compileCatenary(spec()),r=compileCatenary(spec({x:800,y:0},{x:0,y:0}));assert.deepEqual(sampleCatenary(p,0).position,p.from);assert.deepEqual(sampleCatenary(p,1).position,p.to);for(const q of[0,.13,.5,.9,1]){const a=sampleCatenary(p,q),b=sampleCatenary(r,1-q);near(a.position.x,b.position.x);near(a.position.y,b.position.y);near(a.tangent.x,-b.tangent.x);near(a.tangent.y,-b.tangent.y);}});
test('gravity rotation and scaling covariance',()=>{const p=compileCatenary(spec()),r=compileCatenary(spec({x:10,y:30},{x:10,y:830},1000,{x:-7,y:0}));for(const q of[0,.25,.5,.8,1]){const a=sampleCatenary(p,q).position,b=sampleCatenary(r,q).position;near(b.x,10-a.y);near(b.y,30+a.x);}});
test('taut exact and positive slack including vertical domain',()=>{for(const b of[{x:600,y:800},{x:0,y:1000},{x:1000,y:0}]){let p=compileCatenary(spec({x:0,y:0},b,1000));assert.equal(p.kind,'taut');near(sampleCatenary(p,.4).position.y,b.y*.4);}let p=compileCatenary(spec({x:0,y:0},{x:1000,y:0},1000+1e-8));assert.equal(p.kind,'catenary');assert.equal(p.tautLengthError,0);let p2=compileCatenary(spec({x:0,y:0},{x:1000,y:0},1000+.00001));assert.equal(p2.kind,'catenary');assert.ok(sampleCatenary(p2,.5).position.y>0);});
test('invalid length, vertical slack, coincident, unknown and nonfinite rejected',()=>{for(const s of[spec({x:0,y:0},{x:800,y:0},799),spec({x:0,y:0},{x:0,y:800},1000),spec({x:0,y:0},{x:0,y:0},1000),spec({x:0,y:0},{x:800,y:0},30000),{...spec(),extra:1},spec(undefined,undefined,NaN),spec(undefined,undefined,1000,{x:0,y:0})])assert.throws(()=>compileCatenary(s));const hidden=spec();Object.defineProperty(hidden,'hidden',{value:1});assert.throws(()=>compileCatenary(hidden));assert.throws(()=>sampleCatenary(JSON.parse(JSON.stringify(compileCatenary(spec()))),.5));for(const f of[-1,2,NaN,null])assert.throws(()=>sampleCatenary(compileCatenary(spec()),f));});
test('detached deep freeze, random seek is deterministic',()=>{const s=spec(),p=compileCatenary(s);s.from.x=100;assert.equal(p.from.x,0);assert.ok(Object.isFrozen(p.from));const seq=[.1,.7,.22,1,0,.5],baseline=seq.map(x=>sampleCatenary(p,x));for(const i of[4,1,5,0,3,2])assert.deepEqual(sampleCatenary(p,seq[i]),baseline[i]);assert.throws(()=>sampleCatenaryPolyline(p,{segments:1}));});
test('positive slack at one ULP never becomes taut; old threshold continuous',()=>{
 const c=999999,ls=[c+2**-33,c+.0000999998,c+.0001000002];
 const ps=ls.map(l=>compileCatenary(spec({x:0,y:0},{x:c,y:0},l)));
 for(const p of ps){assert.equal(p.kind,'catenary');const s=sampleCatenary(p,.5);assert.ok(s.position.y>0);near(s.position.x,c/2,1e-8);near(s.position.y,Math.sqrt(3*c*(p.length-c)/8),1e-6);}
 assert.ok(Math.abs(sampleCatenary(ps[1],.5).position.y-sampleCatenary(ps[2],.5).position.y)<.0001);
});
test('stable near-taut tilted inversion and midpoint branch continuity',()=>{
 for(const [x,y] of [[600000,800000-2],[.0001,.99999999],[700,200],[-700,200]]){
  const c=Math.hypot(x,y),L=c*(1+2e-14),p=compileCatenary(spec({x:0,y:0},{x,y},L));
  for(const q of [1e-12,.1,.499999999999,.5,.500000000001,.9,1-1e-12]){const s=sampleCatenary(p,q);assert.ok(Number.isFinite(s.position.x));near(Math.hypot(s.tangent.x,s.tangent.y),1,1e-14);near(s.position.x,q*x,Math.sqrt(c*(L-c))*3+1e-8);}
  const a=sampleCatenary(p,.5-1e-12),b=sampleCatenary(p,.5+1e-12);assert.ok(Math.hypot(a.position.x-b.position.x,a.position.y-b.position.y)<L*1e-10+1e-9);
 }
});
test('series boundary is not a geometric classification boundary',()=>{
 for(const u of [1-1e-10,1,1+1e-10]){const p=compileCatenary(spec({x:0,y:0},{x:100,y:0},100*Math.sinh(u)/u));near(p.u,u,2e-15);near(sampleCatenary(p,.5).position.y,50/u*(Math.cosh(u)-1),1e-12);}
});
test('gravity threshold and strict own keys; explicit bounded sampling',()=>{
 assert.throws(()=>compileCatenary(spec(undefined,undefined,1000,{x:0,y:1e-13})));
 assert.equal(compileCatenary(spec(undefined,undefined,1000,{x:0,y:1e-12})).gravity.y,1);
 for(const key of [Symbol('extra'),'extra']){const s=spec();Object.defineProperty(s,key,{value:1});assert.throws(()=>compileCatenary(s));}
 assert.throws(()=>compileCatenary(Object.create(spec())));
 const p=compileCatenary(spec());for(const segments of [0,1,4097,2.5,NaN])assert.throws(()=>sampleCatenaryPolyline(p,{segments}));
 assert.equal(sampleCatenaryPolyline(p,{segments:4096}).length,4097);
});
test('module brand isolation and fresh-process deterministic seek',async()=>{
 const {execFileSync}=await import('node:child_process');const url=new URL('../lib/foundations/geometry/catenary.mjs',import.meta.url).href;
 const p=compileCatenary(spec()),other=await import(url+'?isolated');assert.throws(()=>other.sampleCatenary(p,.5));
 const code=`import{compileCatenary,sampleCatenary}from ${JSON.stringify(url)};const p=compileCatenary(${JSON.stringify(spec())});console.log(JSON.stringify([.9,0,.5,1,.1].map(q=>sampleCatenary(p,q))));`;
 assert.deepEqual(JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'})),[.9,0,.5,1,.1].map(q=>sampleCatenary(p,q)));
});
test('arbitrary gravity rotation and positive-ULP large-coordinate finite outputs',()=>{
 for(let i=1;i<=48;i++){
  const angle=i*.17,c=Math.cos(angle),s=Math.sin(angle),rotate=p=>({x:p.x*c-p.y*s,y:p.x*s+p.y*c});
  const p=compileCatenary(spec({x:0,y:0},{x:700,y:200},900));
  const r=compileCatenary(spec(rotate({x:0,y:0}),rotate({x:700,y:200}),900,rotate({x:0,y:1})));
  for(const q of [.01,.25,.5,.75,.99]){const a=rotate(sampleCatenary(p,q).position),b=sampleCatenary(r,q).position;near(a.x,b.x,1e-9);near(a.y,b.y,1e-9);}
  const from={x:-12345,y:23456},to={x:from.x+900000*c,y:from.y+900000*s},chord=Math.hypot(to.x-from.x,to.y-from.y);
  const large=compileCatenary(spec(from,to,chord+2**-33,{x:Math.cos(i*.019),y:Math.sin(i*.019)}));assert.equal(large.kind,'catenary');
  for(const q of [.001,.5,.999]){const a=sampleCatenary(large,q);assert.ok(Number.isFinite(a.position.x)&&Number.isFinite(a.position.y));near(Math.hypot(a.tangent.x,a.tangent.y),1,1e-14);}
 }
});
test('near-vertical half-address switch has bounded observed rounding seam, not exact continuity',()=>{
 for(const [x,y,length,observedGate] of [[101,999998,999998.00520051,2e-7],[109.99978,999998,999998.0060499889,2e-6]]){
  const p=compileCatenary(spec({x:0,y:0},{x,y},length));
  const a=sampleCatenary(p,.5),b=sampleCatenary(p,.5+Number.EPSILON/2);
  const seam=Math.hypot(a.position.x-b.position.x,a.position.y-b.position.y);
  assert.ok(seam<observedGate,`${seam} exceeds fixture gate ${observedGate}`);
  assert.equal(p.analyticLength,length);
  // This diagnostic is not an exact measured length of the sampled curve.
  assert.notEqual(p.a*(Math.sinh(p.z1)-Math.sinh(p.z0)),p.analyticLength);
  near(Math.hypot(a.tangent.x,a.tangent.y),1,1e-14);
 }
});
