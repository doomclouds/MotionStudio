import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='raster.matte');
assert(item);
const out=api.sampleRasterMatte(item.example);assert.deepEqual([...api.copyRasterPixels(out)],[230,40,20,128,20,90,160,128]);const copy=api.copyRasterPixels(out);copy.fill(0);assert.equal(api.copyRasterPixels(out)[0],230);assert.equal(api.createRasterSnapshot(out),out);assert.throws(()=>api.copyRasterPixels({...out}));
console.log('raster.matte contract PASS');
