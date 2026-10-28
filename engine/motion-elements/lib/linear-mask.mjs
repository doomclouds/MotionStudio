import {object,number,choice,optional,bool,freeze} from './validate.mjs';
import {range,progress} from './time.mjs';
import {curve} from './math.mjs';
const states=new WeakSet();
// Clip a convex local 2D polygon against dot(normal,p) <= limit.
function cut(poly,n,limit){
 const out=[];
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length];
  const da=a.x*n.x+a.y*n.y-limit,db=b.x*n.x+b.y*n.y-limit;
  if(da<=0)out.push(a);
  if((da<0&&db>0)||(da>0&&db<0)){
   const u=da/(da-db);out.push({x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u});
  }
 }
 return out;
}
export function assertLinearMaskState(state){if(!states.has(state))throw Error('Expected genuine linear-mask sample state');}
export function sampleLinearMask(input,at,context={}){
 object(input,['type','version','range','curve','params'],['type','version','range','params']);
 if(input.type!=='transition.linear-mask'||input.version!==1)throw Error('Unsupported linear-mask transition');
 object(input.params,['width','height','angle','mode'],['width','height','angle','mode']);
 const p=input.params,width=number(p.width,1,8192),height=number(p.height,1,8192);
 if(width*height>16777216)throw Error('Linear-mask viewport exceeds area budget');
 const angle=number(p.angle,-Math.PI,Math.PI),mode=choice(p.mode,['sweep','band']);
 object(context,['reducedMotion']);const reduced=bool(optional(context.reducedMotion,false));
 const phase=progress(at,range(input.range)),eased=curve(optional(input.curve,{type:'linear'}),phase.progress);
 const q=reduced?(phase.progress<.5?0:1):eased;
 const normal={x:Math.cos(angle),y:Math.sin(angle)};
 const rect=[{x:0,y:0},{x:width,y:0},{x:width,y:height},{x:0,y:height}];
 const projections=rect.map(v=>v.x*normal.x+v.y*normal.y),lo=Math.min(...projections),hi=Math.max(...projections);
 let polygon=rect;
 if(q===0)polygon=[];
 else if(q!==1){
  if(mode==='sweep')polygon=cut(rect,normal,lo+(hi-lo)*q);
  else {
   const center=(lo+hi)/2,half=(hi-lo)*q/2;
   polygon=cut(cut(rect,normal,center+half),{x:-normal.x,y:-normal.y},-center+half);
  }
 }
 const state=freeze({type:input.type,composition:'over-reveal',phase:phase.phase,progress:phase.progress,revealProgress:q,viewport:{x:0,y:0,width,height},normal,mode,polygon});
 states.add(state);return state;
}
