import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
import {withMotion,drawTransition,sampleTransition,rational as T,composeTransform} from '../lib/index.mjs';
import {createGalleryScene,config} from '../examples/gallery-scene.mjs';
const {api}=loadNativeCanvas();
test('Canvas adapter restores transform, alpha, clip and style on throw',()=>{
 const canvas=api.createCanvas(40,40),ctx=canvas.getContext('2d');ctx.fillStyle='red';ctx.globalAlpha=.7;ctx.translate(2,3);const alphaBefore=ctx.globalAlpha;
 assert.throws(()=>withMotion(ctx,{matrix:composeTransform({x:10}),opacity:.5},c=>{c.fillStyle='blue';c.beginPath();c.rect(0,0,1,1);c.clip();throw Error('expected');}));
 assert.equal(ctx.globalAlpha,alphaBefore);assert.equal(ctx.getTransform().e,2);assert.equal(ctx.getTransform().f,3);
 ctx.resetTransform();ctx.globalAlpha=1;ctx.fillRect(0,0,40,40);assert.equal(ctx.getImageData(39,39,1,1).data[3],255);
 assert.throws(()=>withMotion(ctx,{matrix:composeTransform(),opacity:1},async()=>{}));
});
test('push and wipe opaque viewport has no transparent seam for all native frames',()=>{
 const canvas=api.createCanvas(120,80),ctx=canvas.getContext('2d');
 for(const type of ['transition.push','transition.rect-wipe'])for(const direction of ['left','right','up','down'])for(let f=0;f<=30;f++){
  ctx.reset();ctx.clearRect(0,0,120,80);const state=sampleTransition({type,version:1,range:{start:T(0),end:T(1)},params:{width:120,height:80,direction}},T(f,30));
  drawTransition(ctx,state,{outgoing:c=>{c.fillStyle='red';c.fillRect(0,0,120,80);},incoming:c=>{c.fillStyle='blue';c.fillRect(0,0,120,80);}});
  const data=ctx.getImageData(0,0,120,80).data;for(let j=3;j<data.length;j+=4)assert.equal(data[j],255,`${type}/${direction}/${f}: pixel ${j/4}`);
 }
});
test('gallery real Native pixel output is order-independent, normal and reduced',async()=>{
 for(const reducedMotion of [false,true]){
 const canvas=api.createCanvas(config.width,config.height),ctx=canvas.getContext('2d'),scene=await createGalleryScene({canvas,ctx,config},{reducedMotion});
 const frames=[0,15,21,43,62,75,119,120,239],hash=()=>createHash('sha256').update(canvas.toBuffer('image/png')).digest('hex'),expected=new Map();
 for(const f of frames){scene.renderFrame(f);expected.set(f,hash());}
 for(const f of [239,43,0,119,21,120,62,15,75]){scene.renderFrame(f);assert.equal(hash(),expected.get(f));}
 }
});
test('push explicitly rejects unsupported fractional or rotated parent frames',()=>{
 const canvas=api.createCanvas(31,23),ctx=canvas.getContext('2d');
 const spec={type:'transition.push',version:1,range:{start:T(0),end:T(1)},params:{width:31,height:23,direction:'left'}};
 const callbacks={outgoing:()=>{},incoming:()=>{}};
 ctx.translate(.5,0);assert.throws(()=>drawTransition(ctx,sampleTransition(spec,T(1,3)),callbacks),/integer axis/);
 ctx.reset();ctx.rotate(.1);assert.throws(()=>drawTransition(ctx,sampleTransition(spec,T(1,3)),callbacks),/integer axis/);
 assert.throws(()=>sampleTransition({...spec,params:{...spec.params,width:31.5}},T(1,3)),/integer viewport/);
});
test('path two-content demo seeks pixel-identically with normal and reduced motion',async()=>{
 const {createGalleryScene:createPathScene}=await import('../examples/path-scene.mjs');
 for(const reducedMotion of [false,true]){
 const canvas=api.createCanvas(config.width,config.height),ctx=canvas.getContext('2d'),scene=await createPathScene({canvas,ctx,GlobalFonts:api.GlobalFonts,config},{reducedMotion});
 const hashes=new Map(),frames=[0,15,16,43,100,160,225,239];
 for(const f of frames){scene.renderFrame(f);hashes.set(f,createHash('sha256').update(canvas.toBuffer('image/png')).digest('hex'));}
 for(const f of [...frames].reverse()){scene.renderFrame(f);assert.equal(createHash('sha256').update(canvas.toBuffer('image/png')).digest('hex'),hashes.get(f));}
 }
});
