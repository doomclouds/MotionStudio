/** Unregistered seeded 2D material study. No physical flow, clock, color or mask. */
import {integer,number} from '../../validate.mjs';
const plans=new WeakMap();
function record(value,keys) {
  if(!value||Object.getPrototypeOf(value)!==Object.prototype||Reflect.ownKeys(value).length!==keys.length)throw Error('exact plain data record required');
  const copy={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d||!Object.hasOwn(d,'value'))throw Error('data field required');copy[key]=d.value;}return copy;
}
const fade=x=>x*x*x*(x*(x*6-15)+10);
const mix=(a,b,t)=>a+(b-a)*t;
function hash(x,y,seed) {
  let v=(Math.imul(x,0x45d9f3b)^Math.imul(y,0x27d4eb2d)^seed)>>>0;
  v=Math.imul(v^(v>>>16),0x7feb352d);v=Math.imul(v^(v>>>15),0x846ca68b);
  return ((v^(v>>>16))>>>0)/4294967295;
}
function noise(x,y,seed) {
  const ix=Math.floor(x),iy=Math.floor(y),u=fade(x-ix),v=fade(y-iy);
  return mix(mix(hash(ix,iy,seed),hash(ix+1,iy,seed),u),mix(hash(ix,iy+1,seed),hash(ix+1,iy+1,seed),u),v);
}
export function compileFilamentDensity(input) {
  const a=record(input,['seed','scale','warp','ridgeWidth','filamentMix']);
  const p={seed:integer(a.seed,0,0xffffffff),scale:number(a.scale,.25,12),warp:number(a.warp,0,2),ridgeWidth:number(a.ridgeWidth,.04,.8),filamentMix:number(a.filamentMix,0,1)};
  const plan=Object.freeze({octaves:5});plans.set(plan,p);return plan;
}
/** Pixel centers, centered coordinates in shorter-side units. Offsets translate
 * the sampled material, NOT simulation time. Output owns its Float64Array. */
export function sampleFilamentDensity(plan,input) {
  const p=plans.get(plan);if(!p)throw Error('compiled filament density plan required');
  const a=record(input,['width','height','offsetX','offsetY']);
  const width=integer(a.width,1,256),height=integer(a.height,1,256),ox=number(a.offsetX,-100,100),oy=number(a.offsetY,-100,100);
  const unit=Math.min(width,height),density=new Float64Array(width*height);
  for(let row=0;row<height;row++)for(let col=0;col<width;col++) {
    const x=((col+.5-width/2)/unit+ox)*p.scale,y=((row+.5-height/2)/unit+oy)*p.scale;
    let base=0,weight=1,total=0,f=1;
    for(let k=0;k<5;k++){base+=weight*noise(x*f,y*f,(p.seed+k*977)>>>0);total+=weight;weight*=.5;f*=2;}
    base/=total;
    const wx=(noise(x*.7,y*.7,p.seed^0x51ed270b)*2-1)*p.warp;
    const wy=(noise(x*.7,y*.7,p.seed^0x68bc21eb)*2-1)*p.warp;
    const rx=(x*.8-y*.6)*2+wx,ry=(x*.6+y*.8)*2+wy;
    const ridgeNoise=.75*noise(rx,ry,p.seed^0x02e5be93)+.25*noise(ry*2,-rx*2,p.seed^0x736c921d);
    const distance=Math.abs(ridgeNoise*2-1);
    const q=Math.min(1,distance/p.ridgeWidth),filament=1-q*q*(3-2*q);
    density[row*width+col]=base*base*mix(1,filament,p.filamentMix);
  }
  return {width,height,density};
}
