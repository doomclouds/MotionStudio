import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='composition.grid');
assert(item);
assert.deepEqual(api.gridLayout(item.example).map(v=>v.matrix.slice(4)),[[0,0],[120,0],[240,0]]);const state=api.gridLayout({...item.example,itemIds:['a','b','c'],width:10,height:20,columns:2,gap:3});assert.deepEqual(state[2].geometryBounds,{x:0,y:23,width:10,height:20});assert(Object.isFrozen(state[2].rect));assert.throws(()=>api.gridLayout({...item.example,columns:0}));
console.log('composition.grid contract PASS');
