// SPDX-License-Identifier: MIT
import {solveSpotlight,coverageAt,drawBeam,drawReceiverMask} from '../index.mjs';
export const config={width:640,height:360,fps:30,duration:4};
export const dependencies=['../index.mjs','../spotlight-field.mjs','../canvas-adapter.mjs'];

// Original synthetic orbit diagram; illustrative geometry, not astronomical data.
export function sampleLighting(t){
 return solveSpotlight({mount:{x:320,y:35},target:{x:320+150*Math.cos(t*Math.PI/2),y:225+30*Math.sin(t*Math.PI/2)},emitterOffset:28,halfAngle:.26,feather:.45,intensity:.85,receiver:{aspect:1.5,rotation:-.25,projectionScale:1.5}});
}
export function createScene({ctx:c,createCanvas}){
 const mask=createCanvas(640,360),layer=createCanvas(640,360),beam=createCanvas(1,1);
 function orbits(q,lit){q.lineWidth=2;q.strokeStyle=lit?'#7ebae7':'#213442';
  for(let i=0;i<4;i++){q.beginPath();q.ellipse(320,225,70+i*48,25+i*17,-.25,0,Math.PI*2);q.stroke();const a=i*1.9,x=320+(70+i*48)*Math.cos(a),y=225+(25+i*17)*Math.sin(a);q.fillStyle=lit?['#e8a4c0','#e1cb91','#93c3e3','#b1d5a8'][i]:'#2d414b';q.beginPath();q.arc(x,y,8+i*2,0,Math.PI*2);q.fill()}
  q.fillStyle=lit?'#e4dcc3':'#38454c';q.beginPath();q.arc(320,225,16,0,Math.PI*2);q.fill();
 }
 return {render(t){
  const s=sampleLighting(t);c.fillStyle='#101321';c.fillRect(0,0,640,360);
  // Same uniform camera on every consumer, including the physical lamp.
  c.save();c.translate(320,180);c.scale(1+t*.025,1+t*.025);c.translate(-320-t*3,-180);orbits(c,false);
  const q=layer.getContext('2d'),m=mask.getContext('2d');q.clearRect(0,0,640,360);orbits(q,true);m.clearRect(0,0,640,360);drawReceiverMask(m,s);q.globalCompositeOperation='destination-in';q.drawImage(mask,0,0);q.globalCompositeOperation='source-over';c.drawImage(layer,0,0);
  drawBeam(c,s,{surface:beam,color:[150,195,255],opacity:.24,pixelSize:2});
  for(let i=0;i<210;i++){const p={x:100+(i*73%450)+t,y:60+(i*41%255)},a=coverageAt(s,p).beam;c.fillStyle=`rgba(180,216,255,${a})`;c.beginPath();c.arc(p.x,p.y,1.2,0,Math.PI*2);c.fill()}
  c.save();c.translate(s.mount.x,s.mount.y);c.rotate(s.angle);c.fillStyle='#59667f';c.fillRect(-8,-15,s.emitterOffset+8,30);c.fillStyle='#b7d8fb';c.fillRect(s.emitterOffset-2,-15,2,30);c.restore();c.restore();
 }};
}
