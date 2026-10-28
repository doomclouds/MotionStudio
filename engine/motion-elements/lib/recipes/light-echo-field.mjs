import {object,number,integer,id,point,bool,optional,freeze} from '../validate.mjs';
import {range,progress} from '../time.mjs';
import {seededUnit,lerp,curve} from '../math.mjs';
import {sampleMotion} from '../motions.mjs';
const compiled=new WeakSet(), sampled=new WeakSet();
/** Art-directed same-ID light/vertical echo composition, not physical optics. */
export function compileLightEchoField(input){
 object(input,['type','version','range','seed','lights','camera','focus','drift'],['type','version','range','seed','lights','camera','focus','drift']);
 if(input.type!=='recipe.light-echo-field'||input.version!==1)throw Error('Unsupported light echo recipe');
 const r=range(input.range);
 seededUnit(input.seed,'validation','seed');
 object(input.focus,['from','to'],['from','to']);
 const focus={from:number(input.focus.from,.1,8),to:number(input.focus.to,.1,8)};
 object(input.drift,['x','y','frequencyHz'],['x','y','frequencyHz']);
 const drift={x:number(input.drift.x,0,1000),y:number(input.drift.y,0,1000),frequencyHz:number(input.drift.frequencyHz,0,10)};
 object(input.camera,['from','to','origin'],['from','to','origin']);
 const rawCameraSpec={type:'motion.transform',version:1,range:{start:r.start,end:r.end},curve:{type:'smoothstep'},params:input.camera};
 sampleMotion(rawCameraSpec,r.start);
 const cameraSpec=structuredClone(rawCameraSpec); // Reuse the existing transform validator and evaluator.
 if(!Array.isArray(input.lights)||input.lights.length<1||input.lights.length>512)throw Error('Expected 1..512 lights');
 const ids=new Set();
 const lights=Array.from(input.lights,l=>{
  object(l,['id','position','radius','color','opacity','echo'],['id','position','radius','color','opacity']);
  const lightId=id(l.id);if(ids.has(lightId))throw Error('Duplicate light ID');ids.add(lightId);
  const position=point(l.position),radius=number(l.radius,.1,1000),opacity=number(l.opacity,0,1);
  if(!Array.isArray(l.color)||l.color.length!==3)throw Error('Expected RGB triplet');
  const color=Array.from(l.color,v=>integer(v,0,255));
  let echo=null;
  if(l.echo!==undefined){
   const e=l.echo;object(e,['offset','width','step','count','heightMin','heightMax','opacity'],['offset','width','step','count','heightMin','heightMax','opacity']);
   const offset=point(e.offset),width=number(e.width,.1,1000),step=number(e.step,.1,1000),count=integer(e.count,1,64),heightMin=number(e.heightMin,.1,1000),heightMax=number(e.heightMax,heightMin,1000),echoOpacity=number(e.opacity,0,1);
   echo={offset,width,step,opacity:echoOpacity,fragments:Array.from({length:count},(_,i)=>({index:i,height:lerp(heightMin,heightMax,seededUnit(input.seed,lightId,'height',i)),strength:lerp(.25,1,seededUnit(input.seed,lightId,'strength',i))}))};
  }
  return {id:lightId,position,radius,color,opacity,echo,phase:seededUnit(input.seed,lightId,'phase')*Math.PI*2};
 });
 const plan=freeze({type:input.type,range:r,focus,drift,cameraSpec,lights});compiled.add(plan);return plan;
}
export function sampleLightEchoField(plan,at,options={}){
 if(!compiled.has(plan))throw Error('Expected compiled light echo plan');
 object(options,['reducedMotion']);const reducedMotion=bool(optional(options.reducedMotion,false));
 const timing=progress(at,plan.range),u=curve({type:'smoothstep'},timing.progress);
 const duration=Number(plan.range.duration.n)/Number(plan.range.duration.d);
 // Clamp before/after so out-of-range seeks hold the exact endpoint.
 const seconds=duration*timing.progress,focus=reducedMotion?plan.focus.to:lerp(plan.focus.from,plan.focus.to,u);
 const motion=sampleMotion(plan.cameraSpec,at,{reducedMotion});
 const lights=plan.lights.map(l=>{
  const wave=reducedMotion?0:Math.sin(seconds*2*Math.PI*plan.drift.frequencyHz+l.phase);
  const echo=l.echo;
  return {id:l.id,x:l.position.x,y:l.position.y,radius:l.radius*focus,color:[...l.color],opacity:l.opacity,
   fragments:echo?echo.fragments.map(f=>({sourceId:l.id,index:f.index,x:l.position.x+echo.offset.x+wave*plan.drift.x,y:l.position.y+echo.offset.y+f.index*echo.step+wave*plan.drift.y,width:echo.width,height:f.height,opacity:l.opacity*echo.opacity*f.strength})):[]};
 });
 const state=freeze({type:plan.type,phase:timing.phase,progress:timing.progress,motion,lights});sampled.add(state);return state;
}
export function assertLightEchoState(state){if(!sampled.has(state))throw Error('Expected sampled light echo state');}
