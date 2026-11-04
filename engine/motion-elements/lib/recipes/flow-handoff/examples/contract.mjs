import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='recipe.flow-handoff');
assert(item);
const plan=api.compileFlowHandoff(item.example),q=n=>({n:String(n),d:'1'});assert.equal(api.sampleFlowHandoff(plan,q(0)).flow.links[0].value,40);const middle=api.sampleFlowHandoff(plan,q(1));assert.equal(middle.flow.links[0].value,50);assert.equal(middle.progress,.5);assert.equal(api.sampleFlowHandoff(plan,q(2)).flow.links[0].value,60);
const reduced=api.sampleFlowHandoff(plan,q(1),{reducedMotion:true});assert.equal(reduced.flow.links[0].value,60);assert.equal(reduced.progress,.5);assert.deepEqual(middle,api.sampleFlowHandoff(plan,q(1)));assert.throws(()=>api.sampleFlowHandoff({...plan},q(0)));
console.log('recipe.flow-handoff contract PASS');
