import {object,number,point,id,bool,optional,freeze} from '../validate.mjs';
import {time} from '../time.mjs';
import {rational,add,compare} from '../../../motion-timeline-core/lib/timeline.mjs';
import {offsetCards,itemIds} from '../layouts.mjs';
import {compileStagger} from '../stagger.mjs';
import {sampleMotion} from '../motions.mjs';
import {multiply,matrix,identity,transformBounds} from '../matrix.mjs';
const compiled=new WeakSet(),R=(n,d=100)=>rational(n,d),rect={x:0,y:0,width:640,height:360},origin={x:320,y:180};
export function compileFocusHandoff(input){
 object(input,['type','version','cardIds','selectedId','detailId','nextId','start','travel','rotationStep','focusScale'],['type','version','cardIds','selectedId','detailId','nextId','start','travel','rotationStep','focusScale']);
 if(input.type!=='recipe.focus-handoff'||input.version!==1)throw Error('Unsupported focus handoff recipe');
 const ids=itemIds(input.cardIds);if(ids.length!==3)throw Error('Focus handoff requires exactly three cards');
 const selectedId=id(input.selectedId),detailId=id(input.detailId),nextId=id(input.nextId);
 if(!ids.includes(selectedId))throw Error('Selected card must exist');
 if(new Set([...ids,detailId,nextId]).size!==5)throw Error('Content binding IDs must be distinct');
 const start=time(input.start);if(compare(start,R(0))<0||compare(add(start,R(700)),rational(86400))>0)throw Error('Recipe range must fit 0..24h');
 const travel=point(input.travel);number(travel.x,-100,100);number(travel.y,-100,100);
 const rotationStep=number(input.rotationStep,-.04,.04),focusScale=number(input.focusScale,1.3,1.6);
 const cues=Object.fromEntries(Object.entries({start:0,enterEnd:70,focusStart:150,focusMid:192.5,focusEnd:235,handoffStart:365,handoffMid:400,handoffEnd:435,end:700}).map(([k,v])=>[k,add(start,rational(Math.round(v*10),1000))]));
 const layout=offsetCards({itemIds:ids,origin:{x:128,y:200},card:{width:640,height:360},offset:{x:512,y:150},rotationStep});
 const entrance=compileStagger({itemIds:ids,start,duration:R(50),step:R(10)});
 const layers=layout.map((item,i)=>({...item,zIndex:item.itemId===selectedId?3:i,pose:{x:128+512*i,y:200+150*i,scaleX:1,scaleY:1,rotation:i*rotationStep},entryRange:entrance[i].range}));
 const plan=freeze({type:input.type,version:1,selectedId,detailId,nextId,travel,focusScale,cues,layers});compiled.add(plan);return plan;
}
export function sampleFocusHandoff(plan,at,options={}){
 if(!compiled.has(plan))throw Error('Expected compiled focus handoff plan');
 at=time(at);object(options,['reducedMotion','parentMatrix']);const reduced=bool(optional(options.reducedMotion,false)),parent=matrix(optional(options.parentMatrix,identity()));
 if(parent[1]!==0||parent[2]!==0||parent[0]<=0||parent[0]!==parent[3])throw Error('Recipe parent requires positive uniform scale and translation');
 const c=plan.cues,before=t=>compare(at,t)<0;
 const phase=before(c.start)?'before':before(c.enterEnd)?'enter':before(c.focusStart)?'choices':before(c.focusEnd)?'focus':before(c.handoffStart)?'detail':before(c.handoffEnd)?'handoff':before(c.end)?'next':'after';
 const spec=(type,range,params)=>({type,version:1,range,curve:{type:'smoothstep'},params});
 const scalar=(start,end)=>sampleMotion(spec('motion.opacity',{start,end},{from:0,to:1}),at).opacity;
 const detailReveal=reduced?(before(c.focusMid)?0:1):scalar(c.focusStart,c.focusEnd),nextReveal=reduced?(before(c.handoffMid)?0:1):scalar(c.handoffStart,c.handoffEnd);
 const layers=plan.layers.map((layer,i)=>{
  const selected=layer.itemId===plan.selectedId,base=layer.pose,focus={x:640,y:320,scaleX:plan.focusScale,scaleY:plan.focusScale,rotation:0};
  const exit={...base,x:base.x+(i===0?-90:90),y:base.y+25};
  let poseState,opacity;
  if(before(c.focusStart)){
   poseState=sampleMotion(spec('motion.transform',layer.entryRange,{from:{...base,x:base.x+plan.travel.x,y:base.y+plan.travel.y},to:base,origin}),at,{reducedMotion:reduced});
   opacity=reduced?1:sampleMotion(spec('motion.opacity',layer.entryRange,{from:0,to:1}),at).opacity;
  }else{
   const end=selected?focus:exit,track={start:c.focusStart,end:c.focusEnd};
   const sampled=reduced?(before(c.focusMid)?c.focusStart:c.focusEnd):at;
   poseState=sampleMotion(spec('motion.transform',track,{from:base,to:end,origin}),sampled);
   opacity=selected?1:reduced?(before(c.focusMid)?1:0):1-scalar(c.focusStart,c.focusEnd);
  }
  const current=multiply(parent,poseState.matrix);
  return {itemId:layer.itemId,zIndex:layer.zIndex,matrix:current,opacity,rect:{...rect},geometryBounds:transformBounds(current,rect),
   content:{baseId:layer.itemId,detailId:selected?plan.detailId:null,detailReveal:selected?detailReveal:0,nextId:selected?plan.nextId:null,nextReveal:selected?nextReveal:0,drawPrevious:!selected||nextReveal<1}};
 });
 return freeze({phase,cueTimes:c,selectedId:plan.selectedId,designSize:{width:1920,height:1080},layers});
}
