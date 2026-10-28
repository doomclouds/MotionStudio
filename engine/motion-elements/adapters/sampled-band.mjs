import {assertSampledBand} from '../lib/sampled-band.mjs';
import {object,fail} from '../lib/validate.mjs';
/** Separate Path2D preserves current path; caller owns transform, alpha and layer ordering. */
export function drawSampledBand(ctx,band,style,backend){
 assertSampledBand(band);object(style,['fill'],['fill']);
 if(typeof style.fill!=='string'||!style.fill.trim())fail('Band fill must be a nonempty Canvas color string');
 object(backend,['Path2D'],['Path2D']);
 if(typeof backend.Path2D!=='function')fail('Native or browser Path2D constructor required');
 if(band.degenerate)return;
 const path=new backend.Path2D(),[first,...rest]=band.vertices;
 path.moveTo(first.x,first.y);for(const p of rest)path.lineTo(p.x,p.y);path.closePath();
 ctx.save();try{ctx.fillStyle=style.fill;ctx.fill(path,'nonzero');}finally{ctx.restore();}
}
