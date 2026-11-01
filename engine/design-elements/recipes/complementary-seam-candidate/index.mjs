// Original font-free complementary seam. No implicit resampling or Native dependency.
import {record,dense,integer,finite,append,freeze} from './data.mjs';
const issued=new WeakMap();
const typed=Object.getPrototypeOf(Uint8ClampedArray.prototype);
const intrinsic=Object.fromEntries(['length','buffer','byteOffset'].map(k=>[k,Object.getOwnPropertyDescriptor(typed,k).get]));
function get(m){const p=issued.get(m);if(!p)throw new TypeError('issued seam model required');return p;}
function checkedPixels(p,n){
 if(!(p instanceof Uint8ClampedArray)||Object.getPrototypeOf(p)!==Uint8ClampedArray.prototype)throw new TypeError('ordinary Uint8ClampedArray');
 const buffer=intrinsic.buffer.call(p);if(Object.getPrototypeOf(buffer)!==ArrayBuffer.prototype)throw new TypeError('nonshared ArrayBuffer');
 if(intrinsic.length.call(p)!==4*n)throw new RangeError('exact plane length');
 return new Uint8ClampedArray(buffer,intrinsic.byteOffset.call(p),4*n);
}
export function createSeamModel(input){
 const r=record(input,['width','height','axis','points']);integer(r.width,16,1600,'width');integer(r.height,16,1600,'height');if(r.width*r.height>1000000)throw new RangeError('one million pixels maximum');
 if(typeof r.axis!=='string'||!['horizontal','vertical'].includes(r.axis))throw new TypeError('primitive axis enum');
 const extent=r.axis==='horizontal'?r.width:r.height,cross=r.axis==='horizontal'?r.height:r.width;
 const points=[];let previous=-1,area2=0;
 for(const value of dense(r.points,2,65)){const q=record(value,['u','v']);integer(q.u,0,extent,'u');integer(q.v,1,cross-1,'interior v');if(q.u<=previous)throw new RangeError('strictly increasing u');append(points,{u:q.u,v:q.v});previous=q.u;}
 if(points[0].u!==0||points[points.length-1].u!==extent)throw new RangeError('seam spans full extent');
 for(let i=1;i<points.length;i++)area2+=(points[i-1].v+points[i].v)*(points[i].u-points[i-1].u);
 const owners=new Uint8Array(r.width*r.height);let beforePixels=0,j=0;
 for(let u=0;u<extent;u++){
  while(u>=points[j+1].u)j++;
  const a=points[j],b=points[j+1],du=b.u-a.u,dv=b.v-a.v,numerator=2*a.v*du+(2*u+1-2*a.u)*dv;
  for(let v=0;v<cross;v++){
   const before=(2*v+1)*du<numerator;const x=r.axis==='horizontal'?u:v,y=r.axis==='horizontal'?v:u;
   owners[y*r.width+x]=before?0:1;if(before)beforePixels++;
  }
 }
 const m=freeze({width:r.width,height:r.height,axis:r.axis,points,segments:points.length-1,pixelCount:r.width*r.height,beforePixels,afterPixels:r.width*r.height-beforePixels,beforeArea2:area2,afterArea2:2*r.width*r.height-area2,tieSide:'after'});issued.set(m,owners);return m;
}
export function ownerAt(model,x,y){const owners=get(model);integer(x,0,model.width-1,'x');integer(y,0,model.height-1,'y');return owners[y*model.width+x]===0?'before':'after';}
export function partitionPixels(model,pixels){const owners=get(model),p=checkedPixels(pixels,model.pixelCount),before=new Uint8ClampedArray(p.length),after=new Uint8ClampedArray(p.length);
 for(let i=0;i<owners.length;i++){const to=owners[i]===0?before:after;for(let c=0;c<4;c++)to[4*i+c]=p[4*i+c];}
 return Object.freeze({before,after});
}
export function createSeamEngine(input){const e=record(input,['createCanvas','ImageData']);if(typeof e.createCanvas!=='function'||typeof e.ImageData!=='function')throw new TypeError('trusted fresh Canvas factory and ImageData');
 return Object.freeze({tiles(model,pixels){const p=partitionPixels(model,pixels);
  function one(side){const canvas=e.createCanvas(model.width,model.height);canvas.getContext('2d').putImageData(new e.ImageData(p[side],model.width,model.height),0,0);return Object.freeze({canvas,model,side,place(ctx,x=0,y=0){finite(x);finite(y);ctx.drawImage(canvas,x,y);}});}
  return Object.freeze({before:one('before'),after:one('after')});
 }});
}
