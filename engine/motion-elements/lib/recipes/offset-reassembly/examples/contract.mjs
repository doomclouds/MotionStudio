import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='recipe.offset-reassembly');
assert(item);
const end=api.sampleOffsetReassembly(item.example,{n:'2',d:'1'});assert.equal(end.length,3);assert(end.every(v=>v.opacity===1&&v.phase==='after'));const {itemIds,origin,card,offset,rotationStep}=item.example.params;const target=api.offsetCards({itemIds,origin,card,offset,rotationStep});for(let i=0;i<3;i++)for(let j=0;j<6;j++)assert(Math.abs(end[i].matrix[j]-target[i].matrix[j])<1e-12);assert.deepEqual(end,api.sampleOffsetReassembly(item.example,{n:'2',d:'1'}));
console.log('recipe.offset-reassembly contract PASS');
