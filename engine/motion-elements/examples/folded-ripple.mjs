/** Two neutral synthetic field studies; no source imagery or shader. */
import {compileFoldedRipple,sampleFoldedRipple} from '../lib/foundations/field/folded-ripple.mjs';
import {createRasterSnapshot} from '../lib/internal/raster-snapshot.mjs';
const settings=[
  {width:240,height:160,scale:1.1,speed:.4,ridgeWidth:.16,pulse:{x:.1,y:-.1,at:1,strength:.22,decay:1.5},base:[16,18,27],ink:[236,183,110]},
  {width:144,height:216,scale:2.6,speed:-.3,ridgeWidth:.3,pulse:{x:-.2,y:.2,at:.5,strength:.12,decay:.8},base:[18,26,31],ink:[118,218,209]},
];
const plans=settings.map(({scale,speed,ridgeWidth,pulse})=>compileFoldedRipple({scale,speed,ridgeWidth,pulse}));
export function foldedRippleFrame(index,seconds,{reducedMotion=false}={}) {
  if(!Number.isInteger(index)||index<0||index>=settings.length||typeof reducedMotion!=='boolean'||!Number.isFinite(seconds)||seconds<0||seconds>1e4)throw Error('example arguments');
  const s=settings[index], field=sampleFoldedRipple(plans[index],{width:s.width,height:s.height,seconds:reducedMotion?0:seconds});
  const pixels=new Uint8ClampedArray(s.width*s.height*4);
  for(let i=0;i<field.density.length;i++) {
    const v=Math.sqrt(field.density[i]);
    for(let c=0;c<3;c++)pixels[i*4+c]=s.base[c]+(s.ink[c]-s.base[c])*v;
    pixels[i*4+3]=255;
  }
  return createRasterSnapshot({width:s.width,height:s.height,pixels});
}
