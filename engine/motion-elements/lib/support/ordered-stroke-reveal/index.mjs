/** Original absolute-time ordered outline/median consumer. No font or stroke data. */
import {compilePolylineSections, extractPolylineSection} from '../polyline-sections.mjs';
const plans=new WeakSet();
export function record(v,keys,label){
 if(v===null||typeof v!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(v)))throw TypeError(label+': plain record required');
 const own=Reflect.ownKeys(v);if(own.length!==keys.length||own.some(k=>!keys.includes(k)))throw TypeError(label+': exact fields required');
 for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(!d||!Object.hasOwn(d,'value'))throw TypeError(label+': data fields required');}
}
export function finite(v,min,max,label){if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw RangeError(label+': outside finite domain');return v===0?0:v;}
export function dense(v,min,max,label){
 if(!Array.isArray(v)||Object.getPrototypeOf(v)!==Array.prototype||v.length<min||v.length>max||Reflect.ownKeys(v).length!==v.length+1)throw TypeError(label+': ordinary dense array required');
 for(let i=0;i<v.length;i++){const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d||!Object.hasOwn(d,'value'))throw TypeError(label+': data entries required');}
}
function freeze(v){if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
const arities={M:2,L:2,Q:4,C:6,Z:0};
function outline(v){
 dense(v,3,8192,'outline');let open=false,segments=0;
 const commands=v.map(c=>{record(c,['op','values'],'command');if(typeof c.op!=='string'||!Object.hasOwn(arities,c.op))throw TypeError('Unsupported outline command');dense(c.values,arities[c.op],arities[c.op],'values');
  if(c.op==='M'){if(open)throw RangeError('Close each contour before another M');open=true;segments=0;}
  else if(c.op==='Z'){if(!open||segments<1)throw RangeError('Empty/unopened contour');open=false;}
  else{if(!open)throw RangeError('Open contour required');segments++;}
  return{op:c.op,values:c.values.map(n=>finite(n,-1e6,1e6,'outline coordinate'))};});
 if(open)throw RangeError('Outline must explicitly close');return commands;
}
export function compileOrderedStrokeReveal(spec){
 record(spec,['strokes','startTime','liftDuration'],'spec');dense(spec.strokes,1,256,'strokes');
 const startTime=finite(spec.startTime,-1e9,1e9,'startTime'),liftDuration=finite(spec.liftDuration,0,1e6,'liftDuration');let cursor=startTime,totalPoints=0,totalCommands=0;
 const strokes=spec.strokes.map((s,i)=>{record(s,['outline','median','duration','revealWidth'],'stroke');const duration=finite(s.duration,1e-6,1e6,'duration'),revealWidth=finite(s.revealWidth,1e-6,1e6,'revealWidth');
  const path=compilePolylineSections({points:s.median}),shape=outline(s.outline),endTime=cursor+duration;
  if(endTime<=cursor||endTime>1e9)throw RangeError('Unrepresentable/excessive stroke timeline');
  totalPoints+=path.points.length;totalCommands+=shape.length;if(totalPoints>65536||totalCommands>65536)throw RangeError('Plan geometry budget exceeded');
  const result={outline:shape,path,revealWidth,startTime:cursor,endTime,duration:endTime-cursor};
  cursor=endTime+(i===spec.strokes.length-1?0:liftDuration);if(cursor>endTime&&cursor>1e9||liftDuration>0&&i<spec.strokes.length-1&&cursor===endTime)throw RangeError('Unrepresentable/excessive lift timeline');return result;
 });
 const plan=freeze({strokes,startTime,endTime:cursor,liftDuration});plans.add(plan);return plan;
}
export function sampleOrderedStrokeReveal(plan,time){
 if(!plans.has(plan))throw TypeError('Expected local compiled ordered-stroke plan');finite(time,-1e9,1e9,'time');
 let completedCount=0,active=null;
 for(let i=0;i<plan.strokes.length;i++){
  const s=plan.strokes[i];if(time>=s.endTime){completedCount++;continue;}
  if(time>=s.startTime){const progress=(time-s.startTime)/s.duration;const section=extractPolylineSection(s.path,{startDistance:0,endDistance:progress*s.path.totalLength});active={index:i,progress,section};}break;
 }
 const done=time>=plan.endTime;let lift=null;
 if(!active&&completedCount>0&&!done){const previous=plan.strokes[completedCount-1],next=plan.strokes[completedCount];lift={from:{...previous.path.points.at(-1)},to:{...next.path.points[0]},progress:(time-previous.endTime)/(next.startTime-previous.endTime),startTime:previous.endTime,endTime:next.startTime};}
 return freeze({time,completedCount,active,lift,phase:done?'complete':active?'stroke':lift?'lift':'before',penDown:active!==null,tip:active?{...active.section.vertices.at(-1).position}:null,done});
}
