import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {solveTwoLinkIK as solve} from '../lib/two-link-ik.mjs';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
const base={root:{x:0,y:0},target:{x:50,y:0},upperLength:30,lowerLength:40,bend:'positive',fallbackAxis:{x:1,y:0}};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const near=(a,b,tol=2e-8)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}, tolerance ${tol}`);
function geometry(s,o){near(distance(o.root,o.joint),s.upperLength);near(distance(o.joint,o.end),s.lowerLength);near(distance(o.root,o.end),o.solvedDistance);near(o.error.distance,distance(o.target,o.end));assert.equal(o.error.x,o.target.x-o.end.x);assert.equal(o.error.y,o.target.y-o.end.y);for(const v of [o.angles.upper,o.angles.lower,o.requestedDistance,o.solvedDistance,o.error.distance])assert.ok(Number.isFinite(v));}
test('known 3-4-5 triangle and bend reflection have exact reachable endpoint',()=>{
 const a=solve(base),b=solve({...base,bend:'negative'});assert.deepEqual(a.joint,{x:18,y:24});assert.deepEqual(b.joint,{x:18,y:-24});assert.deepEqual(a.end,base.target);assert.equal(a.reach,'reachable');assert.equal(a.projected,false);assert.equal(a.usedFallback,false);geometry(base,a);geometry(base,b);
 near(Math.cos(a.angles.upper),.6);near(Math.sin(a.angles.upper),.8);near(Math.cos(a.angles.lower),.8);near(Math.sin(a.angles.lower),-.6);
});
test('outside targets project to the outer radius without changing bone lengths',()=>{
 for(const bend of ['positive','negative']){const s={...base,target:{x:200,y:0},bend};const o=solve(s);assert.equal(o.reach,'outside');assert.equal(o.projected,true);assert.deepEqual(o.joint,{x:30,y:0});assert.deepEqual(o.end,{x:70,y:0});assert.deepEqual(o.error,{x:130,y:0,distance:130});geometry(s,o);}
});
test('inside targets project to inner radius for either order of unequal lengths',()=>{
 for(const [upperLength,lowerLength,expected] of [[30,40,-30],[40,30,40]]){const s={...base,upperLength,lowerLength,target:{x:5,y:0}};const o=solve(s);assert.equal(o.reach,'inside');assert.deepEqual(o.end,{x:10,y:0});assert.equal(o.joint.x,expected);geometry(s,o);}
});
test('inner and outer boundaries are reachable; no epsilon expands the reachable set',()=>{
 for(const [x,reach] of [[10,'reachable'],[70,'reachable'],[10-1e-12,'inside'],[70+1e-12,'outside']]){const s={...base,target:{x,y:0}};const o=solve(s);assert.equal(o.reach,reach);geometry(s,o);}
});
test('equal-length zero target uses explicit fallback perpendicular and bend, not history',()=>{
 for(const bend of ['positive','negative']){const s={...base,target:{x:0,y:0},upperLength:30,lowerLength:30,bend,fallbackAxis:{x:0,y:5}};const o=solve(s);assert.equal(o.usedFallback,true);assert.equal(o.reach,'reachable');assert.deepEqual(o.end,{x:0,y:0});near(o.joint.x,bend==='positive'?-30:30);near(o.joint.y,0);geometry(s,o);}
});
test('unequal zero target uses fallback to choose inner-radius projection direction',()=>{
 const s={...base,target:{x:0,y:0},fallbackAxis:{x:0,y:2}};const o=solve(s);assert.equal(o.usedFallback,true);assert.equal(o.reach,'inside');assert.deepEqual(o.end,{x:0,y:10});assert.deepEqual(o.joint,{x:0,y:-30});geometry(s,o);
});
test('nonzero target ignores fallback direction but still validates required input',()=>{
 assert.deepEqual(solve(base),solve({...base,fallbackAxis:{x:-1,y:2}}));
 assert.throws(()=>solve({...base,fallbackAxis:{x:0,y:0}}));
});
test('minimum nonzero target separation is explicit, zero is a distinct supported singularity',()=>{
 const s={...base,upperLength:.001,lowerLength:.001};for(const x of [1e-9,-1e-9])geometry({...s,target:{x,y:0}},solve({...s,target:{x,y:0}}));
 for(const x of [1e-10,Number.MIN_VALUE])assert.throws(()=>solve({...s,target:{x,y:0}}),/Nonzero root-target/);
 assert.doesNotThrow(()=>solve({...s,target:{x:0,y:0}}));
});
test('strict top-level keys, types, omitted fields and inherited-only values reject',()=>{
 for(const value of [null,[],new Date(),new(class X{constructor(){Object.assign(this,base)}})(),{...base,typo:1},{...base,[Symbol('x')]:1}])assert.throws(()=>solve(value));
 for(const key of Object.keys(base)){const s={...base};delete s[key];assert.throws(()=>solve(s));assert.throws(()=>solve({...base,[key]:null}));assert.throws(()=>solve({...base,[key]:undefined}));}
 assert.throws(()=>solve(Object.create(base)));assert.doesNotThrow(()=>solve(Object.assign(Object.create(null),base)));
});
test('nested positions and fallback fields reject unknown, missing, symbol and non-plain structures',()=>{
 for(const key of ['root','target','fallbackAxis'])for(const p of [[],{},null,{x:1},{x:1,y:2,z:3},{x:1,y:2,[Symbol('x')]:3},new(class P{constructor(){this.x=1;this.y=2}})()])assert.throws(()=>solve({...base,[key]:p}));
});
test('all scalar limits and explicit bend reject invalid and nonfinite values',()=>{
 for(const key of ['upperLength','lowerLength'])for(const v of [0,-1,.0009999,100000.1,NaN,Infinity,'30',null])assert.throws(()=>solve({...base,[key]:v}));
 for(const key of ['root','target','fallbackAxis'])for(const axis of ['x','y'])for(const v of [-1000001,1000001,NaN,Infinity,'0'])assert.throws(()=>solve({...base,[key]:{...base[key],[axis]:v}}));
 for(const bend of ['left','Positive',1,null])assert.throws(()=>solve({...base,bend}));
 assert.throws(()=>solve({...base,fallbackAxis:{x:1e-10,y:0}}),/Fallback axis/);
 assert.doesNotThrow(()=>solve({...base,fallbackAxis:{x:1e-9,y:0}}));
});
test('input and outputs are detached, nested frozen and unaffected by later input mutation',()=>{
 const s=structuredClone(base),before=structuredClone(s),o=solve(s);assert.deepEqual(s,before);s.root.x=999;s.target.y=50;s.upperLength=20;assert.deepEqual(o,solve(before));
 for(const p of [o,o.root,o.target,o.joint,o.end,o.angles,o.error]){assert.ok(Object.isFrozen(p));assert.throws(()=>{p.extra=1},TypeError);}
 assert.notEqual(o.root,before.root);assert.notEqual(o.target,before.target);assert.notEqual(o.target,o.end);
});
test('translation, rotation and uniform scale preserve geometry and bend orientation',()=>{
 const original=solve(base),angle=1.1,scale=3,offset={x:-1000,y:2000};
 const transform=p=>({x:offset.x+scale*(p.x*Math.cos(angle)-p.y*Math.sin(angle)),y:offset.y+scale*(p.x*Math.sin(angle)+p.y*Math.cos(angle))});
 const s={...base,root:transform(base.root),target:transform(base.target),upperLength:90,lowerLength:120};const o=solve(s),expected=transform(original.joint);near(o.joint.x,expected.x);near(o.joint.y,expected.y);geometry(s,o);
});
test('forward-kinematic construction provides an independent well-conditioned joint oracle',()=>{
 let seed=613;const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/2**32);
 for(let i=0;i<2500;i++){
  const upperLength=1+499*rnd(),lowerLength=1+499*rnd(),a=rnd()*Math.PI*2,delta=.3+rnd()*2.5,b=a+(rnd()<.5?-delta:delta),root={x:rnd()*1000,y:rnd()*1000};
  const joint={x:root.x+upperLength*Math.cos(a),y:root.y+upperLength*Math.sin(a)},target={x:joint.x+lowerLength*Math.cos(b),y:joint.y+lowerLength*Math.sin(b)};
  const cross=(target.x-root.x)*(joint.y-root.y)-(target.y-root.y)*(joint.x-root.x);
  const s={...base,root,target,upperLength,lowerLength,bend:cross>=0?'positive':'negative'},o=solve(s);geometry(s,o);near(o.joint.x,joint.x);near(o.joint.y,joint.y);
 }
});
test('bounded seeded extreme ratios, coordinates, projection and near-boundary cases keep both lengths',()=>{
 let seed=7;const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/2**32);
 for(let i=0;i<10000;i++){
  const upperLength=10**(-3+8*rnd()),lowerLength=10**(-3+8*rnd()),angle=rnd()*Math.PI*2,radius=(upperLength+lowerLength)*rnd()*1.2,root={x:(rnd()-.5)*1.6e6,y:(rnd()-.5)*1.6e6};
  const s={...base,root,target:{x:root.x+Math.cos(angle)*radius,y:root.y+Math.sin(angle)*radius},upperLength,lowerLength,bend:i%2?'positive':'negative'};geometry(s,solve(s));
 }
 for(const upperLength of [.001,1,100000])for(const lowerLength of [.001,1,100000])for(const rootX of [-1e6,1e6])for(const f of [0,1e-9,.25,.999999999999,1,1.000000000001]){
  const max=upperLength+lowerLength,root={x:rootX,y:1e6},target={x:rootX-(rootX>0?1:-1)*max*f,y:1e6};
  const s={...base,root,target,upperLength,lowerLength};geometry(s,solve(s));
 }
});
test('absolute input states are repeatable in shuffled order and a separate process',()=>{
 const inputs=Array.from({length:17},(_,i)=>({...base,root:{x:i*3,y:Math.sin(i)*10},target:{x:50-i*2,y:Math.cos(i)*40},bend:i%2?'positive':'negative'})),expected=inputs.map(solve);
 for(const i of [16,0,8,4,12,1,16,3])assert.deepEqual(solve(inputs[i]),expected[i]);
 const script=`import{solveTwoLinkIK as solve}from ${JSON.stringify(new URL('../lib/two-link-ik.mjs',import.meta.url).href)};console.log(JSON.stringify(${JSON.stringify(inputs)}.map(solve)));`;
 const p=spawnSync(process.execPath,['--input-type=module','-e',script],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);assert.deepEqual(JSON.parse(p.stdout),expected);
});
test('native joint/endpoint rendering is stable in reverse order and a fresh process; technical not art',()=>{
 const {api}=loadNativeCanvas(),inputs=[0,10,20].map(y=>({...base,root:{x:20,y:30},target:{x:70,y:30+y}}));
 const draw=s=>{const o=solve(s),c=api.createCanvas(100,100),x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,100,100);x.strokeStyle='black';x.lineWidth=3;x.beginPath();x.moveTo(o.root.x,o.root.y);x.lineTo(o.joint.x,o.joint.y);x.lineTo(o.end.x,o.end.y);x.stroke();x.fillStyle='red';x.fillRect(o.end.x-2,o.end.y-2,4,4);return createHash('sha256').update(c.toBuffer('image/png')).digest('hex');};
 const hashes=inputs.map(draw);assert.deepEqual([...inputs].reverse().map(draw),[...hashes].reverse());
 const script=`import{solveTwoLinkIK as solve}from ${JSON.stringify(new URL('../lib/two-link-ik.mjs',import.meta.url).href)};import{loadNativeCanvas}from ${JSON.stringify(new URL('../../motion-render-core/lib/native.mjs',import.meta.url).href)};import{createHash}from'node:crypto';const{api}=loadNativeCanvas();const draw=${draw.toString()};console.log(JSON.stringify(${JSON.stringify(inputs)}.map(draw)));`;
 const p=spawnSync(process.execPath,['--input-type=module','-e',script],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);assert.deepEqual(JSON.parse(p.stdout),hashes);
});

test('public index exposes the exact same pure solver function',async()=>{
 const api=await import('../lib/index.mjs');assert.equal(api.solveTwoLinkIK,solve);assert.deepEqual(api.solveTwoLinkIK(base),solve(base));
});

test('near-tangent IEEE distance classification is not a high-precision joint-position promise',()=>{
 const input={...base,upperLength:100000,lowerLength:100000,target:{x:186465.46912120687,y:72323.08639299238}};
 assert.equal(Math.hypot(input.target.x,input.target.y),200000);
 const state=solve(input);assert.equal(state.reach,'reachable');assert.equal(state.solvedDistance,200000);
 near(state.joint.x,input.target.x/2);near(state.joint.y,input.target.y/2);geometry(input,state);
 // An independent high-precision calculation using exact float input values
 // puts the target slightly inside and joint about .001325 away. Tiny link
 // residuals therefore do not bound joint or angle error near the singularity.
});
