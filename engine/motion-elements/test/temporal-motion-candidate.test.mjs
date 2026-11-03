import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleTemporalMotion as sample} from '../lib/support/temporal-motion-candidate.mjs';
const near=(a,b,e=1e-8)=>assert(Math.abs(a-b)<e,`${a} != ${b}`);
const options=(fn,t=1)=>({time:t,history:.2,samples:7,velocityStep:.01,samplePosition:fn});
test('constant speed in different directions uses seconds, not frames',()=>{
 for(const [vx,vy] of [[0,0],[100,0],[-30,40],[20,-70]]){
  const s=sample(options(t=>({x:3+vx*t,y:7+vy*t})));
  near(s.velocity.x,vx);near(s.velocity.y,vy);near(s.velocity.speed,Math.hypot(vx,vy));
  s.points.forEach(p=>{near(p.x,3+vx*p.time);near(p.y,7+vy*p.time);});
 }
});
test('accelerated and circular trajectories match independent backward secants',()=>{
 const a=sample(options(t=>({x:40*t*t,y:-10*t*t})));near(a.velocity.x,79.6);near(a.velocity.y,-19.9);
 const c=sample(options(t=>({x:90*Math.cos(t),y:90*Math.sin(t)})));
 near(c.velocity.x,90*(Math.cos(1)-Math.cos(.99))/.01);near(c.velocity.y,90*(Math.sin(1)-Math.sin(.99))/.01);
 assert(c.points.some(p=>p.y!==c.points[0].y));
});
test('rebound retains actual history on both sides, rather than head-minus-velocity extrapolation',()=>{
 const triangle=t=>({x:100*(1-Math.abs(t-1)),y:0});
 const s=sample({...options(triangle,1.05),history:.2,samples:5});
 near(s.velocity.x,-100);assert(s.points[1].x>s.points[0].x);assert(s.points.at(-1).x<s.points[0].x);
});
test('clamp-start duplicates are retained but callbacks deduplicate',()=>{
 let calls=0;const fn=t=>{calls++;return {x:t,y:t};};
 const zero=sample(options(fn,0));assert.equal(calls,1);assert.equal(zero.evaluations,1);assert.equal(zero.velocity.speed,0);assert(zero.points.every(p=>p.time===0));
 const early=sample(options(fn,.005));near(early.velocity.x,1);near(early.velocity.interval,.005);
});
test('bounded callback work, copied scratch points, frozen output and out-of-order repeatability',()=>{
 const scratch={x:0,y:0};let calls=0;
 const fn=t=>{calls++;scratch.x=t*8;scratch.y=t*t;return scratch;};
 const args={...options(fn),samples:32,history:.173};const first=sample(args);assert(calls<=33);scratch.x=999;
 assert.equal(first.points[0].x,8);assert(Object.isFrozen(first));assert(Object.isFrozen(first.points));assert(Object.isFrozen(first.points[0]));assert(Object.isFrozen(first.velocity));
 sample(options(fn,2));assert.deepEqual(sample(args),first);
});
test('validation precedes provider callbacks; malformed outputs and non-data fields fail',()=>{
 let calls=0;const base=options(()=>{calls++;return {x:0,y:0};});
 for(const patch of [{time:-1},{time:3601},{time:NaN},{history:0},{history:11},{samples:33},{samples:2.5},{velocityStep:0},{velocityStep:Infinity},{samplePosition:4},{extra:1}])assert.throws(()=>sample({...base,...patch}));
 assert.equal(calls,0);
 const input={...base};Object.defineProperty(input,'time',{get(){throw Error('getter invoked');}});assert.throws(()=>sample(input),/data fields/);
 for(const p of [{x:Infinity,y:0},{x:0,y:1e7},{x:0},{x:0,y:0,z:0},[0,0]])assert.throws(()=>sample(options(()=>p)));
 const p={y:0};Object.defineProperty(p,'x',{enumerable:true,get(){throw Error('getter invoked');}});assert.throws(()=>sample(options(()=>p)),/data fields/);
});
test('resource extremes stay finite; quantized zero and stationary angles are explicit',()=>{
 const s=sample({time:3600,history:10,samples:32,velocityStep:1e-6,samplePosition:t=>({x:t===3600?1e6:-1e6,y:t===3600?-1e6:1e6})});assert(Number.isFinite(s.velocity.speed));assert(s.evaluations<=33);
 const stationary=sample(options(()=>({x:1,y:2})));assert.equal(stationary.velocity.angle,0);
});
test('null-prototype data is accepted, symbols and inherited/custom fields are rejected',()=>{
 const input=Object.assign(Object.create(null),options(t=>Object.assign(Object.create(null),{x:t,y:0})));
 near(sample(input).velocity.x,1);
 const symbol=options(()=>({x:0,y:0}));symbol[Symbol('extra')]=true;assert.throws(()=>sample(symbol));
 class Point {constructor(){this.x=0;this.y=0;}}
 assert.throws(()=>sample(options(()=>new Point())));
});
test('changing sample count changes density, not endpoint time or velocity',()=>{
 const f=t=>({x:Math.sin(3*t)*100,y:t*t});
 const a=sample({...options(f),samples:2}),b=sample({...options(f),samples:32});
 assert.deepEqual(a.points[0],b.points[0]);assert.deepEqual(a.points.at(-1),b.points.at(-1));assert.deepEqual(a.velocity,b.velocity);
});
test('exact minimum positive time and discontinuous positions reject nonfinite derived velocity',()=>{
 for(const time of [Number.MIN_VALUE,1e-320]){
  assert.throws(()=>sample(options(t=>({x:t===0?0:1,y:0}),time)),/derived velocity must be finite/);
  assert.throws(()=>sample(options(t=>({x:0,y:t===0?0:-1}),time)),/derived velocity must be finite/);
  const stationary=sample(options(()=>({x:1,y:-1}),time));assert.equal(stationary.velocity.speed,0);assert.equal(stationary.velocity.interval,time);
 }
 // Components can be finite while their Euclidean magnitude overflows.
 assert.throws(()=>sample(options(t=>({x:t===0?0:1e6,y:t===0?0:1e6}),7e-303)),/derived velocity must be finite/);
 // A finite discontinuity is not silently repaired or treated as physical velocity.
 const finite=sample(options(t=>({x:t===0?0:1,y:0}),1e-6));assert.equal(finite.velocity.x,1e6);
});
