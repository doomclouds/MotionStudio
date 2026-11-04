import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='motion.opacity');
assert(item);
const q=n=>({n:String(n),d:'1'});const mid=api.sampleMotion(item.example,q(1));assert.equal(mid.opacity,.5);assert.equal(api.sampleMotion(item.example,q(1),{reducedMotion:true}).opacity,.5);assert.deepEqual(mid.matrix,[1,0,0,1,0,0]);
console.log('motion.opacity contract PASS');
