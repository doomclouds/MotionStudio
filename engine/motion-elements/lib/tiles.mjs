import {object,integer,number,choice,freeze} from './validate.mjs';
import {range,time,timing,progress} from './time.mjs';
import {rational,add,sub,compare} from '../../motion-timeline-core/lib/timeline.mjs';
import {seededUnit} from './math.mjs';
import {composeTransform,identity} from './matrix.mjs';
const plans=new WeakSet(),states=new WeakMap();
export function assertTileBinding(plan,state){
 if(!plans.has(plan))throw Error('Expected compiled tile plan from this module instance');
 if(state!==undefined&&states.get(state)!==plan)throw Error('Tile state is not bound to this plan');
}
export function compileTileScatter(input){
 object(input,['sourceRect','columns','rows','seed','instanceId','range','step','displacement','maxRotation'],['sourceRect','columns','rows','seed','instanceId','range','step','displacement','maxRotation']);
 object(input.sourceRect,['x','y','width','height'],['x','y','width','height']);
 const x=integer(input.sourceRect.x,0,Number.MAX_SAFE_INTEGER),y=integer(input.sourceRect.y,0,Number.MAX_SAFE_INTEGER),
 width=integer(input.sourceRect.width,1,8192),height=integer(input.sourceRect.height,1,8192);
 if(width*height>16777216||!Number.isSafeInteger(x+width)||!Number.isSafeInteger(y+height))throw Error('Source rectangle exceeds budget');
 const columns=integer(input.columns,1,width),rows=integer(input.rows,1,height),count=columns*rows;
 if(count>256)throw Error('Tile count exceeds 256');
 object(input.displacement,['x','y'],['x','y']);
 const dx=number(input.displacement.x,0,1e4),dy=number(input.displacement.y,0,1e4),rotation=number(input.maxRotation,0,Math.PI);
 // Validate seed/instance even when all movement limits are zero.
 seededUnit(input.seed,input.instanceId,'tile_dx',0);
 const r=range(input.range),step=time(input.step);
 if(compare(step,rational(0))<0)throw Error('Tile step must be nonnegative');
 const duration=sub(r.duration,rational(BigInt(step.n)*BigInt(count-1),step.d));
 if(compare(duration,rational(0))<=0)throw Error('Tile stagger leaves no active duration');
 const tiles=[];
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const i=row*columns+col,hx=Math.floor(col*width/columns),hy=Math.floor(row*height/rows),
   w=Math.floor((col+1)*width/columns)-hx,h=Math.floor((row+1)*height/rows)-hy;
  const tr=timing(add(r.start,rational(BigInt(step.n)*BigInt(i),step.d)),duration);
  tiles.push({tileId:`row:${row}/col:${col}`,sourceRect:{x:x+hx,y:y+hy,width:w,height:h},homeRect:{x:hx,y:hy,width:w,height:h},
   center:{x:hx+w/2,y:hy+h/2},range:tr,
   target:{x:(2*seededUnit(input.seed,input.instanceId,'tile_dx',i)-1)*dx,y:(2*seededUnit(input.seed,input.instanceId,'tile_dy',i)-1)*dy,rotation:(2*seededUnit(input.seed,input.instanceId,'tile_rotation',i)-1)*rotation}});
 }
 const plan=freeze({sourceRect:{x,y,width,height},columns,rows,range:r,tiles});
 plans.add(plan);return plan;
}
export function sampleTileScatter(plan,at,options){
 assertTileBinding(plan);at=time(at);object(options,['direction'],['direction']);choice(options.direction,['out','in']);
 const sampledAt=options.direction==='in'?sub(add(plan.range.start,plan.range.end),at):at;
 const tiles=plan.tiles.map(tile=>{
  const u=progress(sampledAt,tile.range).progress,q=u*u*(3-2*u);
  return {tileId:tile.tileId,sourceRect:tile.sourceRect,homeRect:tile.homeRect,
   matrix:q===0?identity():composeTransform({x:q*tile.target.x,y:q*tile.target.y,rotation:q*tile.target.rotation,pivot:tile.center}),progress:q};
 });
 const state=freeze({atHome:tiles.every(t=>t.progress===0),tiles});states.set(state,plan);return state;
}
