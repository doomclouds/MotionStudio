/** Unregistered original field study, not a physical caustic or source shader port.
 * Five bounded sinusoidal coordinate folds, with one authored radial disturbance.
 * Absolute seconds only: no simulation, frame counter, random state or clock.
 */
import {number, integer} from '../../validate.mjs';
const plans = new WeakMap();
function record(value, keys) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype) throw Error('plain data object required');
  if (Reflect.ownKeys(value).length !== keys.length) throw Error('exact fields required');
  const copy = {};
  for (const key of keys) {
    const d = Object.getOwnPropertyDescriptor(value, key);
    if (!d || !Object.hasOwn(d, 'value')) throw Error('data fields required');
    copy[key] = d.value;
  }
  return copy;
}
// All callers use strictly ascending edges; outside is clamped.
const smooth = (a,b,x) => { const q=Math.max(0,Math.min(1,(x-a)/(b-a))); return q*q*(3-2*q); };
export function compileFoldedRipple(input) {
  const p = record(input, ['scale','speed','ridgeWidth','pulse']);
  const scale=number(p.scale,.25,8), speed=number(p.speed,-2,2), ridgeWidth=number(p.ridgeWidth,.03,.5);
  let pulse=null;
  if (p.pulse !== null) {
    const r=record(p.pulse,['x','y','at','strength','decay']);
    pulse={x:number(r.x,-2,2),y:number(r.y,-2,2),at:number(r.at,0,1e4),strength:number(r.strength,0,.3),decay:number(r.decay,.1,8)};
  }
  const plan=Object.freeze({rounds:5});
  plans.set(plan,{scale,speed,ridgeWidth,pulse});
  return plan;
}
/** Pixel centers; coordinates in shorter-side units, origin center, y downward.
 * Scalar density is dimensionless [0,1], not premultiplied, no color or coverage.
 */
export function sampleFoldedRipple(plan,input) {
  const p=plans.get(plan); if (!p) throw Error('compiled folded ripple plan required');
  const s=record(input,['width','height','seconds']);
  const width=integer(s.width,1,256),height=integer(s.height,1,256),seconds=number(s.seconds,0,1e4);
  const density=new Float64Array(width*height), unit=Math.min(width,height), phase=seconds*p.speed;
  const age=p.pulse ? seconds-p.pulse.at : -1;
  for(let row=0;row<height;row++)for(let col=0;col<width;col++) {
    let x=(col+.5-width/2)/unit, y=(row+.5-height/2)/unit;
    if(age>=0 && p.pulse.strength>0) {
      const dx=x-p.pulse.x,dy=y-p.pulse.y,d=Math.hypot(dx,dy);
      // Finite center direction, smooth onset and bounded displacement. No 1/d singularity.
      const wave=p.pulse.strength*smooth(0,.12,age)*Math.exp(-age*p.pulse.decay-3*d)*Math.sin(22*d-7*age);
      const divisor=Math.sqrt(d*d+.0025);
      x+=dx/divisor*wave; y+=dy/divisor*wave;
    }
    x*=p.scale*Math.PI*2; y*=p.scale*Math.PI*2;
    let sum=0;
    for(let k=0;k<5;k++) {
      const a=.6+k*.47, c=Math.cos(a),s=Math.sin(a);
      const rx=c*x-s*y, ry=s*x+c*y;
      x=rx+.65*Math.sin(ry+phase/(k+1));
      y=ry+.65*Math.sin(rx-phase/(k+2));
      const distance=Math.abs(Math.sin(x+y*.7+k));
      sum+=1-smooth(0,p.ridgeWidth,distance);
    }
    density[row*width+col]=sum/5;
  }
  return {width,height,density};
}
