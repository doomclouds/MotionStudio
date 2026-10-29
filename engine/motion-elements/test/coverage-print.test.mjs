import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
import {halftoneScreen} from '../lib/foundations/geometry/halftone-screen.mjs';
import {morphologyCoverage} from '../lib/foundations/raster/morphology-coverage.mjs';
const screen=(values=[0,.5,1])=>({columns:values.length,rows:1,values,cellSize:10,origin:{x:2,y:3},angle:0});
const mask=(data=[0,128,255,64,0,80],extras={})=>({width:3,height:2,data:new Uint8Array(data),operation:'dilate',radiusX:1,radiusY:1,boundary:'transparent',...extras});
// Independent midpoint quadrature of vertical slices; not production intersection formula.
function measuredArea(r){let sum=0;const n=200000;for(let i=0;i<n;i++){const x=(i+.5)/n-.5;sum+=2*Math.min(.5,Math.sqrt(Math.max(0,r*r-x*x)));}return sum/n;}
function oracle(s){const out=[];for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){let v=s.operation==='dilate'?0:255;for(let dy=-s.radiusY;dy<=s.radiusY;dy++)for(let dx=-s.radiusX;dx<=s.radiusX;dx++){let xx=x+dx,yy=y+dy,q=0;if(s.boundary==='clamp'){xx=Math.min(s.width-1,Math.max(0,xx));yy=Math.min(s.height-1,Math.max(0,yy));}if(xx>=0&&xx<s.width&&yy>=0&&yy<s.height)q=s.data[yy*s.width+xx];v=s.operation==='dilate'?Math.max(v,q):Math.min(v,q);}out.push(v);}return out;}
test('area endpoints, high coverage and independent geometric oracle',()=>{for(const cov of [0,.001,.2,.5,Math.PI/4,.8,.9,.95,.99,.9999,1]){const p=halftoneScreen(screen([cov])),r=p.cells[0].radius/10;assert.ok(Math.abs(measuredArea(r)-cov)<2e-7,`${cov}`);if(cov===0)assert.equal(r,0);if(cov===1)assert.equal(p.cells[0].radius,10*Math.SQRT1_2);}});
test('matrix, local cell clip, IDs, no state or mutable input sharing',()=>{const s=screen();s.angle=Math.PI/2;const a=halftoneScreen(s);assert.deepEqual(a.cells.map(c=>c.id),['0:0','1:0','2:0']);assert.deepEqual(a.cells[1].clip,[10,0,10,10]);const [m0,m1,m2,m3,tx,ty]=a.matrix;assert.ok(Math.abs(m0*15+m2*5+tx+3)<1e-12);assert.ok(Math.abs(m1*15+m3*5+ty-18)<1e-12);s.values[0]=1;s.origin.x=50;assert.equal(a.cells[0].radius,0);assert.equal(a.matrix[4],2);assert.ok(Object.isFrozen(a.cells[0].clip));assert.throws(()=>{a.cells[0].clip[0]=2;});const b=halftoneScreen(screen());halftoneScreen(screen([.9]));assert.deepEqual(halftoneScreen(screen()),b);});
test('morphology matches independent 2D oracle including radii larger than image',()=>{let seed=7;for(let k=0;k<35;k++){const width=1+k%7,height=1+k%5;const data=Uint8Array.from({length:width*height},()=>{seed=(seed*1664525+1013904223)>>>0;return seed>>>24;});for(const operation of ['dilate','erode'])for(const boundary of ['transparent','clamp'])for(const [radiusX,radiusY] of [[0,0],[1,0],[0,2],[2,3],[8,7]]){const s={width,height,data,operation,boundary,radiusX,radiusY};const got=morphologyCoverage(s);assert.deepEqual([...got.data],oracle(s));for(let i=0;i<data.length;i++)assert.ok(operation==='dilate'?got.data[i]>=data[i]:got.data[i]<=data[i]);}}});
test('transparent, solid, half-coverage and explicit erosion edge',()=>{for(const v of [0,128,255]){const s=mask(Array(6).fill(v));assert.deepEqual([...morphologyCoverage(s).data],Array(6).fill(v));assert.deepEqual([...morphologyCoverage({...s,operation:'erode',boundary:'clamp'}).data],Array(6).fill(v));assert.deepEqual([...morphologyCoverage({...s,operation:'erode'}).data],Array(6).fill(0));}});
test('morphology output owns storage, zero radius identity, clamped input accepted, seek stateless',()=>{const s=mask(undefined,{radiusX:0,radiusY:0});s.data=new Uint8ClampedArray(s.data);const out=morphologyCoverage(s);assert.deepEqual([...out.data],[...s.data]);assert.notEqual(out.data.buffer,s.data.buffer);out.data[0]=77;assert.equal(s.data[0],0);const a=morphologyCoverage(mask());morphologyCoverage(mask([255,255,255,255,255,255]));assert.deepEqual(morphologyCoverage(mask()),a);});
test('screen rejects unknown fields, accessors without execution, sparse arrays and invalid numbers',()=>{let reads=0;const accessor=screen();Object.defineProperty(accessor,'angle',{get(){reads++;return 0;}});assert.throws(()=>halftoneScreen(accessor));const vals=[.5];Object.defineProperty(vals,'0',{get(){reads++;return .5;}});assert.throws(()=>halftoneScreen(screen(vals)));assert.equal(reads,0);for(const s of [{...screen(),extra:0},screen([NaN]),screen([Infinity]),screen([-1]),screen([1.01]),screen(new Array(1)),{...screen(),columns:1025},{...screen(),columns:1024,rows:65},{...screen(),angle:7},{...screen(),cellSize:0},{...screen(),origin:{x:NaN,y:0}},screen(new Float32Array([.2]))])assert.throws(()=>halftoneScreen(s));});
test('morphology validates intrinsic metadata, forbidden buffers and budgets',()=>{let reads=0;const d=new Uint8Array(6);Object.defineProperty(d,'length',{get(){reads++;return 6;}});assert.throws(()=>morphologyCoverage(mask(undefined,{data:d})));assert.equal(reads,0);const d2=new Uint8Array(6);d2.extra=1;assert.throws(()=>morphologyCoverage(mask(undefined,{data:d2})));for(const extras of [{extra:1},{width:0},{width:4097},{width:4096,height:4096},{radiusX:65},{radiusY:.5},{operation:'blur'},{boundary:'mirror'},{data:[0,1,2,3,4,5]},{data:new Uint8Array(5)},{data:new Uint8Array(new SharedArrayBuffer(6))},{data:new Uint8Array(new ArrayBuffer(6,{maxByteLength:12}))}])assert.throws(()=>morphologyCoverage(mask(undefined,extras)));const s=mask();Object.defineProperty(s,'data',{get(){reads++;return new Uint8Array(6);}});assert.throws(()=>morphologyCoverage(s));assert.equal(reads,0);});
test('synthetic larger mask verifies visible gap-filling rather than averaging',()=>{const width=384,height=256,data=new Uint8Array(width*height);for(let y=0;y<height;y++){data.fill(255,y*width,y*width+190);data.fill(255,y*width+193,(y+1)*width);}const s={width,height,data,operation:'dilate',radiusX:2,radiusY:2,boundary:'transparent'};const out=morphologyCoverage(s);assert.equal(data[128*width+191],0);assert.equal(out.data[128*width+191],255);assert.equal(out.data.length,width*height);});
test('resource boundaries, nested non-data shape rejection and detached buffer',()=>{const s=screen([0]);s.columns=256;s.rows=256;s.values=Array(65536).fill(0);assert.equal(halftoneScreen(s).cells.length,65536);assert.throws(()=>halftoneScreen({...s,rows:257}));for(const values of [Object.assign([.1],{extra:1}),Object.assign([.1],{[Symbol('x')]:1})])assert.throws(()=>halftoneScreen(screen(values)));const origin={x:0,y:0};Object.defineProperty(origin,'x',{get(){throw Error('getter must not execute');}});assert.throws(()=>halftoneScreen({...screen([.2]),origin}),/data field/);const d=new Uint8Array(6);structuredClone(d.buffer,{transfer:[d.buffer]});assert.throws(()=>morphologyCoverage(mask(undefined,{data:d})));assert.throws(()=>morphologyCoverage(mask(undefined,{data:Object.create(Uint8Array.prototype)})));});

test('positive subnormal coverage retains positive radius without division underflow',()=>{
  for(const c of [Number.MIN_VALUE,2*Number.MIN_VALUE,16*Number.MIN_VALUE,1e-320,1e-310]){
    for(const cellSize of [.001,1,10000]){
      const result=halftoneScreen({...screen([c]),cellSize});
      const r=result.cells[0].radius;
      assert.ok(r>0 && Number.isFinite(r));
      // Algebraic inverse, deliberately taking sqrt before dividing.
      assert.equal(r,Math.sqrt(c)/Math.sqrt(Math.PI)*cellSize);
    }
  }
});

test('strict data records reject hidden and foreign fields without invoking getters',()=>{
 let reads=0;
 for(const key of ['hidden',Symbol('unknown')]){
  const value=screen([.5]);Object.defineProperty(value,key,{get(){reads++;return 1;}});assert.throws(()=>halftoneScreen(value));
  const data=new Uint8Array(6);Object.defineProperty(data,key,{get(){reads++;return 1;}});assert.throws(()=>morphologyCoverage(mask(undefined,{data})));
 }
 for(const value of [Object.assign(Object.create(null),screen([.5])),vm.runInNewContext('('+JSON.stringify(screen([.5]))+')')])assert.throws(()=>halftoneScreen(value));
 for(const data of [vm.runInNewContext('new Uint8Array(6)'),new(class extends Uint8Array{})(6)])assert.throws(()=>morphologyCoverage(mask(undefined,{data})));
 assert.equal(reads,0);
});
test('clamped morphology complement duality and rectangular separability preserve all bytes',()=>{
 for(let k=0;k<35;k++){
  const width=1+k%9,height=1+k%7,data=Uint8Array.from({length:width*height},(_,i)=>(i*67+k*31)%256),s={width,height,data,operation:'dilate',radiusX:k%5,radiusY:k%4,boundary:'clamp'};
  const d=morphologyCoverage(s),inverse=Uint8Array.from(data,x=>255-x),e=morphologyCoverage({...s,data:inverse,operation:'erode'});
  assert.deepEqual([...d.data],Array.from(e.data,x=>255-x));
  for(const operation of ['dilate','erode'])for(const boundary of ['transparent','clamp']){
   const q={...s,operation,boundary},h=morphologyCoverage({...q,radiusY:0}),v=morphologyCoverage({...q,data:h.data,radiusX:0});assert.deepEqual(v.data,morphologyCoverage(q).data);
  }
 }
});
test('Native synthetic screen and coverage expansion render repeatably in a new process',()=>{
 const {api}=loadNativeCanvas();
 function draw(angle){
  const canvas=api.createCanvas(160,100),ctx=canvas.getContext('2d');ctx.fillStyle='#f4ecd8';ctx.fillRect(0,0,160,100);
  const s=halftoneScreen({columns:4,rows:2,values:[0,.2,.6,1,.1,.75,.9,1],cellSize:18,origin:{x:20,y:20},angle});
  ctx.save();ctx.transform(...s.matrix);ctx.fillStyle='#1d3d64';for(const cell of s.cells){ctx.save();ctx.beginPath();ctx.rect(...cell.clip);ctx.clip();ctx.beginPath();ctx.arc(...cell.center,cell.radius,0,Math.PI*2);ctx.fill();ctx.restore();}ctx.restore();
  const m=morphologyCoverage({width:5,height:3,data:new Uint8Array([0,0,0,0,0,0,128,0,255,0,0,0,0,0,0]),operation:'dilate',radiusX:1,radiusY:0,boundary:'transparent'});
  ctx.fillStyle='#d65c34';for(let i=0;i<m.data.length;i++){ctx.globalAlpha=m.data[i]/255;ctx.fillRect(105+(i%5)*7,30+Math.floor(i/5)*7,7,7);}return createHash('sha256').update(canvas.toBuffer('image/png')).digest('hex');
 }
 const angles=[0,.2,-.1],expected=angles.map(draw);assert.equal(new Set(expected).size,3);assert.deepEqual(angles.toReversed().map(draw),expected.toReversed());assert.deepEqual(angles.map(draw),expected);
 const code=`import{halftoneScreen}from ${JSON.stringify(new URL('../lib/foundations/geometry/halftone-screen.mjs',import.meta.url).href)};import{morphologyCoverage}from ${JSON.stringify(new URL('../lib/foundations/raster/morphology-coverage.mjs',import.meta.url).href)};import{loadNativeCanvas}from ${JSON.stringify(new URL('../../motion-render-core/lib/native.mjs',import.meta.url).href)};import{createHash}from'node:crypto';const{api}=loadNativeCanvas();const draw=${draw.toString()};console.log(JSON.stringify(${JSON.stringify(angles)}.map(draw)));`;
 const child=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});assert.equal(child.status,0,child.stderr);assert.deepEqual(JSON.parse(child.stdout),expected);
});
