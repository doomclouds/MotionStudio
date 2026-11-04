import test from 'node:test';import assert from 'node:assert/strict';
import {compileSliceDisplacement,sampleSliceDisplacement,withSliceDisplacement} from '../../../../index.mjs';
import {withSliceDisplacement as direct} from '../canvas.mjs';
const q=n=>({n:String(n),d:'1'});
test('slice: exact partition, alternating bounded middle displacement, canonical adapter',()=>{
 const p=compileSliceDisplacement({width:11,height:7,bands:3,maxOffset:4,seed:'oracle',instanceId:'panel',range:{start:q(0),end:q(2)},jitterCycles:0});
 const s=sampleSliceDisplacement(p,q(1));assert.deepEqual(s.bands.map(b=>[b.y,b.height]),[[0,2],[2,2],[4,3]]);
 for(let i=0;i<3;i++){const b=s.bands[i];assert(Math.abs(b.offset)>=2&&Math.abs(b.offset)<=4);assert.equal(Math.sign(b.offset),i%2?1:-1);}
 assert(sampleSliceDisplacement(p,q(0)).bands.every(b=>Object.is(b.offset,0)));assert(sampleSliceDisplacement(p,q(2)).atHome);assert.equal(withSliceDisplacement,direct);
});
