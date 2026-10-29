import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {sampleKeyframeTrack as sample} from '../lib/keyframe-track.mjs';
import {rational as T} from '../lib/time.mjs';
const spec={range:{start:T(1),end:T(5)},params:{knots:[{at:0,value:0,interpolation:'hold'},{at:.25,value:20,interpolation:'linear'},{at:.75,value:-10,interpolation:'hold'},{at:1,value:40,interpolation:'linear'}]}};
test('exact knot semantics, holds, before/end clamps and scalar interpolation',()=>{
 const at=(n,d=1)=>sample(spec,T(n,d));
 assert.equal(at(0).phase,'before');assert.equal(at(0).value,0);assert.equal(at(3,2).value,0);
 assert.equal(at(2).value,20);assert.equal(at(3).value,5);assert.equal(at(4).value,-10);assert.equal(at(9,2).value,-10);
 assert.equal(at(5).value,40);assert.equal(at(5).phase,'after');assert.equal(at(99).value,40);
});
test('reverse/seek determinism, input isolation, deep freeze, reduced preserves clock',()=>{
 const before=structuredClone(spec),times=[0,1,2,3,4,5,8],states=times.map(t=>sample(spec,T(t)));
 for(const t of [8,4,0,3,5,1,2])assert.deepEqual(sample(spec,T(t)),states[times.indexOf(t)]);
 assert.deepEqual(spec,before);assert.ok(Object.isFrozen(states[0]));
 const state=sample(spec,T(3),{reducedMotion:true});assert.equal(state.value,40);assert.equal(state.progress,.5);assert.equal(state.phase,'active');
});
test('strict scalar track fields and finite ordered complete knots',()=>{
 for(const bad of [null,[],{}, {...spec,unknown:1},{...spec,[Symbol('x')]:1}])assert.throws(()=>sample(bad,T(2)));
 for(const key of ['range','params']){const s=structuredClone(spec);delete s[key];assert.throws(()=>sample(s,T(2)));assert.throws(()=>sample({...spec,[key]:null},T(2)));}
 for(const p of [null,{}, {knots:null},{knots:[]},{knots:Array(2)},{knots:spec.params.knots,extra:1}])assert.throws(()=>sample({...spec,params:p},T(2)));
 for(const context of [null,{reducedMotion:null},{reducedMotion:1},{unknown:1}])assert.throws(()=>sample(spec,T(2),context));
 for(const patch of [{at:NaN},{value:Infinity},{interpolation:'ease'},{at:-.1},{value:null},{bad:1},{[Symbol('x')]:1}]){const s=structuredClone(spec);s.params.knots[1]={...s.params.knots[1],...patch};assert.throws(()=>sample(s,T(2)));}
 for(const key of ['at','value','interpolation']){const s=structuredClone(spec);delete s.params.knots[1][key];assert.throws(()=>sample(s,T(2)));}
 for(const mutate of [k=>k[0].at=.1,k=>k.at(-1).at=.9,k=>k[1].at=0,k=>k.extra=1,k=>k[Symbol('x')]=1]){const s=structuredClone(spec);mutate(s.params.knots);assert.throws(()=>sample(s,T(2)));}
 for(const range of [{start:T(0),end:T(0)},{start:T(-1),end:T(1)},{start:T(0),end:T(86401)}])assert.throws(()=>sample({...spec,range},T(0)));
 assert.throws(()=>sample(spec,{n:2,d:1}));
});
test('minimum and maximum knot counts are bounded and endpoint exact',()=>{
 for(const count of [2,256]){const knots=Array.from({length:count},(_,i)=>({at:i/(count-1),value:i%2?-1e9:1e9,interpolation:'linear'}));const s={...spec,params:{knots}};assert.equal(sample(s,T(5)).value,knots.at(-1).value);}
 const knots=Array.from({length:257},(_,i)=>({at:i/256,value:0,interpolation:'linear'}));assert.throws(()=>sample({...spec,params:{knots}},T(2)));
});
test('separate process evaluates the same keyframe sequence',()=>{
 const url=new URL('../lib/keyframe-track.mjs',import.meta.url).href;
 const code=`import {sampleKeyframeTrack as s} from ${JSON.stringify(url)};console.log(JSON.stringify([0,2,3,5].map(n=>s(${JSON.stringify(spec)},{n:String(n),d:'1'}))));`;
 const run=()=>spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});const a=run(),b=run();assert.equal(a.status,0,a.stderr);assert.equal(a.stdout,b.stdout);
});
test('rational times infinitesimally before hold boundaries do not jump early',()=>{
 const s={range:{start:T(0),end:T(1)},params:{knots:[{at:0,value:0,interpolation:'hold'},{at:.5,value:5,interpolation:'hold'},{at:1,value:10,interpolation:'hold'}]}};
 assert.equal(sample(s,T('499999999999999999','1000000000000000000')).value,0);
 assert.equal(sample(s,T(1,2)).value,5);
 const nearEnd=sample(s,T('999999999999999999','1000000000000000000'));
 assert.equal(nearEnd.phase,'active');assert.equal(nearEnd.value,5);assert.equal(sample(s,T(1)).value,10);
 const shifted={...s,range:{start:T(1),end:T(3)}};
 assert.equal(sample(shifted,T('1999999999999999999','1000000000000000000')).value,0);
 assert.equal(sample(shifted,T(2)).value,5);
 const tiny={range:s.range,params:{knots:[{at:0,value:0,interpolation:'hold'},{at:1e-100,value:5,interpolation:'hold'},{at:1,value:10,interpolation:'hold'}]}};
 assert.equal(sample(tiny,T(0)).value,0);assert.equal(sample(tiny,T(1,'100000000000000000000000000000')).value,5);
});
test('nearby decimal knots use exact local differences before float interpolation',()=>{
 const s={range:{start:T(0),end:T(1)},params:{knots:[
  {at:0,value:-100,interpolation:'linear'},
  {at:.9999999999999998,value:0,interpolation:'linear'},
  {at:.9999999999999999,value:100,interpolation:'linear'},
  {at:1,value:200,interpolation:'hold'},
 ]}};
 for(const [n,value] of [['9999999999999998',0],['999999999999999825',25],['99999999999999985',50],['999999999999999875',75],['9999999999999999',100]]){
  assert.equal(sample(s,T(n,'1'+'0'.repeat(n.length))).value,value);
 }
 const shifted={...s,range:{start:T(1),end:T(3)}};
 assert.equal(sample(shifted,T('29999999999999997','10000000000000000')).value,50);
 assert.equal(sample(s,T(1)).value,200);
});
test('subnormal decimal knots do not overflow local ratio conversion',()=>{
 const s={range:{start:T(0),end:T(1)},params:{knots:[
  {at:0,value:0,interpolation:'linear'},
  {at:Number.MIN_VALUE,value:0,interpolation:'linear'},
  {at:1,value:100,interpolation:'linear'},
 ]}};
 const value=sample(s,T(1,'100000000000000000000000000000')).value;
 assert.ok(Number.isFinite(value));assert.ok(Math.abs(value-1e-27)<1e-42);
 assert.equal(sample(s,T(0)).value,0);assert.equal(sample(s,T(1)).value,100);
});
