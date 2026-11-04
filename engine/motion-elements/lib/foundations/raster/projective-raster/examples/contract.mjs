import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='raster.projective-quad');
assert(item);
const plan=api.compileProjectiveRaster(item.example);
for(const [i,p] of [{x:0,y:0},{x:64,y:0},{x:64,y:48},{x:0,y:48}].entries()){const q=api.mapProjectivePoint(plan,p);assert(Math.abs(q.x-item.example.quad[i].x)<1e-9);assert(Math.abs(q.y-item.example.quad[i].y)<1e-9);}
const source={width:2,height:2,data:new Uint8ClampedArray([10,20,30,255,40,50,60,255,70,80,90,255,100,110,120,255])};
const identity=api.compileProjectiveRaster({sourceWidth:2,sourceHeight:2,outputWidth:2,outputHeight:2,quad:[{x:0,y:0},{x:2,y:0},{x:2,y:2},{x:0,y:2}]});
const output=api.warpProjectiveRGBA(identity,source);assert.deepEqual(output.data,source.data);assert.notEqual(output.data,source.data);
output.data[0]=0;assert.equal(source.data[0],10);assert.equal(api.projectRasterPoint,api.mapProjectivePoint);assert(Object.isFrozen(plan.matrix));
assert.throws(()=>api.mapProjectivePoint({...plan},{x:0,y:0}));assert.throws(()=>api.mapProjectivePoint(plan,{x:65,y:0}));
console.log('raster.projective-quad contract PASS');
