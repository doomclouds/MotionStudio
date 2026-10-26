import {choice, number, id, object} from './validate.mjs';
export const lerp = (a,b,p) => number(a)+(number(b)-a)*number(p,0,1);
export const easings = Object.freeze(['linear','inCubic','outCubic','inOutCubic']);
export function ease(p, name='linear') {
  number(p,0,1);choice(name,easings);
  if(name==='inCubic')return p*p*p;
  if(name==='outCubic')return 1-(1-p)**3;
  if(name==='inOutCubic')return p<.5?4*p*p*p:1-(-2*p+2)**3/2;
  return p;
}
/** FNV-1a hash, channel isolated, no mutable random stream. Non-cryptographic. */
export function seededUnit(seed, instanceId, channel, index=0) {
  if(typeof seed!=='string'||seed.length>128)throw Error('seed must be a string of <=128 characters');
  id(instanceId);id(channel);number(index,0,1e9);if(!Number.isSafeInteger(index))throw Error('index must be integer');
  const text=JSON.stringify([seed,instanceId,channel,index]);let h=2166136261;
  for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
  return (h>>>0)/4294967296;
}
/** Timing curve x is solved by bounded bisection; x control points must be monotone. */
export function curve(input, u) {
  number(u,0,1);
  object(input,['type','values'],['type']);
  choice(input.type,['linear','smoothstep','cubic-bezier']);
  if(input.type!=='cubic-bezier'){
    if(Object.hasOwn(input,'values'))throw Error('values only allowed for cubic-bezier');
    return input.type==='linear'?u:u*u*(3-2*u);
  }
  if(!Array.isArray(input.values)||input.values.length!==4)throw Error('Bezier requires four values');
  const [x1,y1,x2,y2]=input.values.map(v=>number(v,0,1));
  if(x1>x2)throw Error('Bezier x controls must be monotone');
  if(u===0||u===1)return u;
  const bez=(t,a,b)=>3*(1-t)**2*t*a+3*(1-t)*t*t*b+t**3;
  let lo=0,hi=1;for(let i=0;i<48;i++){const mid=(lo+hi)/2;if(bez(mid,x1,x2)<u)lo=mid;else hi=mid;}
  return bez((lo+hi)/2,y1,y2);
}
