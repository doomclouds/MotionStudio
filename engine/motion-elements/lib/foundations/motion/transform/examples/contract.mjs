import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='motion.transform');
assert(item);
const q=n=>({n:String(n),d:'1'});const mid=api.sampleMotion(item.example,q(1));assert.equal(mid.matrix[4],60);assert.equal(mid.matrix[0],1.1);assert.equal(mid.opacity,1);assert.deepEqual(api.sampleMotion(item.example,q(1),{reducedMotion:true}).matrix,api.sampleMotion(item.example,q(2)).matrix);
console.log('motion.transform contract PASS');
