import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {compileCubicPath,sampleCubicPath} from '../lib/foundations/geometry/cubic-path.mjs';
import {layoutGlyphRunOnPath} from '../lib/foundations/typography/glyph-run-path.mjs';
import {compilePolyline} from '../lib/path.mjs';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
const line=(p0={x:0,y:0},p3={x:100,y:0})=>compileCubicPath({segments:[{p0,p1:{x:p0.x+(p3.x-p0.x)/3,y:p0.y+(p3.y-p0.y)/3},p2:{x:p0.x+(p3.x-p0.x)*2/3,y:p0.y+(p3.y-p0.y)*2/3},p3}],tolerance:.001});
const plan=line();
const input={glyphs:[{glyphId:'a',advance:20},{glyphId:'space',advance:10},{glyphId:'b',advance:30}],startDistance:5,tracking:4,normalOffset:-6};
const close=(x,y,e=1e-9)=>assert.ok(Math.abs(x-y)<=e,`${x} != ${y}`);
const segments=[{p0:{x:0,y:0},p1:{x:200,y:0},p2:{x:180,y:450},p3:{x:700,y:450}},{p0:{x:700,y:450},p1:{x:950,y:450},p2:{x:1100,y:-200},p3:{x:1400,y:-200}}];

test('glyph centers honor measured advances and between-cell tracking, not a trailing gap',()=>{
 const result=layoutGlyphRunOnPath(plan,input);
 assert.equal(result.span,68);assert.equal(result.startDistance,5);assert.equal(result.endDistance,73);
 assert.deepEqual(result.glyphs.map(g=>g.glyphId),['a','space','b']);
 assert.deepEqual(result.glyphs.map(g=>g.distance),[15,34,58]);
 for(const [i,g]of result.glyphs.entries()){
  close(g.position.x,[15,34,58][i]);close(g.position.y,-6);close(g.pathPosition.y,0);
  assert.deepEqual(g.normal,{x:-0,y:1});close(g.angle,0);close(g.unitTangent.x,1);
 }
});

test('signed left normal follows screen coordinates on vertical and reversed paths',()=>{
 for(const [p0,p3,tangent]of [[{x:0,y:0},{x:0,y:100},{x:0,y:1}],[{x:100,y:0},{x:0,y:0},{x:-1,y:0}]]){
  const p=line(p0,p3),g=layoutGlyphRunOnPath(p,{glyphs:[{glyphId:'x',advance:10}],startDistance:10,tracking:0,normalOffset:7}).glyphs[0];
  close(g.unitTangent.x,tangent.x);close(g.unitTangent.y,tangent.y);
  close(g.position.x-g.pathPosition.x,-7*tangent.y);close(g.position.y-g.pathPosition.y,7*tangent.x);
 }
});

test('synthetic two-segment path samples every glyph center and normal from the same compiled plan',()=>{
 const p=compileCubicPath({segments,tolerance:.01});
 const result=layoutGlyphRunOnPath(p,{glyphs:Array.from({length:9},(_,i)=>({glyphId:`g${i}`,advance:70+i})),startDistance:610,tracking:2,normalOffset:-26});
 for(const g of result.glyphs){
  const sample=sampleCubicPath(p,g.distance/p.totalLength);
  assert.deepEqual(g.pathPosition,sample.position);assert.deepEqual(g.unitTangent,sample.unitTangent);assert.equal(g.angle,sample.angle);
  close(g.position.x,sample.position.x+26*sample.unitTangent.y);close(g.position.y,sample.position.y-26*sample.unitTangent.x);
  close(Math.hypot(g.normal.x,g.normal.y),1);close(g.normal.x*g.unitTangent.x+g.normal.y*g.unitTangent.y,0);
 }
});

test('undefined tangent at a glyph center is rejected instead of inventing a heading',()=>{
 const p=compileCubicPath({segments:[{p0:{x:0,y:0},p1:{x:100,y:0},p2:{x:100,y:0},p3:{x:0,y:0}}],tolerance:.001});
 assert.equal(sampleCubicPath(p,.5).tangentDefined,false);
 assert.throws(()=>layoutGlyphRunOnPath(p,{glyphs:[{glyphId:'turn',advance:2}],startDistance:(p.totalLength-2)/2,tracking:0,normalOffset:0}),/Undefined path tangent/);
 assert.equal(layoutGlyphRunOnPath(plan,input).glyphs.length,3);
});

test('run fit uses the stated subtraction boundary without auto-fit, clipping or epsilon',()=>{
 const fit={glyphs:[{glyphId:'full',advance:70}],startDistance:30,tracking:16384,normalOffset:0};
 assert.equal(layoutGlyphRunOnPath(plan,fit).endDistance,100);
 // The chosen IEEE subtraction rounds this first near-boundary remainder back to70.
 assert.equal(layoutGlyphRunOnPath(plan,{...fit,startDistance:30+Number.EPSILON*32}).span,70);
 assert.throws(()=>layoutGlyphRunOnPath(plan,{...fit,startDistance:30+Number.EPSILON*64}),/exceeds/);
 assert.throws(()=>layoutGlyphRunOnPath(plan,{...fit,glyphs:[{glyphId:'full',advance:70.001}]}),/exceeds/);
 assert.throws(()=>layoutGlyphRunOnPath(plan,{...fit,startDistance:100}),/exceeds/);
});

test('all returned records and nested geometry are detached and deeply frozen',()=>{
 const data=structuredClone(input),result=layoutGlyphRunOnPath(plan,data),before=JSON.stringify(result);
 data.glyphs[0].advance=1;data.glyphs[0].glyphId='changed';data.startDistance=0;
 for(const value of [result,result.glyphs,...result.glyphs,...result.glyphs.flatMap(g=>[g.position,g.pathPosition,g.normal,g.unitTangent])])assert.ok(Object.isFrozen(value));
 assert.throws(()=>{result.glyphs[0].position.x=0;},TypeError);
 assert.equal(JSON.stringify(result),before);assert.equal(data.glyphs[1].advance,10);
});

test('glyph list has a bounded ordinary dense-array contract and unique stable IDs',()=>{
 for(const glyphs of [[],new Array(2),Array.from({length:257},(_,i)=>({glyphId:`g${i}`,advance:1})),[input.glyphs[0],input.glyphs[0]],vm.runInNewContext('[{glyphId:"x",advance:1}]')])assert.throws(()=>layoutGlyphRunOnPath(plan,{...input,glyphs}));
 for(const key of ['extra',Symbol('unknown')]){
  const glyphs=[{glyphId:'x',advance:1}];Object.defineProperty(glyphs,key,{value:true,enumerable:false});assert.throws(()=>layoutGlyphRunOnPath(plan,{...input,glyphs}));
 }
 const max=layoutGlyphRunOnPath(line({x:0,y:0},{x:1000,y:0}),{glyphs:Array.from({length:256},(_,i)=>({glyphId:`g${i}`,advance:1})),startDistance:0,tracking:0,normalOffset:0});assert.equal(max.glyphs.length,256);
});

test('strict missing, null, nonfinite, type, range and unknown fields reject',()=>{
 for(const key of ['glyphs','startDistance','tracking','normalOffset']){const bad={...input};delete bad[key];assert.throws(()=>layoutGlyphRunOnPath(plan,bad));}
 for(const bad of [null,[],{...input,extra:1},{...input,startDistance:-1},{...input,startDistance:NaN},{...input,tracking:-.001},{...input,tracking:16384.001},{...input,normalOffset:Infinity},{...input,normalOffset:16384.001},{...input,normalOffset:-16384.001}])assert.throws(()=>layoutGlyphRunOnPath(plan,bad));
 for(const advance of [0,-1,.00099,16384.01,null,NaN,Infinity,'2'])assert.throws(()=>layoutGlyphRunOnPath(plan,{...input,glyphs:[{glyphId:'x',advance}]}));
 for(const glyph of [{advance:1},{glyphId:'x'},{glyphId:'x',advance:1,extra:0},{glyphId:'has space',advance:1},null])assert.throws(()=>layoutGlyphRunOnPath(plan,{...input,glyphs:[glyph]}));
});

test('known null-prototype/nonenumerable records are supported; unknown own keys are not',()=>{
 const plain=value=>Object.create(null,Object.fromEntries(Object.entries(value).map(([k,v])=>[k,{value:v,enumerable:false}])));
 const data=plain({...input,glyphs:input.glyphs.map(plain)});assert.deepEqual(layoutGlyphRunOnPath(plan,data),layoutGlyphRunOnPath(plan,input));
 for(const key of ['hiddenUnknown',Symbol('unknown')]){
  const bad=Object.defineProperty({...input},key,{value:1,enumerable:false});assert.throws(()=>layoutGlyphRunOnPath(plan,bad));
  const glyph=Object.defineProperty({...input.glyphs[0]},key,{value:1,enumerable:false});assert.throws(()=>layoutGlyphRunOnPath(plan,{...input,glyphs:[glyph]}));
 }
});

test('brand validation rejects foreign/forged plans before metadata access',async()=>{
 for(const p of [{...plan},compilePolyline({points:[{x:0,y:0},{x:100,y:0}]}),null])assert.throws(()=>layoutGlyphRunOnPath(p,input));
 let reads=0;const forged={get totalLength(){reads++;return 100;}};assert.throws(()=>layoutGlyphRunOnPath(forged,input));assert.equal(reads,0);
 const other=await import('../lib/foundations/geometry/cubic-path.mjs?glyph-brand-test');
 const foreign=other.compileCubicPath({segments,tolerance:.01});assert.throws(()=>layoutGlyphRunOnPath(foreign,input));
});

test('extreme accepted advance, offset and tracking remain explicit and finite',()=>{
 const long=line({x:-16384,y:0},{x:16384,y:0});
 for(const normalOffset of [-16384,16384]){
  const r=layoutGlyphRunOnPath(long,{glyphs:[{glyphId:'large',advance:16384}],startDistance:0,tracking:16384,normalOffset});
  close(r.glyphs[0].position.y,normalOffset);assert.equal(r.span,16384);
 }
 const tiny=layoutGlyphRunOnPath(plan,{glyphs:[{glyphId:'tiny',advance:.001}],startDistance:0,tracking:0,normalOffset:0});close(tiny.glyphs[0].distance,.0005);
});

test('glyph layout is independent of call order and repeated input mutation elsewhere',()=>{
 const p=compileCubicPath({segments,tolerance:.01});
 const args=[0,70,150,400].map(startDistance=>({...input,startDistance})),expected=args.map(a=>layoutGlyphRunOnPath(p,a));
 for(const i of [3,1,0,2,0,3])assert.deepEqual(layoutGlyphRunOnPath(p,args[i]),expected[i]);
 const fresh=compileCubicPath({segments,tolerance:.01});assert.deepEqual(layoutGlyphRunOnPath(fresh,args[2]),expected[2]);
});

test('new Node process produces the same glyph layout bytes',()=>{
 const p=compileCubicPath({segments,tolerance:.01}),expected=JSON.stringify(layoutGlyphRunOnPath(p,input));
 const geometry=new URL('../lib/foundations/geometry/cubic-path.mjs',import.meta.url).href,typography=new URL('../lib/foundations/typography/glyph-run-path.mjs',import.meta.url).href;
 const code=`import {compileCubicPath} from ${JSON.stringify(geometry)};import {layoutGlyphRunOnPath} from ${JSON.stringify(typography)};process.stdout.write(JSON.stringify(layoutGlyphRunOnPath(compileCubicPath({segments:${JSON.stringify(segments)},tolerance:.01}),${JSON.stringify(input)})));`;
 const run=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8',cwd:'/tmp'});assert.equal(run.status,0,run.stderr);assert.equal(run.stdout,expected);
});

test('Native glyph drawing is deterministic in reverse order, without library font state',()=>{
 const {api}=loadNativeCanvas(),canvas=api.createCanvas(400,160),ctx=canvas.getContext('2d');
 const p=line({x:20,y:100},{x:380,y:100});
 const render=startDistance=>{ctx.reset();ctx.fillStyle='#faf4e6';ctx.fillRect(0,0,400,160);ctx.font='30px sans-serif';
  const data={glyphs:[{glyphId:'A',advance:24},{glyphId:'B',advance:22},{glyphId:'C',advance:25}],startDistance,tracking:6,normalOffset:-5};
  for(const glyph of layoutGlyphRunOnPath(p,data).glyphs){ctx.save();ctx.translate(glyph.position.x,glyph.position.y);ctx.rotate(glyph.angle);ctx.fillStyle='#a43125';ctx.fillText(glyph.glyphId,-glyph.advance/2,0);ctx.restore();}
  return createHash('sha256').update(canvas.toBuffer('image/png')).digest('hex');};
 const values=[0,70,160,230],expected=values.map(render);assert.equal(new Set(expected).size,4);
 for(const i of [3,1,0,2,3])assert.equal(render(values[i]),expected[i]);
});
