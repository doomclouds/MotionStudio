import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='recipe.light-echo-field');
assert(item);
const q=(n,d=1)=>({n:String(n),d:String(d)}),plan=api.compileLightEchoField(item.example),state=api.sampleLightEchoField(plan,q(3));
assert.deepEqual(state.lights.map(l=>l.id),item.example.lights.map(l=>l.id));assert.deepEqual(state.lights.map(l=>l.fragments.length),[8,8,6]);
const larger=api.sampleLightEchoField(api.compileLightEchoField({...item.example,focus:{from:2,to:2}}),q(3));
for(const [i,l] of larger.lights.entries()){assert.equal(l.radius,item.example.lights[i].radius*2);assert.deepEqual(l.fragments,state.lights[i].fragments);}
assert(Object.isFrozen(state.lights[0].fragments));assert.deepEqual(state,api.sampleLightEchoField(plan,q(3)));assert.throws(()=>api.sampleLightEchoField({...plan},q(0)));assert.throws(()=>api.compileLightEchoField({...item.example,lights:[item.example.lights[0],item.example.lights[0]]}));
console.log('recipe.light-echo-field contract PASS');
