/** Identity-preserving composition of two caller-owned translation layouts. */
import {object,number,integer,id,bool,freeze,fail} from '../validate.mjs';
import {range,progress} from '../time.mjs';
import {sampleMotion} from '../motions.mjs';
import {curve,lerp} from '../math.mjs';
import {transformBounds} from '../matrix.mjs';
const plans=new WeakSet();
function dense(a,min,max){
 if(!Array.isArray(a)||a.length<min||a.length>max)fail('Invalid array size');
 for(let i=0;i<a.length;i++)if(!Object.hasOwn(a,i))fail('Sparse array');
 for(const k of Reflect.ownKeys(a))if(k!=='length'&&!(typeof k==='string'&&/^(0|[1-9][0-9]*)$/.test(k)&&Number(k)<a.length))fail('Unknown array field');
 return a;
}
function box(b){
 object(b,['x','y','width','height'],['x','y','width','height']);
 return {x:number(b.x,-1e7,1e7),y:number(b.y,-1e7,1e7),width:number(b.width,.001,1e7),height:number(b.height,.001,1e7)};
}
function derivedBounds(b){
 object(b,['x','y','width','height'],['x','y','width','height']);
 // Bounds are derived sums/differences, not caller rectangle dimensions. Their
 // domain must allow coordinate addition and small cancellation at minimum size;
 // the exact transform comparison below still rejects stale or invented bounds.
 return {x:number(b.x,-2e7,2e7),y:number(b.y,-2e7,2e7),width:number(b.width,0,2e7),height:number(b.height,0,2e7)};
}
function layout(a){
 const seen=new Set();return dense(a,0,128).map(v=>{
  object(v,['itemId','rect','matrix','zIndex','geometryBounds'],['itemId','rect','matrix','zIndex','geometryBounds']);
  const itemId=id(v.itemId);if(seen.has(itemId))fail('Duplicate item ID');seen.add(itemId);
  const rect=box(v.rect),matrix=dense(v.matrix,6,6).map(n=>number(n,-1e7,1e7));
  if(matrix[0]!==1||matrix[1]!==0||matrix[2]!==0||matrix[3]!==1)fail('Translation-only layout required');
  const bounds=derivedBounds(v.geometryBounds),expected=transformBounds(matrix,rect);
  for(const k of Object.keys(expected))if(Math.abs(bounds[k]-expected[k])>1e-7)fail('Stale geometry bounds');
  return {itemId,rect,matrix,zIndex:integer(v.zIndex,0,255),geometryBounds:expected};
 });
}
export function compileLayoutHandoff(input){
 object(input,['from','to','range'],['from','to','range']);
 const from=layout(input.from);
 const to=layout(input.to);
 const timing=range(input.range);
 if(!from.length&&!to.length)fail('Empty handoff');
 const ids=[...to.map(v=>v.itemId),...from.filter(v=>!to.some(t=>t.itemId===v.itemId)).map(v=>v.itemId)];
 if(ids.length>128)fail('Union exceeds 128 items');
 const plan=freeze({from,to,ids,range:timing});
 plans.add(plan);
 return plan;
}
export function sampleLayoutHandoff(plan,at,context={}){
 if(!plans.has(plan))fail('Expected compiled handoff');
 object(context,['reducedMotion']);
 const reduced=Object.hasOwn(context,'reducedMotion')?bool(context.reducedMotion):false;
 const clock=progress(at,plan.range);
 const spatial=reduced?1:curve({type:'smoothstep'},clock.progress);
 const mix=(a,b)=>spatial===0?a:spatial===1?b:lerp(a,b,spatial);
 // Reuse the existing motion evaluator; the recipe owns only identity matching.
 const motion=(type,params)=>sampleMotion({
  type,version:1,range:{start:plan.range.start,end:plan.range.end},
  curve:{type:'smoothstep'},params,
 },at,{reducedMotion:reduced});
 const transform=v=>({x:v.matrix[4],y:v.matrix[5],scaleX:1,scaleY:1,rotation:0});
 const items=plan.ids.map((itemId,zIndex)=>{
  const from=plan.from.find(v=>v.itemId===itemId);
  const to=plan.to.find(v=>v.itemId===itemId);
  const a=from??to,b=to??from;
  const rect=Object.fromEntries(Object.keys(a.rect).map(k=>[k,mix(a.rect[k],b.rect[k])]));
  const transformed=motion('motion.transform',{from:transform(a),to:transform(b)});
  // Preserve exact caller endpoints, avoiding cancellation for large-to-small moves.
  const matrix=spatial===0?[...a.matrix]:spatial===1?[...b.matrix]:transformed.matrix;
  const {opacity}=motion('motion.opacity',{from:from?1:0,to:to?1:0});
  return {itemId,rect,matrix,zIndex,geometryBounds:transformBounds(matrix,rect),opacity,role:from&&to?'shared':to?'enter':'exit'};
 });
 return freeze({...clock,items});
}
