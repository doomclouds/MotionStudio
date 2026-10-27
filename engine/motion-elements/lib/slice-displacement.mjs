import {object,number,integer,bool,freeze} from './validate.mjs';
import {seededUnit} from './math.mjs';
import {range,progress} from './time.mjs';
const plans=new WeakSet(),states=new WeakMap();
export function compileSliceDisplacement(input){
 object(input,['width','height','bands','maxOffset','seed','instanceId','range','jitterCycles'],['width','height','bands','maxOffset','seed','instanceId','range','jitterCycles']);
 const width=integer(input.width,1,8192),height=integer(input.height,1,8192);
 if(width*height>16777216)throw Error('Slice viewport area exceeds limit');
 const count=integer(input.bands,2,Math.min(height,256)),maxOffset=number(input.maxOffset,0,8192),jitterCycles=integer(input.jitterCycles,0,32),timing=range(input.range);
 seededUnit(input.seed,input.instanceId,'phase');
 const bands=Array.from({length:count},(_,i)=>({bandId:`band:${i}`,y:Math.floor(i*height/count),height:Math.floor((i+1)*height/count)-Math.floor(i*height/count),sign:i%2?1:-1,phase:seededUnit(input.seed,input.instanceId,'phase',i)*2*Math.PI}));
 const plan=freeze({width,height,maxOffset,jitterCycles,range:timing,bands});plans.add(plan);return plan;
}
export function sampleSliceDisplacement(plan,at,context={}){
 if(!plans.has(plan))throw Error('Expected compiled slice plan');
 object(context,['reducedMotion']);const reducedMotion=context.reducedMotion===undefined?false:bool(context.reducedMotion);
 const clock=progress(at,plan.range),u=clock.progress;
 const envelope=reducedMotion||u===0||u===1?0:Math.sin(Math.PI*u)**2;
 const bands=plan.bands.map(b=>({bandId:b.bandId,y:b.y,height:b.height,offset:envelope===0?0:b.sign*plan.maxOffset*envelope*(.75+.25*Math.sin(2*Math.PI*plan.jitterCycles*u+b.phase))}));
 const state=freeze({...clock,width:plan.width,height:plan.height,atHome:bands.every(b=>b.offset===0),bands});states.set(state,plan);return state;
}
export function assertSliceState(state){if(!states.has(state))throw Error('Expected sampled slice state');}
