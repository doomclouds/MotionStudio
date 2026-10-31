// SPDX-License-Identifier: MIT
// Bounded own-data snapshots; not a hostile-JavaScript sandbox.
export function record(value, allowed, required=allowed) {
  if(value===null || typeof value!=='object' || ![Object.prototype,null].includes(Object.getPrototypeOf(value))) throw TypeError('plain record');
  const ds=Object.getOwnPropertyDescriptors(value), out=Object.create(null);
  for(const key of Reflect.ownKeys(ds)) {
    const d=ds[key];
    if(typeof key!=='string'||!allowed.includes(key)||!Object.hasOwn(d,'value')||!d.enumerable) throw TypeError('enumerable own data fields');
    out[key]=d.value;
  }
  for(const key of required) if(!Object.hasOwn(out,key)) throw TypeError('required own field: '+key);
  return out;
}
export function number(v,min,max,integer=false) {
  if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max||(integer&&!Number.isInteger(v))) throw RangeError('numeric range');
  return Object.is(v,-0)?0:v;
}
export function color(v) {
  if(typeof v!=='string'||!/^#[0-9a-fA-F]{6}$/.test(v)) throw TypeError('hex color');
  return v.toLowerCase();
}
export const def=(v,d)=>v===undefined?d:v;
export function freeze(o) {if(o&&typeof o==='object'){for(const v of Object.values(o))freeze(v);Object.freeze(o);}return o;}
