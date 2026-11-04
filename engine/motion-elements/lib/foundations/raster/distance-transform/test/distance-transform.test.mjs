import test from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../index.mjs';
test('every 2x2 binary mask agrees with explicit nearest-seed squared distance',()=>{
 for(let bits=0;bits<16;bits++){const mask=Array.from({length:4},(_,i)=>(bits>>i)&1),sources=mask.flatMap((v,i)=>v?[i]:[]),out=api.distanceTransform({width:2,height:2,mask});for(let i=0;i<4;i++){const expected=Math.min(Infinity,...sources.map(j=>(i%2-j%2)**2+(Math.floor(i/2)-Math.floor(j/2))**2));assert.equal(out.squaredDistances[i],expected);}}
});
test('one-dimensional distance, caller output ownership and invalid half coverage',()=>{
 const mask=new Uint8Array([0,0,1]),out=api.distanceTransform({width:1,height:3,mask});assert.deepEqual([...out.squaredDistances],[4,1,0]);out.squaredDistances[2]=7;assert.equal(mask[2],1);assert.throws(()=>api.distanceTransform({width:1,height:1,mask:[.5]}));
});
