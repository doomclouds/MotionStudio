// SPDX-License-Identifier: MIT
// Seeded drape formula adapted from formwork-driftwear, Copyright (c) 2026 bswxyz.
// Attribution and complete upstream MIT license: licenses/Upstream-MIT.txt.
import {record,number,color,def,freeze} from './input.mjs';
const owned=new WeakSet(),TAU=2*Math.PI;
function random(seed) {let a=seed;return()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
export function compileDrape(input) {
  const o=record(input,['width','height','seed','low','high','vignette'],['width','height','seed','low','high']);
  const width=number(o.width,160,1000,true),height=number(o.height,160,1200,true),seed=number(o.seed,0,4294967295,true),low=color(o.low),high=color(o.high),vignette=number(def(o.vignette,.3),0,.6);
  const r=random(seed),parameters={folds:6+Math.floor(r()*7),phase:r()*TAU,sharp:.7+r()*1.5,tilt:(r()*2-1)*.55,rippleFrequency:2+r()*3,ripplePhase:r()*TAU,bias:r()*.18};
  const m=freeze({width,height,seed,low,high,vignette,parameters,columns:Math.ceil(width/2),verticalStops:5});owned.add(m);return m;
}
export function assertModel(model) {if(!owned.has(model))throw TypeError('owned compiled drape');return model;}
function brightness(m,u,v) {
  const p=m.parameters;let b=.5+.5*Math.sin((u*p.folds+p.tilt*v+p.phase)*TAU);
  b+=.12*Math.sin((u*p.rippleFrequency+v*1.6)*TAU+p.ripplePhase);b+=p.bias*Math.sin(u*Math.PI);
  b=Math.pow(Math.max(0,Math.min(1,b)),p.sharp);return Math.max(0,Math.min(1,b*(1.05-v*.14)));
}
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
export function sampleDrape(model,u,v) {
  const m=assertModel(model);number(u,0,1);number(v,0,1);const b=brightness(m,u,v),lo=rgb(m.low),hi=rgb(m.high);
  return Object.freeze({brightness:b,rgb:Object.freeze(lo.map((n,i)=>Math.round(n+(hi[i]-n)*b)))});
}
// Internal painter: context must be the fresh owned tile context, not arbitrary caller state.
export function paintDrape(ctx,m) {
  for(let x=0;x<m.width;x+=2) {
    const g=ctx.createLinearGradient(0,0,0,m.height);
    for(let s=0;s<=4;s++)g.addColorStop(s/4,'rgb('+sampleDrape(m,x/m.width,s/4).rgb.join(',')+')');
    ctx.fillStyle=g;ctx.fillRect(x,0,Math.min(2,m.width-x),m.height);
  }
  const g=ctx.createRadialGradient(m.width/2,m.height*.4,Math.min(m.width,m.height)*.1,m.width/2,m.height*.52,Math.max(m.width,m.height)*.8);
  g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,`rgba(0,0,0,${m.vignette})`);ctx.fillStyle=g;ctx.fillRect(0,0,m.width,m.height);
}
