import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='composition.offset-cards');
assert(item);
const spec={...item.example,rotationStep:0};const rows=api.offsetCards(spec);assert.deepEqual(rows.map(x=>x.matrix.slice(4)),[[40,30],[65,45],[90,60]]);assert.deepEqual(api.offsetCards({...spec,zOrder:'descending'}).map(x=>x.zIndex),[2,1,0]);assert(Object.isFrozen(rows[0].rect));assert.throws(()=>api.offsetCards({...spec,itemIds:['a','a']}));
console.log('composition.offset-cards contract PASS');
