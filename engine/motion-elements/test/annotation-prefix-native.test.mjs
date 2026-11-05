import test from 'node:test';
import assert from 'node:assert/strict';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
import {drawAnnotationExample as draw} from '../examples/annotation-prefix.mjs';
const {api}=loadNativeCanvas();
const pixel=(ctx,x,y)=>[...ctx.getImageData(x,y,1,1).data];
test('Native consumer draws elbows, leaves future ink absent and anchors pen on final ink',()=>{
  const c=api.createCanvas(200,160),ctx=c.getContext('2d');
  draw(ctx,0,.5);
  assert.deepEqual(pixel(ctx,91,50),[23,53,84,255]);
  assert.deepEqual(pixel(ctx,91,67),[201,67,50,255]);
  assert.equal(pixel(ctx,91,80)[3],0);
  assert.equal(pixel(ctx,65,52)[3],0); // diagonal corner-cut shortcut stays blank
  ctx.clearRect(0,0,200,160);draw(ctx,1,.5);
  assert.deepEqual(pixel(ctx,59,70),[23,53,84,255]);
  assert.deepEqual(pixel(ctx,59,101),[201,67,50,255]);
  assert.equal(pixel(ctx,59,125)[3],0);
});
test('Native empty/reduced/seek states and caller paint state remain explicit',()=>{
  const c=api.createCanvas(200,160),ctx=c.getContext('2d');
  draw(ctx,0,0);assert.ok(ctx.getImageData(0,0,200,160).data.every(v=>v===0));
  const render=(i,p,opts)=>{ctx.clearRect(0,0,200,160);draw(ctx,i,p,opts);return Buffer.from(ctx.getImageData(0,0,200,160).data);};
  for(const i of [0,1]){
    const expected=render(i,.5);render(i,1);render(i,0);assert.deepEqual(render(i,.5),expected);
    assert.deepEqual(render(i,.2,{reducedMotion:true}),render(i,1));
  }
  ctx.strokeStyle='#abcdef';ctx.lineWidth=7;ctx.setLineDash([2,5]);ctx.translate(3,4);
  draw(ctx,0,.5);
  // Native style getters can cache the inner assignment after restore; verify paint, not that cache.
  ctx.beginPath();ctx.moveTo(10,140);ctx.lineTo(100,140);ctx.stroke();
  assert.deepEqual(pixel(ctx,13,144),[171,205,239,255]);
  assert.equal(ctx.lineWidth,7);
  assert.deepEqual(ctx.getLineDash(),[2,5]);assert.equal(ctx.getTransform().e,3);assert.equal(ctx.getTransform().f,4);
});
