import {record,dense,integer,id,append,freeze,finite} from './data.mjs';
const sources=new WeakMap(),models=new WeakSet();
const M=1000000;
const typed=Object.getPrototypeOf(Uint8ClampedArray.prototype),bufferOf=Object.getOwnPropertyDescriptor(typed,'buffer').get,lengthOf=Object.getOwnPropertyDescriptor(typed,'length').get;
export function createPixelSource(input){
 const q=record(input,['width','height','pixels']);const width=integer(q.width,1,2048),height=integer(q.height,1,2048);
 if(width*height>4000000)throw new RangeError('source pixel budget');
 const p=q.pixels;if(!ArrayBuffer.isView(p)||Object.getPrototypeOf(p)!==Uint8ClampedArray.prototype||!(bufferOf.call(p) instanceof ArrayBuffer)||lengthOf.call(p)!==width*height*4)throw new TypeError('nonshared exact RGBA Uint8ClampedArray');
 const token=Object.freeze({width,height});sources.set(token,new Uint8ClampedArray(p));return token;
}
export function createWindowModel(input){
 const q=record(input,['width','height','panels']);const width=integer(q.width,16,1600),height=integer(q.height,16,1600);if(width*height>2000000)throw new RangeError('destination pixel budget');
 const panels=[],ids=new Set();for(const item of dense(q.panels,1,32)){
  const p=record(item,['id','x','y','width','height','u0','v0','u1','v1']);id(p.id);if(ids.has(p.id))throw new TypeError('duplicate panel id');ids.add(p.id);
  integer(p.x,0,width-1);integer(p.y,0,height-1);integer(p.width,1,width);integer(p.height,1,height);if(p.x+p.width>width||p.y+p.height>height)throw new RangeError('panel outside destination');
  for(const k of ['u0','v0','u1','v1'])integer(p[k],0,M,'source millionth');if(p.u0>=p.u1||p.v0>=p.v1)throw new RangeError('empty source rect');
  for(const a of panels)if(p.x<a.x+a.width&&a.x<p.x+p.width&&p.y<a.y+a.height&&a.y<p.y+p.height)throw new RangeError('panels overlap');
  append(panels,{...p});
 }
 const model=freeze({width,height,panels});models.add(model);return model;
}
function checked(model,source){if(!models.has(model)||!sources.has(source))throw new TypeError('issued window model and pixel source');}
function sample(p,x,y,source){return {x:Math.floor(source.width*(p.u0*2*p.width+(2*(x-p.x)+1)*(p.u1-p.u0))/(2*p.width*M)),y:Math.floor(source.height*(p.v0*2*p.height+(2*(y-p.y)+1)*(p.v1-p.v0))/(2*p.height*M))};}
export function inspectPixel(model,source,x,y){checked(model,source);integer(x,0,model.width-1);integer(y,0,model.height-1);for(const p of model.panels){if(x>=p.x&&x<p.x+p.width&&y>=p.y&&y<p.y+p.height){const at=sample(p,x,y,source);const i=(at.y*source.width+at.x)*4,b=sources.get(source);return freeze({panel:p.id,sourceX:at.x,sourceY:at.y,rgba:[b[i],b[i+1],b[i+2],b[i+3]]});}}return null;}
export function renderPixels(model,source){checked(model,source);const out=new Uint8ClampedArray(model.width*model.height*4),raw=sources.get(source);for(const p of model.panels)for(let y=p.y;y<p.y+p.height;y++)for(let x=p.x;x<p.x+p.width;x++){const at=sample(p,x,y,source),si=(at.y*source.width+at.x)*4,di=(y*model.width+x)*4;out[di]=raw[si];out[di+1]=raw[si+1];out[di+2]=raw[si+2];out[di+3]=raw[si+3];}return out;}
export function createWindowEngine(input){const env=record(input,['createCanvas','ImageData']);if(typeof env.createCanvas!=='function'||typeof env.ImageData!=='function')throw new TypeError('trusted fresh Canvas factory and ImageData constructor');return Object.freeze({tile(model,source){checked(model,source);const raw=renderPixels(model,source),canvas=env.createCanvas(model.width,model.height);canvas.getContext('2d').putImageData(new env.ImageData(raw,model.width,model.height),0,0);return Object.freeze({canvas,model,place(ctx,x=0,y=0){finite(x);finite(y);if(!ctx||typeof ctx.drawImage!=='function')throw new TypeError('trusted host 2D context');ctx.drawImage(canvas,x,y);}});}});}
