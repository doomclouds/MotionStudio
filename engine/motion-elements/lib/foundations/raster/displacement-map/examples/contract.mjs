import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='raster.displacement-map');
assert(item);
const neutral={...item.example,map:{width:2,height:1,pixels:[128,128,0,255,128,128,255,255]}};assert.deepEqual([...api.copyRasterPixels(api.sampleRasterDisplacement(neutral))],item.example.source.pixels);const out=api.sampleRasterDisplacement(item.example);assert.equal(api.copyRasterPixels(out).length,8);assert.equal(api.createRasterSnapshot(out),out);assert.throws(()=>api.sampleRasterDisplacement({...neutral,filter:'cubic'}));
console.log('raster.displacement-map contract PASS');
