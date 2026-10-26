import {assertTileBinding} from '../lib/tiles.mjs';
const sources=new WeakMap();
/** The caller owns the source raster's immutable pixels and parent transform. */
export function drawTileScatter(ctx,source,plan,state){
 assertTileBinding(plan,state);
 if(!source||!Number.isSafeInteger(source.width)||!Number.isSafeInteger(source.height)||source.width<=0||source.height<=0)throw Error('Raster source with integer dimensions required');
 const r=plan.sourceRect;
 if(r.x+r.width>source.width||r.y+r.height>source.height)throw Error('Source crop exceeds raster dimensions');
 if(sources.has(plan)&&sources.get(plan)!==source)throw Error('Tile plan must retain the same source snapshot identity');
 sources.set(plan,source);
 if(state.atHome){
  ctx.save();try{ctx.drawImage(source,r.x,r.y,r.width,r.height,0,0,r.width,r.height);}finally{ctx.restore();}
  return;
 }
 for(const tile of state.tiles){
  const s=tile.sourceRect,h=tile.homeRect;
  ctx.save();try{ctx.transform(...tile.matrix);ctx.drawImage(source,s.x,s.y,s.width,s.height,h.x,h.y,h.width,h.height);}finally{ctx.restore();}
 }
}
