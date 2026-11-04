import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='composition.weighted-flow');
assert(item);
const flow=api.weightedFlowLayout(item.example),link=flow.links[0];assert.equal(link.thickness,40);assert.equal(link.source.x,20);assert.equal(link.target.x,100);assert.equal(link.source.y,40);assert.equal(link.target.y,40);assert.equal(link.band.samples.length,32);assert(link.band.samples.every(s=>s.halfWidth===20));
assert.deepEqual(flow.balances.map(b=>b.net),[-40,40]);assert.deepEqual(flow,api.weightedFlowLayout(item.example));assert.throws(()=>api.weightedFlowLayout({...item.example,unitsToPixels:3}));
console.log('composition.weighted-flow contract PASS');
