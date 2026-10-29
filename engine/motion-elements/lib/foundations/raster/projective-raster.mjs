// Original unit-square homography and inverse RGBA raster sampling.
const plans=new WeakSet();
// Data-only, current-realm records/arrays. Proxies and modified intrinsics are outside contract.
function obj(o, keys, name) {
  if (!o || typeof o !== 'object' || Object.getPrototypeOf(o) !== Object.prototype)
    throw TypeError(name + ' must be a current-realm plain record');
  const descriptors = Object.getOwnPropertyDescriptors(o);
  for (const key of Reflect.ownKeys(descriptors)) {
    if (typeof key !== 'string' || !keys.includes(key)) throw TypeError(name + ' unknown field');
    if (!Object.hasOwn(descriptors[key], 'value')) throw TypeError(name + ' requires data fields');
  }
  for (const key of keys) if (!Object.hasOwn(descriptors, key)) throw TypeError(name + ' missing ' + key);
}
function array(a, min, max, name) {
  if (!Array.isArray(a) || Object.getPrototypeOf(a) !== Array.prototype)
    throw TypeError(name + ' must be an ordinary current-realm array');
  if (a.length < min || a.length > max) throw RangeError(name + ' length out of range');
  const descriptors = Object.getOwnPropertyDescriptors(a);
  if (Reflect.ownKeys(descriptors).length !== a.length + 1) throw TypeError(name + ' must be dense without extras');
  for (let i = 0; i < a.length; i++) {
    const d = descriptors[i];
    if (!d || !Object.hasOwn(d, 'value')) throw TypeError(name + ' requires dense data elements');
  }
}
const typedPrototype = Object.getPrototypeOf(Uint8Array.prototype);
const viewGet = key => Object.getOwnPropertyDescriptor(typedPrototype, key).get;
const viewLength = viewGet('length'), viewBuffer = viewGet('buffer'), viewOffset = viewGet('byteOffset');
function rgba(data, length) {
  if (!data || ![Uint8Array.prototype, Uint8ClampedArray.prototype].includes(Object.getPrototypeOf(data)))
    throw TypeError('image requires a current-realm Uint8Array or Uint8ClampedArray');
  if (viewLength.call(data) !== length) throw TypeError('image needs exact RGBA8 length');
  // Fresh ordinary view ignores shadowed metadata and custom methods; no pixel copy.
  return new Uint8Array(viewBuffer.call(data), viewOffset.call(data), length);
}
function dim(v,n){if(!Number.isInteger(v)||v<1||v>4096)throw RangeError(n+' must be integer 1..4096');return v;}
function point(p){obj(p,['x','y'],'point');for(const x of[p.x,p.y])if(typeof x!=='number'||!Number.isFinite(x)||Math.abs(x)>16384)throw RangeError('quad point coordinate out of range');return Object.freeze({x:p.x,y:p.y});}
function inverse(m){const[a,b,c,d,e,f,g,h,i]=m,A=e*i-f*h,B=c*h-b*i,C=b*f-c*e,D=f*g-d*i,E=a*i-c*g,F=c*d-a*f,G=d*h-e*g,H=b*g-a*h,I=a*e-b*d,det=a*A+b*D+c*G;if(!Number.isFinite(det)||Math.abs(det)<1e-12)throw RangeError('numerically singular homography');return[A,B,C,D,E,F,G,H,I].map(x=>x/det);}
export function compileProjectiveRaster(spec){obj(spec,['sourceWidth','sourceHeight','outputWidth','outputHeight','quad'],'projective raster');const sourceWidth=dim(spec.sourceWidth,'sourceWidth'),sourceHeight=dim(spec.sourceHeight,'sourceHeight'),outputWidth=dim(spec.outputWidth,'outputWidth'),outputHeight=dim(spec.outputHeight,'outputHeight');if(sourceWidth*sourceHeight>4194304||outputWidth*outputHeight>4194304)throw RangeError('area exceeds 4194304');array(spec.quad,4,4,'quad');const quad=Object.freeze(spec.quad.map(point)),xs=quad.map(p=>p.x),ys=quad.map(p=>p.y),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys),scale=Math.max(right-left,bottom-top);if(scale<1e-4)throw RangeError('quad is too small');const center=Object.freeze({x:xs.reduce((a,b)=>a+b)/4,y:ys.reduce((a,b)=>a+b)/4}),q=quad.map(p=>({x:(p.x-center.x)/scale,y:(p.y-center.y)/scale}));let sign=0;
 for(let j=0;j<4;j++){const a=q[j],b=q[(j+1)%4],c=q[(j+2)%4],cross=(b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x);if(Math.abs(cross)<1e-8)throw RangeError('quad near-collinear corner');if(!sign)sign=Math.sign(cross);else if(Math.sign(cross)!==sign)throw RangeError('quad must be strictly convex, ordered, non-crossing');}
 const[x0,x1,x2,x3]=q.map(p=>p.x),[y0,y1,y2,y3]=q.map(p=>p.y),dx1=x1-x2,dx2=x3-x2,dx3=x0-x1+x2-x3,dy1=y1-y2,dy2=y3-y2,dy3=y0-y1+y2-y3;let g=0,h=0;
 if(Math.abs(dx3)+Math.abs(dy3)>1e-14){const den=dx1*dy2-dx2*dy1;if(Math.abs(den)<1e-12)throw RangeError('unstable projective denominator');g=(dx3*dy2-dx2*dy3)/den;h=(dx1*dy3-dx3*dy1)/den;}
 const denCorners=[1,1+g,1+g+h,1+h];if(Math.min(...denCorners)<=1e-8*Math.max(...denCorners))throw RangeError('projective pole crosses or approaches source rectangle');const matrix=Object.freeze([x1-x0+g*x1,x3-x0+h*x3,x0,y1-y0+g*y1,y3-y0+h*y3,y0,g,h,1]),inv=Object.freeze(inverse(matrix));
 const bounds=Object.freeze({left:Math.max(0,Math.floor(left)),top:Math.max(0,Math.floor(top)),right:Math.min(outputWidth,Math.ceil(right)),bottom:Math.min(outputHeight,Math.ceil(bottom))});const p=Object.freeze({sourceWidth,sourceHeight,outputWidth,outputHeight,quad,center,scale,matrix,inverse:inv,bounds,colorSpace:'srgb-encoded',sampling:'premultiplied-bilinear',coverage:'pixel-center-hard-domain',uvBoundaryTolerance:1e-12});plans.add(p);return p;
}
export function projectRasterPoint(plan,p){if(!plans.has(plan))throw TypeError('Expected compiled projective plan');obj(p,['x','y'],'source point');if(typeof p.x!=='number'||typeof p.y!=='number'||!Number.isFinite(p.x+p.y)||p.x<0||p.x>plan.sourceWidth||p.y<0||p.y>plan.sourceHeight)throw RangeError('source point outside rectangle');const u=p.x/plan.sourceWidth,v=p.y/plan.sourceHeight,m=plan.matrix,d=m[6]*u+m[7]*v+1;return Object.freeze({x:plan.center.x+plan.scale*(m[0]*u+m[1]*v+m[2])/d,y:plan.center.y+plan.scale*(m[3]*u+m[4]*v+m[5])/d});}
export function warpProjectiveRGBA(plan,input){if(!plans.has(plan))throw TypeError('Expected compiled projective plan');obj(input,['width','height','data'],'image');if(input.width!==plan.sourceWidth||input.height!==plan.sourceHeight)throw TypeError('source RGBA8 buffer/size mismatch');const w=plan.outputWidth,h=plan.outputHeight,sw=input.width,sh=input.height,src=rgba(input.data,input.width*input.height*4),out=new Uint8ClampedArray(w*h*4),m=plan.inverse,invScale=1/plan.scale;
 for(let y=plan.bounds.top;y<plan.bounds.bottom;y++){const ny=(y+.5-plan.center.y)*invScale;for(let x=plan.bounds.left;x<plan.bounds.right;x++){const nx=(x+.5-plan.center.x)*invScale,d=m[6]*nx+m[7]*ny+m[8];if(Math.abs(d)<1e-14)continue;const u=(m[0]*nx+m[1]*ny+m[2])/d,v=(m[3]*nx+m[4]*ny+m[5])/d;if(u < -1e-12||u > 1+1e-12||v < -1e-12||v > 1+1e-12)continue;const sx=Math.max(0,Math.min(sw-1,u*sw-.5)),sy=Math.max(0,Math.min(sh-1,v*sh-.5)),x0=Math.floor(sx),y0=Math.floor(sy),x1=Math.min(sw-1,x0+1),y1=Math.min(sh-1,y0+1),fx=sx-x0,fy=sy-y0;
 const i0=(y0*sw+x0)*4,i1=(y0*sw+x1)*4,i2=(y1*sw+x0)*4,i3=(y1*sw+x1)*4,k0=(1-fx)*(1-fy)*src[i0+3],k1=fx*(1-fy)*src[i1+3],k2=(1-fx)*fy*src[i2+3],k3=fx*fy*src[i3+3],a=k0+k1+k2+k3,j=(y*w+x)*4;out[j+3]=Math.round(a);if(out[j+3]===0)continue;for(let c=0;c<3;c++)out[j+c]=Math.round((src[i0+c]*k0+src[i1+c]*k1+src[i2+c]*k2+src[i3+c]*k3)/a);
 }}return{width:w,height:h,data:out};
}

export {projectRasterPoint as mapProjectivePoint};
