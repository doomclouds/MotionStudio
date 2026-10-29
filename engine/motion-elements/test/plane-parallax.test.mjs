import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {planeParallaxLayout as layout} from '../lib/plane-parallax.mjs';
import {transformPoint,composeTransform} from '../lib/matrix.mjs';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
const base={planes:[{itemId:'near',depth:600},{itemId:'far',depth:2400}],reference:{width:1920,height:1080},camera:{x:0,y:0,z:0,focalLength:900},viewport:{x:0,y:0,width:1920,height:1080},near:1};
const clone=x=>structuredClone(x);
const near=(a,b,tolerance=1e-8)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b} (tol ${tolerance})`);
const projected=(spec,point)=>layout(spec).map(p=>transformPoint(p.matrix,point));
test('zero camera calibrates every plane to the same reference pixels exactly',()=>{
 const s={...base,planes:[.001,.1,7,999,1e6].map((depth,i)=>({itemId:'p'+i,depth})),near:.001};
 for(const p of layout(s)){assert.equal(p.scale,1);assert.deepEqual(p.matrix,[1,0,0,1,0,0]);assert.equal(p.distance,p.depth);}
});
test('viewport contain centers unequal aspect ratio without stretching or implicit crop',()=>{
 const s={...base,reference:{width:200,height:100},viewport:{x:30,y:-10,width:100,height:100}};
 for(const p of layout(s)){assert.equal(p.scale,.5);assert.deepEqual(transformPoint(p.matrix,{x:0,y:0}),{x:30,y:15});assert.deepEqual(transformPoint(p.matrix,{x:200,y:100}),{x:130,y:65});}
});
test('positive and negative camera translations give inverse depth shift, not uniform pan',()=>{
 const center={x:960,y:540};
 for(const sign of [-1,1]){
  const points=projected({...base,camera:{...base.camera,x:40*sign,y:-20*sign}},center);
  near(points[0].x,960-sign*60);near(points[1].x,960-sign*15);near(points[0].y,540+sign*30);near(points[1].y,540+sign*7.5);
 }
});
test('forward depth motion magnifies near planes more; backwards shrinks; reference center stays centered',()=>{
 for(const z of [-300,180]){
  const s={...base,camera:{...base.camera,z}},out=layout(s);
  near(out[0].scale,600/(600-z));near(out[1].scale,2400/(2400-z));
  assert.ok(z>0?out[0].scale>out[1].scale:out[0].scale<out[1].scale);
  for(const p of out){const point=transformPoint(p.matrix,{x:960,y:540});near(point.x,960);near(point.y,540);}
 }
});
test('independent calibrated world-point pinhole projection matches matrix output',()=>{
 let seed=209715;const unit=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<5000;i++){
  const depth=100+unit()*9000,focalLength=50+unit()*3000;
  const s={planes:[{itemId:'plane',depth}],reference:{width:200+unit()*1800,height:100+unit()*1000},camera:{x:(unit()-.5)*1000,y:(unit()-.5)*1000,z:(unit()-.5)*100,focalLength},viewport:{x:(unit()-.5)*1000,y:(unit()-.5)*1000,width:200+unit()*1800,height:100+unit()*1000},near:1};
  const point={x:unit()*s.reference.width,y:unit()*s.reference.height};
  // Construct a point on the physical pinhole image's depth plane first.
  // This is a separate world-coordinate projection, not the affine coefficient formula.
  const world={x:(point.x-s.reference.width/2)*depth/focalLength,y:(point.y-s.reference.height/2)*depth/focalLength,z:depth};
  const ray={x:world.x-s.camera.x,y:world.y-s.camera.y,z:world.z-s.camera.z};
  const t=focalLength/ray.z,fit=Math.min(s.viewport.width/s.reference.width,s.viewport.height/s.reference.height);
  const oracle={x:s.viewport.x+s.viewport.width/2+ray.x*t*fit,y:s.viewport.y+s.viewport.height/2+ray.y*t*fit};
  const actual=transformPoint(layout(s)[0].matrix,point);near(actual.x,oracle.x);near(actual.y,oracle.y);
 }
});
test('layer identity and input drawing order remain explicit; deletion/reordering does not alter other layers',()=>{
 const s={...base,camera:{...base.camera,x:120,y:-30,z:150}},out=layout(s);
 assert.deepEqual(layout({...s,planes:[...s.planes].reverse()}),[...out].reverse());
 assert.deepEqual(layout({...s,planes:[s.planes[1]]}),[out[1]]);
 assert.deepEqual(layout({...s,planes:[s.planes[0],{itemId:'same-depth',depth:600}]}).map(x=>x.matrix),[out[0].matrix,out[0].matrix]);
});
test('viewport translation composes with output exactly within floating tolerance',()=>{
 const s={...base,camera:{...base.camera,x:123,y:-44,z:180}},a=layout(s),b=layout({...s,viewport:{...s.viewport,x:100,y:-75}});
 for(let i=0;i<a.length;i++){assert.deepEqual(a[i].matrix.slice(0,4),b[i].matrix.slice(0,4));near(b[i].matrix[4]-a[i].matrix[4],100);near(b[i].matrix[5]-a[i].matrix[5],-75);}
});
test('near distance is inclusive and enforced for every plane, with no behind-camera flipping',()=>{
 const s={...base,planes:[{itemId:'p',depth:10}],near:2,camera:{...base.camera,z:8}};
 assert.equal(layout(s)[0].distance,2);
 for(const z of [8.0001,10,11])assert.throws(()=>layout({...s,camera:{...s.camera,z}}),/near distance/);
 assert.throws(()=>layout({...s,planes:[s.planes[0],{itemId:'bad',depth:9}]}),/near distance/);
});
test('near comparison uses IEEE difference, not exact decimal distance or epsilon snapping',()=>{
 const s={...base,planes:[{itemId:'p',depth:.3}],near:.1,camera:{...base.camera,z:.2}};
 assert.equal(.3-.2,.09999999999999998);assert.throws(()=>layout(s),/near distance/);
});
test('derived scale and translation bounds reject combinations rather than clamp outputs',()=>{
 const s={...base,planes:[{itemId:'p',depth:1}],near:.001,reference:{width:.001,height:.001},viewport:{x:0,y:0,width:1,height:1}};
 assert.equal(layout(s)[0].scale,1000);assert.throws(()=>layout({...s,viewport:{...s.viewport,width:1.001,height:1.001}}));
 assert.throws(()=>layout({...base,planes:[{itemId:'p',depth:.001}],near:.001,camera:{x:1e6,y:0,z:0,focalLength:1e6}}));
 assert.throws(()=>layout({...base,planes:[{itemId:'p',depth:.001}],near:.001,camera:{x:0,y:-1e6,z:0,focalLength:1e6}}));
});
test('declared extreme dimensions, positive tiny scales and derived distance above input depth limit are finite',()=>{
 const s={...base,planes:[{itemId:'p',depth:.001}],near:.001,reference:{width:1e6,height:1e6},viewport:{x:-1e6,y:1e6,width:.001,height:.001},camera:{x:0,y:0,z:-1e6,focalLength:.001}};
 const p=layout(s)[0];assert.ok(p.distance>1e6);assert.ok(p.scale>0&&p.scale<1e-17);assert.ok(p.matrix.every(Number.isFinite));
 assert.doesNotThrow(()=>composeTransform({scaleX:p.scale,scaleY:p.scale,x:p.matrix[4],y:p.matrix[5]}));
 assert.doesNotThrow(()=>transformPoint(p.matrix,{x:1e6,y:1e6}));
});
test('every required nested field rejects omission, unknown/symbol fields, null and non-plain objects',()=>{
 for(const key of Object.keys(base)){const s=clone(base);delete s[key];assert.throws(()=>layout(s));assert.throws(()=>layout({...base,[key]:null}));}
 for(const path of ['reference','camera','viewport']){
  for(const key of Object.keys(base[path])){const s=clone(base);delete s[path][key];assert.throws(()=>layout(s));}
  for(const patch of [{...base[path],typo:1},{...base[path],[Symbol('x')]:1},[],new Date()])assert.throws(()=>layout({...base,[path]:patch}));
 }
 for(const patch of [null,[],new Date(),{...base,typo:1},{...base,[Symbol('x')]:1}])assert.throws(()=>layout(patch));
 for(const p of [{itemId:'x'},{depth:100},{itemId:'x',depth:100,extra:1},{itemId:'x',depth:100,[Symbol('x')]:1},new Date()])assert.throws(()=>layout({...base,planes:[p]}));
});
test('all scalar bounds and finite numeric types are validated',()=>{
 const fields=[['near',null,.001,1e6],['reference','width',.001,1e6],['reference','height',.001,1e6],['viewport','width',.001,1e6],['viewport','height',.001,1e6],['viewport','x',-1e6,1e6],['viewport','y',-1e6,1e6],['camera','x',-1e6,1e6],['camera','y',-1e6,1e6],['camera','z',-1e6,1e6],['camera','focalLength',.001,1e6]];
 for(const [parent,key,min,max]of fields)for(const bad of [NaN,Infinity,-Infinity,'1',null,undefined,min-1,max+1]){const s=clone(base);if(key)s[parent][key]=bad;else s[parent]=bad;assert.throws(()=>layout(s));}
 for(const bad of [0,.0009,1e6+1,NaN,Infinity,'600',null,undefined])assert.throws(()=>layout({...base,planes:[{itemId:'p',depth:bad}]}));
});
test('planes are bounded ordinary dense arrays and IDs are strict unique identities',()=>{
 for(const planes of [[],Array(1),[...base.planes,...Array(63).fill(base.planes[0])],{},new (class A extends Array{})(base.planes[0]),runInNewContext('[{itemId:"x",depth:500}]'),Object.assign([...base.planes],{extra:1}),Object.assign([...base.planes],{[Symbol('x')]:1})])assert.throws(()=>layout({...base,planes}));
 for(const itemId of ['',null,12,'a'.repeat(65),'a.b','has space'])assert.throws(()=>layout({...base,planes:[{itemId,depth:600}]}));
 assert.throws(()=>layout({...base,planes:[base.planes[0],base.planes[0]]}),/Duplicate/);
 assert.equal(layout({...base,planes:Array.from({length:64},(_,i)=>({itemId:'p_'+i,depth:600}))}).length,64);
 assert.doesNotThrow(()=>layout({...base,planes:[{itemId:'a'.repeat(64),depth:600}]}));
});
test('inputs are untouched, results detached and deeply frozen without branding hidden state',()=>{
 const s=clone(base),before=JSON.stringify(s),out=layout(s);assert.equal(JSON.stringify(s),before);s.planes[0].depth=999;s.camera.x=100;s.viewport.x=90;
 assert.equal(out[0].depth,600);assert.equal(out[0].matrix[4],0);
 assert.ok(Object.isFrozen(out));assert.ok(Object.isFrozen(out[0]));assert.ok(Object.isFrozen(out[0].matrix));assert.throws(()=>{out[0].matrix[0]=2;});
 assert.deepEqual(JSON.parse(JSON.stringify(out)),layout(base));assert.notEqual(layout(base)[0].matrix,out[0].matrix);
 const nullObject=Object.assign(Object.create(null),base);assert.deepEqual(layout(nullObject),layout(base));
});
test('absolute input order, repeat calls and an independent Node process produce identical values',()=>{
 const inputs=[0,.2,.5,.8,1].map(t=>({...base,camera:{...base.camera,x:160*t,y:-20*t,z:180*t}})),expected=inputs.map(layout);
 for(const i of [4,0,2,1,3,2])assert.deepEqual(layout(inputs[i]),expected[i]);
 const code=`import{planeParallaxLayout as layout}from ${JSON.stringify(new URL('../lib/plane-parallax.mjs',import.meta.url).href)};console.log(JSON.stringify(${JSON.stringify(inputs)}.map(layout)));`;
 const r=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.deepEqual(JSON.parse(r.stdout),expected);
});
test('Native layer matrices draw different depth motions, preserve caller state, and replay across process',()=>{
 const {api}=loadNativeCanvas();
 const inputs=[0,4,8].map(x=>({planes:[{itemId:'far',depth:120},{itemId:'near',depth:40}],reference:{width:80,height:60},camera:{x,y:0,z:4,focalLength:40},viewport:{x:0,y:0,width:80,height:60},near:1}));
 const draw=s=>{const canvas=api.createCanvas(80,60),ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,80,60);ctx.globalAlpha=.75;ctx.lineWidth=7;const before={alpha:ctx.globalAlpha,line:ctx.lineWidth,transform:ctx.getTransform().toString()};
  for(const p of layout(s)){ctx.save();try{ctx.transform(...p.matrix);ctx.fillStyle=p.itemId==='far'?'#263c54':'#e86c42';ctx.fillRect(p.itemId==='far'?15:45,15,12,25);}finally{ctx.restore();}}
  assert.equal(ctx.globalAlpha,before.alpha);assert.equal(ctx.lineWidth,before.line);assert.equal(ctx.getTransform().toString(),before.transform);
  return createHash('sha256').update(canvas.toBuffer('image/png')).digest('hex');};
 const hashes=inputs.map(draw);assert.equal(new Set(hashes).size,3);assert.deepEqual([...inputs].reverse().map(draw),[...hashes].reverse());
 const code=`import{planeParallaxLayout as layout}from ${JSON.stringify(new URL('../lib/plane-parallax.mjs',import.meta.url).href)};import{loadNativeCanvas}from ${JSON.stringify(new URL('../../motion-render-core/lib/native.mjs',import.meta.url).href)};import{createHash}from'node:crypto';import assert from'node:assert/strict';const{api}=loadNativeCanvas();const draw=${draw.toString()};console.log(JSON.stringify(${JSON.stringify(inputs)}.map(draw)));`;
 const r=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.deepEqual(JSON.parse(r.stdout),hashes);
});

test('exact derived translation limits are accepted and beyond-limit values reject',()=>{
 const s={planes:[{itemId:'p',depth:1}],reference:{width:1,height:1},camera:{x:0,y:0,z:0,focalLength:1e6},viewport:{x:0,y:0,width:1,height:1},near:1};
 for(const sign of [-1,1]){
  const a=layout({...s,camera:{...s.camera,x:-1000*sign,y:1000*sign}})[0];
  assert.equal(a.matrix[4],1e9*sign);assert.equal(a.matrix[5],-1e9*sign);
  assert.doesNotThrow(()=>transformPoint(a.matrix,{x:0,y:0}));
  assert.throws(()=>layout({...s,camera:{...s.camera,x:-1000.000001*sign}}));
 }
});

test('public index exposes the same plane projection function without a second state store',async()=>{
 const api=await import('../lib/index.mjs');assert.equal(api.planeParallaxLayout,layout);assert.deepEqual(api.planeParallaxLayout(base),layout(base));
});
