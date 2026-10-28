import {object} from '../lib/validate.mjs';
import {assertLinearMaskState} from '../lib/linear-mask.mjs';
/** A stays behind transparent B, including after the reveal has completed. */
export function drawLinearMask(ctx,state,callbacks,backend){
 assertLinearMaskState(state);
 object(callbacks,['outgoing','incoming'],['outgoing','incoming']);
 object(backend,['Path2D'],['Path2D']);
 if(typeof backend.Path2D!=='function')throw Error('Explicit Path2D constructor required');
 for(const fn of [callbacks.outgoing,callbacks.incoming])if(typeof fn!=='function'||fn.constructor?.name==='AsyncFunction')throw Error('Both callbacks must be synchronous');
 const viewport=new backend.Path2D();viewport.rect(0,0,state.viewport.width,state.viewport.height);
 let mask;
 if(state.revealProgress>0&&state.revealProgress<1){
  mask=new backend.Path2D();state.polygon.forEach((p,i)=>i?mask.lineTo(p.x,p.y):mask.moveTo(p.x,p.y));mask.closePath();
 }
 for(const role of ['outgoing','incoming']){
  if(role==='incoming'&&state.revealProgress===0)continue;
  ctx.save();try{
   ctx.globalCompositeOperation='source-over';ctx.clip(viewport);
   if(role==='incoming'&&mask)ctx.clip(mask);
   const result=callbacks[role](ctx);
   if(result&&typeof result.then==='function')throw Error('Callback returned thenable; synchronous drawing required');
  }finally{ctx.restore();}
 }
}
