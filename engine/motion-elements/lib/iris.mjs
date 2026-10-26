import {object,number,optional,bool,freeze} from './validate.mjs';
import {range,progress} from './time.mjs';
import {curve} from './math.mjs';
import {identity} from './matrix.mjs';
export function sampleIris(input,at,context={}){
 object(input.params,['width','height','center'],['width','height','center']);
 const width=number(input.params.width,1,8192),height=number(input.params.height,1,8192);
 if(width*height>16777216)throw Error('Iris viewport exceeds pixel budget');
 object(input.params.center,['x','y'],['x','y']);
 const center={x:number(input.params.center.x,0,width),y:number(input.params.center.y,0,height)};
 object(context,['reducedMotion']);const reduced=bool(optional(context.reducedMotion,false));
 const phase=progress(at,range(input.range)),eased=curve(optional(input.curve,{type:'linear'}),phase.progress);
 const q=reduced?(phase.progress<.5?0:1):eased;
 const maxRadius=Math.max(...[[0,0],[width,0],[0,height],[width,height]].map(([x,y])=>Math.hypot(x-center.x,y-center.y)));
 const viewport={x:0,y:0,width,height};
 return freeze({type:'transition.iris-reveal',phase:phase.phase,progress:phase.progress,revealProgress:q,composition:'over-reveal',viewport,center,radius:q*maxRadius,maxRadius,
 layers:[{role:'outgoing',matrix:identity(),opacity:1,clip:{...viewport}},{role:'incoming',matrix:identity(),opacity:q===0?0:1,clip:{...viewport}}]});
}
