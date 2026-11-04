import test from 'node:test';
import assert from 'node:assert/strict';
import {createIsometricCamera, logZoom} from './isometric-camera.mjs';
const spec = () => ({width: 1920, height: 1080, center: {x: 7, y: -4, z: 2}, zoom: 20});
function close(a, b, tolerance = 1e-10) {
  assert.ok(Math.abs(a-b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b)), `${a} != ${b}`);
}
test('center and three fixed axes have declared orientation and scale', () => {
  const c = createIsometricCamera(spec());
  assert.deepEqual(c.project(7,-4,2), [960,540]);
  const px=c.project(8,-4,2), py=c.project(7,-3,2), pz=c.project(7,-4,3);
  close(px[0]-960, Math.sqrt(3)*10); close(px[1]-540,10);
  close(py[0]-960,-Math.sqrt(3)*10); close(py[1]-540,10);
  assert.deepEqual(pz,[960,520]);
});
test('two unrelated synthetic geometries: stepped prism and antenna lattice', () => {
  const steppedPrism = [[0,0,0],[9,0,0],[9,4,0],[0,4,0],[0,0,7],[4,0,7],[4,4,7],[0,4,7]];
  const antennaLattice = Array.from({length:25},(_,i)=>[(i%5)*3-6,Math.floor(i/5)*3-6,(i%3)*2]);
  for (const geometry of [steppedPrism,antennaLattice]) {
    for (const zoom of [1e-3, 20, 8000, 1e6]) {
      const c=createIsometricCamera({...spec(),zoom});
      for (const [x,y,z] of geometry) {
        const point=c.project(x,y,z), back=c.unproject(...point,z);
        close(back[0],x,1e-8);close(back[1],y,1e-8);
      }
    }
  }
});
test('inverse fixes the selected plane, not unique 3D depth',()=>{
  const c=createIsometricCamera(spec()), p=c.project(2,3,4);
  const [x,y]=c.unproject(...p,0);
  assert.notDeepEqual([x,y],[2,3]);
  const p0=c.project(x,y,0);p0.forEach((v,i)=>close(v,p[i]));
  assert.deepEqual(c.unproject(...p),c.unproject(...p,0));
});
test('inputs copied, snapshot frozen, outputs fresh, arbitrary seek order',()=>{
  const s=spec(), c=createIsometricCamera(s), baseline=c.project(5,6,7);
  s.width=1;s.center.x=999;s.zoom=1;
  assert.deepEqual(c.project(5,6,7),baseline);
  assert.notEqual(c.snapshot.center,s.center);
  assert.ok(Object.isFrozen(c)&&Object.isFrozen(c.snapshot)&&Object.isFrozen(c.snapshot.center));
  assert.throws(()=>{c.snapshot.center.x=12},TypeError);
  const a=c.project(5,6,7),b=c.project(5,6,7);assert.notEqual(a,b);a[0]=0;assert.deepEqual(b,baseline);
  const ua=c.unproject(10,20),ub=c.unproject(10,20);assert.notEqual(ua,ub);ua[0]=0;assert.notEqual(ua[0],ub[0]);
  const order=[.8,.1,1,0,.4,.1,.8];
  for(const progress of order) {
    const state={...spec(),zoom:logZoom(2,128,progress)};
    const camera=createIsometricCamera(state);
    assert.deepEqual(camera.project(2,3,4),createIsometricCamera(state).project(2,3,4));
  }
});
test('log zoom: exact endpoints and equal ratios forward and backward',()=>{
  for(const [a,b] of [[2,128],[128,2],[1e-6,1e6],[8000,17]]) {
    assert.equal(logZoom(a,b,0),a);assert.equal(logZoom(a,b,1),b);
    const samples=Array.from({length:9},(_,i)=>logZoom(a,b,i/8));
    for(let i=2;i<samples.length;i++)close(samples[i]/samples[i-1],samples[1]/samples[0]);
  }
  assert.equal(logZoom(8000,8000,.71),8000);
});
test('strict records reject accessors without executing them',()=>{
  let reads=0;const getter=()=>{reads++;throw Error('getter invoked')};
  for(const key of ['width','height','zoom','center']){
    const s=spec();Object.defineProperty(s,key,{get:getter,enumerable:true});
    assert.throws(()=>createIsometricCamera(s),TypeError);
  }
  for(const key of ['x','y','z']){
    const s=spec();Object.defineProperty(s.center,key,{get:getter,enumerable:true});
    assert.throws(()=>createIsometricCamera(s),TypeError);
  }
  assert.equal(reads,0);
  for(const bad of [null,[],new Date(),new Number(1),Object.create({width:1920}),{...spec(),extra:0},{...spec(),[Symbol()]:0}])assert.throws(()=>createIsometricCamera(bad));
  const s=spec();delete s.width;assert.throws(()=>createIsometricCamera(s));
  const hidden=spec();Object.defineProperty(hidden,'width',{value:1920,enumerable:false});assert.throws(()=>createIsometricCamera(hidden));
  const nullRecord=Object.assign(Object.create(null),spec());nullRecord.center=Object.assign(Object.create(null),nullRecord.center);
  assert.deepEqual(createIsometricCamera(nullRecord).snapshot,createIsometricCamera(spec()).snapshot);
});
test('no coercion, no clamping, no extrapolation',()=>{
  const c=createIsometricCamera(spec());
  for(const value of [NaN,Infinity,-Infinity,'1',null,undefined,{},1n]){
    assert.throws(()=>createIsometricCamera({...spec(),zoom:value}));
    assert.throws(()=>c.project(value,0,0));assert.throws(()=>c.project(0,value,0));assert.throws(()=>c.project(0,0,value));
    assert.throws(()=>c.unproject(value,0));assert.throws(()=>c.unproject(0,value));
    if(value!==undefined)assert.throws(()=>c.unproject(0,0,value));
    assert.throws(()=>logZoom(1,2,value));
  }
  for(const value of [0,-1,1e-7,1e6+1])assert.throws(()=>logZoom(value,1,.5));
  for(const value of [-.01,1.01])assert.throws(()=>logZoom(1,2,value));
  assert.throws(()=>c.project(1e9+1,0,0));assert.throws(()=>c.unproject(1e16+2,0));
  assert.throws(()=>createIsometricCamera({...spec(),width:0}));
  assert.throws(()=>createIsometricCamera({...spec(),center:{x:0,y:0,z:1e9+1}}));
});
test('boundary arithmetic stays finite; 8000 zoom accepts offscreen coordinates',()=>{
  for(const zoom of [1e-6,8000,1e6]){
    const c=createIsometricCamera({width:1e6,height:1e-6,center:{x:-1e9,y:1e9,z:-1e9},zoom});
    const p=c.project(1e9,-1e9,1e9);assert.ok(p.every(Number.isFinite));
    const b=c.unproject(...p,1e9);close(b[0],1e9);close(b[1],-1e9);
    for(const sign of [-1,1])assert.ok(c.unproject(sign*1e16,-sign*1e16,sign*1e9).every(Number.isFinite));
  }
});
test('shuffled point queries and detached methods preserve deterministic values',()=>{
  const c=createIsometricCamera(spec()),{project,unproject}=c;
  const points=Array.from({length:101},(_,i)=>[(i*73)%101-50,(i*37)%101-50,(i*11)%17]);
  const expected=points.map(p=>project(...p));
  for(let n=0;n<303;n++){
    const i=(n*71)%101,p=points[i],s=project(...p);
    assert.deepEqual(s,expected[i]);
    const xy=unproject(...s,p[2]);xy.forEach((v,j)=>close(v,p[j]));
  }
});
