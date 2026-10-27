import {object} from '../lib/validate.mjs';
import {assertSliceState} from '../lib/slice-displacement.mjs';
/** Parent transform is already on ctx. Callbacks must balance their own save/restore. */
export function withSliceDisplacement(ctx,state,draw,backend){
 assertSliceState(state);object(backend,['Path2D'],['Path2D']);
 if(typeof backend.Path2D!=='function')throw Error('Path2D constructor required');
 if(typeof draw!=='function'||draw.constructor?.name==='AsyncFunction')throw Error('Draw must be synchronous');
 const path=new backend.Path2D();if(typeof path.rect!=='function')throw Error('Path2D rect required');
 const invoke=()=>{const result=draw(ctx);if(result&&typeof result.then==='function')throw Error('Asynchronous drawing unsupported');};
 // At identity render once, without clipping or subdividing: exact baseline raster.
 if(state.atHome){ctx.save();try{invoke();}finally{ctx.restore();}return;}
 for(const band of state.bands){
  const clip=new backend.Path2D();clip.rect(0,band.y,state.width,band.height);
  ctx.save();try{ctx.clip(clip);ctx.translate(band.offset,0);invoke();}finally{ctx.restore();}
 }
}
