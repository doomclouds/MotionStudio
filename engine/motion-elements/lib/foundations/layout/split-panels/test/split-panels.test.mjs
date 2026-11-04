import test from 'node:test';import assert from 'node:assert/strict';import {splitPanels} from '../../../../index.mjs';
test('panels exact equal partitions across counts and axes',()=>{
 for(let n=2;n<=8;n++)for(const axis of ['x','y']){const total=n*5+(n-1)*2;const out=splitPanels({itemIds:Array.from({length:n},(_,i)=>'p'+i),viewport:{width:total,height:total},axis,gap:2});for(let i=0;i<n;i++){assert.equal(out[i].rect[axis==='x'?'width':'height'],5);assert.equal(out[i].matrix[axis==='x'?4:5],i*7);}}
 assert.throws(()=>splitPanels({itemIds:['a'],viewport:{width:10,height:10},axis:'x'}));
});
