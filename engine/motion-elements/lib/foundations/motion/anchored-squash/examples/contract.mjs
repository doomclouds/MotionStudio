import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='motion.anchored-squash');
assert(item);
const mid=api.sampleMotion(item.example,{n:'1',d:'1'});assert.equal(mid.matrix[3],.65);assert(Math.abs(mid.matrix[0]*mid.matrix[3]-1)<1e-15);assert.equal(mid.matrix[3]*50+mid.matrix[5],50);assert.deepEqual(api.sampleMotion(item.example,{n:'1',d:'1'},{reducedMotion:true}).matrix,[1,0,0,1,0,0]);
console.log('motion.anchored-squash contract PASS');
