// Original candidate infrastructure. Trusted JS intrinsics; not a Proxy sandbox.
export const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
export function append(a,v){Object.defineProperty(a,a.length,{value:v,writable:true,enumerable:true,configurable:true});return v;}
export function record(o,keys,required=keys){
 if(o===null||typeof o!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(o)))throw new TypeError('plain own-data record');
 const out=Object.create(null);
 for(const k of Reflect.ownKeys(o)){if(typeof k!=='string'||!keys.includes(k))throw new TypeError('unknown record key');const d=Object.getOwnPropertyDescriptor(o,k);if(!own(d,'value'))throw new TypeError('own data required');Object.defineProperty(out,k,{value:d.value,enumerable:true});}
 for(const k of required)if(!own(out,k))throw new TypeError('missing own field '+k);
 return out;
}
export function dense(a,min,max){
 if(!Array.isArray(a)||Object.getPrototypeOf(a)!==Array.prototype)throw new TypeError('ordinary array');
 const len=Object.getOwnPropertyDescriptor(a,'length').value;integer(len,min,max,'array length');
 if(Reflect.ownKeys(a).length!==len+1)throw new TypeError('dense canonical own indices');
 const out=[];for(let i=0;i<len;i++){const d=Object.getOwnPropertyDescriptor(a,String(i));if(!d||!own(d,'value'))throw new TypeError('dense own data indices');append(out,d.value);}return out;
}
export function integer(v,min,max,name='integer'){if(!Number.isSafeInteger(v)||v<min||v>max)throw new RangeError(name);return v;}
export function ascii(v,min,max,name='text'){if(typeof v!=='string'||v.length<min||v.length>max||!/^[\x20-\x7e]*$/.test(v)||!v.trim())throw new TypeError(name+' visible printable ASCII');return v;}
export function id(v){if(typeof v!=='string'||!/^[A-Za-z][A-Za-z0-9_-]{0,23}$/.test(v))throw new TypeError('identifier');return v;}
export function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){for(const k of Reflect.ownKeys(v))freeze(v[k]);Object.freeze(v);}return v;}
export function finite(v,name='coordinate'){if(typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>1e6)throw new RangeError(name);return v;}
