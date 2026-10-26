import {object,number} from '../lib/validate.mjs';
import {matrix} from '../lib/matrix.mjs';
/** Synchronous callback; an async renderer is rejected to prevent late context mutations. */
export function withMotion(ctx,state,draw) {
  object(state,['matrix','opacity','phase','progress'],['matrix','opacity']);
  const m=matrix(state.matrix),opacity=number(state.opacity,0,1);
  if(typeof draw!=='function'||draw.constructor?.name==='AsyncFunction')throw Error('Draw must be synchronous');
  ctx.save();try{ctx.transform(...m);ctx.globalAlpha*=opacity;const result=draw(ctx);if(result&&typeof result.then==='function')throw Error('Draw returned a promise; asynchronous drawing is unsupported');}finally{ctx.restore();}
}
export function drawTransition(ctx,state,{outgoing,incoming}) {
  if(typeof outgoing!=='function'||typeof incoming!=='function')throw Error('Both scene callbacks required');
  object(state,['type','phase','progress','viewport','layers'],['type','viewport','layers']);
  if(!['transition.push','transition.rect-wipe'].includes(state.type))throw Error('Unknown transition state type');
  if(state.type==='transition.push'){
    const t=ctx.getTransform();
    if(t.b!==0||t.c!==0||![t.a,t.d,t.e,t.f].every(Number.isSafeInteger)||t.a===0||t.d===0)throw Error('Push drawing requires integer axis-aligned Canvas transform');
  }
  const v=state.viewport;
  for(const layer of state.layers){
    if(layer.opacity===0||layer.clip.width===0||layer.clip.height===0)continue;
    ctx.save();try{
      ctx.beginPath();ctx.rect(v.x,v.y,v.width,v.height);ctx.clip();
      // Clip is in viewport coordinates, before the layer transform.
      ctx.beginPath();ctx.rect(layer.clip.x,layer.clip.y,layer.clip.width,layer.clip.height);ctx.clip();
      withMotion(ctx,{matrix:layer.matrix,opacity:layer.opacity},layer.role==='outgoing'?outgoing:incoming);
    }finally{ctx.restore();}
  }
}
