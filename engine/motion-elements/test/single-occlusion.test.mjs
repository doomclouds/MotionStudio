import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRasterSnapshot as snap,copyRasterPixels as copy} from '../lib/raster-effects.mjs';
import {sampleSingleOcclusion as compose} from '../lib/support/single-occlusion.mjs';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
const one=p=>snap({width:1,height:1,pixels:p});
const front={r:110,g:153,b:151,a:255};
const args=()=>({background:one([240,238,231,255]),subject:one([190,116,48,255]),mask:one([0,0,0,128]),front:{...front}});
// Independent sequential source-over, floating-point straight alpha. No intermediate byte rounding.
function over(top,bottom){const a=top[3]+bottom[3]*(1-top[3]);return [...[0,1,2].map(k=>a?(top[k]*top[3]+bottom[k]*bottom[3]*(1-top[3]))/a:0),a];}
function oracle(b,s,m,f){const p=over([f.r,f.g,f.b,m/255*f.a/255],over([...s.slice(0,3),s[3]/255],[...b.slice(0,3),b[3]/255]));return Math.round(p[3]*255)?[...p.slice(0,3).map(Math.round),Math.round(p[3]*255)]:[0,0,0,0];}
test('sequential oracle: alpha extremes, fractional edges, backgrounds and uniform colors',()=>{
 for(const ba of [0,1,90,255])for(const sa of [0,1,115,255])for(const ma of [0,1,64,128,254,255])for(const fa of [0,1,128,255]){
  const b=[17,43,92,ba],s=[211,67,28,sa],f={r:31,g:179,b:140,a:fa};
  assert.deepEqual([...copy(compose({background:one(b),subject:one(s),mask:one([79,33,252,ma]),front:f}))],oracle(b,s,ma,f));
 }
});
test('snapshot immutability, determinism and mask RGB independence',()=>{
 const a=args(),before=copy(a.subject),x=compose(a);copy(x).fill(0);
 assert.deepEqual(copy(a.subject),before);assert.deepEqual(copy(x),copy(compose(a)));
 assert.deepEqual(copy(x),copy(compose({...a,mask:one([255,255,255,128])})));assert(Object.isFrozen(x));
});
test('reject malformed records, colors, dimensions and unbranded snapshots',()=>{
 for(const x of [null,[],{}, {...args(),extra:true},{...args(),[Symbol()]:true}])assert.throws(()=>compose(x));
 for(const k of Object.keys(args())){const a=args();delete a[k];assert.throws(()=>compose(a));}
 for(const v of [-1,256,NaN,Infinity,1.5,'1',null])assert.throws(()=>compose({...args(),front:{...front,a:v}}));
 for(const f of [[],{},[1,2,3,4],{...front,extra:0}])assert.throws(()=>compose({...args(),front:f}));
 const getter={...front};Object.defineProperty(getter,'r',{get(){throw Error('getter must not execute')}});assert.throws(()=>compose({...args(),front:getter}),/Accessor/);
 const a=args();Object.defineProperty(a,'subject',{get(){throw Error('getter must not execute')}});assert.throws(()=>compose(a),/Accessor/);
 for(const k of ['background','subject','mask'])assert.throws(()=>compose({...args(),[k]:{width:1,height:1,pixels:[0,0,0,0]}}),/snapshot/);
 assert.throws(()=>compose({...args(),mask:snap({width:2,height:1,pixels:new Uint8ClampedArray(8)})}),/dimensions/);
 assert.throws(()=>snap({width:4097,height:1,pixels:[]}));assert.throws(()=>snap({width:2048,height:1025,pixels:[]}));
 assert.throws(()=>snap({width:1,height:1,pixels:new Uint8ClampedArray(new SharedArrayBuffer(4))}));
});
test('negative causes separated: opaque antialias double attenuation vs transparent material erasure',()=>{
 const b=[240,238,231,255],s=[190,116,48,255];
 for(const [m,fa,cause] of [[128,255,'double edge attenuation'],[255,128,'transparent material erasure']]){
  const f={...front,a:fa},correct=oracle(b,s,m,f),cut=[...s.slice(0,3),Math.round(s[3]*(1-m/255))],wrong=oracle(b,cut,m,f);
  assert(Math.max(...correct.slice(0,3).map((v,k)=>Math.abs(v-wrong[k])))>10,cause);
 }
});
test('Native Canvas independent painter oracle: final alpha and black/white display RGB',()=>{
 const {api}=loadNativeCanvas(),{createCanvas}=api;
 const read=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data;
 const snapshot=c=>snap({width:c.width,height:c.height,pixels:read(c)});
 let edges=0;
 for(const [w,h] of [[64,48],[113,71],[240,120]])for(const shape of ['ellipse','rotated-rect'])for(const fa of [128,255])for(const ba of [90,255]){
  const b=createCanvas(w,h),s=createCanvas(w,h),m=createCanvas(w,h),p=createCanvas(w,h),q=createCanvas(w,h);
  const bc=b.getContext('2d'),sc=s.getContext('2d');bc.fillStyle=`rgba(17,43,92,${ba/255})`;bc.fillRect(0,0,w,h);
  sc.fillStyle='rgba(211,67,28,0.6)';sc.fillRect(w*.12,h*.1,w*.76,h*.8);
  const draw=(ctx,color)=>{ctx.fillStyle=color;ctx.beginPath();if(shape==='ellipse'){ctx.ellipse(w*.51,h*.6,w*.39,h*.22,.13,0,Math.PI*2);}else{ctx.save();ctx.translate(w*.5,h*.6);ctx.rotate(.19);ctx.rect(-w*.4,-h*.2,w*.8,h*.4);ctx.restore();}ctx.fill();};
  draw(m.getContext('2d'),'white');draw(p.getContext('2d'),`rgba(110,153,151,${fa/255})`);
  const qc=q.getContext('2d');qc.drawImage(b,0,0);qc.drawImage(s,0,0);qc.drawImage(p,0,0);
  const result=copy(compose({background:snapshot(b),subject:snapshot(s),mask:snapshot(m),front:{...front,a:fa}})),expected=read(q),mask=read(m);
  for(let i=0;i<result.length;i+=4){
   assert(Math.abs(result[i+3]-expected[i+3])<=1);
   if(mask[i+3]>0&&mask[i+3]<255)edges++;
   for(const base of [0,255])for(let k=0;k<3;k++){
    const display=(v)=>Math.round(v[i+k]*v[i+3]/255+base*(1-v[i+3]/255));
    assert(Math.abs(display(result)-display(expected))<=3,`${w} ${shape} ${fa} ${ba} pixel ${i/4}`);
   }
  }
 }
 assert(edges>100);
});

test('restricted candidate remains discoverable without barrel or catalog promotion',()=>{
 const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
 assert(read('../README.md').includes('docs/single-occlusion-candidate.md'));
 const recipesURL=new URL('../../../knowledge/design/library/recipes.md',import.meta.url);
 const links=[...readFileSync(recipesURL,'utf8').matchAll(/\]\(([^)]+single-occlusion-candidate\.md)\)/g)];
 // Packaging relocates engine/ to runtime/. Verify the resolved destination,
 // not one checkout-specific spelling, without relaxing candidate visibility.
 const expected=new URL('../docs/single-occlusion-candidate.md',import.meta.url);
 assert(links.some(([,target])=>new URL(target,recipesURL).href===expected.href));
 assert(readFileSync(expected,'utf8').length>0);
 assert(!read('../lib/index.mjs').includes('single-occlusion'));
 assert(!read('../catalog.json').includes('single-occlusion'));
});
