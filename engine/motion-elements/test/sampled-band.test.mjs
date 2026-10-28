import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {compileSampledBand as compile,drawSampledBand as draw} from '../lib/index.mjs';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
import {drawSampledBandStudy} from '../examples/sampled-band-study.mjs';
const {api}=loadNativeCanvas(),backend={Path2D:api.Path2D};
const samples=()=>[{x:10,y:30,halfWidth:0},{x:40,y:20,halfWidth:10},{x:80,y:40,halfWidth:5}];
const bytes=c=>Buffer.from(c.getImageData(0,0,320,240).data);
const context=()=>api.createCanvas(320,240).getContext('2d');
test('exact upper-forward/lower-reverse contour, bounds, detached deep freeze',()=>{
 const input={samples:samples()},b=compile(input);
 assert.deepEqual(b.vertices,[{x:10,y:30},{x:40,y:10},{x:80,y:35},{x:80,y:45},{x:40,y:30},{x:10,y:30}]);
 assert.deepEqual(b.bounds,{x:10,y:10,width:70,height:35});assert.equal(b.degenerate,false);
 input.samples[0].y=500;assert.equal(b.samples[0].y,30);
 for(const v of [b,b.samples,b.samples[0],b.vertices,b.vertices[0],b.bounds])assert.ok(Object.isFrozen(v));
});
test('strict samples, coordinates, width, x ordering and numeric envelope',()=>{
 const invalid=[null,{},[],{samples:null},{samples:[]},{samples:[samples()[0]]},{samples:Array(1025).fill(samples()[0])},{samples:Array(2)},
  {samples:samples(),extra:1},{samples:samples(),[Symbol('bad')]:1}];
 for(const [key,values] of Object.entries({x:[NaN,Infinity,-Infinity,1e9+1,'1'],y:[NaN,Infinity,-1e9-1,null],halfWidth:[-1,NaN,Infinity,1e9+1,'1']}))for(const value of values){const s=samples();s[1][key]=value;invalid.push({samples:s});}
 for(const x of [10,9]){const s=samples();s[1].x=x;invalid.push({samples:s});}
 const extra=samples();extra.note=1;invalid.push({samples:extra});
 const hidden=samples();Object.defineProperty(hidden[0],'hidden',{value:1});invalid.push({samples:hidden});
 const symbol=samples();symbol[Symbol('bad')]=1;invalid.push({samples:symbol});
 invalid.push({samples:[{x:0,y:1e9,halfWidth:Number.MIN_VALUE},{x:1,y:0,halfWidth:0}]});
 for(const input of invalid)assert.throws(()=>compile(input));
 const max=compile({samples:[{x:-1e9,y:-1e9,halfWidth:1e9},{x:1e9,y:1e9,halfWidth:1e9}]});
 assert.deepEqual(max.bounds,{x:-1e9,y:-2e9,width:2e9,height:4e9});
 const tiny=compile({samples:[{x:0,y:0,halfWidth:Number.MIN_VALUE},{x:Number.MIN_VALUE,y:0,halfWidth:0}]});assert.equal(tiny.degenerate,false);
 assert.equal(compile({samples:Array.from({length:1024},(_,x)=>({x,y:0,halfWidth:1}))}).vertices.length,2048);
});
test('zero endpoints, interior pinch and fully degenerate band are explicit',()=>{
 const b=compile({samples:[{x:0,y:5,halfWidth:3},{x:1,y:2,halfWidth:0},{x:2,y:5,halfWidth:4}]});assert.equal(b.degenerate,false);
 const zero=compile({samples:[{x:0,y:5,halfWidth:0},{x:1,y:-8,halfWidth:0}]});assert.equal(zero.degenerate,true);
 const c=context(),before=bytes(c);draw(c,zero,{fill:'red'},backend);assert.deepEqual(bytes(c),before);
});
test('raster matches independently constructed variable-width contour under parent transform/alpha/clip',()=>{
 for(let k=0;k<12;k++){
  const s=Array.from({length:2+k},(_,i)=>({x:10+i*8,y:45+18*Math.sin(i*.6+k),halfWidth:i%4===0?0:3+i}));
  const a=context(),b=context();
  for(const c of [a,b]){c.translate(40,20);c.rotate(.13);c.scale(1.2,.8);c.globalAlpha=.6;c.beginPath();c.rect(0,0,220,120);c.clip();}
  draw(a,compile({samples:s}),{fill:'#527d91'},backend);
  b.beginPath();s.forEach((p,i)=>i?b.lineTo(p.x,p.y-p.halfWidth):b.moveTo(p.x,p.y-p.halfWidth));
  for(let i=s.length-1;i>=0;i--)b.lineTo(s[i].x,s[i].y+s[i].halfWidth);b.closePath();b.fillStyle='#527d91';b.fill();
  assert.deepEqual(bytes(a),bytes(b));
 }
});
test('adapter isolation: current path, styles, transform, alpha, exceptions and forged state',()=>{
 const a=context(),b=context(),band=compile({samples:samples()});
 for(const c of [a,b]){c.translate(10,10);c.globalAlpha=.5;c.fillStyle='lime';c.beginPath();c.rect(100,100,20,20);}
 draw(a,band,{fill:'red'},backend);
 // Clear only band pixels before comparing caller path and restored native styles.
 a.clearRect(-10,-10,110,100);a.fill();b.fill();assert.deepEqual(bytes(a),bytes(b));
 assert.equal(a.globalAlpha,b.globalAlpha);assert.deepEqual(a.getTransform(),b.getTransform());
 const calls=[],mock={save(){calls.push('save');},restore(){calls.push('restore');},fill(){throw Error('draw failure');}};
 assert.throws(()=>draw(mock,band,{fill:'red'},backend),/draw failure/);assert.deepEqual(calls,['save','restore']);
 for(const args of [[structuredClone(band),{fill:'red'},backend],[band,{},backend],[band,{fill:''},backend],[band,{fill:'red',stroke:'black'},backend],[band,{fill:'red'},{Path2D:null}]])assert.throws(()=>draw(a,...args));
});
test('neutral wave and chart examples, deterministic repeated and reordered calls',()=>{
 const a=context(),b=context();const states=drawSampledBandStudy(a,backend);drawSampledBandStudy(b,backend);assert.deepEqual(bytes(a),bytes(b));
 for(const name of ['confidence','wave','confidence'])assert.deepEqual(compile({samples:states[name].samples}),states[name]);
 assert.ok(bytes(a).some(v=>v));
});

test('independent vertical cross-section pixel membership and fresh-process geometry',()=>{
 const s=[{x:20,y:75,halfWidth:12},{x:100,y:45,halfWidth:25},{x:200,y:90,halfWidth:4}];
 const band=compile({samples:s}),c=context();draw(c,band,{fill:'red'},backend);
 const data=c.getImageData(0,0,320,240).data;
 for(let x=22;x<198;x++)for(let y=5;y<130;y++){
  const i=x+.5<100?0:1,a=s[i],b=s[i+1],t=(x+.5-a.x)/(b.x-a.x);
  const center=a.y+(b.y-a.y)*t,width=a.halfWidth+(b.halfWidth-a.halfWidth)*t;
  const distance=Math.abs(y+.5-center)-width;
  if(Math.abs(distance)>2)assert.equal(data[(y*320+x)*4+3],distance<0?255:0);
 }
 const url=new URL('../lib/index.mjs',import.meta.url).href;
 const result=execFileSync(process.execPath,['--input-type=module','-e',`import {compileSampledBand} from '${url}';console.log(JSON.stringify(compileSampledBand(${JSON.stringify({samples:s})})))`],{encoding:'utf8'});
 assert.deepEqual(JSON.parse(result),band);
});
