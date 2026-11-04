/** Neutral synthetic compositions, no source assets/fonts/shaders. */
import {compileSphericalSplats, sampleSphericalSplats} from '../lib/foundations/field/spherical-splats.mjs';
import {freeze} from '../lib/validate.mjs';
import {createRasterSnapshot} from '../lib/internal/raster-snapshot.mjs';
const make = (x,y,z,sigma,strength) => ({direction:{x,y,z},sigma,strength});
export const sphericalSplatExamples = freeze([
  {id:'copper-cloud', size:192, duration:6, turns:1, pitch:.24, base:[10,17,25], color:[244,158,72], lobes:[make(-.8,-.3,.5,.48,1.2),make(.7,.5,.6,.3,2.6),make(.2,-.7,-.6,.52,1.8),make(-.4,.4,-.7,.24,2.5),make(.6,-.6,.2,.14,1.2)]},
  {id:'arctic-beacon', size:96, duration:6, turns:-1, pitch:-.42, base:[5,18,22], color:[97,229,209], lobes:[make(.6,-.3,.7,.12,4),make(-.7,.2,.5,.4,.7),make(.2,.8,-.5,.18,3),make(-.4,-.7,-.6,.55,1.4)]},
  {id:'soft-lilac', size:256, duration:6, turns:1, pitch:.6, base:[18,13,23], color:[202,171,223], lobes:[make(.2,-.3,.9,.8,.8),make(-.6,.7,.3,.6,.65),make(.1,.4,-.8,.7,1.2)]},
]);
const plans = sphericalSplatExamples.map(s => compileSphericalSplats({lobes:s.lobes}));
/** Time is explicitly periodic here, NOT implicitly periodic in the mechanism.
 * reducedMotion freezes the first authored phase. Palette is encoded sRGB art.
 */
export function sphericalSplatFrame(index, seconds, {reducedMotion=false}={}) {
  if (!Number.isInteger(index) || index<0 || index>=sphericalSplatExamples.length || !Number.isFinite(seconds) || Math.abs(seconds)>1e6 || typeof reducedMotion!=='boolean') throw Error('example arguments');
  const s = sphericalSplatExamples[index], time = reducedMotion ? 0 : ((seconds%s.duration)+s.duration)%s.duration;
  const field = sampleSphericalSplats(plans[index], {width:s.size,height:s.size,yaw:time/s.duration*Math.PI*2*s.turns,pitch:s.pitch});
  const pixels = new Uint8ClampedArray(s.size*s.size*4);
  for (let i=0;i<field.density.length;i++) {
    const x=((i%s.size)+.5-s.size/2)/(s.size/2), y=(Math.floor(i/s.size)+.5-s.size/2)/(s.size/2);
    const rim=Math.pow(Math.min(1,Math.hypot(x,y)),18)*.12;
    const value=Math.min(1,field.density[i]+rim);
    for(let c=0;c<3;c++)pixels[i*4+c]=s.base[c]+(s.color[c]-s.base[c])*value;
    pixels[i*4+3]=Math.round(field.coverage[i]*255);
  }
  return createRasterSnapshot({width:s.size,height:s.size,pixels});
}
