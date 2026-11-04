import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='composition.constraint-stack');
assert(item);
const state=api.constraintStackLayout(item.example);assert.deepEqual(state.map(v=>v.matrix.slice(4)),[[0,0],[0,28]]);assert.deepEqual(api.constraintStackLayout({...item.example,axis:'x'}).map(v=>v.matrix.slice(4)),[[0,0],[236,0]]);assert(Object.isFrozen(state[1]));assert.throws(()=>api.constraintStackLayout({...item.example,items:[item.example.items[0],item.example.items[0]]}));
console.log('composition.constraint-stack contract PASS');
