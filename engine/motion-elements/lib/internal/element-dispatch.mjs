import {object,number,optional,choice,bool,freeze} from '../validate.mjs';
import {range,progress} from '../time.mjs';
import {curve} from '../math.mjs';
import {identity,matrix,multiply} from '../matrix.mjs';
import {sampleLinearMask} from '../foundations/transition/linear-mask/index.mjs';
import {sampleIris} from '../foundations/transition/iris-reveal/index.mjs';
import {applyLocal as applyPush,validateViewport as validatePushViewport} from '../foundations/transition/push/index.mjs';
import {applyLocal as applyRectWipe} from '../foundations/transition/rect-wipe/index.mjs';
import {validateParameters as validateTransform,sampleLocal as sampleTransform} from '../foundations/motion/transform/index.mjs';
import {validateParameters as validateOpacity,sampleLocal as sampleOpacity} from '../foundations/motion/opacity/index.mjs';
import {validateParameters as validateAnchoredSquash,sampleLocal as sampleAnchoredSquash} from '../foundations/motion/anchored-squash/index.mjs';
import {validateParameters as validateShake,sampleLocal as sampleShake} from '../foundations/motion/shake/index.mjs';

export const motionTypes=Object.freeze(['motion.transform','motion.opacity','motion.anchored-squash','motion.shake']);
export function validateMotion(input) {
  object(input,['type','version','range','curve','params'],['type','version','range','params']);
  choice(input.type,motionTypes);if(input.version!==1)throw Error('Unsupported element version');
  const r=range(input.range),rawCurve=optional(input.curve,{type:'linear'});curve(rawCurve,.5);const c=structuredClone(rawCurve);
  let p=input.params;
  if(input.type==='motion.transform'){
    p=validateTransform(p);
  } else if(input.type==='motion.opacity'){
    p=validateOpacity(p);
  } else if(input.type==='motion.anchored-squash'){
    p=validateAnchoredSquash(p);
  } else {
    p=validateShake(p);
  }
  return freeze({type:input.type,version:1,range:{start:r.start,end:r.end},curve:c,params:p});
}
export function sampleMotion(input,at,context={}) {
  const spec=validateMotion(input),r=range(spec.range),phase=progress(at,r),p=spec.params;
  object(context,['reducedMotion','parentMatrix']);const reduced=bool(optional(context.reducedMotion,false));
  const parent=matrix(optional(context.parentMatrix,identity()));let m=identity(),opacity=1;
  const u=curve(spec.curve,phase.progress);
  if(spec.type==='motion.transform'){
    m=sampleTransform(p,u,reduced);
  }else if(spec.type==='motion.opacity') opacity=sampleOpacity(p,u);
  else if(spec.type==='motion.anchored-squash'&&!reduced){
    m=sampleAnchoredSquash(p,u);
  }else if(spec.type==='motion.shake'&&!reduced&&phase.phase==='active'){
    m=sampleShake(p,r,phase);
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

export function sampleTransition(input,at,context={}) {
  object(input,['type','version','range','curve','params'],['type','version','range','params']);
  choice(input.type,['transition.push','transition.rect-wipe','transition.iris-reveal','transition.linear-mask']);if(input.version!==1)throw Error('Unsupported element version');
  if(input.type==='transition.linear-mask')return sampleLinearMask(input,at,context);
  if(input.type==='transition.iris-reveal')return sampleIris(input,at,context);
  object(input.params,['width','height','direction'],['width','height','direction']);
  const w=number(input.params.width,.001,100000),h=number(input.params.height,.001,100000),dir=choice(input.params.direction,['left','right','up','down']);
  object(context,['reducedMotion']);const reduced=bool(optional(context.reducedMotion,false));
  const phase=progress(at,range(input.range)),p=curve(optional(input.curve,{type:'linear'}),phase.progress);
  if(input.type==='transition.push')validatePushViewport(w,h);
  const viewport={x:0,y:0,width:w,height:h};
  const a={role:'outgoing',matrix:identity(),opacity:1,clip:{...viewport}},b={role:'incoming',matrix:identity(),opacity:1,clip:{...viewport}};
  if(reduced){a.opacity=p<.5?1:0;b.opacity=p<.5?0:1;}
  else if(input.type==='transition.push'){
    applyPush(a,b,w,h,dir,p);
  } else {
    applyRectWipe(a,b,w,h,dir,p);
  }
  // Endpoint visibility prevents both callbacks from drawing unnecessarily.
  if(phase.progress===0)b.opacity=0;
  if(phase.progress===1)a.opacity=0;
  return freeze({type:input.type,phase:phase.phase,progress:phase.progress,viewport,layers:[a,b]});
}
