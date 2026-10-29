import{test}from'node:test';import assert from'node:assert/strict';import{compileProjectiveRaster as C,warpProjectiveRGBA as W,projectRasterPoint as P}from'../lib/foundations/raster/projective-raster.mjs';
const spec=(o={})=>({sourceWidth:2,sourceHeight:2,outputWidth:2,outputHeight:2,quad:[{x:0,y:0},{x:2,y:0},{x:2,y:2},{x:0,y:2}],...o}),img=(w,h,p)=>({width:w,height:h,data:new Uint8ClampedArray(p)}),near=(a,b,e=1e-9)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
test('identity RGBA and exact source-boundary corner correspondences',()=>{const p=C(spec()),source=img(2,2,[255,0,0,255,0,255,0,255,0,0,255,255,80,100,120,255]);assert.deepEqual(W(p,source).data,source.data);for(const [i,v]of[{x:0,y:0},{x:2,y:0},{x:2,y:2},{x:0,y:2}].entries()){let q=P(p,v);near(q.x,p.quad[i].x);near(q.y,p.quad[i].y);}});
test('premultiplied bilinear prevents invisible-blue contamination',()=>{const p=C(spec({sourceWidth:2,sourceHeight:1,outputWidth:3,outputHeight:1,quad:[{x:0,y:0},{x:3,y:0},{x:3,y:1},{x:0,y:1}]})),source=img(2,1,[255,0,0,255,0,0,255,0]);assert.deepEqual([...W(p,source).data],[255,0,0,255,255,0,0,128,0,0,0,0]);});
test('ordered reverse-winding quad performs reflection, not forced winding repair',()=>{const p=C(spec({quad:[{x:2,y:0},{x:0,y:0},{x:0,y:2},{x:2,y:2}]})),source=img(2,2,[10,0,0,255,20,0,0,255,30,0,0,255,40,0,0,255]);assert.deepEqual(Array.from(W(p,source).data).filter((_,i)=>i%4===0),[20,10,40,30]);});
test('outside quad is transparent; caller can draw clipped/offscreen quad',()=>{const p=C(spec({outputWidth:5,outputHeight:4,quad:[{x:-1,y:1},{x:1,y:1},{x:1,y:3},{x:-1,y:3}]})),src=img(2,2,Array.from({length:16},()=>255)),out=W(p,src);assert.equal(out.data.filter((v,i)=>i%4===3&&v>0).length,2);});
test('single-pixel image and source-edge replication inside mapped domain',()=>{const p=C(spec({sourceWidth:1,sourceHeight:1,outputWidth:3,outputHeight:3,quad:[{x:0,y:0},{x:3,y:0},{x:3,y:3},{x:0,y:3}]}));const out=W(p,img(1,1,[40,90,130,200]));for(let i=0;i<36;i+=4)assert.deepEqual([...out.data.slice(i,i+4)],[40,90,130,200]);});
// Independent 8x8 Gaussian elimination oracle, not production unit-square formula.
function solve(A,b){A=A.map((r,i)=>[...r,b[i]]);for(let k=0;k<8;k++){let p=k;for(let j=k+1;j<8;j++)if(Math.abs(A[j][k])>Math.abs(A[p][k]))p=j;[A[k],A[p]]=[A[p],A[k]];const d=A[k][k];for(let j=k;j<=8;j++)A[k][j]/=d;for(let i=0;i<8;i++)if(i!==k){const f=A[i][k];for(let j=k;j<=8;j++)A[i][j]-=f*A[k][j];}}return A.map(r=>r[8]);}
function oracle(quad){const A=[],b=[];[[0,0],[1,0],[1,1],[0,1]].forEach(([u,v],i)=>{const{x,y}=quad[i];A.push([u,v,1,0,0,0,-x*u,-x*v],[0,0,0,u,v,1,-y*u,-y*v]);b.push(x,y);});return solve(A,b);}
test('nonaffine projective mapping agrees with independent linear-system oracle',()=>{const quad=[{x:17,y:9},{x:170,y:24},{x:140,y:160},{x:35,y:131}],p=C(spec({sourceWidth:100,sourceHeight:80,outputWidth:200,outputHeight:180,quad})),m=oracle(quad);for(const u of[0,.1,.4,.7,1])for(const v of[0,.2,.6,.9,1]){const q=P(p,{x:u*100,y:v*80}),d=m[6]*u+m[7]*v+1;near(q.x,(m[0]*u+m[1]*v+m[2])/d);near(q.y,(m[3]*u+m[4]*v+m[5])/d);}});
test('raster values follow inverse homography rather than triangular affine interpolation',()=>{const quad=[{x:1,y:1},{x:17,y:3},{x:14,y:18},{x:4,y:16}],p=C(spec({sourceWidth:8,sourceHeight:8,outputWidth:20,outputHeight:20,quad})),source=img(8,8,Array.from({length:256},(_,i)=>i%4===0?Math.floor(i/4)%8*30:i%4===1?Math.floor(i/32)*30:i%4===2?0:255)),out=W(p,source),m=oracle(quad);let checked=0;for(let y=0;y<20;y++)for(let x=0;x<20;x++){const X=x+.5,Y=y+.5,a=m[0]-X*m[6],b=m[1]-X*m[7],c=X-m[2],d=m[3]-Y*m[6],e=m[4]-Y*m[7],f=Y-m[5],det=a*e-b*d,u=(c*e-b*f)/det,v=(a*f-c*d)/det,i=(y*20+x)*4;if(u>=-1e-12&&u<=1+1e-12&&v>=-1e-12&&v<=1+1e-12){assert.equal(out.data[i+3],255);near(out.data[i],Math.round(Math.max(0,Math.min(7,u*8-.5))*30),1.01);near(out.data[i+1],Math.round(Math.max(0,Math.min(7,v*8-.5))*30),1.01);checked++;}else assert.equal(out.data[i+3],0);}assert.ok(checked>100);});
test('invalid crossed, concave, degenerate, near-flat, unknown and serialized plans reject',()=>{for(const q of[[{x:0,y:0},{x:2,y:2},{x:2,y:0},{x:0,y:2}],[{x:0,y:0},{x:2,y:0},{x:.5,y:.5},{x:0,y:2}],[{x:0,y:0},{x:2,y:0},{x:2,y:0},{x:0,y:2}],[{x:0,y:0},{x:2,y:0},{x:2,y:1e-10},{x:0,y:1e-10}]])assert.throws(()=>C(spec({quad:q})));assert.throws(()=>C({...spec(),extra:1}));assert.throws(()=>W(JSON.parse(JSON.stringify(C(spec()))),img(2,2,new Array(16).fill(0))));assert.throws(()=>W(C(spec()),img(1,1,[0,0,0,0])));});
test('input detachment, frozen nested state, random seek/repeated compile determinism',()=>{const s=spec(),p=C(s);s.quad[0].x=100;assert.equal(p.quad[0].x,0);assert.ok(Object.isFrozen(p.quad[0]));const src=img(2,2,Array.from({length:16},(_,i)=>i*17));const states=[1,4,2,5,3].map(k=>C(spec({outputWidth:12,outputHeight:12,quad:[{x:k,y:1},{x:k+3,y:2},{x:k+2,y:6},{x:k,y:5}]})));const baseline=states.map(p=>W(p,src).data);for(const i of[4,0,3,1,2,2])assert.deepEqual(W(states[i],src).data,baseline[i]);});
import vm from 'node:vm';
test('every record and quad element must be data-only, missing/extra keys rejected without getter calls',()=>{
 let reads=0;for(const key of Object.keys(spec())){const s=spec();Object.defineProperty(s,key,{get(){reads++;return spec()[key];}});assert.throws(()=>C(s));const missing=spec();delete missing[key];assert.throws(()=>C(missing));}
 for(const key of ['x','y']){const q=spec().quad;Object.defineProperty(q[0],key,{get(){reads++;return 0;}});assert.throws(()=>C(spec({quad:q})));}
 const q=spec().quad;Object.defineProperty(q,'0',{get(){reads++;return{x:0,y:0};}});assert.throws(()=>C(spec({quad:q})));
 const p=C(spec());for(const key of ['width','height','data']){const input=img(2,2,new Array(16).fill(0));Object.defineProperty(input,key,{get(){reads++;return 2;}});assert.throws(()=>W(p,input));}
 for(const key of ['x','y']){const pt={x:0,y:0};Object.defineProperty(pt,key,{get(){reads++;return 0;}});assert.throws(()=>P(p,pt));}assert.equal(reads,0);
 for(const extra of [s=>({...s,[Symbol()]:1}),s=>Object.defineProperty(s,'hidden',{value:1})]){assert.throws(()=>C(extra(spec())));assert.throws(()=>P(p,extra({x:0,y:0})));const q=spec().quad;q[0]=extra(q[0]);assert.throws(()=>C(spec({quad:q})));}
});
test('quad ordinary array/record contract and image byte-view brands are current-realm only',()=>{
 for(const q of [spec().quad.slice(1),[...spec().quad,{x:0,y:0}],Object.assign(spec().quad,{other:1}),Object.assign(spec().quad,{[Symbol()]:1}),new(class extends Array {})(...spec().quad),vm.runInNewContext('[{x:0,y:0},{x:2,y:0},{x:2,y:2},{x:0,y:2}]')])assert.throws(()=>C(spec({quad:q})));
 const sparse=spec().quad;delete sparse[1];assert.throws(()=>C(spec({quad:sparse})));
 for(const q of [Object.assign(Object.create(null),{x:0,y:0}),vm.runInNewContext('({x:0,y:0})')]){const quad=spec().quad;quad[0]=q;assert.throws(()=>C(spec({quad})));}
 const p=C(spec());for(const data of [new Float32Array(16),new Uint8Array(15),new(class extends Uint8Array {})(16),vm.runInNewContext('new Uint8Array(16)')])assert.throws(()=>W(p,{width:2,height:2,data}));
 assert.throws(()=>P({...p},{x:0,y:0}));assert.throws(()=>W({...p},img(2,2,new Array(16).fill(0))));
});
test('bounds, near-flat rejection, extreme coordinates and affine discrepancy remain explicit finite guards',()=>{
 for(const key of ['sourceWidth','sourceHeight','outputWidth','outputHeight'])for(const value of [0,4097,.5,NaN,Infinity,'2'])assert.throws(()=>C(spec({[key]:value})));
 assert.throws(()=>C(spec({sourceWidth:4096,sourceHeight:1025})),/area/);
 for(const value of [NaN,Infinity,-Infinity,16385,-16385,'1',null]){const quad=spec().quad;quad[0].x=value;assert.throws(()=>C(spec({quad})));}
 for(const scale of [1e-5,1e-9])assert.throws(()=>C(spec({quad:[{x:0,y:0},{x:scale,y:0},{x:scale,y:scale},{x:0,y:scale}]})),/small/);
 assert.throws(()=>C(spec({quad:[{x:0,y:0},{x:2,y:0},{x:2,y:1e-9},{x:0,y:1e-9}]})),/collinear/);
 for(const quad of [[{x:-16384,y:-16384},{x:16384,y:-16384},{x:16384,y:16384},{x:-16384,y:16384}],[{x:0,y:0},{x:1e-4,y:0},{x:1e-4,y:1e-4},{x:0,y:1e-4}]]){const p=C(spec({quad}));for(const [i,v]of[{x:0,y:0},{x:2,y:0},{x:2,y:2},{x:0,y:2}].entries()){const point=P(p,v);near(point.x,quad[i].x,1e-8);near(point.y,quad[i].y,1e-8);}}
 const off=C(spec({quad:[{x:100,y:100},{x:102,y:100},{x:102,y:102},{x:100,y:102}]}));assert.ok(W(off,img(2,2,Array(16).fill(255))).data.every(x=>x===0));
 for(const pt of [{x:-1,y:0},{x:0,y:3},{x:NaN,y:1},{x:0,y:Infinity},{x:'1',y:0}])assert.throws(()=>P(C(spec()),pt));
});
test('100 convex trapezoids and 2500 forward points agree with independent elimination oracle',()=>{
 for(let i=0;i<100;i++){const quad=[{x:-5+i*.03,y:2},{x:35-i*.05,y:1},{x:29+i*.04,y:30},{x:1-i*.02,y:26}],p=C(spec({quad,sourceWidth:7,sourceHeight:9,outputWidth:40,outputHeight:35})),m=oracle(quad);
 for(const u of [0,.125,.5,.875,1])for(const v of [0,.125,.5,.875,1]){const got=P(p,{x:u*7,y:v*9}),d=m[6]*u+m[7]*v+1;near(got.x,(m[0]*u+m[1]*v+m[2])/d,1e-10);near(got.y,(m[3]*u+m[4]*v+m[5])/d,1e-10);}}
});
test('max output area valid offscreen and returns fresh mutable data; metadata getters not read',()=>{
 const p=C(spec({sourceWidth:1,sourceHeight:1,outputWidth:4096,outputHeight:1024,quad:[{x:-4,y:-4},{x:-2,y:-4},{x:-2,y:-2},{x:-4,y:-2}]}));
 const data=new Uint8Array([10,20,30,255]);let reads=0;for(const key of ['length','buffer','byteOffset'])Object.defineProperty(data,key,{get(){reads++;throw Error('read');}});
 const input={width:1,height:1,data},a=W(p,input),b=W(p,input);assert.equal(a.data.length,4194304*4);assert.equal(reads,0);assert.notEqual(a.data,b.data);a.data[0]=255;assert.equal(b.data[0],0);assert.equal(data[0],10);
});
test('strongly tapered accepted poses stay finite without promising uniform conditioning',()=>{
 for(const epsilon of [1e-7,1e-6,1e-5,.01])for(const reverse of [false,true]){
  let quad=[{x:0,y:0},{x:2,y:0},{x:1+epsilon/2,y:2},{x:1-epsilon/2,y:2}];if(reverse)quad=[quad[1],quad[0],quad[3],quad[2]];
  const p=C(spec({quad}));for(const [i,pt]of[{x:0,y:0},{x:2,y:0},{x:2,y:2},{x:0,y:2}].entries()){const q=P(p,pt);near(q.x,quad[i].x,1e-6);near(q.y,quad[i].y,1e-6);}
  for(let j=0;j<=20;j++){const q=P(p,{x:j/10,y:j/10});assert.ok(Number.isFinite(q.x)&&Number.isFinite(q.y));}
  const input=img(2,2,Array(16).fill(255));assert.deepEqual(W(p,input),W(C(spec({quad})),input));
 }
});
