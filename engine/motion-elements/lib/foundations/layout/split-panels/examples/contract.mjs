import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='composition.split-panels');
assert(item);
const rows=api.splitPanels({itemIds:['a','b'],viewport:{width:11,height:7},axis:'x',gap:1});assert.deepEqual(rows.map(x=>[x.rect.width,x.rect.height,...x.matrix.slice(4)]),[[5,7,0,0],[5,7,6,0]]);assert.equal(api.splitPanels(item.example).length,3);assert.throws(()=>api.splitPanels({itemIds:['a','b'],viewport:{width:11,height:7},axis:'x',gap:11}));
console.log('composition.split-panels contract PASS');
