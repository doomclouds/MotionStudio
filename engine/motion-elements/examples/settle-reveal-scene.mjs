import {registerGalleryFonts} from './gallery-fonts.mjs';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
import {sampleFiniteSettle,withLocalReveal,sampleMotion,composeTransform,withMotion,rational,framesToTime} from '../lib/index.mjs';
export const config={width:1280,height:720,fps:30,duration:8};
export const dependencies=['./gallery-fonts.mjs','../lib/settle.mjs','../adapters/local-reveal.mjs','../lib/index.mjs','../lib/path.mjs','../lib/validate.mjs','../lib/time.mjs','../lib/motions.mjs','../lib/math.mjs','../lib/matrix.mjs','../lib/stagger.mjs','../lib/layouts.mjs','../lib/recipes.mjs','../lib/transitions.mjs','../adapters/canvas.mjs','../../motion-timeline-core/lib/timeline.mjs','../../motion-render-core/lib/native.mjs'];
export async function createGalleryScene({ctx,GlobalFonts,canvasApi,config:cfg=config},{reducedMotion=false}={}){
 const api=canvasApi||loadNativeCanvas().api,backend={Path2D:api.Path2D};
 const font=registerGalleryFonts(GlobalFonts||api.GlobalFonts),family=font.family==='sans-serif'?'sans-serif':'"'+font.family+'"';
 const timing={type:'motion.opacity',version:1,range:{start:rational(1,2),end:rational(7,2)},params:{from:0,to:1}};
 const rounded=(x,y,w,h,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();};
 return {font,renderFrame(frame){
  ctx.reset();ctx.fillStyle='#101720';ctx.fillRect(0,0,cfg.width,cfg.height);
  ctx.fillStyle='#f0f5f8';ctx.font=`bold 28px ${family}`;ctx.fillText('Finite settle + local reveal / 03',32,46);
  ctx.fillStyle='#a1b0bc';ctx.font=`15px ${family}`;ctx.fillText('Analytic residual ≠ progress • local geometry ≠ glyph alpha mask • two 4-second exhibitions',32,76);
  const u=sampleMotion(timing,framesToTime(frame%120,{n:30,d:1})).progress,s=u*u*(3-2*u);
  const r=reducedMotion?0:sampleFiniteSettle(u,{amplitude:.8,oscillations:2,decay:1}).residual,p=reducedMotion?(u<.5?0:1):s;
  const labels=['01  Card / finite residual','02  Foot-anchored settling','03  Moving rounded chart','04  Transparent icon windows'];
  for(let i=0;i<4;i++){
   const x=24+(i%2)*630,y=100+Math.floor(i/2)*300;
   rounded(x,y,602,280,14,'#1b2531');ctx.fillStyle='#d7e2eb';ctx.font=`bold 19px ${family}`;ctx.fillText(labels[i],x+20,y+32);
   ctx.save();try{
    ctx.translate(x,y);
    if(i===0){
     rounded(340,80,145,125,12,'#293a4b');const px=60+280*s+70*r;
     rounded(px,90,145,105,10,'#85c7c3');ctx.fillStyle='#19353b';ctx.font=`bold 16px ${family}`;ctx.fillText('CARD',px+49,148);
    }
    if(i===1){
     ctx.strokeStyle='#738493';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(100,208);ctx.lineTo(500,208);ctx.stroke();
     ctx.translate(300,168);const sy=1+.3*r;
     withMotion(ctx,{matrix:composeTransform({scaleX:1/sy,scaleY:sy,pivot:{x:0,y:40}}),opacity:1},()=>{
      rounded(-55,-40,110,80,20,'#e8b875');ctx.fillStyle='#304052';ctx.fillRect(-25,-9,9,12);ctx.fillRect(16,-9,9,12);
     });
    }
    if(i===2){
     ctx.translate(165+30*s,90);ctx.rotate(-.12+.24*s);ctx.scale(1.1,.85);
     withLocalReveal(ctx,{bounds:{x:0,y:0,width:240,height:145},radius:18,progress:p,direction:'left-to-right'},c=>{
      c.fillStyle='#334e64';c.fillRect(-30,-30,300,220);
      for(let j=0;j<5;j++){c.fillStyle=['#85c7c3','#a7b7d8'][j%2];c.fillRect(24+j*43,125-(j+1)*18,28,(j+1)*18);}
     },backend);
    }
    if(i===3){
     for(let j=0;j<2;j++){
      ctx.save();ctx.translate(135+j*190,85);
      for(let yy=0;yy<140;yy+=14)for(let xx=0;xx<140;xx+=14){ctx.fillStyle=(xx/14+yy/14)%2?'#314151':'#263440';ctx.fillRect(xx,yy,14,14);}
      withLocalReveal(ctx,{bounds:{x:0,y:0,width:140,height:140},radius:20,progress:p,direction:j?'right-to-left':'bottom-to-top'},c=>{
       const ring=new api.Path2D();ring.arc(70,70,53,0,Math.PI*2);ring.arc(70,70,26,0,Math.PI*2);
       c.fillStyle=j?'#a7b7d8':'#85c7c3';c.fill(ring,'evenodd');
      },backend);ctx.restore();
     }
    }
   }finally{ctx.restore();}
   ctx.fillStyle='#a1b0bc';ctx.font=`14px ${family}`;ctx.fillText([
    'Base smoothstep + residual; endpoint value and velocity settle',
    'Foot stays fixed; artistic deformation, not physical simulation',
    'Caller owns transforms; fixed rounded boundary ∩ reveal strip',
    'Transparent holes preserve the checkerboard behind them'
   ][i],x+20,y+260);
  }
 }};
}
export const createScene=options=>createGalleryScene(options);
