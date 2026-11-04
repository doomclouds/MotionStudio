import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='transition.push');
assert(item);
const q=n=>({n:String(n),d:'1'});const mid=api.sampleTransition(item.example,q(1));assert.deepEqual(mid.layers.map(x=>x.matrix[4]),[-320,320]);assert.deepEqual(api.sampleTransition(item.example,q(2)).layers.map(x=>x.opacity),[0,1]);assert.throws(()=>api.sampleTransition({...item.example,params:{...item.example.params,width:640.5}},q(1),{reducedMotion:true}));
console.log('transition.push contract PASS');
