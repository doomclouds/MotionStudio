import {registerGalleryFonts} from './gallery-fonts.mjs';
import {compilePolyline,samplePath,sampleTrail,sampleMotion,rational,framesToTime} from '../lib/index.mjs';
export const config={width:1280,height:720,fps:30,duration:8};
export const dependencies=['./gallery-fonts.mjs','../lib/path.mjs','../lib/index.mjs','../lib/validate.mjs','../lib/time.mjs','../lib/motions.mjs','../lib/math.mjs','../lib/matrix.mjs','../lib/stagger.mjs','../lib/layouts.mjs','../lib/recipes.mjs','../lib/transitions.mjs','../adapters/canvas.mjs','../../motion-timeline-core/lib/timeline.mjs','../../motion-render-core/lib/native.mjs'];
export async function createGalleryScene({ctx,GlobalFonts,config:cfg=config},{reducedMotion=false}={}){
 const font=registerGalleryFonts(GlobalFonts),family=font.family==='sans-serif'?'sans-serif':'"'+font.family+'"';
 const circuit=compilePolyline({points:[{x:0,y:130},{x:85,y:130},{x:85,y:0},{x:270,y:0},{x:270,y:160}]}),
 flow=compilePolyline({points:[{x:0,y:100},{x:125,y:10},{x:285,y:100}]});
 const timing={type:'motion.opacity',version:1,range:{start:rational(1,2),end:rational(15,2)},params:{from:0,to:1}};
 function line(points,color,width){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();}
 function draw(path,u,length){
  line(path.points,'#3b4b5c',4);
  const trail=sampleTrail(path,{headProgress:u,length,samples:64}),head=samplePath(path,u);
  line(trail.points.map(v=>v.position),'#82d5ca',8);
  ctx.fillStyle='#f2c481';ctx.beginPath();ctx.arc(head.position.x,head.position.y,9,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(head.position.x,head.position.y);ctx.lineTo(head.position.x+head.unitTangent.x*24,head.position.y+head.unitTangent.y*24);ctx.stroke();
 }
 return {font,renderFrame(frame){
  ctx.reset();ctx.fillStyle='#101720';ctx.fillRect(0,0,cfg.width,cfg.height);
  ctx.fillStyle='#f0f5f8';ctx.font=`bold 28px ${family}`;ctx.fillText('Path + bounded trail / 02',36,48);
  ctx.font=`16px ${family}`;ctx.fillStyle='#a1b0bc';ctx.fillText('Local arc length • deterministic seeking • no trail ahead of the head',36,82);
  const u=sampleMotion(timing,framesToTime(frame,{n:30,d:1})).progress,shown=reducedMotion?1:u;
  for(let i=0;i<2;i++){ctx.fillStyle='#1b2531';ctx.beginPath();ctx.roundRect(24+i*630,110,602,560,16);ctx.fill();
   ctx.fillStyle='#ced9e2';ctx.font=`bold 20px ${family}`;ctx.fillText(i?'02  Connected workflow / rotated parent':'01  Circuit / four unequal segments',44+i*630,150);
  }
  ctx.save();ctx.translate(170,270);draw(circuit,shown,85);ctx.restore();
  ctx.save();ctx.translate(810,285);ctx.rotate(-.12);
  for(const [i,p] of flow.points.entries()){ctx.fillStyle='#34485a';ctx.beginPath();ctx.roundRect(p.x-35,p.y-25,70,50,9);ctx.fill();ctx.fillStyle='#e2eaf0';ctx.font=`bold 14px ${family}`;ctx.fillText(['INPUT','CHECK','READY'][i],p.x-27,p.y-33);}
  draw(flow,shown,70);ctx.restore();
  ctx.font=`16px ${family}`;ctx.fillStyle='#b5c4d0';
  ctx.fillText('Corners: outgoing tangent; endpoint: incoming tangent',44,560);
  ctx.fillText('0 ≤ tail distance ≤ head distance ≤ total length',44,594);
  ctx.fillText('Same geometry drives the marker and growing route',674,560);
  ctx.fillText('Rotation preserves length; nonuniform scale changes speed',674,594);
  ctx.font=`14px ${family}`;ctx.fillStyle='#8c9ba9';ctx.fillText(reducedMotion?'Reduced motion: terminal pose; same 8s duration':`Linear progress ${Math.round(u*100)}% • start 0.5s / end 7.5s • explicit holds`,44,643);
 }};
}
export const createScene=options=>createGalleryScene(options);
