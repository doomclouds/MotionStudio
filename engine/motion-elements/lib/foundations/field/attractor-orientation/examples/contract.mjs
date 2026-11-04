import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='field.attractor-orientation');
assert(item);
const p=api.compileAttractorField({...item.example,bounds:{x:0,y:0,width:2,height:2},columns:1,rows:1});const radial=api.sampleAttractorField(p,{attractor:{x:4,y:5},radial:1,tangential:0}).cells[0];assert.equal(radial.distance,5);assert.deepEqual(radial.direction,{x:.6,y:.8});const tangent=api.sampleAttractorField(p,{attractor:{x:4,y:5},radial:0,tangential:1}).cells[0];assert.deepEqual(tangent.direction,{x:-.8,y:.6});assert.equal(api.sampleAttractorField(p,{attractor:{x:1,y:1},radial:1,tangential:1}).cells[0].defined,false);assert.equal(api.compileAttractorField(item.example).cells.length,144);assert.throws(()=>api.sampleAttractorField({...p},{attractor:{x:0,y:0},radial:1,tangential:0}));
console.log('field.attractor-orientation contract PASS');
