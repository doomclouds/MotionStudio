import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='transition.rect-wipe');
assert(item);
const q=n=>({n:String(n),d:'1'});const mid=api.sampleTransition(item.example,q(1));assert.deepEqual(mid.layers[1].clip,{x:0,y:0,width:320,height:360});assert.deepEqual(mid.layers[1].matrix,[1,0,0,1,0,0]);assert.deepEqual(api.sampleTransition(item.example,q(2)).layers.map(x=>x.opacity),[0,1]);
console.log('transition.rect-wipe contract PASS');
