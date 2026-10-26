import {object,number,freeze} from './validate.mjs';
/** Finite artistic residual, not a physical spring or bounded progress curve. */
export function sampleFiniteSettle(u,options){
 number(u,0,1);object(options,['amplitude','oscillations','decay'],['amplitude','oscillations','decay']);
 const a=number(options.amplitude,-1,1),w=2*Math.PI*number(options.oscillations,1,4),d=number(options.decay,0,8);
 if(u===0||u===1)return freeze({residual:0,derivative:0});
 const sin=Math.sin(Math.PI*u),exp=Math.exp(-d*u),envelope=sin*sin*exp;
 const slope=exp*(Math.PI*Math.sin(2*Math.PI*u)-d*sin*sin);
 return freeze({residual:a*envelope*Math.sin(w*u),derivative:a*(slope*Math.sin(w*u)+envelope*w*Math.cos(w*u))});
}
