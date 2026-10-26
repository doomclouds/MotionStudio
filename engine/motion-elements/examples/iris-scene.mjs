import {registerGalleryFonts} from './gallery-fonts.mjs';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
import {sampleTransition,drawTransition,rational,framesToTime} from '../lib/index.mjs';
export const config={width:1280,height:720,fps:30,duration:8};
export const dependencies=['./gallery-fonts.mjs','../lib/iris.mjs','../adapters/iris.mjs','../lib/index.mjs','../lib/validate.mjs','../lib/time.mjs','../lib/math.mjs','../lib/matrix.mjs','../lib/motions.mjs','../lib/transitions.mjs','../adapters/canvas.mjs','../lib/layouts.mjs','../lib/stagger.mjs','../lib/recipes.mjs','../lib/path.mjs','../lib/settle.mjs','../lib/tiles.mjs','../adapters/tiles.mjs','../adapters/local-reveal.mjs','../lib/recipes/focus-handoff.mjs','../lib/recipes/tile-signature.mjs','../../motion-timeline-core/lib/timeline.mjs','../../motion-render-core/lib/native.mjs'];
export async function createGalleryScene({ctx,GlobalFonts,canvasApi,config:cfg=config},{reducedMotion=false}={}){
 const api=canvasApi||loadNativeCanvas().api,backend={Path2D:api.Path2D},font=registerGalleryFonts(GlobalFonts||api.GlobalFonts),family=font.family==='sans-serif'?'sans-serif':'"'+font.family+'"';
 const w=560,h=210,centers=[{x:280,y:105},{x:140.35,y:125.65},{x:112,y:147},{x:0,y:0}];
 const rect=(c,color,x,y,width,height)=>{c.fillStyle=color;c.fillRect(x,y,width,height);};
 function desktop(c){rect(c,'#263f53',0,0,w,h);for(let i=0;i<4;i++){rect(c,'#b8d6db',30+i*135,25,105,95);rect(c,'#557f8c',42+i*135,39,70,8);rect(c,'#8baab4',42+i*135,58,82,42);}rect(c,'#152937',0,170,w,40);}
 function garden(c){rect(c,'#a9d8d4',0,0,w,h);rect(c,'#477d67',0,170,w,40);for(let i=0;i<5;i++){rect(c,'#356650',48+i*110,104,12,66);c.fillStyle=i%2?'#e9bd79':'#86b592';c.beginPath();c.arc(54+i*110,96,33,0,Math.PI*2);c.fill();}}
 function chart(c){rect(c,'#873e45',0,0,w,h);for(let i=0;i<6;i++)rect(c,'#c97a77',25+i*90,170-(i+1)*19,58,(i+1)*19);}
 function overlay(c){rect(c,'#3f96d580',20,20,180,170);rect(c,'#69addb80',360,20,180,170);
  const ring=new api.Path2D();ring.arc(280,105,80,0,2*Math.PI);ring.arc(280,105,42,0,2*Math.PI);c.fillStyle='#82bce0';c.fill(ring,'evenodd');
 }
 return {font,renderFrame(frame){
  ctx.reset();rect(ctx,'#101720',0,0,cfg.width,cfg.height);
  ctx.fillStyle='#eff4f5';ctx.font=`bold 28px ${family}`;ctx.fillText('Iris / one reveal, two compositing cases',28,42);
  ctx.fillStyle='#a6b7c3';ctx.font=`15px ${family}`;ctx.fillText('A stays underneath B • radius progress, not area progress • no decorative ring',28,69);
  const at=framesToTime(frame,{n:30,d:1});
  for(let i=0;i<4;i++){
   const x=24+(i%2)*632,y=94+Math.floor(i/2)*300;
   rect(ctx,'#1b2935',x,y,608,280);
   ctx.fillStyle='#d7e3ea';ctx.font=`bold 16px ${family}`;ctx.fillText(['01  Opaque worlds / centered','02  Opaque worlds / offset center','03  Transparent B / A remains visible','04  Transparent B / corner origin'][i],x+16,y+25);
   ctx.save();try{
    ctx.translate(x+24,y+42);
    for(let yy=0;yy<h;yy+=15)for(let xx=0;xx<w;xx+=15)rect(ctx,(xx/15+yy/15)%2?'#617286':'#8394a6',xx,yy,Math.min(15,w-xx),Math.min(15,h-yy));
    const state=sampleTransition({type:'transition.iris-reveal',version:1,range:{start:rational(1),end:rational(5)},curve:{type:'smoothstep'},params:{width:w,height:h,center:centers[i]}},at,{reducedMotion});
    drawTransition(ctx,state,{outgoing:i<2?desktop:chart,incoming:i<2?garden:overlay},backend);
    // Shared actor is deliberately absent from A/B and drawn exactly once here.
    if(i<2){const u=state.progress,heroX=reducedMotion?280:90+340*u;ctx.fillStyle='#f1c57f';ctx.beginPath();ctx.roundRect(heroX-16,132,32,38,12);ctx.fill();ctx.fillStyle='#203944';ctx.fillRect(heroX-9,141,4,5);ctx.fillRect(heroX+5,141,4,5);}
   }finally{ctx.restore();}
   ctx.fillStyle='#91a7b6';ctx.font=`12px ${family}`;ctx.fillText(i<2?'Backgrounds transition; shared actor drawn once afterward':'End / after = full A + B; the hole still shows red A',x+16,y+269);
  }
 }};
}
export const createScene=options=>createGalleryScene(options);
