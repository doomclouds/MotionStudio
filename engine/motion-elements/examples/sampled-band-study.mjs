import {compileSampledBand,drawSampledBand} from '../lib/index.mjs';
// Two neutral uses of one geometry API. No production media, clock or assets.
export function drawSampledBandStudy(ctx,{Path2D}){
 const wave=compileSampledBand({samples:Array.from({length:65},(_,i)=>({
  x:20+i*4,y:70+20*Math.sin(i/8),halfWidth:i===0||i===64?0:12*Math.sin(Math.PI*i/64)**2
 }))});
 const confidence=compileSampledBand({samples:[
  {x:20,y:180,halfWidth:8},{x:80,y:165,halfWidth:20},
  {x:160,y:190,halfWidth:30},{x:276,y:170,halfWidth:12}
 ]});
 drawSampledBand(ctx,wave,{fill:'#527d91'},{Path2D});
 drawSampledBand(ctx,confidence,{fill:'#c19766'},{Path2D});
 return {wave,confidence};
}
