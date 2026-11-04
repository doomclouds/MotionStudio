/** Original synthetic usage fixture. Not a new registered recipe or live UI. */
import {compileStagedLayoutHandoff, sampleStagedLayoutHandoff} from '../lib/recipes/staged-layout-handoff/index.mjs';
import {sampleMotion} from '../lib/internal/element-dispatch.mjs';
import {rational as T} from '../lib/time.mjs';

// Deliberately different content, dimensions, positions and authored timing.
export const actionStatusExamples = Object.freeze([
 {name:'export',width:960,height:540,label:'Preparing export',color:'#7153ad',
  boxes:[[760,350,48,48],[460,250,28,28],[290,250,360,28]],
  times:[1,2,3],fade:[1,2],labelFade:[2.7,3.2],busyAt:0.8},
 {name:'sync',width:640,height:480,label:'Checking updates',color:'#257961',
  boxes:[[470,310,40,40],[306,220,24,24],[180,220,280,24]],
  times:[0.5,1.5,2.5],fade:[0.5,1.5],labelFade:[2.3,2.8],busyAt:0.3},
]);
const time = seconds => T(Math.round(seconds*1000),1000);
const item = ([x,y,width,height]) => ({itemId:'action',rect:{x:0,y:0,width,height},
 matrix:[1,0,0,1,x,y],zIndex:0,geometryBounds:{x,y,width,height}});
export function createActionStatusExample(config) {
 const plan=compileStagedLayoutHandoff({snapshots:config.boxes.map(box=>[item(box)]),
  ranges:config.times.slice(1).map((end,i)=>({start:time(config.times[i]),end:time(end)}))});
 const opacity=(at,range,from,to)=>sampleMotion({type:'motion.opacity',version:1,
  range:{start:time(range[0]),end:time(range[1])},curve:{type:'smoothstep'},params:{from,to}},at).opacity;
 return {config,plan,sample(seconds,{reducedMotion=false}={}) {
  const at=time(seconds),state=sampleStagedLayoutHandoff(plan,at,{reducedMotion});
  const container=state.items[0];
  // Visual content is caller-owned. Reduced geometry does not fast-forward status.
  return {container,radius:Math.min(container.rect.width,container.rect.height)/2,
   shellOpacity:opacity(at,config.fade,1,0),
   labelOpacity:opacity(at,config.labelFade,0,1),
   iconOpacity:opacity(at,config.labelFade,1,0),
   icon:seconds<config.busyAt?'submit':'busy',label:config.label};
 }};
}

/** Canvas usage only: no typography claims; explicitly measures the caller font. */
export function drawActionStatusExample(ctx,example,seconds,context={}) {
 const {config}=example,s=example.sample(seconds,context),b=s.container.geometryBounds;
 ctx.save();ctx.fillStyle='#fafafa';ctx.fillRect(0,0,config.width,config.height);
 ctx.globalAlpha=s.shellOpacity;ctx.fillStyle='#e5e5e5';
 ctx.fillRect(config.width*.15,config.height*.25,config.width*.7,config.height*.5);
 ctx.globalAlpha=1;ctx.fillStyle=config.color;ctx.beginPath();
 ctx.roundRect(b.x,b.y,b.width,b.height,s.radius);ctx.fill();
 ctx.globalAlpha=s.iconOpacity;ctx.fillStyle='white';
 if(s.icon==='busy')ctx.fillRect(b.x+b.width/2-4,b.y+b.height/2-4,8,8);
 else {ctx.beginPath();ctx.moveTo(b.x+b.width/2,b.y+b.height/2-7);
  ctx.lineTo(b.x+b.width/2-6,b.y+b.height/2+5);ctx.lineTo(b.x+b.width/2+6,b.y+b.height/2+5);ctx.closePath();ctx.fill();}
 if(s.labelOpacity>0){ctx.font='14px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  if(ctx.measureText(s.label).width>b.width-24){ctx.restore();throw new RangeError('Label does not fit caller container');}
  ctx.globalAlpha=s.labelOpacity;ctx.fillText(s.label,b.x+b.width/2,b.y+b.height/2);}
 ctx.restore();return s;
}
