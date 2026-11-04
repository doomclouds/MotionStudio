import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='composition.poisson-disc');
assert(item);
const output=api.samplePoissonDisc(item.example);
assert.deepEqual(output,api.samplePoissonDisc(item.example));
assert(output.points.length>0 && output.points.length<=item.example.maxPoints);
for(const [i,p] of output.points.entries()) {
 assert(Math.hypot(p.x-item.example.domain.x,p.y-item.example.domain.y)<=item.example.domain.radius+1e-9);
 for(const q of output.points.slice(0,i)) assert(Math.hypot(p.x-q.x,p.y-q.y)>=item.example.minDistance-1e-9);
}
assert.throws(()=>api.samplePoissonDisc({...item.example,minDistance:0}));
const one=api.samplePoissonDisc({...item.example,minDistance:201});
assert.equal(one.points.length,1);assert.equal(one.termination,'active-list-exhausted');
console.log('composition.poisson-disc contract PASS');
