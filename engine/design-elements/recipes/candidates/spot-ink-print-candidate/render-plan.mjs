// Pure validated backend contract. Shader source remains in shader-sources.mjs.
import {record,dimensions,options} from './validation.mjs';
const freeze=x=>{if(x&&typeof x==='object'){for(const v of Object.values(x))freeze(v);Object.freeze(x);}return x;};
export function createSpotInkRenderPlan(input) {
 record(input,['width','height','options'],'render plan');
 const {width,height}=input;dimensions(width,height);
 const o=options(input.options,width),u={};
 const add=(name,type,value)=>u[name]={type,value};
 add('uTex','1i',[0]);add('uRes','2fv',[width,height]);
 add('uOff','2fv',o.off.flat());add('uRot','1fv',o.rot);add('uAng','1fv',o.ang);
 add('uInk','3fv',o.inks.flat().map(v=>v/255));add('uPaper','3fv',o.paper.map(v=>v/255));
 for(const name of ['seed','sheet','boil','period','grain'])add('u'+name[0].toUpperCase()+name.slice(1),'1fv',[o[name]]);
 add('uGate','1fv',o.gate);add('uSweep','1fv',o.sweep);
 return freeze({schema:'spot-ink-render-plan/1',width,height,
  shader:'spot-ink-nonreflection/1',uniforms:u,
  texture:{unit:0,format:'RGBA8',minFilter:'LINEAR',magFilter:'LINEAR',wrapS:'CLAMP_TO_EDGE',wrapT:'CLAMP_TO_EDGE',rowOrder:'top-to-bottom',flipY:false,premultiplyAlpha:false,colorSpaceConversion:'NONE',inputAlpha:'opaque-required-shader-ignores',outputAlpha:1},
  geometry:{mode:'TRIANGLES',attribute:'p',components:2,vertices:[-1,-1,3,-1,-1,3],first:0,count:3},
  target:{viewport:[0,0,width,height],blend:false,depth:false,cull:false,scissor:false,colorMask:[true,true,true,true]}
 });
}
