/** Original synthetic technical example; output directory must be outside source. */
import fs from 'node:fs';
import path from 'node:path';
import {sampleTemporalMotion} from '../lib/support/temporal-motion-candidate.mjs';
const api=await import(process.env.MOTIONSTUDIO_CANVAS_MODULE || '@napi-rs/canvas');
const canvas=api.createCanvas(900,600),c=canvas.getContext('2d');
const paths=[
 t=>({x:70+Math.min(t/3,1)**2*710,y:116}),
 t=>({x:450+140*Math.cos(t*2.2),y:306+55*Math.sin(t*2.2)}),
 t=>({x:80+710*(1-Math.abs(((t*.85)%2)-1)),y:504}),
];
const labels=['ACCELERATION / SECANT','CURVED PATH / ORIENTATION','REVERSAL / TRUE HISTORY'];
export function render(t){
 c.fillStyle='#172030';c.fillRect(0,0,900,600);
 paths.forEach((samplePosition,i)=>{
  c.fillStyle='#d2d9e5';c.font='14px sans-serif';c.fillText(labels[i],25,28+i*195);
  const s=sampleTemporalMotion({time:t,history:.3,samples:12,velocityStep:1/120,samplePosition});
  for(let k=s.points.length-1;k>0;k--){const p=s.points[k];c.globalAlpha=.3*(1-k/s.points.length);c.fillStyle='#8ed6db';c.beginPath();c.arc(p.x,p.y,10,0,Math.PI*2);c.fill();}
  c.globalAlpha=1;const p=s.points[0];c.save();c.translate(p.x,p.y);c.rotate(s.velocity.angle);const stretch=Math.min(2.3,1+s.velocity.speed/700);c.scale(stretch,1/Math.sqrt(stretch));c.fillStyle='#ffb56b';c.beginPath();c.arc(0,0,10,0,Math.PI*2);c.fill();c.restore();
 });return canvas;
}
if(process.argv[2]){
 const out=path.resolve(process.argv[2]);fs.mkdirSync(out,{recursive:true});
 for(let n=0;n<90;n++)fs.writeFileSync(path.join(out,`${String(n).padStart(4,'0')}.png`),render(n/30).toBuffer('image/png'));
}
