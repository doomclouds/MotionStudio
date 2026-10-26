import {object,id,number,choice,optional,bool,freeze} from '../validate.mjs';
import {time} from '../time.mjs';
import {rational,add,sub,compare} from '../../../motion-timeline-core/lib/timeline.mjs';
import {compileTileScatter,sampleTileScatter} from '../tiles.mjs';
import {sampleMotion} from '../motions.mjs';
import {matrix,identity,multiply,transformBounds} from '../matrix.mjs';
const plans=new WeakSet(),R=n=>rational(n,100);
export function compileTileSignature(input){
 object(input,['type','version','sourceId','signatureId','sourceRect','grid','seed','instanceId','start','displacement','maxRotation'],['type','version','sourceId','signatureId','sourceRect','grid','seed','instanceId','start','displacement','maxRotation']);
 if(input.type!=='recipe.tile-signature'||input.version!==1)throw Error('Unsupported tile signature recipe');
 const sourceId=id(input.sourceId),signatureId=id(input.signatureId);if(sourceId===signatureId)throw Error('Distinct content IDs required');
 const start=time(input.start);if(compare(start,R(0))<0||compare(add(start,R(800)),rational(86400))>0)throw Error('Recipe range must fit 0..24h');
 choice(input.grid,['5x3','8x5']);
 object(input.displacement,['x','y'],['x','y']);object(input.sourceRect,['x','y','width','height'],['x','y','width','height']);
 const width=number(input.sourceRect.width,1,8192),height=number(input.sourceRect.height,1,8192);
 if(width/height<1.5||width/height>2)throw Error('Source aspect ratio must be 1.5..2 for the fixed recipe design');
 number(input.displacement.x,0,width*.2);number(input.displacement.y,0,height*.25);number(input.maxRotation,0,.35);
 const cues=Object.fromEntries(Object.entries({start:0,scatterStart:100,scatterEnd:220,returnStart:255,returnEnd:375,settleStart:455,settleEnd:515,signatureStart:505,signatureMid:535,signatureEnd:565,end:800}).map(([k,v])=>[k,add(start,R(v))]));
 const tilePlan=compileTileScatter({sourceRect:input.sourceRect,columns:input.grid==='5x3'?5:8,rows:input.grid==='5x3'?3:5,seed:input.seed,instanceId:input.instanceId,range:{start:cues.scatterStart,end:cues.scatterEnd},step:rational(1,100),displacement:input.displacement,maxRotation:input.maxRotation});
 const scale=900/width,cx=width/2,cy=height/2;
 // Conservative per-tile swept circle and translation bound: no arbitrary sample-grid proof.
 for(const tile of tilePlan.tiles){
  const radius=Math.hypot(tile.homeRect.width,tile.homeRect.height)/2*scale;
  const x=960+(tile.center.x-cx)*scale,y=480+(tile.center.y-cy)*scale;
  if(x-Math.abs(tile.target.x)*scale-radius<24||x+Math.abs(tile.target.x)*scale+radius>1896||y-Math.abs(tile.target.y)*scale-radius<24||y+Math.abs(tile.target.y)*scale+radius>900)throw Error('Scatter exceeds conservative design safe area; reduce displacement or change grid');
 }
 const plan=freeze({type:input.type,version:1,sourceId,signatureId,cues,tilePlan,sourceSize:{width,height}});plans.add(plan);return plan;
}
export function sampleTileSignature(plan,at,options={}){
 if(!plans.has(plan))throw Error('Expected compiled tile signature plan');
 at=time(at);object(options,['reducedMotion','parentMatrix']);
 const reduced=bool(optional(options.reducedMotion,false)),parent=matrix(optional(options.parentMatrix,identity()));
 if(parent[1]!==0||parent[2]!==0||parent[0]<=0||parent[0]!==parent[3])throw Error('Recipe parent requires positive uniform scale and translation');
 const c=plan.cues,before=t=>compare(at,t)<0;
 const phase=before(c.start)?'before':before(c.scatterStart)?'recognize':before(c.scatterEnd)?'scatter':before(c.returnStart)?'dispersed-hold':before(c.returnEnd)?'return':before(c.settleStart)?'home-hold':before(c.settleEnd)?'settle':before(c.signatureEnd)?'signature':'final';
 let sampledAt,direction;
 if(reduced){sampledAt=c.scatterStart;direction='out';}
 else if(before(c.returnStart)){sampledAt=before(c.scatterEnd)?at:c.scatterEnd;direction='out';}
 else if(before(c.returnEnd)){sampledAt=add(c.scatterStart,sub(at,c.returnStart));direction='in';}
 else{sampledAt=c.scatterStart;direction='out';}
 const tileState=sampleTileScatter(plan.tilePlan,sampledAt,{direction});
 const {width,height}=plan.sourceSize,origin={x:width/2,y:height/2};
 const sourceMotion=sampleMotion({type:'motion.transform',version:1,range:{start:c.settleStart,end:c.settleEnd},curve:{type:'smoothstep'},params:{
  from:{x:960-origin.x,y:480-origin.y,scaleX:900/width,scaleY:900/width,rotation:0},
  to:{x:960-origin.x,y:420-origin.y,scaleX:720/width,scaleY:720/width,rotation:0},origin
 }},at);
 const current=multiply(parent,sourceMotion.matrix);
 const reveal=reduced?(before(c.signatureMid)?0:1):sampleMotion({type:'motion.opacity',version:1,range:{start:c.signatureStart,end:c.signatureEnd},curve:{type:'smoothstep'},params:{from:0,to:1}},at).opacity;
 const signatureMatrix=multiply(parent,[1,0,0,1,560,710]),signatureBounds={x:0,y:0,width:800,height:110};
 return freeze({phase,cueTimes:c,reducedMode:reduced?'static-source-no-fragment-narrative':null,
 source:{bindingId:plan.sourceId,matrix:current,tilePlan:plan.tilePlan,tileState,geometryBounds:transformBounds(current,{x:0,y:0,width,height})},
 signature:{bindingId:plan.signatureId,matrix:signatureMatrix,bounds:signatureBounds,reveal,geometryBounds:transformBounds(signatureMatrix,signatureBounds)}});
}
