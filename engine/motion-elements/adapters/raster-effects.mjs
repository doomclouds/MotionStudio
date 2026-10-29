import {object,number,bool,fail} from '../lib/validate.mjs';
import {createRasterSnapshot,copyRasterPixels} from '../lib/raster-effects.mjs';
/** Explicit synchronous backend; scratch stays isolated and caller path is untouched. */
export function drawRasterSnapshot(ctx,input,placement,backend){
 const raster=createRasterSnapshot(input);
 object(placement,['x','y','width','height','smoothing'],['x','y','width','height','smoothing']);
 const x=number(placement.x,-1e6,1e6),y=number(placement.y,-1e6,1e6),width=number(placement.width,.001,1e6),height=number(placement.height,.001,1e6),smoothing=bool(placement.smoothing);
 object(backend,['createCanvas'],['createCanvas']);
 if(typeof backend.createCanvas!=='function'||backend.createCanvas.constructor.name==='AsyncFunction')fail('Synchronous canvas factory required');
 const canvas=backend.createCanvas(raster.width,raster.height);
 if(!canvas||typeof canvas.then==='function'||typeof canvas.getContext!=='function'||canvas===ctx.canvas)fail('Factory must return a separate canvas');
 if(canvas.width!==raster.width||canvas.height!==raster.height)fail('Scratch canvas dimensions mismatch');
 const scratch=canvas.getContext('2d');if(!scratch||scratch===ctx)fail('Separate scratch context required');
 const image=scratch.createImageData(raster.width,raster.height);image.data.set(copyRasterPixels(raster));scratch.putImageData(image,0,0);
 ctx.save();
 try{ctx.imageSmoothingEnabled=smoothing;ctx.drawImage(canvas,x,y,width,height);}finally{ctx.restore();}
}
