import test from 'node:test';
import assert from 'node:assert/strict';
import {compileFilamentDensity as compile,sampleFilamentDensity as sample} from '../lib/foundations/field/filament-density.mjs';
import {filamentDensityFrame} from '../examples/filament-density.mjs';
import {copyRasterPixels} from '../lib/raster-effects.mjs';
const spec=(x={})=>({seed:29,scale:4,warp:1.2,ridgeWidth:.25,filamentMix:.85,...x});
const opts=(x={})=>({width:31,height:31,offsetX:.2,offsetY:-.1,...x});
test('deterministic seed, seek, output/input isolation and fresh buffers',()=>{
 const s=spec(),p=compile(s),a=sample(p,opts());s.seed=0;
 sample(p,opts({offsetX:100}));assert.deepEqual(sample(p,opts()),a);
 assert.notDeepEqual(sample(compile(spec({seed:30})),opts()),a);
 const b=sample(p,opts());assert.notEqual(a.density.buffer,b.density.buffer);a.density.fill(9);assert.deepEqual(sample(p,opts()),b);
});
test('square coordinate crop agrees exactly with rectangular domain',()=>{
 const p=compile(spec()),a=sample(p,opts()),b=sample(p,opts({width:41}));
 for(let y=0;y<31;y++)for(let x=0;x<31;x++)assert.equal(a.density[y*31+x],b.density[y*41+x+5]);
});
test('filament mixing is linear and only suppresses density; zero mix ignores warp/width',()=>{
 const a=sample(compile(spec({filamentMix:0})),opts()).density,b=sample(compile(spec({filamentMix:1})),opts()).density,c=sample(compile(spec({filamentMix:.5})),opts()).density;
 for(let i=0;i<a.length;i++){assert.ok(b[i]<=a[i]);assert.ok(Math.abs(c[i]-(a[i]+b[i])/2)<1e-15);}
 assert.deepEqual(a,sample(compile(spec({filamentMix:0,warp:0,ridgeWidth:.8})),opts()).density);
 assert.notDeepEqual(b,sample(compile(spec({filamentMix:1,warp:0})),opts()).density);
});
test('bounded output, maximum allocation and parameter extreme combinations',()=>{
 for(const seed of [0,0xffffffff])for(const scale of [.25,12])for(const warp of [0,2])for(const ridgeWidth of [.04,.8])for(const filamentMix of [0,1]) {
 const f=sample(compile(spec({seed,scale,warp,ridgeWidth,filamentMix})),opts({width:1,height:256,offsetX:100,offsetY:-100}));assert.ok(f.density.every(v=>Number.isFinite(v)&&v>=0&&v<=1));}
 const f=sample(compile(spec()),opts({width:256,height:256}));assert.equal(f.density.byteLength,524288);assert.equal(f.density.length,65536);
});
test('strict data records, parameter limits and forged plans rejected before sampling',()=>{
 for(const [key,value] of [['seed',-1],['seed',1.5],['seed',2**32],['scale',0],['warp',2.01],['ridgeWidth',0],['filamentMix',1.01],['scale',NaN],['warp',Infinity],['extra',0]])assert.throws(()=>compile(spec({[key]:value})));
 for(const x of [null,[],Object.create(null)])assert.throws(()=>compile(x));
 let invoked=false;const a=spec();Object.defineProperty(a,'scale',{get(){invoked=true;return 1}});assert.throws(()=>compile(a));assert.equal(invoked,false);
 const p=compile(spec());for(const [key,value] of [['width',0],['height',257],['width',1.5],['offsetX',101],['offsetY',NaN],['extra',1]])assert.throws(()=>sample(p,opts({[key]:value})));
 assert.throws(()=>sample({},opts()));assert.throws(()=>sample(p,{width:1,height:1,offsetX:0}));
});
test('two neutral raster examples seek, differ, and reduced motion is fixed',()=>{
 for(const i of [0,1]){const a=copyRasterPixels(filamentDensityFrame(i,2));filamentDensityFrame(i,100);assert.deepEqual(copyRasterPixels(filamentDensityFrame(i,2)),a);assert.notDeepEqual(copyRasterPixels(filamentDensityFrame(i,0)),a);assert.deepEqual(copyRasterPixels(filamentDensityFrame(i,99,{reducedMotion:true})),copyRasterPixels(filamentDensityFrame(i,0)));}
 assert.throws(()=>filamentDensityFrame(2,0));assert.throws(()=>filamentDensityFrame(0,-1));
});
test('independent off-center Python scalar oracle',()=>{
 // Separately evaluated using Python integer arithmetic + scalar interpolation.
 const f=sample(compile(spec()),opts({width:5,height:5}));
 assert.ok(Math.abs(f.density[4]-.13105398368725257)<1e-14);
});
