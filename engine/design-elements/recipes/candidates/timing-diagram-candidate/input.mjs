// SPDX-License-Identifier: MIT
export function fail(m){throw new TypeError(m)}
export function record(o,keys){if(!o||Object.getPrototypeOf(o)!==Object.prototype)fail('plain own-data record');const d=Object.getOwnPropertyDescriptors(o);if(Reflect.ownKeys(d).some(k=>typeof k!=='string'||!keys.includes(k)||(!('value'in d[k])||!d[k].enumerable)))fail('own data only');for(const k of keys)if(!Object.hasOwn(d,k))fail('required '+k);return Object.fromEntries(keys.map(k=>[k,d[k].value]));}
export function dense(a,min,max){if(!Array.isArray(a)||Object.getPrototypeOf(a)!==Array.prototype||a.length<min||a.length>max)fail('dense bounded array');const d=Object.getOwnPropertyDescriptors(a);if(Reflect.ownKeys(d).some(k=>k!=='length'&&(!/^(0|[1-9][0-9]*)$/.test(String(k))||typeof k!=='string'||Number(k)>=a.length)))fail('array extra protocol');return Array.from({length:a.length},(_,i)=>{if(!d[i]||(!('value'in d[i])||!d[i].enumerable))fail('dense own data');return d[i].value;});}
export function int(v,min,max){if(!Number.isSafeInteger(v)||v<min||v>max)fail('bounded integer');return v;}
export function text(v,max){if(typeof v!=='string'||!v.length||v.length>max||!/^[\x20-\x7e]+$/.test(v))fail('nonempty ASCII');return v;}
export function deep(o){if(o&&typeof o==='object'){for(const v of Object.values(o))deep(v);Object.freeze(o)}return o;}
