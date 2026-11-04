import test from 'node:test';import assert from 'node:assert/strict';import * as api from '../../../../index.mjs';
test('displacement bilinear quarter-pixel oracle and matte chain identity',()=>{
 const source={width:2,height:1,pixels:[0,0,0,255,100,200,80,255]},map={width:2,height:1,pixels:[160,128,0,255,128,128,0,255]};
 const moved=api.sampleRasterDisplacement({source,map,scaleX:1,scaleY:0,edge:'clamp',filter:'bilinear'});assert.deepEqual([...api.copyRasterPixels(moved)],[25,50,20,255,100,200,80,255]);
 const mask={width:2,height:1,pixels:[0,0,0,255,0,0,0,128]};const matte=api.sampleRasterMatte({source:moved,mask,mode:'alpha',invert:false});
 const neutral=api.sampleRasterDisplacement({source:matte,map,scaleX:0,scaleY:0,edge:'transparent',filter:'nearest'});assert.deepEqual(api.copyRasterPixels(neutral),api.copyRasterPixels(matte));assert.throws(()=>api.copyRasterPixels({...neutral}));
});
