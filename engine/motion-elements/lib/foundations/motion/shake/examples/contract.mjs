import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='motion.shake');
assert(item);
const q=n=>({n:String(n),d:'1'});assert.deepEqual(api.sampleMotion(item.example,q(0)).matrix,[1,0,0,1,0,0]);assert.deepEqual(api.sampleMotion(item.example,q(2)).matrix,[1,0,0,1,0,0]);const mid=api.sampleMotion(item.example,q(1));assert(Math.abs(mid.matrix[4])<=12&&Math.abs(mid.matrix[5])<=6);assert.deepEqual(mid,api.sampleMotion(item.example,q(1)));assert.deepEqual(api.sampleMotion(item.example,q(1),{reducedMotion:true}).matrix,[1,0,0,1,0,0]);
console.log('motion.shake contract PASS');
