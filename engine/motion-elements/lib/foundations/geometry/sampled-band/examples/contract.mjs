import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='geometry.sampled-band');
assert(item);
const band=api.compileSampledBand({samples:[{x:0,y:3,halfWidth:2},{x:5,y:3,halfWidth:2}]});assert.deepEqual(band.bounds,{x:0,y:1,width:5,height:4});assert.deepEqual(band.vertices,[{x:0,y:1},{x:5,y:1},{x:5,y:5},{x:0,y:5}]);assert.equal(band.degenerate,false);assert(api.compileSampledBand({samples:[{x:0,y:1,halfWidth:0},{x:1,y:4,halfWidth:0}]}).degenerate);assert.deepEqual(api.compileSampledBand(item.example),api.compileSampledBand(item.example));assert.throws(()=>api.compileSampledBand({samples:[{x:1,y:0,halfWidth:1},{x:0,y:0,halfWidth:1}]}));
console.log('geometry.sampled-band contract PASS');
