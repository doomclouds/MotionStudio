import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='geometry.polyline-trail');
assert(item);
const plan=api.compilePolyline({points:[{x:0,y:0},{x:3,y:0},{x:3,y:4}]});assert.equal(plan.totalLength,7);const corner=api.samplePath(plan,3/7);assert.deepEqual(corner.position,{x:3,y:0});assert.equal(corner.segmentIndex,1);const trail=api.sampleTrail(plan,{headProgress:1,length:4,samples:3});assert.equal(trail.tailDistance,3);assert.equal(trail.headDistance,7);assert.deepEqual(trail.points.map(p=>p.position),[{x:3,y:0},{x:3,y:2},{x:3,y:4}]);assert.deepEqual(api.samplePath(api.compilePolyline(item.example),1).position,{x:120,y:80});assert.throws(()=>api.samplePath({...plan},.5));
console.log('geometry.polyline-trail contract PASS');
