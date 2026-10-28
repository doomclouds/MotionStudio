import {withMotion} from './canvas.mjs';
import {assertLightEchoState} from '../lib/recipes/light-echo-field.mjs';
const rgba=(rgb,a)=>`rgba(${rgb.join(',')},${a})`;
/** Source-over light disks then same-color rectangular echoes. Caller owns background/clip. */
export function drawLightEchoField(ctx,state){
 assertLightEchoState(state);
 withMotion(ctx,state.motion,c=>{
  c.globalCompositeOperation='source-over';
  for(const l of state.lights){
   const r=l.radius,g=c.createRadialGradient(l.x-r*.08,l.y-r*.05,r*.05,l.x,l.y,r*1.06);
   g.addColorStop(0,rgba(l.color,l.opacity*.95));g.addColorStop(.84,rgba(l.color,l.opacity));g.addColorStop(.94,rgba(l.color,l.opacity*.9));g.addColorStop(1,rgba(l.color,0));
   c.fillStyle=g;c.fillRect(l.x-r*1.1,l.y-r*1.1,r*2.2,r*2.2);
  }
  for(const l of state.lights)for(const f of l.fragments){c.fillStyle=rgba(l.color,f.opacity);c.fillRect(f.x,f.y,f.width,f.height);}
 });
}
