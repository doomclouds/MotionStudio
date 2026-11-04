import test from 'node:test';import assert from 'node:assert/strict';import {compileStagger,rational as q} from '../../../../index.mjs';
const input={itemIds:['a','b','c'],start:q(1,3),duration:q(2,3),step:q(1,6)};
test('stagger rational oracle, detached times and invalid duration/overflow',()=>{
 const a=compileStagger(input);assert.deepEqual(a.map(x=>x.range.start),[q(1,3),q(1,2),q(2,3)]);assert.deepEqual(a[2].range.end,q(4,3));
 for(const patch of [{duration:q(0)},{step:q(-1)},{start:q(86400)},{itemIds:['a','a']}])assert.throws(()=>compileStagger({...input,...patch}));
 const copy=structuredClone(input);const out=compileStagger(copy);copy.start.n='99';assert.deepEqual(out,a);assert(Object.isFrozen(out[0].range));
});
