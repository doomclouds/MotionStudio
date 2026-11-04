import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='field.grid-transport');
assert(item);
const grid=api.compileVelocityGrid(item.exampleSetup.velocityGrid);
const plan=api.compileGridTransport(grid,item.example);
for(const time of [3,0,1.25,3]) {
 const point=api.sampleGridTransport(plan,{time}).points[0];
 assert(Math.abs(point.x-(.2+.1*time))<1e-12);
 assert(Math.abs(point.y-(.6-.05*time))<1e-12);
}
const changed=api.sampleGridTransport(plan,{time:0});changed.points[0].x=99;
assert.equal(api.sampleGridTransport(plan,{time:0}).points[0].x,.2);
assert.throws(()=>api.sampleGridTransport(plan,{time:4}));
assert.throws(()=>api.sampleGridTransport(JSON.parse(JSON.stringify(plan)),{time:0}));
assert.throws(()=>api.compileGridTransport(grid,{seeds:[{x:1,y:.5}],duration:1,steps:1}));
console.log('field.grid-transport contract PASS');
