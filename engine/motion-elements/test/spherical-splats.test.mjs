import test from 'node:test';
import assert from 'node:assert/strict';
import {compileSphericalSplats as compile, sampleSphericalSplats as sample} from '../lib/foundations/field/spherical-splats.mjs';
import {sphericalSplatFrame, sphericalSplatExamples} from '../examples/spherical-splats.mjs';
import {copyRasterPixels, sampleRasterMatte} from '../lib/raster-effects.mjs';
const lobe = () => ({direction:{x:0,y:0,z:1},sigma:.3,strength:2});
const options = (extra={}) => ({width:65,height:65,yaw:0,pitch:0,...extra});
const difference = (a,b) => Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
test('analytic center, rotation convention, empty field and projection', () => {
  const p=compile({lobes:[lobe()]});
  assert.equal(sample(p,options({width:1,height:1})).density[0],-Math.expm1(-2));
  const side=sample(p,options({width:1,height:1,yaw:Math.PI/2}));
  assert.ok(Math.abs(side.density[0]-(-Math.expm1(-2*Math.exp(-1/.09))))<1e-15);
  const f=sample(p,options()); assert.equal(f.coverage[0],0); assert.equal(f.density[0],0);
  assert.equal(f.coverage[32*65+32],1);
  const empty=sample(compile({lobes:[]}),options()); assert.ok(empty.density.every(v=>v===0));
  const rectangular=sample(p,options({width:81,height:65}));
  for(let y=0;y<65;y++)for(let x=0;x<65;x++)assert.equal(rectangular.density[y*81+x+8],f.density[y*65+x]);
});
test('asymmetric off-center yaw/pitch order and positive pitch are fixed', () => {
  const p=compile({lobes:[{direction:{x:.3,y:-.4,z:.5},sigma:.7,strength:1.3}]});
  // Independent explicit Rx(-pitch)*Ry(-yaw) matrix evaluation at (.4,-.4,sqrt(.68)):
  // rotated point (.07473521387343474,-.8511524344135474,.5195711512383883).
  const field=sample(p,options({width:5,height:5,yaw:.37,pitch:-.61}));
  assert.ok(Math.abs(field.density[1*5+3]-.6389843133846455)<1e-14);
  const yLobe=compile({lobes:[{direction:{x:0,y:1,z:0},sigma:.7,strength:1.3}]});
  // Positive pitch maps center toward positive object y: dot=sin(.61).
  assert.ok(Math.abs(sample(yLobe,options({width:1,height:1,pitch:.61})).density[0]-.4194111478753434)<1e-14);
});
test('seek independence, periodic rotation, mutation isolation and normalized directions', () => {
  const source={lobes:[lobe()]}, p=compile(source), a=sample(p,options({yaw:.72,pitch:-.3}));
  source.lobes[0].strength=0; sample(p,options({yaw:-3,pitch:1}));
  assert.deepEqual(sample(p,options({yaw:.72,pitch:-.3})),a);
  a.density.fill(99); a.coverage.fill(99);
  assert.ok(sample(p,options()).density.every(v=>v>=0&&v<=1));
  assert.ok(difference(sample(p,options()).density,sample(p,options({yaw:Math.PI*2})).density)<1e-14);
  assert.deepEqual(sample(compile({lobes:[{...lobe(),direction:{x:0,y:0,z:99}}]}),options()),sample(p,options()));
  assert.throws(()=>sample({...p},options()));
});
test('bounded finite outputs at narrow/wide splats, poles, fringe and maximum dimensions', () => {
  for(const sigma of [.03,2])for(const direction of [{x:0,y:1,z:0},{x:0,y:0,z:-1}]) {
    const p=compile({lobes:[{direction,sigma,strength:8}]});
    for(const [width,height] of [[1,1],[1,512],[512,1],[512,512],[2,3]]) {
      const f=sample(p,options({width,height,yaw:1e4,pitch:-1e4}));
      assert.ok(f.density.every(v=>Number.isFinite(v)&&v>=0&&v<=1));
      assert.ok(f.coverage.every(v=>Number.isFinite(v)&&v>=0&&v<=1));
    }
  }
});
test('reject malformed inputs and cost beyond declared budget', () => {
  for(const x of [null,{}, {lobes:[,]}, {lobes:Array(33).fill(lobe())}, {lobes:[{...lobe(),sigma:0}]}, {lobes:[{...lobe(),strength:-1}]}, {lobes:[{...lobe(),direction:{x:0,y:0,z:0}}]}, {lobes:[{...lobe(),unknown:true}]}])assert.throws(()=>compile(x));
  const malicious={get lobes(){throw Error('getter executed');}};
  assert.throws(()=>compile(malicious),/accessors/);
  const p=compile({lobes:[lobe()]});
  for(const change of [{width:0},{width:513},{width:1.5},{yaw:NaN},{pitch:Infinity},{yaw:10001},{other:1}])assert.throws(()=>sample(p,options(change)));
  assert.throws(()=>sample(compile({lobes:Array(32).fill(lobe())}),options({width:512,height:512})),/budget/);
});
test('three original example palettes/sizes, reduced mode, loop endpoint, raster composition', () => {
  assert.equal(sphericalSplatExamples.length,3);
  for(let i=0;i<3;i++) {
    const a=copyRasterPixels(sphericalSplatFrame(i,0));
    const b=copyRasterPixels(sphericalSplatFrame(i,1));
    assert.notDeepEqual(a,b);
    assert.deepEqual(a,copyRasterPixels(sphericalSplatFrame(i,6)));
    assert.deepEqual(a,copyRasterPixels(sphericalSplatFrame(i,5,{reducedMotion:true})));
    assert.deepEqual(a,copyRasterPixels(sphericalSplatFrame(i,0)));
    const source=sphericalSplatFrame(i,0), masked=sampleRasterMatte({source,mask:source,mode:'alpha',invert:false});
    assert.equal(masked.width,source.width);
  }
});
