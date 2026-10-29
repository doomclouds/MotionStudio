import{test}from'node:test';import assert from'node:assert/strict';import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';import{compileConvolution,convolveRGBA}from'../lib/foundations/raster/convolution.mjs';import{compileProjectiveRaster,warpProjectiveRGBA,mapProjectivePoint,projectRasterPoint}from'../lib/foundations/raster/projective-raster.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
test('new Node process reproduces both source-independent output buffers and point helper',()=>{const img={width:4,height:3,data:new Uint8ClampedArray(Array.from({length:48},(_,i)=>(i*37)%256))},c={kernel:[[1,2,1],[2,4,2],[1,2,1]],boundary:'transparent',effect:'unsharp',amount:.4,alphaMode:'preserve'},q={sourceWidth:4,sourceHeight:3,outputWidth:12,outputHeight:9,quad:[{x:1,y:1},{x:11,y:0},{x:10,y:8},{x:0,y:7}]},plan=compileProjectiveRaster(q),own={convolution:hash(convolveRGBA(compileConvolution(c),img).data),projective:hash(warpProjectiveRGBA(plan,img).data),point:mapProjectivePoint(plan,{x:2,y:1})};assert.equal(mapProjectivePoint,projectRasterPoint);const code=`import{createHash}from'node:crypto';import{compileConvolution,convolveRGBA}from ${JSON.stringify(new URL('../lib/foundations/raster/convolution.mjs',import.meta.url).href)};import{compileProjectiveRaster,warpProjectiveRGBA,mapProjectivePoint}from ${JSON.stringify(new URL('../lib/foundations/raster/projective-raster.mjs',import.meta.url).href)};const img=${JSON.stringify({...img,data:[...img.data]})};img.data=new Uint8ClampedArray(img.data);const hash=x=>createHash('sha256').update(x).digest('hex'),p=compileProjectiveRaster(${JSON.stringify(q)});console.log(JSON.stringify({projective:hash(warpProjectiveRGBA(p,img).data),point:mapProjectivePoint(p,{x:2,y:1}),convolution:hash(convolveRGBA(compileConvolution(${JSON.stringify(c)}),img).data)}));`;assert.deepEqual(JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'})),own);});
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
function nativeDraw(api,k){
 const canvas=api.createCanvas(40,32),ctx=canvas.getContext('2d');ctx.fillStyle='#d6c7a8';ctx.fillRect(0,0,40,32);ctx.fillStyle='#c73028';ctx.fillRect(5,4,21,17);ctx.clearRect(12,8,4,5);
 const source={width:40,height:32,data:ctx.getImageData(0,0,40,32).data};
 const filtered=convolveRGBA(compileConvolution({kernel:[[1,2,1],[0,2,0],[1,2,1]],boundary:'transparent',effect:'blur',amount:k/4,alphaMode:'filter'}),source);
 const quad=[{x:3+k,y:2},{x:43,y:4+k},{x:40-k,y:35},{x:1,y:31-k}];
 const warped=warpProjectiveRGBA(compileProjectiveRaster({sourceWidth:40,sourceHeight:32,outputWidth:48,outputHeight:40,quad}),filtered);
 const output=api.createCanvas(48,40),outctx=output.getContext('2d'),pixels=outctx.createImageData(48,40);pixels.data.set(warped.data);outctx.putImageData(pixels,0,0);
 return{rgba:hash(warped.data),png:hash(output.toBuffer('image/png'))};
}
test('Native RGBA consumption and PNGs match in forward, reverse, repeated and separate Node processes',()=>{
 const{api}=loadNativeCanvas(),expected=[0,1,2,3,4].map(k=>nativeDraw(api,k));for(const k of [4,3,2,1,0,2])assert.deepEqual(nativeDraw(api,k),expected[k]);
 const code=`import{createHash}from'node:crypto';import{loadNativeCanvas}from ${JSON.stringify(new URL('../../motion-render-core/lib/native.mjs',import.meta.url).href)};import{compileConvolution,convolveRGBA}from ${JSON.stringify(new URL('../lib/foundations/raster/convolution.mjs',import.meta.url).href)};import{compileProjectiveRaster,warpProjectiveRGBA}from ${JSON.stringify(new URL('../lib/foundations/raster/projective-raster.mjs',import.meta.url).href)};const hash=${hash.toString()};const nativeDraw=${nativeDraw.toString()};const{api}=loadNativeCanvas();console.log(JSON.stringify([4,2,0,3,1].map(k=>nativeDraw(api,k))));`;
 assert.deepEqual(JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'})),[4,2,0,3,1].map(i=>expected[i]));
});
test('plans from separately loaded module instances are deliberately not transferable',async()=>{
 const c=await import('../lib/foundations/raster/convolution.mjs?isolated-brand'),p=await import('../lib/foundations/raster/projective-raster.mjs?isolated-brand');
 const img={width:1,height:1,data:new Uint8Array([1,2,3,255])},cs={kernel:[[1]],boundary:'clamp',effect:'blur',amount:1,alphaMode:'preserve'},ps={sourceWidth:1,sourceHeight:1,outputWidth:1,outputHeight:1,quad:[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}]};
 assert.throws(()=>convolveRGBA(c.compileConvolution(cs),img),/compiled/);assert.throws(()=>warpProjectiveRGBA(p.compileProjectiveRaster(ps),img),/compiled/);
 assert.deepEqual(convolveRGBA(compileConvolution(cs),img).data,c.convolveRGBA(c.compileConvolution(cs),img).data);
});
