/** Unregistered candidate: one subject, one coverage mask, uniform front color.
 * Straight RGBA8 snapshots; encoded-byte RGB, not linear-light compositing.
 */
import {createRasterSnapshot,copyRasterPixels} from '../raster-effects.mjs';
import {object,integer} from '../validate.mjs';
function record(value,keys){
 object(value,keys,keys);
 for(const key of keys)if(!Object.hasOwn(Object.getOwnPropertyDescriptor(value,key),'value'))throw Error('Accessor fields unsupported');
}
export function sampleSingleOcclusion(input){
 record(input,['background','subject','mask','front']);
 record(input.front,['r','g','b','a']);
 const color=['r','g','b','a'].map(k=>integer(input.front[k],0,255));
 // Reuse existing branded, immutable, resource-bounded snapshot contract.
 // Raw payloads are intentionally not accepted by this candidate.
 const b=copyRasterPixels(input.background),s=copyRasterPixels(input.subject),m=copyRasterPixels(input.mask);
 const {width,height}=input.background;
 for(const value of [input.subject,input.mask])if(value.width!==width||value.height!==height)throw Error('Raster dimensions must match');
 const out=new Uint8ClampedArray(b.length);
 for(let i=0;i<out.length;i+=4){
  const f=m[i+3]/255*color[3]/255,sa=s[i+3]/255,ba=b[i+3]/255;
  const sw=sa*(1-f),bw=ba*(1-sa)*(1-f),a=f+sw+bw;
  out[i+3]=Math.round(a*255);
  if(out[i+3])for(let k=0;k<3;k++)out[i+k]=Math.round((color[k]*f+s[i+k]*sw+b[i+k]*bw)/a);
 }
 return createRasterSnapshot({width,height,pixels:out});
}
