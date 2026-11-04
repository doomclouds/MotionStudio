import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='geometry.visibility-fan');
assert(item);
const area=result=>result.fans.reduce((sum,f)=>sum+((f.a.x-result.source.x)*(f.b.y-result.source.y)-(f.a.y-result.source.y)*(f.b.x-result.source.x))/2,0);
const result=api.visibilityFan(item.example);
assert(Math.abs(area(result)-800000)<1e-8);
assert.deepEqual(result,api.visibilityFan(item.example));
assert(Object.isFrozen(result.fans[0].a));
const blocked=api.visibilityFan({...item.example,source:{x:100,y:400},segments:[{a:{x:500,y:200},b:{x:500,y:600}}]});
// Visible rectangle x0..500 plus two outer triangles gives480000 square units.
assert(Math.abs(area(blocked)-480000)<1e-8);
assert.throws(()=>api.visibilityFan({...item.example,source:{x:.5,y:400}}));
assert.throws(()=>api.visibilityFan({...item.example,source:{x:500,y:400},segments:[{a:{x:500,y:200},b:{x:500,y:600}}]}));
console.log('geometry.visibility-fan contract PASS');
