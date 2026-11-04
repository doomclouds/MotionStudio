import test from 'node:test';import assert from 'node:assert/strict';import * as api from '../../../../index.mjs';
import {createRasterSnapshot,copyRasterPixels} from '../../../../internal/raster-snapshot.mjs';
test('matte exact integer-alpha oracle and one shared snapshot brand',async()=>{
 assert.equal(api.createRasterSnapshot,createRasterSnapshot);assert.equal(api.copyRasterPixels,copyRasterPixels);
 for(const alpha of [0,1,127,128,254,255]){const source=createRasterSnapshot({width:1,height:1,pixels:[9,21,87,255]});const out=api.sampleRasterMatte({source,mask:{width:1,height:1,pixels:[0,0,0,alpha]},mode:'alpha',invert:false});assert.deepEqual([...copyRasterPixels(out)],[9,21,87,alpha]);assert.equal(createRasterSnapshot(out),out);}
 const foreign=await import('../../../../internal/raster-snapshot.mjs?brand-isolation');const snap=foreign.createRasterSnapshot({width:1,height:1,pixels:[1,2,3,255]});assert.throws(()=>copyRasterPixels(snap));assert.throws(()=>api.sampleRasterMatte({source:snap,mask:snap,mode:'alpha',invert:false}));
});
