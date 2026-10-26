import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {sampleTransition as sample,drawTransition as draw,rational as T} from '../lib/index.mjs';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
const {api}=loadNativeCanvas(),backend={Path2D:api.Path2D};
const spec={type:'transition.iris-reveal',version:1,range:{start:T(1),end:T(3)},params:{width:240,height:180,center:{x:103.35,y:87.65}}};
const fill=color=>ctx=>{ctx.fillStyle=color;ctx.fillRect(-30,-30,300,240);};
test('iris radial progress covers every corner and strict domains reject unsupported modes',()=>{
 for(const center of [{x:0,y:0},{x:240,y:180},{x:103.35,y:87.65}]){
 const s={...spec,params:{...spec.params,center}},mid=sample(s,T(2)),end=sample(s,T(3));
 assert.equal(mid.radius,mid.maxRadius/2);assert.equal(end.radius,end.maxRadius);assert.equal(end.composition,'over-reveal');
 for(const [x,y] of [[0,0],[240,0],[0,180],[240,180]])assert.ok(end.radius>=Math.hypot(x-center.x,y-center.y));
 }
 for(const p of [{...spec.params,center:{x:-1,y:0}},{...spec.params,center:null},{...spec.params,width:8193},{...spec.params,width:8192,height:8192},{...spec.params,direction:'out'},{...spec.params,areaMode:true}])assert.throws(()=>sample({...spec,params:p},T(2)));
});
test('iris end and after retain both callbacks; reduced uses raw midpoint not eased progress',()=>{
 const canvas=api.createCanvas(240,180),ctx=canvas.getContext('2d');
 for(const [at,count] of [[T(0),[1,0]],[T(1),[1,0]],[T(2),[1,1]],[T(3),[1,1]],[T(4),[1,1]]]){
 let a=0,b=0;draw(ctx,sample(spec,at),{outgoing:()=>a++,incoming:()=>b++},backend);assert.deepEqual([a,b],count);
 }
 const curved={...spec,curve:{type:'cubic-bezier',values:[.7,0,.9,.1]}};
 assert.equal(sample(curved,T(1999,1000),{reducedMotion:true}).revealProgress,0);
 assert.equal(sample(curved,T(2),{reducedMotion:true}).revealProgress,1);
 assert.ok(sample(curved,T(2)).revealProgress<.5);
});
test('iris fractional native circle over opaque A has no green internal edge leakage',()=>{
 const ctx=api.createCanvas(240,180).getContext('2d');
 for(const at of [T(13,10),T(7,4),T(2),T(2999,1000),T(3)]){
 ctx.fillStyle='lime';ctx.fillRect(0,0,240,180);
 draw(ctx,sample(spec,at),{outgoing:fill('red'),incoming:fill('blue')},backend);
 const data=ctx.getImageData(0,0,240,180).data;
 for(let i=0;i<data.length;i+=4){assert.equal(data[i+1],0);assert.equal(data[i+3],255);}
 }
});
test('transparent B intentionally retains A at end and after with no last-frame A withdrawal',()=>{
 const ctx=api.createCanvas(240,180).getContext('2d');
 const incoming=c=>{c.fillStyle='#0000ff80';c.fillRect(0,0,100,180);};
 const hashes=[];
 for(const at of [T(2999999,1000000),T(3),T(3000001,1000000),T(4)]){
 ctx.clearRect(0,0,240,180);draw(ctx,sample(spec,at),{outgoing:fill('red'),incoming},backend);
 assert.deepEqual([...ctx.getImageData(170,90,1,1).data],[255,0,0,255]);hashes.push([...ctx.getImageData(20,90,1,1).data]);
 }
 hashes.forEach(v=>assert.deepEqual(v,hashes[0]));
});
test('iris isolates parent/clip/composite/alpha and leaves caller current path even on error',()=>{
 const ctx=api.createCanvas(400,300).getContext('2d');ctx.beginPath();ctx.rect(350,250,20,20);
 ctx.translate(17.5,11.5);ctx.scale(1.1,.8);ctx.globalAlpha=.7;ctx.globalCompositeOperation='multiply';
 const transform=ctx.getTransform(),alpha=ctx.globalAlpha;
 assert.throws(()=>draw(ctx,sample(spec,T(2)),{outgoing:fill('red'),incoming:c=>{c.translate(3,4);throw Error('fixture');}},backend),/fixture/);
 assert.deepEqual(ctx.getTransform(),transform);assert.equal(ctx.globalAlpha,alpha);assert.equal(ctx.globalCompositeOperation,'multiply');
 ctx.resetTransform();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle='blue';
 const pathCtx=api.createCanvas(400,300).getContext('2d');pathCtx.beginPath();pathCtx.rect(350,250,20,20);
 assert.throws(()=>draw(pathCtx,sample(spec,T(2)),{outgoing:()=>{},incoming:()=>{throw Error('path');}},backend));pathCtx.fillStyle='blue';pathCtx.fill();assert.equal(pathCtx.getImageData(360,260,1,1).data[2],255);
 ctx.fillRect(390,0,10,10);assert.equal(ctx.getImageData(395,5,1,1).data[2],255);
 assert.throws(()=>draw(ctx,sample(spec,T(1)),{outgoing:()=>{},incoming:async()=>{}},backend));
 assert.throws(()=>draw(ctx,sample(spec,T(2)),{outgoing:()=>{},incoming:()=>Promise.resolve()},backend));
 assert.throws(()=>draw(ctx,sample(spec,T(2)),{outgoing:()=>{},incoming:()=>{}},{...backend,typo:1}));
});
test('iris seeks deterministically across processes and shifts absolute intervals',()=>{
 const expected=new Map([0,1,2,3,4].map(n=>[n,sample(spec,T(n))]));
 for(const n of [4,2,0,3,1])assert.deepEqual(sample(spec,T(n)),expected.get(n));
 const shifted={...spec,range:{start:T(11),end:T(13)}};
 for(const n of [0,1,2,3,4])assert.deepEqual(sample(shifted,T(n+10)),expected.get(n));
 const url=new URL('../lib/index.mjs',import.meta.url).href;
 const result=execFileSync(process.execPath,['--input-type=module','-e',`import {sampleTransition as s,rational as T} from '${url}';console.log(JSON.stringify(s(${JSON.stringify(spec)},T(2))))`],{encoding:'utf8'});
 assert.deepEqual(JSON.parse(result),expected.get(2));
});
