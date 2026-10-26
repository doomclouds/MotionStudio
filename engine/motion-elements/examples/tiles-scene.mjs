import {registerGalleryFonts} from './gallery-fonts.mjs';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
import {compileTileScatter,sampleTileScatter,drawTileScatter,rational,framesToTime} from '../lib/index.mjs';
export const config={width:1280,height:720,fps:30,duration:8};
export const dependencies=['./gallery-fonts.mjs','../lib/tiles.mjs','../adapters/tiles.mjs','../lib/index.mjs','../lib/validate.mjs','../lib/time.mjs','../lib/matrix.mjs','../lib/math.mjs','../lib/motions.mjs','../lib/layouts.mjs','../lib/recipes.mjs','../lib/transitions.mjs','../lib/stagger.mjs','../lib/path.mjs','../lib/settle.mjs','../adapters/canvas.mjs','../adapters/local-reveal.mjs','../../motion-timeline-core/lib/timeline.mjs','../../motion-render-core/lib/native.mjs'];
export async function createGalleryScene({ctx,GlobalFonts,canvasApi,config:cfg=config},{reducedMotion=false}={}){
 const api=canvasApi||loadNativeCanvas().api,font=registerGalleryFonts(GlobalFonts||api.GlobalFonts),family=font.family==='sans-serif'?'sans-serif':'"'+font.family+'"';
 const sources=[api.createCanvas(641,359),api.createCanvas(641,359)];
 const a=sources[0].getContext('2d');
 for(let y=0;y<359;y+=40)for(let x=0;x<641;x+=40){a.fillStyle=((x+y)/40)%2?'#85c7c3':'#456b7b';a.fillRect(x,y,40,40);}
 a.fillStyle='#efc08099';a.fillRect(350,50,230,200);a.strokeStyle='#f4f7fa';a.lineWidth=1;a.beginPath();a.moveTo(0,179.5);a.lineTo(641,179.5);a.moveTo(320.5,0);a.lineTo(320.5,359);a.stroke();
 a.globalCompositeOperation='destination-out';a.fillStyle='#000';a.beginPath();a.arc(170,170,75,0,Math.PI*2);a.fill();a.globalCompositeOperation='source-over';
 const b=sources[1].getContext('2d');b.fillStyle='#dce8ec';b.fillRect(0,0,641,359);b.fillStyle='#172c3c';b.font=`bold 46px ${family}`;b.fillText('FIXED CONTENT',36,80);b.font=`23px ${family}`;b.fillText('One raster. One set of identities.',36,132);b.fillText('Scatter, reverse time, return home.',36,170);
 b.fillStyle='#286575';b.fillRect(36,215,569,95);b.fillStyle='#f0f5f8';b.font=`bold 40px ${family}`;b.fillText('641 × 359',64,279);
 const plans=sources.map((_,i)=>compileTileScatter({sourceRect:{x:0,y:0,width:641,height:359},columns:i?5:8,rows:i?3:5,seed:'tile-study',instanceId:'content'+i,range:{start:rational(1,2),end:rational(7,2)},step:rational(1,50),displacement:{x:85,y:60},maxRotation:.18}));
 return {font,renderFrame(frame){
  ctx.reset();ctx.fillStyle='#101720';ctx.fillRect(0,0,cfg.width,cfg.height);
  ctx.fillStyle='#f0f5f8';ctx.font=`bold 28px ${family}`;ctx.fillText('Fixed tiles / scatter + global time reversal',32,46);
  const direction=frame<120?'out':'in',at=framesToTime(frame%120,{n:30,d:1}),debug=frame<45&&!reducedMotion;
  ctx.fillStyle='#a1b0bc';ctx.font=`15px ${family}`;ctx.fillText('Same source identity • integer partition • exact home uses the same full raster',32,78);
  for(let i=0;i<2;i++){
   const x=24+i*630;ctx.fillStyle='#1b2531';ctx.beginPath();ctx.roundRect(x,110,602,560,14);ctx.fill();ctx.fillStyle='#d9e4ed';ctx.font=`bold 19px ${family}`;ctx.fillText(i?'02  Text card / 15 tiles':'01  Geometry + transparency / 40 tiles',x+20,147);
   ctx.save();try{
    ctx.translate(x+85,245);ctx.scale(.68,.68);
    const state=sampleTileScatter(plans[i],at,{direction});
    const show=reducedMotion?(direction==='out'?frame%120<60:frame%120>=60):true;
    if(show)drawTileScatter(ctx,sources[i],plans[i],reducedMotion?sampleTileScatter(plans[i],rational(0),{direction:'out'}):state);
    if(debug)for(const tile of state.tiles){
     ctx.save();ctx.transform(...tile.matrix);const h=tile.homeRect;ctx.strokeStyle='#ffffff99';ctx.lineWidth=1;ctx.strokeRect(h.x,h.y,h.width,h.height);ctx.fillStyle='#10232d';ctx.font=`8px ${family}`;ctx.fillText(tile.tileId,h.x+3,h.y+12);
     ctx.beginPath();ctx.moveTo(h.x+h.width/2-4,h.y+h.height/2);ctx.lineTo(h.x+h.width/2+4,h.y+h.height/2);ctx.moveTo(h.x+h.width/2,h.y+h.height/2-4);ctx.lineTo(h.x+h.width/2,h.y+h.height/2+4);ctx.stroke();ctx.restore();
    }
   }finally{ctx.restore();}
   ctx.fillStyle='#acbac7';ctx.font=`15px ${family}`;ctx.fillText(i?'Raster content only; no glyph splitting':'Non-divisible grid; no widened or overlapping UVs',x+20,580);
   ctx.fillText(direction==='out'?'Home → staggered scatter':'Dispersed → exact home (global time reflected)',x+20,610);
  }
  ctx.fillStyle='#91a6b7';ctx.font=`14px ${family}`;ctx.fillText(reducedMotion?'Reduced motion: whole-image midpoint cut; no fragment movement':debug?'Identity debug overlay (first 1.5s only)':'Clean raster view • moving edges may show sampling seams',44,646);
 }};
}
export const createScene=options=>createGalleryScene(options);
