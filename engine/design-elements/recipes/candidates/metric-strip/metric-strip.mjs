/** Fixed horizontal metric-strip model. No rendering, refresh, live source, or trend inference. */
export const id='recipe.metric-strip.v1';
const text=(v,n,max)=>{if(typeof v!=='string'||!v.trim()||v.length>max||/[\r\n]/.test(v))throw new TypeError(n);return v};
const count=(v,n)=>{if(!Number.isSafeInteger(v)||v<0)throw new RangeError(n);return v};
export function layoutMetricStrip({bounds,items}){
 if(!bounds||!['x','y','width','height'].every(k=>Number.isFinite(bounds[k])))throw new TypeError('finite bounds');
 if(!Array.isArray(items)||items.length<2||items.length>6)throw new RangeError('2–6 items');
 if(Math.abs(bounds.x)>16384||Math.abs(bounds.y)>16384||bounds.width>8192||bounds.width/items.length<180||bounds.height<100||bounds.height>400)throw new RangeError('bounds outside fixed-strip support');
 for(let i=0;i<items.length;i++)if(!Object.hasOwn(items,i))throw new TypeError('dense items required');
 const ids=new Set();const cards=items.map((d,i)=>{
  text(d.id,'id',60);if(ids.has(d.id))throw new TypeError('duplicate id');ids.add(d.id);text(d.label,'label',45);count(d.value,'nonnegative safe integer value');
  if(!['count','part-whole'].includes(d.kind))throw new TypeError('kind');
  if(d.kind==='part-whole'){count(d.total,'total');if(d.total===0||d.value>d.total)throw new RangeError('0 <= part <= positive total');}else if(d.total!==undefined)throw new TypeError('count cannot have total');
  const delta=d.delta??null;if(delta!==null){if(typeof delta!=='object'||Array.isArray(delta))throw new TypeError('delta object');text(delta.text,'delta text',60);if(!['favorable','unfavorable','neutral'].includes(delta.meaning))throw new TypeError('explicit delta meaning');}
  return {id:d.id,label:d.label,kind:d.kind,valueText:String(d.value),denominatorText:d.kind==='part-whole'?`/ ${d.total}`:null,delta:delta?{text:delta.text,meaning:delta.meaning}:null,bounds:{x:bounds.x+i*bounds.width/items.length,y:bounds.y,width:bounds.width/items.length,height:bounds.height}};
 });
 return {id,bounds:{...bounds},cards,readingOrder:cards.map(c=>c.id)};
}
