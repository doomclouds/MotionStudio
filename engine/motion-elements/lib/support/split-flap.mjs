import {object, number, integer, id, bool, freeze} from '../validate.mjs';
const states=new WeakSet();
/** Bounded opaque-panel 2D hinge approximation; not perspective or a 3D mesh. */
export function sampleSplitFlap(input){
 object(input,['from','to','width','height','progress','reducedMotion'],['from','to','width','height','progress']);
 for(const key of Reflect.ownKeys(input))if(!('value' in Object.getOwnPropertyDescriptor(input,key)))throw Error('Accessor fields are not supported');
 const from=id(input.from),to=id(input.to),width=integer(input.width,1,4096),height=integer(input.height,2,4096),p=number(input.progress,0,1);
 if(width*height>2097152)throw Error('Split-flap viewport exceeds area budget');
 const reduced=Object.hasOwn(input,'reducedMotion')?bool(input.reducedMotion):false;
 const q=reduced?(p<.5?0:1):p;
 let layers;
 if(from===to||q===0||q===1)layers=[{id:q===1?to:from,half:'full',scaleY:1}];
 else{
  // A full opaque next backing avoids a transparent fractional hinge seam.
  layers=[{id:to,half:'full',scaleY:1},{id:from,half:'lower',scaleY:1}];
  // Exactly at the hinge no moving surface is submitted; never invert the glyph.
  if(q!==.5)layers.push({id:q<.5?from:to,half:q<.5?'upper':'lower',scaleY:Math.abs(Math.cos(Math.PI*q))});
 }
 const state=freeze({type:'candidate.split-flap-2d',width,height,progress:p,displayProgress:q,layers});states.add(state);return state;
}
/** drawPanel(ctx,id) paints the SAME local [0,w]x[0,h] opaque panel each call. */
export function drawSplitFlap(ctx,state,drawPanel){
 if(!states.has(state))throw Error('Expected genuine split-flap state');
 if(typeof drawPanel!=='function')throw Error('Expected panel drawing callback');
 for(const method of ['save','restore','beginPath','rect','clip','translate','scale'])if(typeof ctx?.[method]!=='function')throw Error('Expected Canvas-like context');
 const {width:w,height:h}=state;
 for(const layer of state.layers){
  ctx.save();try{
   // Outer clip constrains even a poorly bounded panel painter.
   ctx.beginPath();ctx.rect(0,0,w,h);ctx.clip();
   ctx.translate(0,h/2);ctx.scale(1,layer.scaleY);ctx.translate(0,-h/2);
   ctx.beginPath();ctx.rect(0,layer.half==='lower'?h/2:0,w,layer.half==='full'?h:h/2);ctx.clip();
   drawPanel(ctx,layer.id);
  }finally{ctx.restore();}
 }
}
