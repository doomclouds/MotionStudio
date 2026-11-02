'use strict';
// Scalar bicubic and dot math adapted from OpenDesign webgl-halftone-drift (declared MIT).
// No reference/calibrated field data is contained in this module. See CREDITS.md.
const clamp=x=>Math.min(1,Math.max(0,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const fract=x=>x-Math.floor(x);
const hash=(x,y)=>fract(Math.sin(x*41.3+y*289.1)*43758.5453);
const cubic=(a,b,c,d,t)=>b+.5*t*(c-a+t*(2*a-5*b+4*c-d+t*(3*(b-c)+d-a)));
function meshValue(f,x,y){let xx=x*(f.cols-1),yy=y*(f.rows-1),ix=Math.floor(xx),iy=Math.floor(yy),tx=xx-ix,ty=yy-iy;const at=(x,y)=>f.values[Math.max(0,Math.min(f.rows-1,y))*f.cols+Math.max(0,Math.min(f.cols-1,x))];let r=[];for(let j=-1;j<=2;j++)r.push(cubic(at(ix-1,iy+j),at(ix,iy+j),at(ix+1,iy+j),at(ix+2,iy+j),tx));return clamp(cubic(...r,ty));}

module.exports={clamp,smooth,fract,hash,meshValue};
