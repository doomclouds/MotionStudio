import test from 'node:test';import assert from 'node:assert/strict';
import {loadNativeCanvas} from '../../../../../motion-render-core/lib/native.mjs';
import {drawHeldAnnotation} from '../examples/held-annotation.mjs';
const {api}=loadNativeCanvas();
test('held jitter, exact path prefix and marker consume one current geometry',()=>{
 const c=api.createCanvas(240,140),g=c.getContext('2d'),results=new Map();
 for(const frame of [0,3,4,12,0]){g.clearRect(0,0,240,140);const r=drawHeldAnnotation(g,frame,.65);assert.deepEqual(r.marker.contact,r.section.vertices.at(-1).position);const pixels=Buffer.from(g.getImageData(0,0,240,140).data);assert.ok(pixels.some(v=>v!==0));if(results.has(frame))assert.deepEqual(pixels,results.get(frame));results.set(frame,pixels);}
 assert.deepEqual(results.get(0),results.get(3));assert.notDeepEqual(results.get(0),results.get(4));
 g.clearRect(0,0,240,140);assert.equal(drawHeldAnnotation(g,0,0).marker,null);assert.ok(g.getImageData(0,0,240,140).data.every(v=>v===0));
});
