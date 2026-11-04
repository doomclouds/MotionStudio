import test from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../index.mjs';
test('hand-computed two-row half-gray distinguishes serpentine error feedback',()=>{
 const out=api.paletteDiffuse({width:2,height:2,rgb:Array(12).fill(.5),palette:[[0,0,0],[1,1,1]]});assert.deepEqual([...out.indices],[0,1,1,0]);for(let i=0;i<4;i++)assert.deepEqual([...out.rgb.slice(i*3,i*3+3)],Array(3).fill(out.indices[i]));
});
test('authored exact palette colors survive and outputs are independent',()=>{
 const input={width:2,height:1,rgb:[1,0,0,0,0,1],palette:[[1,0,0],[0,0,1]]},out=api.paletteDiffuse(input);assert.deepEqual([...out.indices],[0,1]);out.rgb[0]=.3;assert.equal(input.rgb[0],1);assert.throws(()=>api.paletteDiffuse({...input,rgb:[2,0,0,0,0,1]}));
});
