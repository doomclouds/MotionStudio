/** Original bounded CPU raster operators. No clock, cumulative buffer or global canvas. */
import {object,number,integer,choice,bool,fail} from './validate.mjs';
const storage=new WeakMap();
export const RASTER_LIMITS=Object.freeze({maxDimension:4096,maxPixels:2097152});
const typedPrototype=Object.getPrototypeOf(Uint8ClampedArray.prototype);
const typedLength=Object.getOwnPropertyDescriptor(typedPrototype,'length').get;
const typedBuffer=Object.getOwnPropertyDescriptor(typedPrototype,'buffer').get;
const arrayBufferLength=Object.getOwnPropertyDescriptor(ArrayBuffer.prototype,'byteLength').get;
const byte=x=>Math.round(Math.max(0,Math.min(255,x)));
function keep(width,height,pixels){
 const snapshot=Object.freeze({width,height});storage.set(snapshot,pixels);return snapshot;
}
/** Opaque immutable snapshot. Raw typed-array metadata is not part of the byte sequence. */
export function createRasterSnapshot(input){
 if(storage.has(input))return input;
 object(input,['width','height','pixels'],['width','height','pixels']);
 const width=integer(input.width,1,RASTER_LIMITS.maxDimension),height=integer(input.height,1,RASTER_LIMITS.maxDimension);
 if(width*height>RASTER_LIMITS.maxPixels)fail('Raster pixel budget exceeded');
 const source=input.pixels,length=width*height*4;
 let pixels;
 if(source instanceof Uint8ClampedArray){
  if(typedLength.call(source)!==length)fail('RGBA byte count mismatch');
  const buffer=typedBuffer.call(source);
  // Internal ArrayBuffer brand check also rejects cross-realm SharedArrayBuffer.
  // instanceof would miss that case and allow a worker to race the source copy.
  try{arrayBufferLength.call(buffer);}catch{fail('Shared or unsupported raster buffers are unsupported');}
  pixels=new Uint8ClampedArray(length);pixels.set(source);
 }else{
  if(!Array.isArray(source)||source.length!==length)fail('Expected exact RGBA byte array');
  // JSON arrays are strict data structures. Prefer Uint8ClampedArray for HD input:
  // unlike a JS array, its internal byte sequence is already dense and bounded.
  for(const key of Reflect.ownKeys(source))if(key!=='length'&&!(typeof key==='string'&&/^(0|[1-9][0-9]*)$/.test(key)&&Number(key)<length))fail('Unknown byte array field');
  pixels=new Uint8ClampedArray(length);
  for(let i=0;i<length;i++){if(!Object.hasOwn(source,i))fail('Sparse byte array');pixels[i]=integer(source[i],0,255);}
 }
 return keep(width,height,pixels);
}
/** Inspection/transport copy, never an alias of a stored buffer. */
export function copyRasterPixels(snapshot){
 const pixels=storage.get(snapshot);if(!pixels)fail('Expected a raster snapshot from this module');
 return new Uint8ClampedArray(pixels);
}
function pair(source,other){
 const a=createRasterSnapshot(source),b=createRasterSnapshot(other);
 if(a.width!==b.width||a.height!==b.height)fail('Raster dimensions must match');
 return[a,b,storage.get(a),storage.get(b)];
}
/** Alpha/luma are modes of one coverage mechanism, in encoded sRGB byte space. */
export function sampleRasterMatte(input){
 object(input,['source','mask','mode','invert'],['source','mask','mode','invert']);
 const mode=choice(input.mode,['alpha','luma']),invert=bool(input.invert);
 const [source,,pixels,mask]=pair(input.source,input.mask),out=new Uint8ClampedArray(pixels);
 for(let i=0;i<pixels.length;i+=4){
  let coverage=mask[i+3]/255;
  if(mode==='luma')coverage*=(.2126*mask[i]+.7152*mask[i+1]+.0722*mask[i+2])/255;
  if(invert)coverage=1-coverage;
  out[i+3]=byte(pixels[i+3]*coverage);
 }
 return keep(source.width,source.height,out);
}
function pixelIndex(x,y,w,h,edge){
 if(edge==='transparent'&&(x<0||y<0||x>=w||y>=h))return -1;
 return(Math.max(0,Math.min(h-1,y))*w+Math.max(0,Math.min(w-1,x)))*4;
}
function copyPixel(src,index,out,dest){
 if(index<0){out[dest]=out[dest+1]=out[dest+2]=out[dest+3]=0;return;}
 for(let c=0;c<4;c++)out[dest+c]=src[index+c];
}
/** Inverse pixel lookup; RG128 neutral, map alpha gates offset, blue unused. */
export function sampleRasterDisplacement(input){
 object(input,['source','map','scaleX','scaleY','edge','filter'],['source','map','scaleX','scaleY','edge','filter']);
 const sx=number(input.scaleX,-4096,4096),sy=number(input.scaleY,-4096,4096),edge=choice(input.edge,['clamp','transparent']),filter=choice(input.filter,['nearest','bilinear']);
 const [source,,pixels,map]=pair(input.source,input.map),w=source.width,h=source.height,out=new Uint8ClampedArray(pixels.length);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,a=map[i+3]/255;
  let px=x+(map[i]-128)/128*sx*a,py=y+(map[i+1]-128)/128*sy*a;
  if(filter==='nearest'){
   // Ties choose floor(v + .5), including negative coordinates.
   copyPixel(pixels,pixelIndex(Math.floor(px+.5),Math.floor(py+.5),w,h,edge),out,i);continue;
  }
  if(edge==='clamp'){px=Math.max(0,Math.min(w-1,px));py=Math.max(0,Math.min(h-1,py));}
  const x0=Math.floor(px),y0=Math.floor(py),tx=px-x0,ty=py-y0;
  // Exact integer lookup preserves source bytes, even invisible RGB. Fractional
  // interpolation uses premultiplied channels; zero resulting alpha yields RGB0.
  if(tx===0&&ty===0){copyPixel(pixels,pixelIndex(x0,y0,w,h,edge),out,i);continue;}
  let alpha=0,r=0,g=0,b=0;
  for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++){
   const k=pixelIndex(x0+xx,y0+yy,w,h,edge);if(k<0)continue;
   const weight=(xx?tx:1-tx)*(yy?ty:1-ty),aw=pixels[k+3]*weight;
   alpha+=aw;r+=pixels[k]*aw;g+=pixels[k+1]*aw;b+=pixels[k+2]*aw;
  }
  out[i+3]=byte(alpha);
  if(out[i+3]){out[i]=byte(r/alpha);out[i+1]=byte(g/alpha);out[i+2]=byte(b/alpha);}
 }
 return keep(w,h,out);
}
