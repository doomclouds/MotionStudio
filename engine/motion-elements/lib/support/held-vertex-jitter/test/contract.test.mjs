import test from 'node:test';import assert from 'node:assert/strict';
import {compileHeldVertexJitter,sampleHeldVertexJitter} from '../index.mjs';
import {plans,cases,sampledExamples} from '../examples/contract.mjs';
test('held offsets, bound, endpoints, closed seam and repeat/seek determinism',()=>{
 for(let c=0;c<plans.length;c++){
  const p=plans[c];assert.deepEqual(sampleHeldVertexJitter(p,0),sampleHeldVertexJitter(p,p.holdFrames-1));assert.notDeepEqual(sampleHeldVertexJitter(p,0),sampleHeldVertexJitter(p,p.holdFrames));
  const seen=new Map();for(const f of [0,7,12,2,101,7,0]){const a=sampleHeldVertexJitter(p,f);if(seen.has(f))assert.deepEqual(a,seen.get(f));seen.set(f,a);
   a.points.forEach((q,i)=>{assert.ok(Math.abs(q.x-p.points[i].x)<=p.amplitude);assert.ok(Math.abs(q.y-p.points[i].y)<=p.amplitude);});
   if(p.lockEndpoints){assert.deepEqual(a.points[0],p.points[0]);assert.deepEqual(a.points.at(-1),p.points.at(-1));}if(p.closed)assert.deepEqual(a.points[0],a.points.at(-1));
  }
 }
 assert.notDeepEqual(sampledExamples(7)[0].points,sampledExamples(7)[1].points);
});
test('zero amplitude, immutable copied input and strict invalid inputs',()=>{
 const spec=structuredClone(cases[0]),p=compileHeldVertexJitter({...spec,amplitude:0});spec.points[0].x=99;
 assert.deepEqual(sampleHeldVertexJitter(p,17).points,cases[0].points);assert.ok(Object.isFrozen(p.points[0]));assert.ok(Object.isFrozen(sampleHeldVertexJitter(p,0).points));
 for(const bad of [{amplitude:-1},{holdFrames:0},{holdFrames:1.2},{seed:1},{lockEndpoints:1},{extra:1}])assert.throws(()=>compileHeldVertexJitter({...cases[0],...bad}));
 assert.throws(()=>compileHeldVertexJitter({points:[{x:999999,y:0},{x:1000000,y:0},{x:999999,y:1}],seed:'edge',amplitude:100,lockEndpoints:false}),/reserve amplitude/);
 for(const f of [-1,.5,NaN,1e9+1])assert.throws(()=>sampleHeldVertexJitter(p,f));assert.throws(()=>sampleHeldVertexJitter({...p},0));
 let reads=0;assert.throws(()=>compileHeldVertexJitter({points:cases[0].points,get seed(){reads++;return 's';}}));assert.equal(reads,0);
});
