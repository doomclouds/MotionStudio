import test from 'node:test';import assert from 'node:assert/strict';
import {shadeContourRim} from './index.mjs';import {createFixture} from './fixtures.mjs';
for(const kind of ['ring','bridge','diamond'])test(`${kind}: alpha, determinism, isolation, narrow-rim ablation`,()=>{
 const p=createFixture(kind),before=p.alpha.slice(),a=shadeContourRim(p),b=shadeContourRim({...p,enabled:false});
 assert.deepEqual(a,shadeContourRim(p));assert.deepEqual(p.alpha,before);assert.notDeepEqual(a,b);
 let changed=0,solid=0;for(let i=0;i<p.alpha.length;i++){assert.equal(a[i*4+3],p.alpha[i]);assert.equal(b[i*4+3],p.alpha[i]);if(p.alpha[i])solid++;if(a[i*4]!==b[i*4]){changed++;assert.ok(p.alpha[i]);}}
 assert.ok(changed>0&&changed<solid);a[0]=123;assert.notEqual(shadeContourRim(p)[0],123);
});
test('holes and transparent input stay transparent',()=>{let p=createFixture('ring'),o=shadeContourRim(p);assert.equal(o[(60*160+80)*4+3],0);assert.ok(shadeContourRim({...p,alpha:new Uint8Array(160*120)}).every(v=>v===0));});
test('boundary validation',()=>{let p=createFixture('bridge');for(const patch of [{width:NaN},{height:2},{width:2049},{alpha:[]},{alpha:new Uint8Array(2)},{bandWidth:0},{bandWidth:Infinity},{face:[0,0,NaN]},{contrast:128},{edgeBase:-1},{light:[0,0]},{light:[Infinity,1]},{enabled:'yes'}])assert.throws(()=>shadeContourRim({...p,...patch}));let a=p.alpha.slice();a[0]=1;assert.throws(()=>shadeContourRim({...p,alpha:a}));});
test('light reversal changes rim but not flat interior',()=>{let p=createFixture('bridge');assert.notDeepEqual(shadeContourRim(p),shadeContourRim({...p,light:[-.52,-.85]}));assert.deepEqual(shadeContourRim({...p,enabled:false}),shadeContourRim({...p,enabled:false,light:[-.52,-.85]}));});

test('reject sparse color and light arrays, including inherited channels',()=>{
 const p=createFixture('bridge');
 const inherited=Array(3);Object.setPrototypeOf(inherited,Object.assign(Object.create(Array.prototype),{0:200,1:200,2:207}));
 for(const face of [Array(3),[200,,207],[,200,207],[200,200,],inherited,[200,undefined,207],[200,null,207],[200,'200',207]]){
   for(const enabled of [true,false]) assert.throws(()=>shadeContourRim({...p,face,enabled}),TypeError);
 }
 for(const light of [Array(2),[1,,],[,1],[1,undefined]])assert.throws(()=>shadeContourRim({...p,light}),TypeError);
});
test('accept dense channel endpoints and fractional channels without treating zero as absent',()=>{
 const p=createFixture('bridge');
 for(const face of [[0,0,0],[255,255,255],[0,127.5,255],[200,200,207]]){
   const result=shadeContourRim({...p,face,enabled:false}),i=p.alpha.findIndex(v=>v===255)*4;
   assert.deepEqual([...result.slice(i,i+3)],[...new Uint8ClampedArray(face)]);
 }
 assert.doesNotThrow(()=>shadeContourRim({...p,light:[0,1]}));
 assert.doesNotThrow(()=>shadeContourRim({...p,light:[1,0]}));
});
test('AA alpha bytes survive the binary distance threshold unchanged',()=>{
 const width=9,height=9,alpha=new Uint8ClampedArray(width*height);
 [1,64,127,128,200,254,255].forEach((v,k)=>{alpha[4*width+k+1]=v;});
 for(const bandWidth of [1,32])for(const enabled of [true,false]){
  const o=shadeContourRim({width,height,alpha,bandWidth,enabled});
  for(let i=0;i<alpha.length;i++)assert.equal(o[i*4+3],alpha[i]);
 }
 const aa=shadeContourRim({width,height,alpha,bandWidth:1}),flat=shadeContourRim({width,height,alpha,bandWidth:1,enabled:false});
 assert.notDeepEqual(aa,flat); // Alpha <=127 has distance 0 and can still receive rim color.
});
test('one-pixel binary line: band 1 is unchanged; band 32 may color its entire width',()=>{
 const width=11,height=11,alpha=new Uint8Array(width*height);for(let y=2;y<9;y++)alpha[y*width+5]=255;
 const p={width,height,alpha},flat=shadeContourRim({...p,enabled:false});
 assert.deepEqual(shadeContourRim({...p,bandWidth:1}),flat);
 const wide=shadeContourRim({...p,bandWidth:32});let changed=0;
 for(let i=0;i<alpha.length;i++)if(alpha[i]){assert.notEqual(wide[i*4],flat[i*4]);changed++;}
 assert.equal(changed,7);assert.throws(()=>shadeContourRim({...p,bandWidth:32.001}),RangeError);
});
test('maximum pixel budget and dimension limits are enforced',()=>{
 // 2048x512 is exactly the 1,048,576-pixel budget and includes a nonempty shape.
 const width=2048,height=512,alpha=new Uint8Array(width*height);alpha[256*width+1024]=255;
 const out=shadeContourRim({width,height,alpha});assert.equal(out.length,4194304);assert.equal(out[(256*width+1024)*4+3],255);
 assert.throws(()=>shadeContourRim({width:2048,height:513,alpha:new Uint8Array(2048*513)}),RangeError);
 assert.throws(()=>shadeContourRim({width:2049,height:5,alpha:new Uint8Array(2049*5)}),RangeError);
 assert.throws(()=>shadeContourRim({width:5,height:2049,alpha:new Uint8Array(5*2049)}),RangeError);
});
test('light norm includes exactly 1e-6 and rejects a smaller norm',()=>{
 const p=createFixture('bridge');assert.doesNotThrow(()=>shadeContourRim({...p,light:[1e-6,0]}));
 assert.throws(()=>shadeContourRim({...p,light:[0.999e-6,0]}),TypeError);
 assert.deepEqual(shadeContourRim({...p,light:[1e-6,0]}),shadeContourRim({...p,light:[1,0]}));
});
