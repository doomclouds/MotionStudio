// Original neighborhood operator; no third-party implementation code.
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
function num(v,n,lo,hi){if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi)throw RangeError(n+' out of range');return v;}
function image(i){obj(i,['width','height','data'],'image');for(const n of['width','height'])if(!Number.isInteger(i[n])||i[n]<1||i[n]>4096)throw RangeError(n+' must be 1..4096');if(i.width*i.height>4194304)throw RangeError('image area exceeds 4194304');return rgba(i.data,i.width*i.height*4);}
export function compileConvolution(spec){obj(spec,['kernel','boundary','effect','amount','alphaMode'],'convolution');const {kernel,boundary,effect,amount,alphaMode}=spec;
 array(kernel,1,25,'kernel');for(const row of kernel)array(row,1,25,'kernel row');if(kernel.length%2!==1)throw RangeError('kernel height must be odd 1..25');const height=kernel.length,width=kernel[0]?.length;if(!Number.isInteger(width)||width<1||width>25||width%2!==1)throw RangeError('kernel width must be odd 1..25');let sum=0;const raw=[];for(let y=0;y<height;y++){if(!Object.hasOwn(kernel,y)||!Array.isArray(kernel[y])||kernel[y].length!==width)throw TypeError('kernel must be dense rectangular matrix');for(let x=0;x<width;x++){if(!Object.hasOwn(kernel[y],x))throw TypeError('kernel holes unsupported');const w=num(kernel[y][x],'weight',0,1e6);raw.push(w);sum+=w;}}
 if(sum<=0)throw RangeError('kernel must have positive total weight');if(!['clamp','transparent'].includes(boundary))throw RangeError('unsupported boundary');if(!['blur','unsharp'].includes(effect))throw RangeError('unsupported effect');if(!['filter','preserve'].includes(alphaMode))throw RangeError('unsupported alphaMode');if(effect==='unsharp'&&alphaMode!=='preserve')throw RangeError('unsharp requires preserved alpha');num(amount,'amount',0,effect==='blur'?1:2);
 const weights=Object.freeze(raw.map(v=>v/sum)),p=Object.freeze({width,height,weights,boundary,effect,amount,alphaMode,colorSpace:'srgb-encoded',operation:'convolution',anchor:Object.freeze({x:(width-1)/2,y:(height-1)/2})});plans.add(p);return p;
}
/** Normalized nonnegative kernel. Samples x+anchor-k, i.e. convolution, not correlation. */
export function convolveRGBA(plan,input){if(!plans.has(plan))throw TypeError('Expected compiled convolution plan');const src=image(input);const {width:w,height:h}=input;if(w*h*plan.width*plan.height>64000000)throw RangeError('image area times kernel cells exceeds 64000000');const out=new Uint8ClampedArray(src.length);if(plan.amount===0){out.set(src);for(let i=0;i<out.length;i+=4)if(out[i+3]===0)out[i]=out[i+1]=out[i+2]=0;return{width:w,height:h,data:out};}
 const kw=plan.width,kh=plan.height,cx=plan.anchor.x,cy=plan.anchor.y,weights=plan.weights,clamp=plan.boundary==='clamp',filterAlpha=plan.alphaMode==='filter',blur=plan.effect==='blur',m=plan.amount;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  let ar=0,ag=0,ab=0,aa=0,k=0;for(let ky=0;ky<kh;ky++){let sy=y+cy-ky;for(let kx=0;kx<kw;kx++,k++){const weight=weights[k];if(weight===0)continue;let sx=x+cx-kx;if(!clamp&&(sx<0||sx>=w||sy<0||sy>=h))continue;const px=Math.max(0,Math.min(w-1,sx)),py=Math.max(0,Math.min(h-1,sy)),j=(py*w+px)*4,a=src[j+3]*weight;aa+=a;ar+=src[j]*a;ag+=src[j+1]*a;ab+=src[j+2]*a;}}
  const i=(y*w+x)*4,originalAlpha=src[i+3];let alpha=filterAlpha?originalAlpha*(1-m)+aa*m:originalAlpha;out[i+3]=Math.round(alpha);if(out[i+3]===0){out[i]=out[i+1]=out[i+2]=0;continue;}
  const cr=aa>0?ar/aa:0,cg=aa>0?ag/aa:0,cb=aa>0?ab/aa:0;
  if(blur&&filterAlpha){out[i]=Math.round((src[i]*originalAlpha*(1-m)+ar*m)/alpha);out[i+1]=Math.round((src[i+1]*originalAlpha*(1-m)+ag*m)/alpha);out[i+2]=Math.round((src[i+2]*originalAlpha*(1-m)+ab*m)/alpha);}
  else{const sign=blur?1:-1;out[i]=Math.round(src[i]+sign*m*(cr-src[i]));out[i+1]=Math.round(src[i+1]+sign*m*(cg-src[i+1]));out[i+2]=Math.round(src[i+2]+sign*m*(cb-src[i+2]));}
 }
 return{width:w,height:h,data:out};
}
