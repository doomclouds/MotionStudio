import test from 'node:test';
import assert from 'node:assert/strict';
import {morphologyCoverage} from '../index.mjs';
test('explicit neighborhood extrema agree on small nonsquare masks and both boundaries',()=>{
 const width=4,height=3,data=new Uint8Array([0,17,200,255,80,33,128,0,90,250,12,63]);
 for(const operation of ['dilate','erode'])for(const boundary of ['transparent','clamp'])for(const [radiusX,radiusY] of [[0,0],[1,2],[5,1]]){
  const expected=[];for(let y=0;y<height;y++)for(let x=0;x<width;x++){const values=[];for(let dy=-radiusY;dy<=radiusY;dy++)for(let dx=-radiusX;dx<=radiusX;dx++){let a=x+dx,b=y+dy;if(boundary==='clamp'){a=Math.max(0,Math.min(width-1,a));b=Math.max(0,Math.min(height-1,b));}values.push(a<0||b<0||a>=width||b>=height?0:data[b*width+a]);}expected.push(operation==='dilate'?Math.max(...values):Math.min(...values));}
  assert.deepEqual([...morphologyCoverage({width,height,data,operation,boundary,radiusX,radiusY}).data],expected);
 }
});
test('frozen wrapper retains independent mutable output and rejects shared buffers',()=>{
 const input={width:1,height:1,data:new Uint8Array([128]),operation:'dilate',boundary:'clamp',radiusX:0,radiusY:0},out=morphologyCoverage(input);assert(Object.isFrozen(out));out.data[0]=3;assert.equal(input.data[0],128);assert.throws(()=>morphologyCoverage({...input,data:new Uint8Array(new SharedArrayBuffer(1))}));
});
