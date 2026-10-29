import{test}from'node:test';import assert from'node:assert/strict';import{compileConvolution as C,convolveRGBA as F}from'../lib/foundations/raster/convolution.mjs';
const image=(w,h,p)=>({width:w,height:h,data:new Uint8ClampedArray(p)}),spec=(o={})=>({kernel:[[1,1,1]],boundary:'clamp',effect:'blur',amount:1,alphaMode:'preserve',...o});
test('constant image/clamp, detached output and frozen normalized plan',()=>{const source=image(3,1,[40,60,80,255,40,60,80,255,40,60,80,255]),k=[[1,1,1]],p=C(spec({kernel:k}));k[0][0]=900;assert.deepEqual(p.weights,[1/3,1/3,1/3]);assert.ok(Object.isFrozen(p.weights));const out=F(p,source);assert.deepEqual(out.data,source.data);assert.notEqual(out.data,source.data);});
test('asymmetric kernel is actual convolution not correlation',()=>{const src=image(3,1,[10,0,0,255,20,0,0,255,90,0,0,255]),out=F(C(spec({kernel:[[0,0,1]]})),src);assert.deepEqual(Array.from(out.data).filter((_,i)=>i%4===0),[10,10,20]);});
test('premult coverage normalization avoids hidden-color fringe',()=>{const src=image(2,1,[255,0,0,255,0,0,255,0]);const preserve=F(C(spec()),src);assert.deepEqual([...preserve.data],[255,0,0,255,0,0,0,0]);const filter=F(C(spec({alphaMode:'filter'})),src);assert.deepEqual([...filter.data],[255,0,0,170,255,0,0,85]);});
test('transparent boundary changes coverage, not supported-color brightness',()=>{const src=image(1,1,[100,150,200,255]),p=C(spec({kernel:[[1,1,1],[1,1,1],[1,1,1]],boundary:'transparent',alphaMode:'filter'}));assert.deepEqual([...F(p,src).data],[100,150,200,28]);assert.deepEqual([...F(C(spec({kernel:[[1,1,1]],boundary:'transparent',alphaMode:'preserve'})),src).data],[100,150,200,255]);});
test('unsharp is original plus amount times original-minus-neighborhood',()=>{const src=image(3,1,[80,80,80,255,100,100,100,255,80,80,80,255]);assert.deepEqual([...F(C(spec({effect:'unsharp'})),src).data],[73,73,73,255,113,113,113,255,73,73,73,255]);});
test('fractional blur and filter-alpha interpolation are premultiplied',()=>{const src=image(2,1,[255,0,0,255,0,0,255,0]);assert.deepEqual([...F(C(spec({alphaMode:'filter',amount:.5})),src).data],[255,0,0,213,255,0,0,43]);});
test('amount zero preserves visible bytes but normalizes zero-alpha RGB',()=>{const src=image(2,1,[8,9,10,255,90,80,70,0]);assert.deepEqual([...F(C(spec({amount:0})),src).data],[8,9,10,255,0,0,0,0]);});
test('strict validation, holes, alpha mode and brand reject',()=>{for(const s of[spec({kernel:[[0]]}),spec({kernel:[[-1,2,1]]}),spec({kernel:[[1,1]]}),spec({kernel:[[1,,1]]}),spec({effect:'unsharp',alphaMode:'filter'}),spec({effect:'unsharp',amount:2.1}),spec({amount:NaN}),spec({extra:1}),spec({boundary:'wrap'})])assert.throws(()=>C(s));const src=image(1,1,[1,2,3,255]);assert.throws(()=>F(JSON.parse(JSON.stringify(C(spec()))),src));assert.throws(()=>F(C(spec()),{...src,data:new Float32Array(4)}));});
test('independent scalar reference covers 2D convolution, both boundaries and alpha policies',()=>{let seed=17;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed>>>24;};const src=image(7,5,Array.from({length:140},rng)),weights=[[1,2,0],[3,4,1],[0,5,2]],sum=18;
 for(const boundary of['transparent','clamp'])for(const alphaMode of['filter','preserve']){const out=F(C(spec({kernel:weights,boundary,alphaMode})),src);for(let y=0;y<5;y++)for(let x=0;x<7;x++){let a=0,r=0,g=0,b=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){let sx=x+dx,sy=y+dy;if(boundary==='transparent'&&(sx<0||sy<0||sx>=7||sy>=5))continue;sx=Math.min(6,Math.max(0,sx));sy=Math.min(4,Math.max(0,sy));let i=(sy*7+sx)*4,w=weights[1-dy][1-dx]/sum,aw=w*src.data[i+3];a+=aw;r+=src.data[i]*aw;g+=src.data[i+1]*aw;b+=src.data[i+2]*aw;}const i=(y*7+x)*4,oa=alphaMode==='filter'?Math.round(a):src.data[i+3],want=oa===0?[0,0,0,0]:[Math.round(r/a),Math.round(g/a),Math.round(b/a),oa];assert.deepEqual([...out.data.slice(i,i+4)],want);}}});
import vm from 'node:vm';
test('data-only records reject getters without executing them and reject all unknown own keys',()=>{
 let reads=0;for(const key of Object.keys(spec())){const s=spec();Object.defineProperty(s,key,{get(){reads++;return spec()[key];}});assert.throws(()=>C(s),/data fields/);}
 const src=image(1,1,[1,2,3,255]);for(const key of Object.keys(src)){const s={...src};Object.defineProperty(s,key,{get(){reads++;return src[key];}});assert.throws(()=>F(C(spec()),s),/data fields/);}assert.equal(reads,0);
 for(const key of [...Object.keys(spec())]){const s=spec();delete s[key];assert.throws(()=>C(s));}
 for(const s of [Object.assign(Object.create(null),spec()),vm.runInNewContext('({kernel:[[1]],boundary:"clamp",effect:"blur",amount:1,alphaMode:"preserve"})'),new(class {})(),Object.defineProperty(spec(),'hidden',{value:1}),{...spec(),[Symbol()]:1}])assert.throws(()=>C(s));
 const s=spec();Object.defineProperty(s,'amount',{value:1,enumerable:false});assert.doesNotThrow(()=>C(s));
});
test('kernel arrays and rows are dense ordinary same-realm data arrays without extras',()=>{
 let reads=0;for(const row of [false,true])for(const variant of ['getter','extra','symbol','hole','subclass','foreign']){
  const a=variant==='subclass'?new(class extends Array {})(1,2,1):variant==='foreign'?vm.runInNewContext('[1,2,1]'):[1,2,1];
  let k=row?[a]:[a,[1,2,1],[1,2,1]],target=row?a:k;
  if(variant==='getter')Object.defineProperty(target,'0',{get(){reads++;return row?1:a;}});
  if(variant==='extra')Object.defineProperty(target,'extra',{value:1});if(variant==='symbol')target[Symbol()]=1;if(variant==='hole')delete target[0];
  if(!row&&variant==='subclass')k=new(class extends Array {})(a,[1,2,1],[1,2,1]);if(!row&&variant==='foreign')k=vm.runInNewContext('[[1,2,1]]');
  assert.throws(()=>C(spec({kernel:k})),variant);
 }assert.equal(reads,0);
});
test('weight, enum, amount, dimensions and image type ranges reject',()=>{
 for(const v of [-1,NaN,Infinity,-Infinity,'1',null,undefined,1000001])assert.throws(()=>C(spec({kernel:[[v]]})));
 for(const k of [[],[[1,1]],Array.from({length:27},()=>[1]),[[1],[],[1]],[[0]]])assert.throws(()=>C(spec({kernel:k})));
 for(const amount of [-.01,1.0001,NaN,'0'])assert.throws(()=>C(spec({amount})));
 for(const key of ['boundary','effect','alphaMode'])for(const v of ['',null,{},1])assert.throws(()=>C(spec({[key]:v})));
 const p=C(spec());for(const n of [0,4097,.5,NaN,Infinity,'1'])for(const k of ['width','height'])assert.throws(()=>F(p,{...image(1,1,[0,0,0,0]),[k]:n}));
 for(const data of [[],new Float32Array(4),new Uint8Array(3),new(class extends Uint8Array {})(4),vm.runInNewContext('new Uint8Array(4)'),new DataView(new ArrayBuffer(4))])assert.throws(()=>F(p,{width:1,height:1,data}));
 assert.throws(()=>F(p,{width:4096,height:1025,data:new Uint8Array(0)}),/area/);
});
test('intrinsic RGBA metadata ignores shadow getters; offset and shared views work without aliasing outputs',()=>{
 const backing=new Uint8Array([9,9,9,9,20,40,80,255,9,9,9,9]),data=backing.subarray(4,8);let reads=0;
 for(const key of ['length','buffer','byteOffset'])Object.defineProperty(data,key,{get(){reads++;throw Error('must not read');}});
 const p=C(spec({kernel:[[1]]})),out=F(p,{width:1,height:1,data});assert.deepEqual([...out.data],[20,40,80,255]);assert.equal(reads,0);out.data[0]=99;assert.equal(backing[4],20);
 const shared=new Uint8Array(new SharedArrayBuffer(4));shared.set([3,5,7,255]);assert.deepEqual([...F(p,{width:1,height:1,data:shared}).data],[3,5,7,255]);
 const detached=new Uint8Array(4);structuredClone(detached.buffer,{transfer:[detached.buffer]});assert.throws(()=>F(p,{width:1,height:1,data:detached}));
});
test('64 million area-times-cells budget applies before output, even zero amount and zero weights',()=>{
 const kernel=Array.from({length:25},()=>Array(25).fill(0));kernel[12][12]=1;
 for(const amount of [0,1]){const p=C(spec({kernel,amount}));const exact={width:320,height:320,data:new Uint8Array(320*320*4)};assert.equal(F(p,exact).data.length,exact.data.length);
 assert.throws(()=>F(p,{width:321,height:320,data:new Uint8Array(321*320*4)}),/64000000/);}
 const p=C(spec({kernel:[[1]],amount:0}));assert.equal(F(p,{width:4096,height:1024,data:new Uint8Array(4194304*4)}).data.length,4194304*4);
});
test('subnormal positive kernels normalize; maximum weights and clipping remain bounded',()=>{
 for(const weight of [Number.MIN_VALUE,1e6]){const p=C(spec({kernel:[[weight]]}));assert.deepEqual(p.weights,[1]);assert.deepEqual([...F(p,image(1,1,[10,20,30,255])).data],[10,20,30,255]);}
 const src=image(3,1,[0,0,0,255,255,255,255,255,0,0,0,255]);assert.deepEqual([...F(C(spec({effect:'unsharp',amount:2})),src).data],[0,0,0,255,255,255,255,255,0,0,0,255]);
});
test('half-alpha IEEE threshold may canonicalize all RGB, not merely differ by one RGB byte',()=>{
 // Exact alpha is 49/98 = .5, but 49 * (1/98) is .49999999999999994 in JS.
 const out=F(C(spec({kernel:[[1,1,96]],boundary:'transparent',alphaMode:'filter'})),image(1,1,[255,50,20,49]));
 assert.equal(49*(1/98),.49999999999999994);assert.deepEqual([...out.data],[0,0,0,0]);
});

test('normalized-weight alpha half threshold can canonicalize straight RGB by255',()=>{
 const p=C({kernel:[[1,97,0]],boundary:'transparent',effect:'blur',amount:1,alphaMode:'filter'});
 assert.equal(49/98,.5);assert.ok(p.weights[0]*49<.5);
 const out=F(p,{width:2,height:1,data:new Uint8ClampedArray([0,0,0,0,255,50,20,49])});
 assert.deepEqual([...out.data.subarray(0,4)],[0,0,0,0]);
});
