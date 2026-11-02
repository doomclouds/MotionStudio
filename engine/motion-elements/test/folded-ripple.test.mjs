import test from 'node:test';
import assert from 'node:assert/strict';
import {compileFoldedRipple as compile,sampleFoldedRipple as sample} from '../lib/foundations/field/folded-ripple.mjs';
import {foldedRippleFrame} from '../examples/folded-ripple.mjs';
import {copyRasterPixels} from '../lib/raster-effects.mjs';
const spec=(extra={})=>({scale:1.2,speed:.4,ridgeWidth:.2,pulse:{x:0,y:0,at:1,strength:.2,decay:2},...extra});
const opts=(seconds,extra={})=>({width:31,height:31,seconds,...extra});
test('independent analytic center at zero phase locks five-round ridge response',()=>{
 const w=.2,q=Math.sin(3)/w;
 // At x=y=phase=0 all folds remain zero. Only k=0 and k=3 have nonzero ridges.
 const expected=(2-q*q*(3-2*q))/5;
 assert.ok(Math.abs(sample(compile(spec({pulse:null})),opts(0,{width:1,height:1})).density[0]-expected)<1e-15);
});
test('independent off-center nonzero-phase numerical oracle',()=>{
 // Independently evaluated with Python math; no invocation of this sampler.
 const f=sample(compile(spec({pulse:null})),opts(1.7,{width:5,height:5}));
 assert.ok(Math.abs(f.density[4]-.11942603278644251)<1e-12);
 assert.ok(Math.abs(f.density[24]-.0777324228906423)<1e-12);
});
test('seek/repeat and 24/30/60 fps agree at shared absolute timestamps',()=>{
  const p=compile(spec()), expected=sample(p,opts(2)).density;
  for(const fps of [24,30,60]) {for(let f=0;f<fps*2;f++)sample(p,opts(f/fps,{width:3,height:3}));assert.deepEqual(sample(p,opts(fps*2/fps)).density,expected);}
  sample(p,opts(99)); sample(p,opts(0)); assert.deepEqual(sample(p,opts(2)).density,expected);
});
test('pulse absent before/on event, continuous onset, decays and affects field',()=>{
  const p=compile(spec()), baseline=compile(spec({pulse:null}));
  for(const t of [0,.5,1])assert.deepEqual(sample(p,opts(t)).density,sample(baseline,opts(t)).density);
  const diff=t=>{const a=sample(p,opts(t)).density,b=sample(baseline,opts(t)).density;return a.reduce((m,v,i)=>Math.max(m,Math.abs(v-b[i])),0);};
  assert.ok(diff(1.000001)<1e-8);assert.ok(diff(1.3)>.01);assert.ok(diff(30)<1e-12);
  assert.deepEqual(sample(compile(spec({pulse:{x:0,y:0,at:0,strength:0,decay:1}})),opts(2)).density,sample(baseline,opts(2)).density);
});
test('center finite, rectangular domain preserves square center, outputs isolated',()=>{
 const p=compile(spec()), square=sample(p,opts(1.2)),wide=sample(p,opts(1.2,{width:41}));
 for(let y=0;y<31;y++)for(let x=0;x<31;x++)assert.equal(square.density[y*31+x],wide.density[y*41+x+5]);
 assert.ok(square.density.every(v=>Number.isFinite(v)&&v>=0&&v<=1));square.density.fill(9);assert.ok(sample(p,opts(1.2)).density.every(v=>v<=1));
});
test('bounded parameter extremes, maximum grid and compile input isolation',()=>{
 for(const scale of [.25,8])for(const speed of [-2,0,2])for(const ridgeWidth of [.03,.5]){
 const p=compile(spec({scale,speed,ridgeWidth,pulse:{x:2,y:-2,at:0,strength:.3,decay:.1}}));
 assert.ok(sample(p,opts(1e4,{width:1,height:1})).density.every(v=>Number.isFinite(v)&&v>=0&&v<=1));}
 assert.equal(sample(compile(spec()),opts(2,{width:256,height:256})).density.length,65536);
 const src=spec(), p=compile(src),a=sample(p,opts(2));src.pulse.strength=0;src.scale=8;assert.deepEqual(sample(p,opts(2)),a);
});
test('reject malformed records, accessors, forged plans and out of domain values',()=>{
 for(const [k,v] of [['scale',0],['speed',Infinity],['ridgeWidth',.001],['extra',1],['pulse',undefined]])assert.throws(()=>compile(spec({[k]:v})));
 const getter=spec();Object.defineProperty(getter,'scale',{get(){throw Error('must not run')}});assert.throws(()=>compile(getter),/data fields/);
 const p=compile(spec());for(const v of [-1,NaN,Infinity,10001])assert.throws(()=>sample(p,opts(v)));
 for(const width of [0,257,1.5])assert.throws(()=>sample(p,opts(0,{width})));
 assert.throws(()=>sample({},opts(0)));assert.throws(()=>sample(p,{...opts(0),extra:1}));
 for(const [k,v] of [['x',3],['y',NaN],['at',-1],['strength',.31],['decay',0]])assert.throws(()=>compile(spec({pulse:{...spec().pulse,[k]:v}})));
});
test('two raster examples vary, seek exactly, and reduced motion freezes',()=>{
 for(const i of [0,1]){const a=copyRasterPixels(foldedRippleFrame(i,1.5));foldedRippleFrame(i,7);assert.deepEqual(copyRasterPixels(foldedRippleFrame(i,1.5)),a);assert.notDeepEqual(copyRasterPixels(foldedRippleFrame(i,0)),a);assert.deepEqual(copyRasterPixels(foldedRippleFrame(i,100,{reducedMotion:true})),copyRasterPixels(foldedRippleFrame(i,0)));}
 assert.throws(()=>foldedRippleFrame(2,0)); assert.throws(()=>foldedRippleFrame(0,-1));
});
