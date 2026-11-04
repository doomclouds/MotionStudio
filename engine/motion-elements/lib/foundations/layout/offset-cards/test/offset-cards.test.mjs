import test from 'node:test';import assert from 'node:assert/strict';import {offsetCards} from '../../../../index.mjs';
test('offset placement oracle and shared ID rejection',()=>{
 for(let n=1;n<=20;n++){const out=offsetCards({itemIds:Array.from({length:n},(_,i)=>'p'+i),origin:{x:-3,y:7},card:{width:8,height:6},offset:{x:2,y:-4}});for(let i=0;i<n;i++)assert.deepEqual(out[i].geometryBounds,{x:-3+2*i,y:7-4*i,width:8,height:6});}
 assert.throws(()=>offsetCards({itemIds:['a','a'],origin:{x:0,y:0},card:{width:8,height:6},offset:{x:0,y:0}}));
});
