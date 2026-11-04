import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='geometry.registered-polygon-morph');
assert(item);
const from=[{x:0,y:0},{x:4,y:0},{x:4,y:2},{x:0,y:2}],to=from.map(p=>({x:p.x+2,y:p.y+4}));const plan=api.compileRegisteredPolygonMorph({...item.example,from,to});const middle=api.sampleRegisteredPolygonMorph(plan,.5);assert.deepEqual(middle.vertices,from.map((p,i)=>({vertexId:item.example.vertexIds[i],x:p.x+1,y:p.y+2})));assert.deepEqual(api.sampleRegisteredPolygonMorph(plan,.25,{direction:'reverse'}).vertices,api.sampleRegisteredPolygonMorph(plan,.75).vertices);assert.throws(()=>api.sampleRegisteredPolygonMorph({...plan},.5));assert(api.sampleRegisteredPolygonMorph(api.compileRegisteredPolygonMorph(item.example),0));
console.log('geometry.registered-polygon-morph contract PASS');
