/** Shared canonical snapshot storage for matte, displacement and drawing. */
import {object,integer,fail} from '../validate.mjs';
const storage=new WeakMap();
export const RASTER_LIMITS=Object.freeze({maxDimension:4096,maxPixels:2097152});
const typedPrototype=Object.getPrototypeOf(Uint8ClampedArray.prototype);
const typedLength=Object.getOwnPropertyDescriptor(typedPrototype,'length').get;
const typedBuffer=Object.getOwnPropertyDescriptor(typedPrototype,'buffer').get;
const arrayBufferLength=Object.getOwnPropertyDescriptor(ArrayBuffer.prototype,'byteLength').get;
export const byte=x=>Math.round(Math.max(0,Math.min(255,x)));
export function keep(width,height,pixels){
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
export function pair(source,other){
 const a=createRasterSnapshot(source),b=createRasterSnapshot(other);
 if(a.width!==b.width||a.height!==b.height)fail('Raster dimensions must match');
 return[a,b,storage.get(a),storage.get(b)];
}
