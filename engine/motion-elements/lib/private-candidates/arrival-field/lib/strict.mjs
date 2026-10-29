import {rational,compare} from '../runtime/timeline.mjs';
export const freeze=x=>{if(x&&typeof x==='object'){for(const v of Object.values(x))freeze(v);Object.freeze(x)}return x};
export function record(x,keys){if(!x||typeof x!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(x)))throw TypeError('plain record required');const own=Reflect.ownKeys(x);if(own.length!==keys.length||own.some(k=>!keys.includes(k)))throw TypeError('exact record fields required');for(const k of keys){const d=Object.getOwnPropertyDescriptor(x,k);if(!d||!Object.hasOwn(d,'value'))throw TypeError('data fields required')}return x}
export function array(x,min,max){if(!Array.isArray(x)||Object.getPrototypeOf(x)!==Array.prototype||x.length<min||x.length>max||Reflect.ownKeys(x).length!==x.length+1)throw TypeError('bounded dense array required');for(let i=0;i<x.length;i++){const d=Object.getOwnPropertyDescriptor(x,String(i));if(!d||!Object.hasOwn(d,'value'))throw TypeError('dense data array required')}return x}
export function num(x,min,max){if(typeof x!=='number'||!Number.isFinite(x)||x<min||x>max)throw RangeError('finite numeric domain');return Object.is(x,-0)?0:x}
export function integer(x,min,max){num(x,min,max);if(!Number.isSafeInteger(x))throw RangeError('integer domain');return x}
export function id(x){if(typeof x!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(x))throw TypeError('ASCII ID');return x}
export function text(x){if(typeof x!=='string'||!x.trim()||x.length>256)throw TypeError('reason required');return x}
export function hash(x){if(typeof x!=='string'||!/^[a-f0-9]{64}$/.test(x))throw TypeError('sha256 required');return x}
export function point(x){record(x,['x','y']);return {x:num(x.x,-1e6,1e6),y:num(x.y,-1e6,1e6)}}
export function time(x,min=0,max=86400){record(x,['n','d']);if(typeof x.n!=='string'||typeof x.d!=='string'||! /^-?\d{1,12}$/.test(x.n)||! /^\d{1,12}$/.test(x.d))throw TypeError('bounded rational strings');const q=rational(x.n,x.d);if(compare(q,rational(min))<0||compare(q,rational(max))>0)throw RangeError('time domain');return q}
export function unique(a,key='id'){if(new Set(a.map(x=>x[key])).size!==a.length)throw TypeError('duplicate IDs')}
export const cmpId=(a,b)=>a.id<b.id?-1:a.id>b.id?1:0;
