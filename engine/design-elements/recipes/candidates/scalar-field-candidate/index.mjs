// Deterministic original scalar field; no image/font/mesh inputs.
// SPDX-License-Identifier: MIT
function rec(o,keys){if(!o||![Object.prototype,null].includes(Object.getPrototypeOf(o)))throw TypeError('own-data record');const r={};for(const k of Reflect.ownKeys(o)){const d=Object.getOwnPropertyDescriptor(o,k);if(typeof k!=='string'||!keys.includes(k)||!d.enumerable||!('value'in d))throw TypeError('record key');r[k]=d.value;}for(const k of keys)if(!Object.hasOwn(r,k))throw TypeError('missing field');return r;}
function arr(a,min,max){if(!Array.isArray(a)||Object.getPrototypeOf(a)!==Array.prototype||a.length<min||a.length>max)throw TypeError('dense bounded array');for(const k of Reflect.ownKeys(a))if(k!=='length'&&(!/^(0|[1-9]\d*)$/.test(typeof k==='string'?k:'!')||+k>=a.length))throw TypeError('array extra');const out=[];for(let i=0;i<a.length;i++){const d=Object.getOwnPropertyDescriptor(a,''+i);if(!d||!d.enumerable||!('value'in d))throw TypeError('array descriptor');out.push(d.value);}return out;}
function num(v,min,max,int=false){if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max||(int&&!Number.isInteger(v)))throw RangeError('number domain');return v;}

/** Trusted factory: each createCanvas must return a fresh real Native surface. */
export function createScalarFieldKit(api){
 if(!api||typeof api.createCanvas!=='function')throw TypeError('trusted Canvas API required');
 const privateRaster=new WeakMap();
function fieldTile(input){const s=rec(input,['width','height','phase','frequency','palette']);const width=num(s.width,64,1600,true),height=num(s.height,64,1000,true);if(width*height>1500000)throw RangeError('pixel budget');const phase=num(s.phase,-Math.PI*4,Math.PI*4),frequency=num(s.frequency,1,10),palette=arr(s.palette,3,3).map(v=>arr(v,3,3).map(n=>num(n,0,255,true)));const c=api.createCanvas(width,height),q=c.getContext('2d'),im=q.createImageData(width,height);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const u=(x/width-.5)*3.8,v=(y/height-.5)*2.4;const a=u+.30*Math.sin(v*3+phase)+.12*Math.cos(u*5-v*2);const b=v+.22*Math.sin(u*4-phase);const radius=Math.hypot(a*.8,b);const angle=a*frequency*2+Math.sin(b*7)+radius*5+phase;const f=(Math.sin(angle*3)+1)/2;const band=Math.pow(f,.62),t=band<.5?band*2:(band-.5)*2,k=band<.5?0:1;const glow=(.84+.16*Math.sin((a+b)*2))*(.72+.28*Math.pow((Math.cos(angle*19)+1)/2,10));const i=(y*width+x)*4;for(let n=0;n<3;n++)im.data[i+n]=Math.round((palette[k][n]*(1-t)+palette[k+1][n]*t)*glow);im.data[i+3]=255;}q.putImageData(im,0,0);const plan=Object.freeze({kind:'scalar-field',width,height,phase,frequency,palette:Object.freeze(palette.map(v=>Object.freeze(v)))});const handle=Object.freeze({width,height,plan});privateRaster.set(handle,c);return handle;}

 function place(ctx,tile,x,y){
  const raster=privateRaster.get(tile);
  if(!raster)throw TypeError('same-builder field handle required');
  num(x,-8192,8192);num(y,-8192,8192);
  if(!ctx||typeof ctx.drawImage!=='function')throw TypeError('drawing context required');
  ctx.drawImage(raster,x,y);
 }
 return Object.freeze({fieldTile,place});
}
