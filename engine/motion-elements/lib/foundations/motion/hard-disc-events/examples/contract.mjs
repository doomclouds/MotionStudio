import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='motion.hard-disc-isolated-events');
assert(item);
const plan = api.compileHardDiscs(item.example);
const sample = time => api.sampleHardDiscs(plan, {time});
// Equal masses: initial gap260 at speed100 gives contact at2.6s.
assert.equal(sample(0).discs[0].x,100);
const end=sample(3).discs;
assert(Math.abs(end[0].x-360)<1e-10);
assert(Math.abs(end[1].x-440)<1e-10);
assert.equal(end[0].vx,0); assert.equal(end[1].vx,100);
assert.deepEqual(sample(0),sample(0));
assert.throws(()=>sample(4));
assert.throws(()=>api.compileHardDiscs({...item.example,maxEvents:0}));
console.log('motion.hard-disc-isolated-events contract PASS');
