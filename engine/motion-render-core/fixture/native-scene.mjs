export const config={width:320,height:180,fps:30,duration:1};
export function createScene({ctx,config}) {return {render(t){ctx.fillStyle='#eff3f8';ctx.fillRect(0,0,config.width,config.height);ctx.fillStyle='#2953ed';ctx.beginPath();ctx.arc(35+t*240,90,22,0,Math.PI*2);ctx.fill();ctx.fillStyle='#151923';ctx.font='16px sans-serif';ctx.fillText('MotionStudio · Native Canvas',14,28);}};}
