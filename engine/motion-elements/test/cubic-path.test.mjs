import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {compileCubicPath,sampleCubicPath} from '../lib/foundations/geometry/cubic-path.mjs';
const P=(x,y=0)=>({x,y});
const segment=(p0,p1,p2,p3)=>({p0,p1,p2,p3});
const line=segment(P(0),P(100/3),P(200/3),P(100));
const cubic=segment(P(0),P(0),P(0),P(100));
const definition=(segments=[line],tolerance=.001)=>({segments,tolerance});
const close=(a,b,epsilon=1e-10)=>assert.ok(Math.abs(a-b)<=epsilon,`${a} differs from ${b} by ${Math.abs(a-b)}`);
const route=[segment(P(40,260),P(280,260),P(160,-120),P(560,-120)),segment(P(560,-120),P(840,-120),P(920,180),P(1160,180))];

test('cubic path has exact authored endpoints and distances on a uniform straight line',()=>{
 const p=compileCubicPath(definition());close(p.totalLength,100);assert.equal(p.approximation.leafCount,1);
 for(const q of [0,.1,.5,.9,1]){const s=sampleCubicPath(p,q);close(s.position.x,100*q);close(s.position.y,0);close(s.parameter,q);close(s.distance,100*q);assert.deepEqual(s.unitTangent,P(1));assert.equal(s.angle,0);assert.equal(s.tangentDefined,true);}
 assert.ok(Object.isFrozen(p));assert.ok(Object.isFrozen(p.segments[0].p0));assert.ok(Object.isFrozen(sampleCubicPath(p,.5).unitTangent));
});

test('straight nonuniform t-cubed curve is addressed by approximate travel distance, not linear t',()=>{
 const p=compileCubicPath(definition([cubic]));assert.ok(p.approximation.leafCount>1);close(p.totalLength,100);
 for(let i=0;i<=100;i++){const s=sampleCubicPath(p,i/100);close(s.position.x,i,.001);close(s.parameter,Math.cbrt(i/100),i===0?0:.004);}
 const halfway=sampleCubicPath(p,.5);assert.ok(halfway.position.x>49.999&&halfway.position.x<50.001);assert.ok(halfway.parameter>.79&&halfway.parameter<.80);
 assert.deepEqual(sampleCubicPath(p,0).unitTangent,P(1));
 const reversed=segment(P(100),P(0),P(0),P(0)),rp=compileCubicPath(definition([reversed]));
 close(sampleCubicPath(rp,.5).position.x,50,.001);assert.deepEqual(sampleCubicPath(rp,1).unitTangent,P(-1));
});

test('two segment join selects outgoing tangent, final endpoint uses incoming tangent',()=>{
 const vertical=segment(P(100),P(100,100/3),P(100,200/3),P(100,100));
 const p=compileCubicPath(definition([line,vertical]));close(p.totalLength,200);
 const s=sampleCubicPath(p,.5);assert.equal(s.segmentIndex,1);assert.equal(s.parameter,0);assert.deepEqual(s.position,P(100));assert.deepEqual(s.unitTangent,P(0,1));
 const end=sampleCubicPath(p,1);assert.equal(end.segmentIndex,1);assert.equal(end.parameter,1);assert.deepEqual(end.position,P(100,100));
});

test('looping and retracing curves are not mistaken for zero-length endpoint chords',()=>{
 const loop=compileCubicPath(definition([segment(P(0),P(100,100),P(-100,100),P(0))]));assert.ok(loop.totalLength>200);assert.deepEqual(sampleCubicPath(loop,0).position,sampleCubicPath(loop,1).position);assert.ok(sampleCubicPath(loop,.5).position.y>70);
 const retrace=compileCubicPath(definition([segment(P(0),P(100),P(-100),P(0))]));assert.ok(retrace.totalLength>100);assert.ok(sampleCubicPath(retrace,.25).position.x>20);assert.ok(sampleCubicPath(retrace,.75).position.x< -20);
});

test('interior stationary derivative is explicit, not borrowed from previous samples',()=>{
 // Symmetric turnaround at t=.5, with unequal endpoints avoided by an exact symmetric route.
 const p=compileCubicPath(definition([segment(P(0),P(100),P(100),P(0))]));
 close(p.totalLength,150);const s=sampleCubicPath(p,.5);assert.equal(s.parameter,.5);assert.deepEqual(s.position,P(75));assert.equal(s.tangentDefined,false);assert.equal(s.unitTangent,null);assert.equal(s.angle,null);
 sampleCubicPath(p,.9);sampleCubicPath(p,.1);assert.deepEqual(sampleCubicPath(p,.5),s);
});

test('diagnostics satisfy declared stopping request, finite resource cap is explicit',()=>{
 for(const tolerance of [.001,.01,1]){
  const p=compileCubicPath(definition(route,tolerance));assert.ok(p.approximation.lengthBracketGap<=tolerance);assert.ok(p.approximation.maxParameterDeviation<=tolerance);assert.ok(p.approximation.leafCount<=32768);assert.ok(p.totalLength>1100&&p.totalLength<1600);
 }
 const extreme=segment(P(-16384,-16384),P(16384,16384),P(-16384,16384),P(-16384,-16384));
 assert.throws(()=>compileCubicPath(definition(Array.from({length:16},()=>extreme))),/subdivision.*limit/);
});

test('input is copied and deep frozen; independent plans and shuffled samples are deterministic',()=>{
 const input=definition(structuredClone(route),.01),a=compileCubicPath(input),b=compileCubicPath(input);
 input.segments[0].p1.x=1;input.tolerance=1;assert.deepEqual(a,b);assert.notEqual(a,b);
 const qs=[0,.0001,.02,.25,.5,.75,.999,1],states=qs.map(q=>sampleCubicPath(a,q));
 for(const i of [7,3,0,6,2,5,1,4,3]){assert.deepEqual(sampleCubicPath(a,qs[i]),states[i]);assert.deepEqual(sampleCubicPath(b,qs[i]),states[i]);}
 assert.throws(()=>{a.segments[0].p0.x=4;},TypeError);
});

test('strict required shapes, own keys, numeric limits and continuous endpoints',()=>{
 const bad=[null,undefined,{},definition([],1),definition([line],0),definition([line],1.01),definition([line],NaN),definition([line],null),{...definition(),extra:1},definition([{...line,p0:P(Infinity)}]),definition([{...line,p3:P(16384.01)}]),definition([{...line,p0:{x:0}}]),definition([{...line,extra:1}]),definition([{p0:P(0),p1:P(0),p2:P(0),p3:P(0)}]),definition([segment(P(0),P(0),P(0),P(1e-7))]),definition([line,{...line,p0:P(100.00001)}]),definition(Array(2))];
 for(const x of bad)assert.throws(()=>compileCubicPath(x));
 for(const value of [-.1,1.1,NaN,Infinity,null,undefined,'0',{}])assert.throws(()=>sampleCubicPath(compileCubicPath(definition()),value));
 const array=[line];array.extra=true;assert.throws(()=>compileCubicPath(definition(array)),/array field/);
 for(const key of [Symbol('extra'),'hidden']){
  const extra=x=>Object.defineProperty({...x},key,{value:1,enumerable:false});
  assert.throws(()=>compileCubicPath(extra(definition())));
  assert.throws(()=>compileCubicPath(definition([extra(line)])));
  assert.throws(()=>compileCubicPath(definition([{...line,p0:extra(line.p0)}])));
  const a=[line];Object.defineProperty(a,key,{value:1});assert.throws(()=>compileCubicPath(definition(a)));
 }
});

test('forged and foreign-module plans reject; null-prototype records remain accepted',async()=>{
 const p=compileCubicPath(definition());for(const forged of [null,{},structuredClone(p),{...p}])assert.throws(()=>sampleCubicPath(forged,.5),/module instance/);
 const foreign=await import('../lib/foundations/geometry/cubic-path.mjs?independent-cubic-brand');assert.throws(()=>foreign.sampleCubicPath(p,.5));assert.throws(()=>sampleCubicPath(foreign.compileCubicPath(definition()),.5));
 const plainNull=x=>Object.assign(Object.create(null),x);
 const s=Object.fromEntries(Object.entries(line).map(([k,v])=>[k,plainNull(v)]));
 assert.deepEqual(compileCubicPath(plainNull({segments:[plainNull(s)],tolerance:.001})),p);
});

test('synthetic two-segment route and authored flattening remain deterministic over 720 samples',()=>{
 let largestLeaves=0;
 for(let f=0;f<720;f++){
  const u=f/719;
  const segments=route.map(s=>Object.fromEntries(Object.entries(s).map(([key,p])=>[key,{x:p.x,y:p.y+(200-p.y)*u}])));
  const p=compileCubicPath(definition(segments,.02));largestLeaves=Math.max(largestLeaves,p.approximation.leafCount);
  for(const q of [0,.15,.5,.9,1]){const a=sampleCubicPath(p,q);assert.ok(a.tangentDefined);assert.ok(a.parameter>=0&&a.parameter<=1);assert.ok(Math.abs(Math.hypot(a.unitTangent.x,a.unitTangent.y)-1)<1e-14);assert.deepEqual(a,sampleCubicPath(p,q));}
  if(f===719){close(p.totalLength,1120,1e-8);for(const q of [.1,.5,.9])close(sampleCubicPath(p,q).position.x,40+1120*q,.02);}
 }
 assert.ok(largestLeaves<2000);
});

test('fresh Node processes reproduce complete output states',()=>{
 const url=new URL('../lib/foundations/geometry/cubic-path.mjs',import.meta.url).href;
 const code=`import {compileCubicPath,sampleCubicPath} from ${JSON.stringify(url)};const p=compileCubicPath(${JSON.stringify(definition(route,.02))});console.log(JSON.stringify({p,s:[0,.2,.5,.8,1].map(q=>sampleCubicPath(p,q))}));`;
 const a=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'}),b=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});
 assert.equal(a.status,0,a.stderr);assert.equal(b.status,0,b.stderr);assert.equal(a.stdout,b.stdout);
 const p=compileCubicPath(definition(route,.02));assert.deepEqual(JSON.parse(a.stdout),JSON.parse(JSON.stringify({p,s:[0,.2,.5,.8,1].map(q=>sampleCubicPath(p,q))})));
});

test('unresolvable subdivision and cumulative distance rounding reject rather than loop or lose a segment',()=>{
 const subUlpLoop=segment(P(8192),P(8192+2**-39),P(8192-2**-39),P(8192));
 assert.throws(()=>compileCubicPath(definition([subUlpLoop])),/depth limit/);
 const long=segment(P(-16384),P(-16384+32768/3),P(-16384+65536/3),P(16384));
 const tiny=segment(P(16384),P(16384),P(16384),P(16384-2**-39));
 assert.throws(()=>compileCubicPath(definition([long,tiny])),/cumulative distance is not representable/);
});

test('array subclasses and cross-realm records/arrays are not silently accepted',async()=>{
 const {runInNewContext}=await import('node:vm');
 class Segments extends Array {}
 assert.throws(()=>compileCubicPath(definition(new Segments(line))),/ordinary dense/);
 const foreignArray=runInNewContext(JSON.stringify([line]));
 assert.throws(()=>compileCubicPath(definition(foreignArray)),/ordinary dense/);
 const foreignPoint=runInNewContext('({x:0,y:0})');
 assert.throws(()=>compileCubicPath(definition([{...line,p0:foreignPoint}])),/plain object/);
});
