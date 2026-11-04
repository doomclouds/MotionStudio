import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='transition.iris-reveal');
assert(item);
const q=n=>({n:String(n),d:'1'});const spec={...item.example,params:{width:3,height:4,center:{x:0,y:0}}};const mid=api.sampleTransition(spec,q(1));assert.equal(mid.maxRadius,5);assert.equal(mid.radius,2.5);assert.equal(mid.composition,'over-reveal');assert.equal(api.sampleTransition(spec,q(2)).radius,5);assert.equal(api.sampleTransition(spec,q(1),{reducedMotion:true}).radius,5);assert.deepEqual(mid,api.sampleTransition(spec,q(1)));assert.throws(()=>api.sampleTransition({...spec,params:{...spec.params,center:{x:-1,y:0}}},q(1)));
console.log('transition.iris-reveal contract PASS');
