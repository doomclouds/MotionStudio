import test from 'node:test';
import assert from 'node:assert/strict';
import {compilePolylineSections as compile,extractPolylineSection as extract} from '../lib/candidate-index.mjs';
import {compileArrivalField as field,sampleArrivalField as sample} from '../lib/candidate-index.mjs';
const q=(n,d=1)=>({n:String(n),d:String(d)}), point=(id,x,y=0)=>({id,position:{x,y}}), src=(id,x,at=q(0))=>({...point(id,x),at});
const bits=new DataView(new ArrayBuffer(8));
function adjacent(x,direction){bits.setFloat64(0,x);let b=bits.getBigUint64(0);bits.setBigUint64(0,b+BigInt(direction));return bits.getFloat64(0)}
function ratEqual(actual,n,d){assert.equal(BigInt(actual.n)*BigInt(d),BigInt(actual.d)*BigInt(n))}
test('independent exact BigInt rational arrival oracle over integer axial domains',()=>{
 // Division rounding cannot cross the exact ceiling in these bounded non-near-integer cases;
 // integer quotients are exact. This is not an all-domain Math.hypot oracle.
 for(let x=0;x<121;x++)for(const speed of [1,2,3,7,16])for(const tickRate of [1,3,32]){
  const p=field({sources:[src('a',0,q(1,7))],speed,tickRate});
  const a=sample(p,{points:[point('p',x)]}).points[0];
  const numerator=BigInt(x*tickRate),denominator=BigInt(speed),ticks=(numerator+denominator-1n)/denominator;
  assert.equal(BigInt(a.winner.travelTicks),ticks);
  ratEqual(a.arrival,BigInt(tickRate)+7n*ticks,7n*BigInt(tickRate));
 }
});
test('arrival maximum earliest boundary and nonwinning late source policy',()=>{
 const f=field({sources:[src('a',0)],speed:1,tickRate:1});
 ratEqual(sample(f,{points:[point('p',86400)]}).points[0].arrival,86400,1);
 assert.throws(()=>sample(f,{points:[point('p',adjacent(86400,1))]}),RangeError);
 const far=field({sources:[src('near',0),src('far',1000000,q(86400))],speed:.001,tickRate:192000});
 assert.equal(sample(far,{points:[point('p',0)]}).points[0].winnerSourceId,'near');
});
test('arrival quantized ties obey ASCII ID and rational start, not closest point',()=>{
 const p=field({sources:[src('Z',.125,q(1,7)),src('a',.0625,q(1,7)),src('A',0,q(2))],speed:1,tickRate:1});
 const a=sample(p,{points:[point('p',0)]}).points[0];
 assert.deepEqual(a.tiedSourceIds,['Z','a']);assert.equal(a.winnerSourceId,'Z');ratEqual(a.arrival,8,7);
});
test('polyline adjacent representable distances never epsilon-snap at exact corners',()=>{
 const p=compile({points:[{x:0,y:0},{x:8,y:0},{x:8,y:8},{x:0,y:8}]});
 for(const d of [8,16])for(const delta of [-1,0,1]){
  const x=delta?adjacent(d,delta):d,s=extract(p,{startDistance:x,endDistance:x});
  assert.equal(s.empty,true);assert.equal(s.vertices.length,1);assert.equal(s.vertices[0].sourceVertexIndex,delta?null:d/8);
  assert.equal(s.vertices[0].distance,x);assert.ok(s.vertices[0].parameter>=0&&s.vertices[0].parameter<=1);
 }
 const s=extract(p,{startDistance:adjacent(8,-1),endDistance:adjacent(16,1)});
 assert.deepEqual(s.vertices.map(v=>v.sourceVertexIndex),[null,1,2,null]);
});
test('polyline exact axis oracle handles retracing and redundant corners for 2048 intervals',()=>{
 const points=[{x:0,y:0},{x:8,y:0},{x:3,y:0},{x:3,y:7},{x:3,y:9},{x:0,y:9},{x:0,y:0}], ds=[0,8,13,20,22,25,34];
 const p=compile({points});assert.deepEqual(p.vertexDistances,ds);
 function at(d){let i=ds.findIndex(x=>x>=d);if(ds[i]===d)return points[i];i--;const span=BigInt(ds[i+1]-ds[i]),offset=BigInt(d*64-ds[i]*64);const coord=k=>Number(BigInt(points[i][k])*span*64n+BigInt(points[i+1][k]-points[i][k])*offset)/Number(span*64n);return{x:coord('x'),y:coord('y')}}
 for(let i=0;i<2048;i++){
  const a=i/64,b=34-(i%64)/64;
  const expected=a===b?[at(a)]:[at(a),...points.filter((_,j)=>ds[j]>a&&ds[j]<b),at(b)];
  const actual=extract(p,{startDistance:a,endDistance:b}).vertices.map(v=>v.position);assert.equal(actual.length,expected.length);
  for(let j=0;j<actual.length;j++)for(const k of ['x','y'])assert.ok(Math.abs(actual[j][k]-expected[j][k])<=8*Number.EPSILON*Math.max(1,Math.abs(expected[j][k])),`rational coordinate tolerance at ${i}/${j}/${k}`);
 }
});
test('no callback execution through nested property descriptors at compile/sample boundaries',()=>{
 let calls=0;
 const p={x:0,y:0};Object.defineProperty(p,'x',{get(){calls++;return 0},enumerable:true});assert.throws(()=>compile({points:[p,{x:1,y:1}]}));
 const f=field({sources:[src('a',0)],speed:1,tickRate:1});const a=[point('p',0)];Object.defineProperty(a,'0',{get(){calls++;return point('p',0)},enumerable:true});assert.throws(()=>sample(f,{points:a}));assert.equal(calls,0);
});
