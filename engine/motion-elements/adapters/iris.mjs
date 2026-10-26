import {object,number,choice} from '../lib/validate.mjs';
function validate(state){
 object(state,['type','phase','progress','revealProgress','composition','viewport','center','radius','maxRadius','layers'],['type','phase','progress','revealProgress','composition','viewport','center','radius','maxRadius','layers']);
 if(state.type!=='transition.iris-reveal'||state.composition!=='over-reveal')throw Error('Expected iris over-reveal state');
 choice(state.phase,['before','active','after']);number(state.progress,0,1);number(state.revealProgress,0,1);
 object(state.viewport,['x','y','width','height'],['x','y','width','height']);
 const v=state.viewport,w=number(v.width,1,8192),h=number(v.height,1,8192);if(v.x!==0||v.y!==0||w*h>16777216)throw Error('Invalid iris viewport');
 object(state.center,['x','y'],['x','y']);const {x,y}=state.center;number(x,0,w);number(y,0,h);
 const max=Math.max(...[[0,0],[w,0],[0,h],[w,h]].map(([cx,cy])=>Math.hypot(cx-x,cy-y)));
 if(state.maxRadius!==max||state.radius!==max*state.revealProgress)throw Error('Inconsistent iris radius');
 if(!Array.isArray(state.layers)||state.layers.length!==2)throw Error('Iris requires two layers');
 state.layers.forEach((layer,i)=>{
  object(layer,['role','matrix','opacity','clip'],['role','matrix','opacity','clip']);
  if(layer.role!==(i?'incoming':'outgoing')||layer.opacity!==(i&&state.revealProgress===0?0:1)||!Array.isArray(layer.matrix)||layer.matrix.length!==6||layer.matrix.some((v,j)=>v!==[1,0,0,1,0,0][j]))throw Error('Invalid iris layer state');
  object(layer.clip,['x','y','width','height'],['x','y','width','height']);if(Object.keys(v).some(k=>layer.clip[k]!==v[k]))throw Error('Iris layer viewport mismatch');
 });
}
export function drawIris(ctx,state,callbacks,backend){
 validate(state);object(callbacks,['outgoing','incoming'],['outgoing','incoming']);object(backend,['Path2D'],['Path2D']);
 if(typeof backend.Path2D!=='function')throw Error('Iris requires explicit Path2D constructor');
 for(const fn of [callbacks.outgoing,callbacks.incoming])if(typeof fn!=='function'||fn.constructor?.name==='AsyncFunction')throw Error('Both iris callbacks must be synchronous');
 const v=state.viewport,viewport=new backend.Path2D();viewport.rect(0,0,v.width,v.height);
 let circle;
 if(state.revealProgress>0&&state.revealProgress<1){circle=new backend.Path2D();circle.moveTo(state.center.x+state.radius,state.center.y);circle.arc(state.center.x,state.center.y,state.radius,0,2*Math.PI);}
 for(const layer of state.layers){
  if(layer.opacity===0)continue;
  ctx.save();try{
   ctx.globalCompositeOperation='source-over';ctx.clip(viewport);if(layer.role==='incoming'&&circle)ctx.clip(circle);
   const result=callbacks[layer.role](ctx);
   if(result&&typeof result.then==='function')throw Error('Iris callback returned a promise; synchronous drawing required');
  }finally{ctx.restore();}
 }
}
