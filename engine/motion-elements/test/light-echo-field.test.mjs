import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {compileLightEchoField as compile,sampleLightEchoField as sample,drawLightEchoField as draw,rational as T,framesToTime} from '../lib/index.mjs';
import {example,createScene,config} from '../examples/light-echo-field-scene.mjs';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
const copy=()=>structuredClone(example),{api}=loadNativeCanvas();
test('light echo is immutable, seek-safe, bounded and fractional-rate addressable',()=>{
 const input=copy(),original=copy(),p=compile(input),frames=[0,1,2,97,209,210];
 assert.deepEqual(input,original);assert.ok(Object.isFrozen(p.lights[0].echo.fragments));assert.equal(Object.isFrozen(input),false);
 const states=frames.map(f=>sample(p,framesToTime(f,{n:30000,d:1001})));
 for(let i=frames.length-1;i>=0;i--)assert.deepEqual(sample(p,framesToTime(frames[i],{n:30000,d:1001})),states[i]);
 assert.deepEqual(sample(p,T(-1)).lights,sample(p,T(0)).lights);assert.deepEqual(sample(p,T(100)).lights,sample(p,T(7)).lights);
 assert.equal(sample(p,T(7)).phase,'after');assert.equal(sample(p,T(6999,1000)).phase,'active');
 input.lights[0].color[0]=0;assert.equal(p.lights[0].color[0],255);
});
test('IDs, not array positions, own fragments and phase; seed only changes echoes',()=>{
 const a=copy(),b=copy();b.lights.reverse();const sa=sample(compile(a),T(3)),sb=sample(compile(b),T(3));
 for(const l of sa.lights)assert.deepEqual(l,sb.lights.find(v=>v.id===l.id));
 b.seed='different';const changed=sample(compile(b),T(3));
 assert.notDeepEqual(changed.lights.find(l=>l.id==='amber').fragments,sa.lights[0].fragments);
 for(const l of changed.lights){const before=sa.lights.find(v=>v.id===l.id);assert.equal(l.radius,before.radius);assert.equal(l.x,before.x);assert.deepEqual(l.color,before.color);for(const f of l.fragments)assert.equal(f.sourceId,l.id);}
});
test('focus cannot move layout or resize echoes; reduced motion holds all geometry',()=>{
 const a=copy(),b=copy();b.focus={from:3,to:4};
 const x=sample(compile(a),T(3)),y=sample(compile(b),T(3));assert.deepEqual(x.motion,y.motion);
 x.lights.forEach((l,i)=>{assert.equal(l.x,y.lights[i].x);assert.equal(l.y,y.lights[i].y);assert.deepEqual(l.fragments,y.lights[i].fragments);assert.notEqual(l.radius,y.lights[i].radius);});
 const p=compile(a);assert.deepEqual(sample(p,T(0),{reducedMotion:true}).lights,sample(p,T(7),{reducedMotion:true}).lights);
 assert.deepEqual(sample(p,T(0),{reducedMotion:true}).motion.matrix,sample(p,T(7),{reducedMotion:true}).motion.matrix);
});
test('strict input validation rejects malformed specs, identity and runtime states',()=>{
 for(const edit of [s=>s.lights.push(s.lights[0]),s=>s.lights[0].id='',s=>s.seed=null,s=>s.focus.to=NaN,s=>s.focus.extra=1,s=>s.lights[0].echo.count=65,s=>s.lights[0].echo.heightMin=100,s=>s.lights[0].color=[255,0,256],s=>s.lights[0].echo=null,s=>s.range.end=T(0),s=>s.drift.frequencyHz=-1,s=>s.camera.from.x=Infinity,s=>s.lights=[],s=>s.lights=new Array(2),s=>delete s.lights[0].color[1],s=>s.camera.from=Object.assign(Object.create({hidden:1}),s.camera.from)]){const s=copy();edit(s);assert.throws(()=>compile(s));}
 const p=compile(copy());assert.throws(()=>sample({},T(0)));assert.throws(()=>sample(p,T(0),{reducedMotion:null}));assert.throws(()=>sample(p,{n:'1',d:'0'}));assert.throws(()=>draw({},{}));
 const s=copy();delete s.lights[0].echo;assert.deepEqual(sample(compile(s),T(2)).lights[0].fragments,[]);
});
test('native Canvas drawing restores state, clip and current path on success/error',()=>{
 const s=sample(compile(copy()),T(3));
 for(const fail of [false,true]){
  const a=api.createCanvas(960,540).getContext('2d'),b=api.createCanvas(960,540).getContext('2d');
  for(const c of [a,b]){c.translate(2,3);c.globalAlpha=.7;c.globalCompositeOperation='multiply';c.fillStyle='red';c.beginPath();c.rect(0,0,80,80);c.clip();c.beginPath();c.rect(0,0,100,100);}
  if(fail){a.createRadialGradient=()=>{throw Error('injected');};assert.throws(()=>draw(a,s),/injected/);}else draw(a,s);
  // Native fillStyle getter may cache the last assignment; verify restored paint pixels.
  a.clearRect(-2,-3,960,540);a.fill();b.fill();
  assert.deepEqual(a.getImageData(0,0,960,540).data,b.getImageData(0,0,960,540).data);
  assert.deepEqual(a.getTransform(),b.getTransform());assert.equal(a.globalAlpha,b.globalAlpha);assert.equal(a.globalCompositeOperation,b.globalCompositeOperation);
 }
});
test('synthetic native frames have deterministic seeks, both motion modes',async()=>{
 for(const reducedMotion of [false,true]){
 const canvas=api.createCanvas(config.width,config.height),ctx=canvas.getContext('2d'),scene=await createScene({ctx},{reducedMotion}),hash=()=>createHash('sha256').update(canvas.toBuffer('image/png')).digest('hex'),known=new Map();
 for(const f of [0,1,90,91,209,210]){scene.renderFrame(f);known.set(f,hash());}
 for(const f of [210,91,0,209,90,1]){scene.renderFrame(f);assert.equal(hash(),known.get(f));}
 assert.equal(known.get(0)===known.get(209),reducedMotion);
 }
});
