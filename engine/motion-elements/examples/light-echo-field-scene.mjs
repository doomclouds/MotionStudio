import {compileLightEchoField,sampleLightEchoField,drawLightEchoField,rational as T,framesToTime} from '../lib/index.mjs';
export const config={width:960,height:540,fps:30,duration:7};
export const dependencies=[];
const pose=x=>({x,y:0,scaleX:1,scaleY:1,rotation:0});
// Synthetic authored layout, no source-film assets or project-specific light positions.
export const example={type:'recipe.light-echo-field',version:1,range:{start:T(0),end:T(7)},seed:'echo-study-v1',camera:{from:pose(0),to:pose(28),origin:{x:480,y:270}},focus:{from:1,to:1.6},drift:{x:5,y:12,frequencyHz:.12},lights:[
 {id:'amber',position:{x:210,y:140},radius:23,color:[255,155,65],opacity:.8,echo:{offset:{x:-30,y:140},width:18,step:28,count:8,heightMin:10,heightMax:25,opacity:.35}},
 {id:'red',position:{x:500,y:190},radius:29,color:[235,48,62],opacity:.85,echo:{offset:{x:-40,y:100},width:22,step:25,count:8,heightMin:8,heightMax:27,opacity:.4}},
 {id:'mint',position:{x:730,y:110},radius:15,color:[90,215,180],opacity:.6,echo:{offset:{x:-22,y:190},width:12,step:30,count:6,heightMin:12,heightMax:22,opacity:.3}}
]};
export async function createScene({ctx},{reducedMotion=false}={}){
 const plan=compileLightEchoField(example);
 return {renderFrame(frame){ctx.fillStyle='#161419';ctx.fillRect(0,0,config.width,config.height);drawLightEchoField(ctx,sampleLightEchoField(plan,framesToTime(frame,{n:30,d:1}),{reducedMotion}));}};
}
