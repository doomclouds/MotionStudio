import test from 'node:test';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
import {drawOrderedStrokeReveal as draw} from '../adapter.mjs';import {buildExamples} from '../example.mjs';
let native;try{native=await import(process.env.MOTION_CANVAS_MODULE?pathToFileURL(process.env.MOTION_CANVAS_MODULE).href:'@napi-rs/canvas');}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
const options=()=>({x:10,y:10,scale:2,yOrigin:30,color:'#000000',Path2D:native.Path2D});
const rgba=c=>Buffer.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data);
const render=(p,t)=>{const c=native.createCanvas(160,100);draw(c.getContext('2d'),p,t,options());return c;};
test('Native: empty pixels, exact outline terminal, Y-up and seeking', {skip:!native},()=>{
 const p=buildExamples()[0];assert.equal(rgba(render(p,0)).some(Boolean),false);
 const expected=native.createCanvas(160,100),e=expected.getContext('2d');e.fillStyle='#000000';e.fillRect(10,62,40,8);assert.deepEqual(rgba(render(p,1)),rgba(expected));
 const partial=render(p,.5),px=partial.getContext('2d').getImageData(20,65,1,1).data;assert.equal(px[3],255);assert.equal(partial.getContext('2d').getImageData(20,85,1,1).data[3],0);
 const times=[0,.5,1,2,.01,.99],baseline=times.map(t=>rgba(render(p,t)));for(const i of [4,2,0,5,3,1,5,0])assert.deepEqual(rgba(render(p,times[i])),baseline[i]);
});
test('Native: no line between strokes and gap equals prior terminal', {skip:!native},()=>{
 const p=buildExamples()[1];assert.deepEqual(rgba(render(p,3)),rgba(render(p,3.24)));const c=render(p,3.5);assert.equal(c.getContext('2d').getImageData(75,55,1,1).data[3],0);
});
test('Native: styles, transform, clip and caller current path survive', {skip:!native},()=>{
 const c=native.createCanvas(160,100),ctx=c.getContext('2d');ctx.strokeStyle='#ff0000';ctx.fillStyle='#00ff00';ctx.lineWidth=7;ctx.globalAlpha=.7;ctx.setLineDash([3,5]);ctx.lineDashOffset=2;ctx.shadowColor='#112233';ctx.shadowBlur=3;ctx.translate(2,3);ctx.beginPath();ctx.rect(0,0,2,2);
 const before={transform:ctx.getTransform().toString(),width:ctx.lineWidth,alpha:ctx.globalAlpha,dash:ctx.getLineDash(),offset:ctx.lineDashOffset,shadow:ctx.shadowColor,blur:ctx.shadowBlur};draw(ctx,buildExamples()[0],.5,options());
 assert.deepEqual({transform:ctx.getTransform().toString(),width:ctx.lineWidth,alpha:ctx.globalAlpha,dash:ctx.getLineDash(),offset:ctx.lineDashOffset,shadow:ctx.shadowColor,blur:ctx.shadowBlur},before);
 ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.fill();assert.deepEqual(Array.from(ctx.getImageData(2,3,1,1).data),[0,255,0,255]);
 // Native getters can be stale after restore; verify actual paint, never write them back.
 ctx.setLineDash([]);ctx.strokeRect(110,2,12,12);assert.deepEqual(Array.from(ctx.getImageData(112,5,1,1).data),[255,0,0,255]);
 ctx.resetTransform();ctx.fillStyle='#ff00ff';ctx.fillRect(130,80,4,4);assert.equal(ctx.getImageData(131,81,1,1).data[3],255);
});
