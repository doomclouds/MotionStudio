import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='recipe.layout-handoff');
assert(item);
const plan=api.compileLayoutHandoff(item.example),q=n=>({n:String(n),d:'1'});const middle=api.sampleLayoutHandoff(plan,q(1));assert.equal(middle.items[0].matrix[4],20);assert.equal(middle.items[0].opacity,1);assert.equal(middle.items[0].role,'shared');assert.equal(api.sampleLayoutHandoff(plan,q(2)).items[0].matrix[4],40);
assert.equal(api.sampleLayoutHandoff(plan,q(1),{reducedMotion:true}).items[0].matrix[4],40);assert.deepEqual(middle,api.sampleLayoutHandoff(plan,q(1)));assert.throws(()=>api.sampleLayoutHandoff({...plan},q(0)));
console.log('recipe.layout-handoff contract PASS');
