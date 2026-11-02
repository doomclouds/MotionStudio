/** Neutral material examples. Translation uses absolute seconds, not fluid advection. */
import {compileFilamentDensity,sampleFilamentDensity} from '../lib/foundations/field/filament-density.mjs';
import {createRasterSnapshot} from '../lib/raster-effects.mjs';
const settings=[
 {width:240,height:160,seed:29,scale:4,warp:1.2,ridgeWidth:.25,filamentMix:.85,base:[13,22,30],ink:[77,211,205]},
 {width:160,height:240,seed:814,scale:2.5,warp:.6,ridgeWidth:.48,filamentMix:.6,base:[27,18,29],ink:[223,176,104]},
];
const plans=settings.map(({seed,scale,warp,ridgeWidth,filamentMix})=>compileFilamentDensity({seed,scale,warp,ridgeWidth,filamentMix}));
export function filamentDensityFrame(index,seconds,{reducedMotion=false}={}) {
 if(!Number.isInteger(index)||index<0||index>=settings.length||!Number.isFinite(seconds)||seconds<0||seconds>1e4||typeof reducedMotion!=='boolean')throw Error('example arguments');
 const s=settings[index],t=reducedMotion?0:seconds;
 const f=sampleFilamentDensity(plans[index],{width:s.width,height:s.height,offsetX:Math.sin(t*.15)*.2,offsetY:Math.sin(t*.11)*.15});
 const pixels=new Uint8ClampedArray(s.width*s.height*4);
 for(let i=0;i<f.density.length;i++){const v=Math.sqrt(f.density[i]);for(let c=0;c<3;c++)pixels[i*4+c]=s.base[c]+(s.ink[c]-s.base[c])*v;pixels[i*4+3]=255;}
 return createRasterSnapshot({width:s.width,height:s.height,pixels});
}
