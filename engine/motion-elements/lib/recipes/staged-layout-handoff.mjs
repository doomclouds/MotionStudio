/** Explicit waypoint composition; original code, no playback or layout solver. */
import {object,bool,freeze,fail} from '../validate.mjs';
import {range,progress,time} from '../time.mjs';
import {compare} from '../../../motion-timeline-core/lib/timeline.mjs';
import {compileLayoutHandoff,sampleLayoutHandoff} from './layout-handoff.mjs';
const plans=new WeakMap();
function dense(value,min,max) {
 if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length<min||value.length>max)fail('Expected bounded ordinary same-realm array');
 for(let i=0;i<value.length;i++)if(!Object.hasOwn(value,i))fail('Sparse arrays unsupported');
 for(const key of Reflect.ownKeys(value))if(key!=='length'&&!(typeof key==='string'&&/^(0|[1-9][0-9]*)$/.test(key)&&Number(key)<value.length))fail('Unknown array field');
 return value;
}
export function compileStagedLayoutHandoff(input) {
 object(input,['snapshots','ranges'],['snapshots','ranges']);
 const rawSnapshots=dense(input.snapshots,3,17);
 const rawRanges=dense(input.ranges,2,16);
 if(rawSnapshots.length!==rawRanges.length+1)fail('One more snapshot than ranges required');
 // Gate arrays before delegating, preventing overridden array methods in old API.
 for(const snapshot of rawSnapshots) {
  dense(snapshot,1,128);
  for(const item of snapshot) {
   object(item,['itemId','rect','matrix','zIndex','geometryBounds'],['itemId','rect','matrix','zIndex','geometryBounds']);
   dense(item.matrix,6,6);
  }
 }
 const ranges=rawRanges.map(range);
 for(let i=1;i<ranges.length;i++)if(compare(ranges[i-1].end,ranges[i].start)!==0)fail('Stage ranges must meet exactly');
 const whole=range({start:ranges[0].start,end:ranges.at(-1).end});
 // Existing compiler provides authoritative translation-layout validation/copying.
 const snapshots=rawSnapshots.map(snapshot=>compileLayoutHandoff({from:snapshot,to:snapshot,range:{start:whole.start,end:whole.end}}).from);
 const ids=snapshots[0].map(item=>item.itemId);
 const normalized=snapshots.map(snapshot=>{
  if(snapshot.length!==ids.length||snapshot.some(item=>!ids.includes(item.itemId)))fail('Every snapshot must have exactly the same IDs');
  return ids.map(itemId=>snapshot.find(item=>item.itemId===itemId));
 });
 const stages=ranges.map((r,i)=>compileLayoutHandoff({from:normalized[i],to:normalized[i+1],range:{start:r.start,end:r.end}}));
 const finalItems=sampleLayoutHandoff(stages.at(-1),whole.end).items;
 const plan=freeze({snapshots:normalized,ranges:ranges.map(r=>({start:r.start,end:r.end})),range:{start:whole.start,end:whole.end},itemIds:ids});
 plans.set(plan,{stages,whole,finalItems});
 return plan;
}
export function sampleStagedLayoutHandoff(plan,at,context={}) {
 const compiled=plans.get(plan);
 if(!compiled)fail('Expected compiled staged handoff from this module instance');
 object(context,['reducedMotion']);
 const reduced=Object.hasOwn(context,'reducedMotion')?bool(context.reducedMotion):false;
 const when=time(at),clock=progress(when,compiled.whole);
 let stageIndex=0;
 while(stageIndex<compiled.stages.length-1&&compare(when,plan.ranges[stageIndex].end)>=0)stageIndex++;
 const sampled=sampleLayoutHandoff(compiled.stages[stageIndex],when);
 return freeze({...clock,stageIndex,stageProgress:sampled.progress,items:reduced?compiled.finalItems:sampled.items});
}
