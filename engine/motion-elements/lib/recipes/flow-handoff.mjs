/** Recipe: conservative data-weight handoff on explicit, unchanged graph identities. */
import {object,bool,freeze,fail} from '../validate.mjs';
import {range} from '../time.mjs';
import {curve,lerp} from '../math.mjs';
import {sampleKeyframeTrack} from '../keyframe-track.mjs';
import {weightedFlowLayout} from '../weighted-flow.mjs';
const plans=new WeakSet();
function conserved(flow){
 for(const p of flow.ports){
  if(!p.inputs.length||!p.outputs.length)continue;
  const b=flow.balances.find(b=>b.itemId===p.itemId);
  // Relative to actual flow, not a unit-sized absolute tolerance: tiny valid
  // bands must not admit proportionally large creation/loss. Both zero => 0.
  if(Math.abs(b.net)>Number.EPSILON*32*Math.max(b.incoming,b.outgoing))fail('Internal node flow is not conserved');
 }
}
export function compileFlowHandoff(input){
 object(input,['nodes','from','to','range','unitsToPixels','portGap','samples'],['nodes','from','to','range','unitsToPixels','portGap','samples']);
 const timing=range(input.range),settings={nodes:input.nodes,unitsToPixels:input.unitsToPixels,portGap:input.portGap,samples:input.samples};
 const fromFlow=weightedFlowLayout({...settings,links:input.from}),toFlow=weightedFlowLayout({...settings,links:input.to});
 // A positive band cannot approach zero at arbitrary rational times while still
 // being representable around a nonzero global y. V1 therefore keeps inactive
 // links inactive and requires a conservative positive-width margin. No hidden
 // visibility threshold or clamping may falsify the model's flow quantities.
 const maxY=Math.max(1,...input.nodes.map(n=>Math.abs(n.geometryBounds.y)+n.geometryBounds.height+1));
 const minimumHalfWidth=32*Number.EPSILON*maxY;
 const previous=new Map(fromFlow.links.map(l=>[l.linkId,l]));
 if(fromFlow.links.length!==toFlow.links.length)fail('Flow topology must have the same link IDs');
 const values=toFlow.links.map(l=>{
  const before=previous.get(l.linkId);
  if(!before||before.fromId!==l.fromId||before.toId!==l.toId)fail('Flow topology changed');
  if((before.value===0)!==(l.value===0))fail('V1 flow handoff cannot activate or deactivate zero-weight links');
  if(l.value>0&&Math.min(before.thickness,l.thickness)/2<minimumHalfWidth)fail('Flow handoff requires numerically robust positive widths');
  return{linkId:l.linkId,fromId:l.fromId,toId:l.toId,from:before.value,to:l.value};
 });
 conserved(fromFlow);conserved(toFlow);
 const plan=freeze({settings:structuredClone(settings),values,track:{range:{start:timing.start,end:timing.end},params:{knots:[{at:0,value:0,interpolation:'linear'},{at:1,value:1,interpolation:'linear'}]}}});
 plans.add(plan);return plan;
}
export function sampleFlowHandoff(plan,at,context={}){
 if(!plans.has(plan))fail('Expected compiled flow handoff');
 object(context,['reducedMotion']);const reduced=Object.hasOwn(context,'reducedMotion')?bool(context.reducedMotion):false;
 const state=sampleKeyframeTrack(plan.track,at,{reducedMotion:reduced}),u=curve({type:'smoothstep'},state.value);
 const links=plan.values.map(({from,to,...link})=>({...link,value:u===0?from:u===1?to:u<=.5?lerp(from,to,u):lerp(to,from,1-u)}));
 const flow=weightedFlowLayout({...plan.settings,links});
 return freeze({phase:state.phase,progress:state.progress,flow});
}
