import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='transition.masked-slice-displacement');
assert(item);
const p=api.compileSliceDisplacement(item.example),q=n=>({n:String(n),d:'1'});const home=api.sampleSliceDisplacement(p,q(1));assert(home.atHome);assert(api.sampleSliceDisplacement(p,q(5)).atHome);assert(api.sampleSliceDisplacement(p,q(3),{reducedMotion:true}).atHome);const mid=api.sampleSliceDisplacement(p,q(3));assert.deepEqual(mid,api.sampleSliceDisplacement(p,q(3)));assert.throws(()=>api.sampleSliceDisplacement({...p},q(2)));
console.log('transition.masked-slice-displacement contract PASS');
