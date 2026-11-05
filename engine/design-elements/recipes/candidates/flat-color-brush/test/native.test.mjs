import test from 'node:test';
import assert from 'node:assert/strict';
import {loadNativeCanvas} from '../../../../../motion-render-core/lib/native.mjs';
import {drawFlatColorBrush as draw} from '../index.mjs';
import {drawSampleRibbon,drawConcavePatch} from '../examples/consumers.mjs';
let api;
try { ({api}=loadNativeCanvas()); } catch(error) { if(process.env.MOTIONSTUDIO_CANVAS_MODULE) throw error; }
const native=(name,fn)=>test(name,{skip:api?false:'Optional installed Native Canvas unavailable'},fn);
const canvas=()=>api.createCanvas(512,512);
const pixels=c=>Buffer.from(c.getContext('2d').getImageData(0,0,512,512).data);
const pixel=(q,x,y)=>[...q.getImageData(x,y,1,1).data];
const opts={x:230.25,y:250.25,color:'#357d86'};
native('72 finite raster-cell enclosures and 24 actual contact edge checks',()=>{
  for(const width of [6,24,40,48]) for(const length of [60,140,260]) for(const angle of [0,.63,-1.2]) for(const lift of [0,1]) {
    const c=canvas(),q=c.getContext('2d'),s=draw(q,{...opts,width,length,angle,lift}),b=s.toolBounds;
    const data=pixels(c);let occupied=0;
    // Unit pixel CELLS, not centers. One device-pixel AA allowance per side.
    for(let y=0;y<512;y++) for(let x=0;x<512;x++) if(data[(y*512+x)*4+3]) {
      occupied++;assert.ok(x>=b.minX-1 && y>=b.minY-1 && x+1<=b.maxX+1 && y+1<=b.maxY+1);
    }
    assert.ok(occupied>0);
    if(angle===0) {
      const x=Math.floor(s.visibleEdge.a.x),a=s.visibleEdge.a.y,z=s.visibleEdge.b.y;let first=512,last=-1;
      for(let y=0;y<512;y++) {const p=pixel(q,x,y);if(p[3]>=64) {
        for(const [i,v] of [53,125,134].entries()) assert.ok(Math.abs(p[i]-v)<=5);
        first=Math.min(first,y);last=Math.max(last,y+1);
      }}
      assert.ok(first<last && Math.abs(first-a)<=1 && Math.abs(last-z)<=1);
      for(let y=Math.floor(a)-2;y<=Math.ceil(z)+2;y++) assert.equal(pixel(q,x-1,y)[3],0);
    }
  }
});
native('parent transform/alpha/composite and actual clip/style/shadow restoration',()=>{
  const c=canvas(),q=c.getContext('2d');q.translate(3,7);q.scale(1.2,.8);q.globalAlpha=.7;
  q.globalCompositeOperation='source-over';q.fillStyle='#ff0000';q.shadowColor='#0000ff';q.shadowBlur=0;q.shadowOffsetX=15;q.shadowOffsetY=0;
  q.beginPath();q.rect(0,0,350,400);q.clip();const transform=q.getTransform(),alpha=q.globalAlpha;
  draw(q,{x:150,y:200,width:24,length:100});
  assert.deepEqual(q.getTransform(),transform);assert.equal(q.globalAlpha,alpha);assert.equal(q.globalCompositeOperation,'source-over');
  q.fillRect(1,1,10,10);const p=pixel(q,8,10);assert.deepEqual(p.slice(0,3),[255,0,0]);assert.ok(p[3]>170&&p[3]<185);
  assert.ok(pixel(q,25,10)[2]>200,'caller shadow restored');
  q.fillRect(360,1,30,20);assert.equal(pixel(q,450,15)[3],0,'caller clip restored');
  // Compare tool draw against equivalent pre-transformed Canvas placement.
  const a=canvas(),b=canvas(),qa=a.getContext('2d'),qb=b.getContext('2d');
  for(const g of [qa,qb]) {g.fillStyle='#bbbbbb';g.fillRect(0,0,512,512);g.globalAlpha=.6;g.globalCompositeOperation='multiply';}
  qa.translate(20,30);draw(qa,{x:100,y:100});draw(qb,{x:120,y:130});assert.deepEqual(pixels(a),pixels(b));
});
native('independent calls are deterministic after unrelated draw and lift',()=>{
  const render=o=>{const c=canvas();draw(c.getContext('2d'),o);return pixels(c);};
  const first=render(opts);render({...opts,lift:1,angle:.7,color:'#bb6046'});assert.deepEqual(render(opts),first);
});
function consumer(drawConsumer,fraction,showTool=false) {
  const c=canvas(),q=c.getContext('2d'),s=drawConsumer(q,fraction,showTool);return {c,q,s};
}
native('ribbon is butt-ended and actual edge follows partial caller paint',()=>{
  const {q,s}=consumer(drawSampleRibbon,.5);
  assert.equal(s.visibleEdge.a.x,150);assert.equal(s.visibleEdge.a.y,68);
  assert.equal(pixel(q,149,80)[3],255);assert.equal(pixel(q,150,80)[3],0);
  assert.equal(pixel(q,39,80)[3],0);assert.equal(pixel(q,100,67)[3],0);
  const visible=consumer(drawSampleRibbon,.5,true);assert.ok(pixel(visible.q,151,80)[3]>200);
});
native('concave rows retain holes, lift without ink and never replace the patch',()=>{
  const before=consumer(drawConcavePatch,.16),later=consumer(drawConcavePatch,.19);
  assert.equal(before.s.contact,false);assert.equal(later.s.contact,false);assert.deepEqual(pixels(before.c),pixels(later.c));
  const partial=consumer(drawConcavePatch,.275); // row 2, half painted right-to-left
  assert.equal(partial.s.contact,true);assert.equal(partial.s.visibleEdge.a.x,150);
  assert.equal(pixel(partial.q,149,85)[3],0);assert.equal(pixel(partial.q,151,85)[3],255);
  const done=consumer(drawConcavePatch,1),lastPaint=consumer(drawConcavePatch,.95);
  assert.deepEqual(pixels(done.c),pixels(lastPaint.c));assert.equal(done.s.contact,false);
  assert.equal(pixel(done.q,100,175)[3],255);assert.equal(pixel(done.q,200,130)[3],0);
  assert.equal(pixel(done.q,39,80)[3],0);assert.equal(pixel(done.q,260,80)[3],0);
  const visible=consumer(drawConcavePatch,.275,true);assert.ok(pixel(visible.q,151,85)[3]>200);
  consumer(drawConcavePatch,.61,true);assert.deepEqual(pixels(consumer(drawConcavePatch,.275,true).c),pixels(visible.c));
});
