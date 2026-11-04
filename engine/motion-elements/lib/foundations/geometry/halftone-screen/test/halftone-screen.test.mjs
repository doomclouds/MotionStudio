import test from 'node:test';
import assert from 'node:assert/strict';
import {halftoneScreen} from '../index.mjs';
const spec=v=>({columns:1,rows:1,values:[v],cellSize:1,origin:{x:0,y:0},angle:0});
test('independent midpoint area integrates clipped circles across low and high coverage',()=>{
 for(const coverage of [.05,.5,.8,.95,1]) {const radius=halftoneScreen(spec(coverage)).cells[0].radius;let area=0;const n=20000;for(let i=0;i<n;i++){const x=(i+.5)/n-.5;area+=2*Math.min(.5,Math.sqrt(Math.max(0,radius*radius-x*x)))/n;}assert(Math.abs(area-coverage)<2e-6);}
});
test('positive subnormal radius, copy isolation and data-only input rejection',()=>{
 assert(halftoneScreen(spec(Number.MIN_VALUE)).cells[0].radius>0);const input=spec(.5),result=halftoneScreen(input);input.values[0]=1;assert.equal(result.cells[0].coverage,.5);
 let reads=0;const bad={...spec(.5),get angle(){reads++;return 0;}};assert.throws(()=>halftoneScreen(bad));assert.equal(reads,0);
});
