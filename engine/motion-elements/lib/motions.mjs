import {object,number,point,optional,choice,bool,freeze,id} from './validate.mjs';
import {range,progress} from './time.mjs';
import {curve,lerp,seededUnit} from './math.mjs';
import {composeTransform,identity,matrix,multiply} from './matrix.mjs';
export const motionTypes=Object.freeze(['motion.transform','motion.opacity','motion.anchored-squash','motion.shake']);
const transform=v=>{object(v,['x','y','scaleX','scaleY','rotation'],['x','y','scaleX','scaleY','rotation']);return {x:number(v.x),y:number(v.y),scaleX:number(v.scaleX,-1000,1000),scaleY:number(v.scaleY,-1000,1000),rotation:number(v.rotation,-1e6,1e6)};};
export function validateMotion(input) {
  object(input,['type','version','range','curve','params'],['type','version','range','params']);
  choice(input.type,motionTypes);if(input.version!==1)throw Error('Unsupported element version');
  const r=range(input.range),rawCurve=optional(input.curve,{type:'linear'});curve(rawCurve,.5);const c=structuredClone(rawCurve);
  let p=input.params;
  if(input.type==='motion.transform'){
    object(p,['from','to','origin'],['from','to']);p={from:transform(p.from),to:transform(p.to),origin:point(optional(p.origin,{x:0,y:0}))};
  } else if(input.type==='motion.opacity'){
    object(p,['from','to'],['from','to']);p={from:number(p.from,0,1),to:number(p.to,0,1)};
  } else if(input.type==='motion.anchored-squash'){
    object(p,['amount','axis','origin'],['amount','axis','origin']);p={amount:number(p.amount,0,.8),axis:choice(p.axis,['x','y']),origin:point(p.origin)};
  } else {
    object(p,['amplitudeX','amplitudeY','rotation','frequencyHz','seed','elementId','origin'],['amplitudeX','amplitudeY','rotation','frequencyHz','seed','elementId']);
    p={amplitudeX:number(p.amplitudeX,0,10000),amplitudeY:number(p.amplitudeY,0,10000),rotation:number(p.rotation,0,Math.PI),frequencyHz:number(p.frequencyHz,.01,120),seed:p.seed,elementId:id(p.elementId),origin:point(optional(p.origin,{x:0,y:0}))};
    seededUnit(p.seed,p.elementId,'x');
  }
  return freeze({type:input.type,version:1,range:{start:r.start,end:r.end},curve:c,params:p});
}
export function sampleMotion(input,at,context={}) {
  const spec=validateMotion(input),r=range(spec.range),phase=progress(at,r),p=spec.params;
  object(context,['reducedMotion','parentMatrix']);const reduced=bool(optional(context.reducedMotion,false));
  const parent=matrix(optional(context.parentMatrix,identity()));let m=identity(),opacity=1;
  const u=curve(spec.curve,phase.progress);
  if(spec.type==='motion.transform'){
    const t=reduced?1:u,values=Object.fromEntries(Object.keys(p.from).map(k=>[k,lerp(p.from[k],p.to[k],t)]));
    m=composeTransform({...values,pivot:p.origin});
  }else if(spec.type==='motion.opacity') opacity=lerp(p.from,p.to,u);
  else if(spec.type==='motion.anchored-squash'&&!reduced){
    const compression=1-p.amount*Math.sin(Math.PI*u)**2;
    m=composeTransform({scaleX:p.axis==='x'?compression:1/compression,scaleY:p.axis==='y'?compression:1/compression,pivot:p.origin});
  }else if(spec.type==='motion.shake'&&!reduced&&phase.phase==='active'){
    const seconds=Number(r.duration.n)/Number(r.duration.d)*phase.progress;
    const tick=seconds*p.frequencyHz,i=Math.floor(tick),blend=tick-i,sm=blend*blend*(3-2*blend);
    const noise=channel=>lerp(seededUnit(p.seed,p.elementId,channel,i)*2-1,seededUnit(p.seed,p.elementId,channel,i+1)*2-1,sm);
    const envelope=Math.sin(Math.PI*phase.progress)**2;
    m=composeTransform({x:noise('x')*p.amplitudeX*envelope,y:noise('y')*p.amplitudeY*envelope,rotation:noise('rotation')*p.rotation*envelope,pivot:p.origin});
  }
  return freeze({matrix:multiply(parent,m),opacity,phase:phase.phase,progress:phase.progress});
}
/** Compose transform and opacity writers. Two writers of one channel are rejected. */
export function composeMotionStates(states,options={}) {
  object(options,['parentMatrix']);const parentMatrix=optional(options.parentMatrix,identity());
  if(!Array.isArray(states)||states.length>64)throw Error('Invalid state list');
  let transform=identity(),opacity=1,hasM=false,hasO=false;
  for(const state of states){
    object(state,['channel','state'],['channel','state']);choice(state.channel,['transform','opacity']);
    object(state.state,['matrix','opacity','phase','progress'],['matrix','opacity']);
    const m=matrix(state.state.matrix),o=number(state.state.opacity,0,1);
    if(state.channel==='transform'){if(hasM)throw Error('Conflicting transform writers');hasM=true;transform=m;if(o!==1)throw Error('Transform writer also writes opacity');}
    else {if(hasO)throw Error('Conflicting opacity writers');hasO=true;opacity=o;if(m.some((v,i)=>v!==identity()[i]))throw Error('Opacity writer also writes transform');}
  }
  return freeze({matrix:multiply(matrix(parentMatrix),transform),opacity});
}
