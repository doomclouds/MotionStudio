export const own = (v,keys,optional=[]) => {if(!v || Object.getPrototypeOf(v)!==Object.prototype)throw new TypeError('Plain object required');const d=Object.getOwnPropertyDescriptors(v);if(Reflect.ownKeys(d).some(k=>!keys.includes(k)||!('value' in d[k]))||keys.some(k=>!optional.includes(k)&&!d[k]))throw new TypeError('Exact data fields required');return v;};
export const dense=(v,min,max)=>{if(!Array.isArray(v)||v.length<min||v.length>max)throw new RangeError('Array count');return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d||!('value' in d))throw new TypeError('Dense data array required');return d.value;});};
export const number=(v,min=-1e4,max=1e4)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw new RangeError('Finite bounded number required');return v;};
export const point=p=>{own(p,['x','y']);return {x:number(p.x),y:number(p.y)};};
export const points=(ps,min=1,max=64)=>{return dense(ps,min,max).map(point);};
export const rect=r=>{own(r,['x','y','width','height']);return {x:number(r.x),y:number(r.y),width:number(r.width,1e-4,1e4),height:number(r.height,1e-4,1e4)};};
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
