import test from 'node:test';import assert from 'node:assert/strict';
import {compileAttractorField,sampleAttractorField} from '../../../../index.mjs';
test('orientation: axial and integer-vector oracle around one stationary cell',()=>{
 const p=compileAttractorField({bounds:{x:-1,y:-1,width:2,height:2},columns:1,rows:1});
 for(let x=-4;x<=4;x++)for(let y=-4;y<=4;y++){
  const c=sampleAttractorField(p,{attractor:{x,y},radial:1,tangential:0}).cells[0];
  assert.equal(c.defined,x!==0||y!==0);if(!c.defined)continue;
  const d=Math.sqrt(x*x+y*y);assert(Math.abs(c.direction.x-x/d)<1e-15);assert(Math.abs(c.direction.y-y/d)<1e-15);
 }
});
