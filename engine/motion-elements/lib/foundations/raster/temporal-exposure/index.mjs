/** Original bounded, random-access, premultiplied-alpha temporal exposure.
 * RGB arithmetic is in caller-provided encoded byte space, NOT radiometric light.
 * No stateful feedback, source-over blend, interpolation or optical-flow claim.
 */
const plans=new WeakSet();
const integer=(x,min,max)=>{if(!Number.isSafeInteger(x)||x<min||x>max)throw Error('integer out of bounds');return x};
function dataObject(x,keys,required){if(!x||Object.getPrototypeOf(x)!==Object.prototype)throw Error('plain object required');for(const k of Reflect.ownKeys(x)){if(!keys.includes(k)||!Object.hasOwn(Object.getOwnPropertyDescriptor(x,k),'value'))throw Error('unknown or accessor field')}for(const k of required)if(!Object.hasOwn(x,k))throw Error('missing field');return x}
function dense(a){if(!Array.isArray(a)||Object.getPrototypeOf(a)!==Array.prototype||a.length<1||a.length>32)throw Error('plain bounded array required');for(const k of Reflect.ownKeys(a)){if(k==='length')continue;if(typeof k!=='string'||!/^(0|[1-9][0-9]*)$/.test(k)||Number(k)>=a.length||!Object.hasOwn(Object.getOwnPropertyDescriptor(a,k),'value'))throw Error('array extra/accessor')}const copy=[];for(let i=0;i<a.length;i++){if(!Object.hasOwn(a,i))throw Error('sparse array');copy.push(a[i])}return copy}
export function compileTemporalExposure(spec={}){
 dataObject(spec,['offsets','weights','boundary'],['offsets','weights']);let {offsets,weights,boundary='transparent'}=spec;offsets=dense(offsets);weights=dense(weights);
 if(!Array.isArray(offsets)||!Array.isArray(weights)||offsets.length<1||offsets.length>32||offsets.length!==weights.length)throw Error('1..32 matched samples required');
 if(!['transparent','clamp-start'].includes(boundary))throw Error('boundary');
 const o=Array.from(offsets,x=>integer(x,0,3600));if(new Set(o).size!==o.length)throw Error('duplicate offsets');
 const w=Array.from(weights,x=>{if(typeof x!=='number'||!Number.isFinite(x)||x<0)throw Error('invalid weight');return x});const max=Math.max(...w);if(!max)throw Error('positive total required');
 const scaled=w.map(x=>x/max);if(w.some((x,i)=>x>0&&scaled[i]===0))throw Error('weight ratio underflow');const sum=scaled.reduce((a,b)=>a+b,0);const normalized=scaled.map(x=>x/sum);if(scaled.some((x,i)=>x>0&&normalized[i]===0))throw Error('normalized underflow');
 const p=Object.freeze({offsets:Object.freeze(o),weights:Object.freeze(normalized),boundary});plans.add(p);return p;
}
export function sampleTemporalExposure(plan,frame,spec={}){
 dataObject(spec,['width','height','readFrame'],['width','height','readFrame']);const {width,height,readFrame}=spec;
 if(!plans.has(plan))throw Error('compiled plan required');integer(frame,0,Number.MAX_SAFE_INTEGER);integer(width,1,2048);integer(height,1,2048);const pixels=width*height;if(pixels>1048576||pixels*plan.offsets.length>8388608)throw Error('resource limit');if(typeof readFrame!=='function')throw Error('readFrame required');
 // Dimensions/resources are validated before callbacks; each returned frame is checked and copied.
 const taps=plan.offsets.map((o,i)=>({frame:frame-o,weight:plan.weights[i]})).filter(x=>x.weight>0);const cache=new Map();
 for(const t of taps){if(t.frame<0){if(plan.boundary==='transparent')continue;t.frame=0}if(cache.has(t.frame))continue;const data=readFrame(t.frame);const proto=Object.getPrototypeOf(Uint8ClampedArray.prototype),len=Object.getOwnPropertyDescriptor(proto,'length').get,buffer=Object.getOwnPropertyDescriptor(proto,'buffer').get;if(!data||Object.getPrototypeOf(data)!==Uint8ClampedArray.prototype||len.call(data)!==pixels*4||!(buffer.call(data) instanceof ArrayBuffer))throw Error('unshared base RGBA8 straight-alpha frame required');cache.set(t.frame,new Uint8ClampedArray(data));}
 const out=new Uint8ClampedArray(pixels*4);
 for(let p=0;p<out.length;p+=4){let a=0,r=0,g=0,b=0;for(const t of taps){const src=cache.get(t.frame);if(!src)continue;const wa=t.weight*src[p+3];a+=wa;r+=wa*src[p];g+=wa*src[p+1];b+=wa*src[p+2]}if(Math.round(a)>0){out[p]=Math.round(r/a);out[p+1]=Math.round(g/a);out[p+2]=Math.round(b/a);out[p+3]=Math.round(a)}}
 return {width,height,data:out,sourceFrames:[...cache.keys()],tapCount:taps.length};
}
