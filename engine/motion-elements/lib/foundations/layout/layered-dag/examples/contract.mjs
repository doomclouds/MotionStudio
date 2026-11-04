import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='composition.layered-dag');
assert(item);
const layout=api.layeredDagLayout(item.example);assert.deepEqual(layout.placements,[{itemId:'source',layer:0,order:0},{itemId:'sink',layer:1,order:0}]);assert.deepEqual(layout.extent,{width:120,height:80});assert.equal(layout.items[1].matrix[4],100);assert(Object.isFrozen(layout.items[0].rect));
assert.deepEqual(layout,api.layeredDagLayout(item.example));assert.throws(()=>api.layeredDagLayout({...item.example,links:[...item.example.links,{linkId:'back',fromId:'sink',toId:'source'}]}));
console.log('composition.layered-dag contract PASS');
