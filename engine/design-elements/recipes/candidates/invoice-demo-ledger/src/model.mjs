// SPDX-License-Identifier: Apache-2.0
// Changed from the attributed OpenDesign invoice study: synthetic-only bounded model,
// exact cents, no original fixture/identity/payment fields, explicit half-up rounding.
export const LIMITS=Object.freeze({rows:6,quantity:999,rateCents:9999999,amountCents:99999999});
export function object(value,keys){if(!value||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw new TypeError('Plain data object required');for(const key of Reflect.ownKeys(value)){if(typeof key!=='string'||!keys.includes(key)||!Object.hasOwn(Object.getOwnPropertyDescriptor(value,key),'value'))throw new TypeError('Unknown or accessor field');}return value;}
export function integer(n,min,max){if(!Number.isSafeInteger(n)||n<min||n>max)throw new RangeError('Bounded integer required');return n;}
export function text(value,max){if(typeof value!=='string'||value.length<1||value.length>max||value.trim()!==value||!/^[\x20-\x7e]+$/.test(value))throw new TypeError('Trimmed bounded printable ASCII required');return value;}
export function dense(values,min,max=min){if(!Array.isArray(values)||Object.getPrototypeOf(values)!==Array.prototype||values.length<min||values.length>max)throw new RangeError('Dense bounded array required');for(let i=0;i<values.length;i++)if(!Object.hasOwn(values,i)||!Object.hasOwn(Object.getOwnPropertyDescriptor(values,String(i)),'value'))throw new TypeError('Sparse or accessor array rejected');const allowed=new Set(['length',...Array.from({length:values.length},(_,i)=>String(i))]);if(Reflect.ownKeys(values).some(k=>!allowed.has(k)))throw new TypeError('Unknown array property');return values;}
export function computeInvoice(items,retainerBps=0,taxBps=0){
 dense(items,1,LIMITS.rows);integer(retainerBps,0,10000);integer(taxBps,0,10000);
 const rows=Array.from({length:items.length},(_,index)=>{const item=items[index];object(item,['title','note','quantity','rateCents']);if(['title','note','quantity','rateCents'].some(k=>!Object.hasOwn(item,k)))throw new TypeError('All item fields required');const title=text(item.title,52),note=text(item.note,160),quantity=integer(item.quantity,1,LIMITS.quantity),rateCents=integer(item.rateCents,0,LIMITS.rateCents),amount=integer(quantity*rateCents,0,LIMITS.amountCents);return Object.freeze({title,note,quantity,rateCents,amount});});
 const subtotal=integer(rows.reduce((sum,row)=>sum+row.amount,0),0,LIMITS.amountCents);
 const halfUp=(cents,bps)=>Number((BigInt(cents)*BigInt(bps)+5000n)/10000n);
 const retainer=halfUp(subtotal,retainerBps),net=subtotal-retainer,tax=halfUp(net,taxBps),total=integer(net+tax,0,LIMITS.amountCents);
 return Object.freeze({rows:Object.freeze(rows),subtotal,retainer,net,tax,total,retainerBps,taxBps});
}
export function money(cents){integer(cents,0,LIMITS.amountCents);return '$'+String(Math.floor(cents/100)).replace(/\B(?=(\d{3})+(?!\d))/g,',')+'.'+String(cents%100).padStart(2,'0');}
export function basisPercent(bps){integer(bps,0,10000);return String(bps/100)+'%';}
