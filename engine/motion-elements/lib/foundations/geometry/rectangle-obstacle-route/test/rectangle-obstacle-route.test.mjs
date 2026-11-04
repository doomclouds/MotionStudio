import test from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../index.mjs';
test('single obstacle has analytic detour length and reflection symmetry',()=>{
 const spec={start:{x:0,y:0},end:{x:10,y:0},obstacles:[{x:4,y:-1,width:2,height:2}]};const result=api.routeRectangles(spec);assert(Math.abs(result.length-(2*Math.sqrt(17)+2))<1e-10);
 const shifted={...spec,start:{x:0,y:2},end:{x:10,y:2}},reflected={...shifted,start:{x:0,y:-2},end:{x:10,y:-2}};assert(Math.abs(api.routeRectangles(shifted).length-api.routeRectangles(reflected).length)<1e-10);
});
test('boundary travel allowed but expanded obstacle overlap rejects',()=>{
 assert.equal(api.routeRectangles({start:{x:0,y:0},end:{x:2,y:0},obstacles:[{x:0,y:0,width:2,height:2}]}).length,2);
 assert.throws(()=>api.routeRectangles({start:{x:-5,y:0},end:{x:9,y:0},clearance:1,obstacles:[{x:0,y:0,width:2,height:2},{x:3,y:0,width:2,height:2}]}));
});
