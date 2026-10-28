import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {sampleTransition as sample,drawTransition as draw,rational as T} from '../lib/index.mjs';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
const {api}=loadNativeCanvas(),backend={Path2D:api.Path2D};
const spec=(mode='sweep',angle=.17,width=160,height=90)=>({type:'transition.linear-mask',version:1,range:{start:T(1),end:T(3)},params:{width,height,mode,angle}});
const fill=color=>c=>{c.fillStyle=color;c.fillRect(-10,-10,9000,9000);};
function raster(s,t,options={}){const c=api.createCanvas(s.params.width,s.params.height).getContext('2d');draw(c,sample(s,t,options),{outgoing:fill('red'),incoming:fill('blue')},backend);return Buffer.from(c.getImageData(0,0,s.params.width,s.params.height).data);}
test('three variants, rational endpoints, dimensions and frozen local polygon',()=>{
 for(const [mode,angle] of [['band',Math.PI/2],['sweep',.17],['sweep',Math.PI]])for(const [w,h] of [[1,1],[160,90],[90,160],[641,359]]){
  const s=spec(mode,angle,w,h),before=sample(s,T(0)),start=sample(s,T(1)),end=sample(s,T(3));
  assert.equal(before.phase,'before');assert.equal(start.phase,'active');assert.equal(end.phase,'after');assert.deepEqual(start.polygon,[]);
  assert.deepEqual(end.polygon,[{x:0,y:0},{x:w,y:0},{x:w,y:h},{x:0,y:h}]);
  assert.ok(Object.isFrozen(end.polygon[0]));
  for(let i=1;i<100;i++)for(const p of sample(s,T(100+i*2,100)).polygon){assert.ok(p.x>=-1e-9&&p.x<=w+1e-9&&p.y>=-1e-9&&p.y<=h+1e-9);}
 }
 const band=sample(spec('band',Math.PI/2),T(2));assert.ok(band.polygon.every(p=>p.y>=22.5-1e-8&&p.y<=67.5+1e-8));
});
test('strict invalid input, unknown keys, forged states and range errors',()=>{
 for(const params of [{...spec().params,width:NaN},{...spec().params,height:0},{...spec().params,width:8193},{...spec().params,width:8192,height:8192},{...spec().params,mode:'diagonal'},{...spec().params,angle:Infinity},{...spec().params,angle:4},{...spec().params,typo:1},null])assert.throws(()=>sample({...spec(),params},T(2)));
 for(const s of [{...spec(),version:2},{...spec(),range:{start:T(2),end:T(2)}},{...spec(),curve:null},{...spec(),extra:1}])assert.throws(()=>sample(s,T(2)));
 for(const context of [{reducedMotion:null},{reducedMotion:1},{typo:true}])assert.throws(()=>sample(spec(),T(2),context));
 const hidden=Object.defineProperty({...spec().params},'secret',{value:1});assert.throws(()=>sample({...spec(),params:hidden},T(2)));
 const symbolic={...spec().params,[Symbol('bad')]:1};assert.throws(()=>sample({...spec(),params:symbolic},T(2)));
 const c=api.createCanvas(160,90).getContext('2d');assert.throws(()=>draw(c,structuredClone(sample(spec(),T(2))),{outgoing:()=>{},incoming:()=>{}},backend));
});
test('raw midpoint reduced-motion, forward/backward/random seek state and native pixels',()=>{
 const s={...spec(),curve:{type:'cubic-bezier',values:[.7,0,.9,.1]}};
 assert.equal(sample(s,T(1999,1000),{reducedMotion:true}).revealProgress,0);
 assert.equal(sample(s,T(2),{reducedMotion:true}).revealProgress,1);
 assert.deepEqual(raster(s,T(2),{reducedMotion:true}),raster(s,T(3)));
 const points=[T(0),T(1),T(11,10),T(3,2),T(2),T(29,10),T(3),T(4)];
 const states=points.map(t=>sample(s,t)),pixels=points.map(t=>raster(s,t));
 for(const i of [7,0,4,2,6,1,5,3]){assert.deepEqual(sample(s,points[i]),states[i]);assert.deepEqual(raster(s,points[i]),pixels[i]);}
 const url=new URL('../lib/index.mjs',import.meta.url).href;
 const result=execFileSync(process.execPath,['--input-type=module','-e',`import {sampleTransition as s,rational as T} from '${url}';console.log(JSON.stringify(s(${JSON.stringify(s)},T(2))))`],{encoding:'utf8'});
 assert.deepEqual(JSON.parse(result),sample(s,T(2)));
});
test('opaque overlap has no caller-color seam; exact axis-aligned center geometry',()=>{
 for(const mode of ['band','sweep'])for(const angle of [0,.17,Math.PI/2,-.4])for(const t of [T(1),T(11,10),T(2),T(2999,1000),T(3)]){
  const c=api.createCanvas(160,90).getContext('2d');c.fillStyle='lime';c.fillRect(0,0,160,90);draw(c,sample(spec(mode,angle),t),{outgoing:fill('red'),incoming:fill('blue')},backend);
  const data=c.getImageData(0,0,160,90).data;for(let i=0;i<data.length;i+=4){assert.equal(data[i+1],0);assert.equal(data[i+3],255);}
 }
 const d=raster(spec('band',Math.PI/2),T(2));for(const [x,y,blue] of [[80,10,false],[80,45,true],[80,80,false]])assert.equal(d[(y*160+x)*4+2],blue?255:0);
});
test('transparent incoming is over-reveal at end; callback count and state restoration',()=>{
 const c=api.createCanvas(200,120).getContext('2d');
 for(const t of [T(2999,1000),T(3),T(4)]){c.clearRect(0,0,200,120);draw(c,sample(spec(),t),{outgoing:fill('red'),incoming:q=>{q.fillStyle='#0000ff80';q.fillRect(0,0,20,20);}},backend);assert.deepEqual([...c.getImageData(100,50,1,1).data],[255,0,0,255]);}
 for(const [t,n] of [[T(0),0],[T(1),0],[T(2),1],[T(3),1]]){let a=0,b=0;draw(c,sample(spec(),t),{outgoing:()=>a++,incoming:()=>b++},backend);assert.deepEqual([a,b],[1,n]);}
 c.translate(3.5,4.5);c.rotate(.2);c.scale(.8,1.1);c.globalAlpha=.7;c.globalCompositeOperation='multiply';const before=c.getTransform(),alpha=c.globalAlpha;
 c.beginPath();c.rect(0,0,1,1);
 assert.throws(()=>draw(c,sample(spec(),T(2)),{outgoing:()=>{},incoming:q=>{q.translate(50,0);q.globalAlpha=.1;throw Error('fixture');}},backend),/fixture/);
 assert.deepEqual(c.getTransform(),before);assert.equal(c.globalAlpha,alpha);assert.equal(c.globalCompositeOperation,'multiply');
 assert.throws(()=>draw(c,sample(spec(),T(1)),{outgoing:()=>{},incoming:async()=>{}},backend));
 assert.throws(()=>draw(c,sample(spec(),T(2)),{outgoing:()=>{},incoming:()=>Promise.resolve()},backend));
 assert.throws(()=>draw(c,sample(spec(),T(1)),{outgoing:()=>{},incoming:()=>{}},{}));
 // Adapter paths must not replace a caller's pre-existing current path.
 const p=api.createCanvas(200,120).getContext('2d');p.beginPath();p.rect(180,100,10,10);draw(p,sample(spec(),T(2)),{outgoing:()=>{},incoming:()=>{}},backend);p.fillStyle='blue';p.fill();assert.equal(p.getImageData(185,105,1,1).data[2],255);
});
test('diagonal geometry agrees with independent half-plane pixel classification',()=>{
 for(const [w,h] of [[160,90],[90,160]])for(const angle of [.17,-.4,2.7])for(const mode of ['sweep','band']){
 const s=spec(mode,angle,w,h),q=.37,d=raster(s,T(174,100)),nx=Math.cos(angle),ny=Math.sin(angle);
 const values=[0,w*nx,h*ny,w*nx+h*ny],lo=Math.min(...values),hi=Math.max(...values);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const v=(x+.5)*nx+(y+.5)*ny,dist=mode==='sweep'?lo+(hi-lo)*q-v:(hi-lo)*q/2-Math.abs(v-(lo+hi)/2);
  if(Math.abs(dist)<2)continue;assert.equal(d[(y*w+x)*4+2],dist>0?255:0);
 }
 }
});
test('neutral examples use three variants in normal/reduced modes at portrait and landscape sizes',async()=>{
 const {drawLinearMaskStudy}=await import('../examples/linear-mask-study.mjs');
 for(const [width,height] of [[160,90],[90,160]])for(const variant of ['band','diagonal','reverse'])for(const reducedMotion of [false,true]){
  const c=api.createCanvas(width,height).getContext('2d');const result=drawLinearMaskStudy(c,T(2),{width,height,variant,reducedMotion,Path2D:api.Path2D});assert.equal(result.viewport.width,width);
 }
});
