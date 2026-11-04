import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {sampleOffsetReassembly,rational as q} from '../../../index.mjs';
const spec=JSON.parse(readFileSync(new URL('../../../../catalog.json',import.meta.url))).elements.find(e=>e.id==='recipe.offset-reassembly').example;
test('reassembly zero remaining duration rejects; parent applied once; stateless seek',()=>{
 assert.throws(()=>sampleOffsetReassembly({...spec,params:{...spec.params,step:q(1)}},q(0)));
 const a=sampleOffsetReassembly(spec,q(2)),b=sampleOffsetReassembly(spec,q(2),{parentMatrix:[1,0,0,1,7,11]});
 for(let i=0;i<a.length;i++){assert.equal(b[i].matrix[4],a[i].matrix[4]+7);assert.equal(b[i].matrix[5],a[i].matrix[5]+11);}
 sampleOffsetReassembly(spec,q(0));assert.deepEqual(sampleOffsetReassembly(spec,q(2)),a);assert(a.every(x=>Object.isFrozen(x.geometryBounds)));
});

test('reduced reassembly holds final spatial layout but retains authored opacity timing',()=>{
 const before=sampleOffsetReassembly(spec,q(0),{reducedMotion:true}),end=sampleOffsetReassembly(spec,q(2));
 for(let i=0;i<before.length;i++){assert.deepEqual(before[i].matrix,end[i].matrix);assert.equal(before[i].opacity,0);}
});
