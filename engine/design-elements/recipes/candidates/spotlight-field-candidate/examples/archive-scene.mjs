// SPDX-License-Identifier: MIT
import {solveSpotlight,coverageAt,drawBeam,drawReceiverMask} from '../index.mjs';
export const config={width:640,height:360,fps:30,duration:4};
export const dependencies=['../index.mjs','../spotlight-field.mjs','../canvas-adapter.mjs'];

// Original synthetic shelf of geometric tokens; no historical artwork or source scene.
export function sampleLighting(t){
 return solveSpotlight({mount:{x:60,y:270+5*Math.sin(t*2)},target:{x:340+130*Math.sin(t*Math.PI/2),y:145},emitterOffset:30,halfAngle:.2,feather:.3,intensity:.9,receiver:{aspect:1,rotation:0,projectionScale:1.7}});
}
export function createScene({ctx:c,createCanvas}){
 const mask=createCanvas(640,360),layer=createCanvas(640,360),beam=createCanvas(1,1);
 function tokens(q,lit){
  q.strokeStyle=lit?'#e4b06d':'#34434b';q.fillStyle=lit?'#41796d':'#182b33';q.lineWidth=3;
  for(let i=0;i<6;i++){const x=220+i*66,y=135+(i%2)*20;q.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3;(k?q.lineTo.bind(q):q.moveTo.bind(q))(x+25*Math.cos(a),y+25*Math.sin(a))}q.closePath();q.fill();q.stroke();q.beginPath();q.moveTo(x-9,y);q.lineTo(x+9,y);q.moveTo(x,y-9);q.lineTo(x,y+9);q.stroke()}
 }
 return {render(t){
  const s=sampleLighting(t);c.fillStyle='#0b1822';c.fillRect(0,0,640,360);
  c.fillStyle='#1b3038';c.fillRect(183,202,437,12);tokens(c,false);
  const q=layer.getContext('2d'),m=mask.getContext('2d');q.clearRect(0,0,640,360);tokens(q,true);m.clearRect(0,0,640,360);drawReceiverMask(m,s);q.globalCompositeOperation='destination-in';q.drawImage(mask,0,0);q.globalCompositeOperation='source-over';c.drawImage(layer,0,0);
  drawBeam(c,s,{surface:beam,color:[242,189,104],opacity:.3,pixelSize:2});
  for(let i=0;i<180;i++){const p={x:90+(i*43%500),y:60+(i*71%240)-t*2},a=coverageAt(s,p).beam;c.fillStyle=`rgba(255,225,170,${a})`;c.fillRect(p.x,p.y,1.5,1.5)}
  c.save();c.translate(s.mount.x,s.mount.y);c.rotate(s.angle);c.fillStyle='#526877';c.fillRect(-12,-13,s.emitterOffset+12,26);c.fillStyle='#f4d792';c.fillRect(s.emitterOffset-2,-13,2,26);c.restore();
 }};
}
