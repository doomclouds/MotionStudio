import test from 'node:test';
import assert from 'node:assert/strict';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
import {withLocalReveal as draw} from '../lib/index.mjs';
const {api}=loadNativeCanvas(),backend={Path2D:api.Path2D};
const spec={bounds:{x:10,y:10,width:60,height:40},progress:1,radius:10,direction:'left-to-right'};
const make=()=>api.createCanvas(100,80).getContext('2d'),pixel=(ctx,x,y)=>[...ctx.getImageData(x,y,1,1).data];
test('local reveal endpoints and all directions use a fixed rounded boundary',()=>{
 const ctx=make();let count=0;draw(ctx,{...spec,progress:0},()=>count++,backend);assert.equal(count,0);
 draw(ctx,spec,c=>{c.fillStyle='red';c.fillRect(0,0,100,80);},backend);
 assert.equal(pixel(ctx,30,30)[3],255);assert.equal(pixel(ctx,10,10)[3],0);assert.equal(pixel(ctx,80,30)[3],0);
 for(const direction of ['left-to-right','right-to-left','top-to-bottom','bottom-to-top']){
 ctx.reset();ctx.clearRect(0,0,100,80);draw(ctx,{...spec,progress:.5,direction},c=>c.fillRect(0,0,100,80),backend);
 const pairs=direction.includes('left')?[[25,30],[55,30]]:[[40,20],[40,40]];
 const first=['left-to-right','top-to-bottom'].includes(direction);assert.equal(pixel(ctx,...pairs[0])[3],first?255:0);assert.equal(pixel(ctx,...pairs[1])[3],first?0:255);
 }
});
test('local reveal preserves caller current path; exceptions restore transform alpha and clip',()=>{
 const ctx=make();ctx.beginPath();ctx.rect(80,60,10,10);
 draw(ctx,spec,()=>{},backend);ctx.fillStyle='red';ctx.fill();assert.equal(pixel(ctx,85,65)[0],255);assert.equal(pixel(ctx,30,30)[3],0);
 ctx.translate(2,3);ctx.globalAlpha=.5;const before=ctx.getTransform(),alpha=ctx.globalAlpha;
 assert.throws(()=>draw(ctx,spec,c=>{c.translate(20,20);c.globalAlpha=.1;throw Error('expected');},backend),/expected/);
 assert.deepEqual(ctx.getTransform(),before);assert.equal(ctx.globalAlpha,alpha);
 ctx.resetTransform();ctx.globalAlpha=1;ctx.fillStyle='blue';ctx.fillRect(90,0,10,10);assert.equal(pixel(ctx,95,5)[2],255);
});
test('local reveal nested clips and transparent holes remain local under parent transforms',()=>{
 const ctx=make();ctx.translate(10,5);ctx.scale(1.2,.8);
 draw(ctx,{...spec,radius:0},c=>draw(c,{bounds:{x:20,y:20,width:20,height:20},progress:1,radius:0,direction:'top-to-bottom'},cc=>{
 cc.fillStyle='green';cc.fillRect(0,0,100,80);cc.clearRect(25,25,5,5);
 },backend),backend);
 assert.ok(pixel(ctx,36,23)[3]>0);assert.equal(pixel(ctx,42,27)[3],0);assert.equal(pixel(ctx,70,23)[3],0);
});
test('local reveal rejects invalid domains and asynchronous callbacks',()=>{
 const ctx=make();
 for(const s of [null,{...spec,extra:1},{...spec,progress:NaN},{...spec,progress:1.1},{...spec,radius:21},{...spec,bounds:{...spec.bounds,width:0}},{...spec,direction:'diagonal'}])assert.throws(()=>draw(ctx,s,()=>{},backend));
 assert.throws(()=>draw(ctx,spec,()=>{},{}));assert.throws(()=>draw(ctx,spec,async()=>{},backend));assert.throws(()=>draw(ctx,spec,()=>Promise.resolve(),backend));
});
