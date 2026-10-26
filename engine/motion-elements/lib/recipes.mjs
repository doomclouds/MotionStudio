import {object,point,number,optional,freeze,bool} from './validate.mjs';
import {range,time} from './time.mjs';
import {rational,sub,compare} from '../../motion-timeline-core/lib/timeline.mjs';
import {offsetCards} from './layouts.mjs';
import {compileStagger} from './stagger.mjs';
import {sampleMotion} from './motions.mjs';
import {multiply,matrix,identity,transformBounds} from './matrix.mjs';
/** A composition recipe, not a text-fracture or arbitrary-topology morph engine. */
export function sampleOffsetReassembly(input,at,context={}) {
  object(input,['type','version','range','curve','params'],['type','version','range','params']);
  if(input.type!=='recipe.offset-reassembly'||input.version!==1)throw Error('Unsupported recipe');
  object(context,['reducedMotion','parentMatrix']); const reducedMotion=bool(optional(context.reducedMotion,false)), parent=matrix(optional(context.parentMatrix,identity()));
  const p=input.params;object(p,['itemIds','origin','card','offset','rotationStep','zOrder','step','travel'],['itemIds','origin','card','offset','step','travel']);
  const layout=offsetCards({itemIds:p.itemIds,origin:p.origin,card:p.card,offset:p.offset,rotationStep:p.rotationStep,zOrder:p.zOrder});
  const r=range(input.range),step=time(p.step),travel=point(p.travel);
  const lastDelay=rational(BigInt(step.n)*BigInt(layout.length-1),step.d),duration=sub(r.duration,lastDelay);
  if(compare(duration,rational(0))<=0)throw Error('Stagger delay leaves no animation duration');
  const timings=compileStagger({itemIds:p.itemIds,start:r.start,duration,step});
  return freeze(layout.map((item,i)=>{
    const spec={version:1,range:timings[i].range,curve:optional(input.curve,{type:'smoothstep'})};
    const transform=sampleMotion({...spec,type:'motion.transform',params:{from:{x:travel.x,y:travel.y,scaleX:.85,scaleY:.85,rotation:0},to:{x:0,y:0,scaleX:1,scaleY:1,rotation:0},origin:{x:p.card.width/2,y:p.card.height/2}}},at,{reducedMotion});
    const opacity=sampleMotion({...spec,type:'motion.opacity',params:{from:0,to:1}},at,{reducedMotion:optional(context.reducedMotion,false)});
    const current=multiply(parent,multiply(item.matrix,transform.matrix));
    return {...item,matrix:current,geometryBounds:transformBounds(current,item.rect),opacity:opacity.opacity,phase:transform.phase};
  }));
}
