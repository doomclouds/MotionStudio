import {sampleIris} from './iris.mjs';
import {object,number,optional,choice,bool,freeze} from './validate.mjs';
import {range,progress} from './time.mjs';
import {curve} from './math.mjs';
import {composeTransform,identity} from './matrix.mjs';
export function sampleTransition(input,at,context={}) {
  object(input,['type','version','range','curve','params'],['type','version','range','params']);
  choice(input.type,['transition.push','transition.rect-wipe','transition.iris-reveal']);if(input.version!==1)throw Error('Unsupported element version');
  if(input.type==='transition.iris-reveal')return sampleIris(input,at,context);
  object(input.params,['width','height','direction'],['width','height','direction']);
  const w=number(input.params.width,.001,100000),h=number(input.params.height,.001,100000),dir=choice(input.params.direction,['left','right','up','down']);
  object(context,['reducedMotion']);const reduced=bool(optional(context.reducedMotion,false));
  const phase=progress(at,range(input.range)),p=curve(optional(input.curve,{type:'linear'}),phase.progress);
  if(input.type==='transition.push'&&(!Number.isSafeInteger(w)||!Number.isSafeInteger(h)))throw Error('Push requires integer viewport dimensions for pixel-aligned seams');
  const viewport={x:0,y:0,width:w,height:h};
  const a={role:'outgoing',matrix:identity(),opacity:1,clip:{...viewport}},b={role:'incoming',matrix:identity(),opacity:1,clip:{...viewport}};
  if(reduced){a.opacity=p<.5?1:0;b.opacity=p<.5?0:1;}
  else if(input.type==='transition.push'){
    const x=dir==='left'?-w:dir==='right'?w:0,y=dir==='up'?-h:dir==='down'?h:0;
    const dx=Math.round(x*p),dy=Math.round(y*p);
    a.matrix=composeTransform({x:dx,y:dy});b.matrix=composeTransform({x:dx-x,y:dy-y});
  } else {
    // A stays fully behind B. A zero-width incoming clip is skipped by the adapter.
    if(dir==='left')b.clip={x:w*(1-p),y:0,width:w*p,height:h};
    if(dir==='right')b.clip={x:0,y:0,width:w*p,height:h};
    if(dir==='up')b.clip={x:0,y:h*(1-p),width:w,height:h*p};
    if(dir==='down')b.clip={x:0,y:0,width:w,height:h*p};
  }
  // Endpoint visibility prevents both callbacks from drawing unnecessarily.
  if(phase.progress===0)b.opacity=0;
  if(phase.progress===1)a.opacity=0;
  return freeze({type:input.type,phase:phase.phase,progress:phase.progress,viewport,layers:[a,b]});
}
