import {registerGalleryFonts} from './gallery-fonts.mjs';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
import {compileTileSignature,sampleTileSignature,drawTileScatter,withMotion,withLocalReveal,rational,framesToTime} from '../lib/index.mjs';
export const config={width:1920,height:1080,fps:30,duration:8};
export const dependencies=['./gallery-fonts.mjs','../lib/recipes/tile-signature.mjs','../lib/recipes/focus-handoff.mjs','../lib/index.mjs','../lib/validate.mjs','../lib/time.mjs','../lib/matrix.mjs','../lib/math.mjs','../lib/motions.mjs','../lib/layouts.mjs','../lib/recipes.mjs','../lib/transitions.mjs','../lib/stagger.mjs','../lib/path.mjs','../lib/settle.mjs','../lib/tiles.mjs','../adapters/canvas.mjs','../adapters/local-reveal.mjs','../adapters/tiles.mjs','../../motion-timeline-core/lib/timeline.mjs','../../motion-render-core/lib/native.mjs'];
export async function createGalleryScene({ctx,GlobalFonts,canvasApi,config:cfg=config},{reducedMotion=false}={}){
 const api=canvasApi||loadNativeCanvas().api,font=registerGalleryFonts(GlobalFonts||api.GlobalFonts),family=font.family==='sans-serif'?'sans-serif':'"'+font.family+'"',backend={Path2D:api.Path2D};
 const sources=[api.createCanvas(641,359),api.createCanvas(641,359)];
 const a=sources[0].getContext('2d');
 for(let y=0;y<359;y+=40)for(let x=0;x<641;x+=40){a.fillStyle=((x+y)/40)%2?'#85c7c3':'#456b7b';a.fillRect(x,y,40,40);}
 a.fillStyle='#efc08099';a.fillRect(350,50,230,200);a.globalCompositeOperation='destination-out';a.fillStyle='#000';a.beginPath();a.arc(170,170,75,0,Math.PI*2);a.fill();a.globalCompositeOperation='source-over';
 const b=sources[1].getContext('2d');b.fillStyle='#dce8e9';b.fillRect(0,0,641,359);b.fillStyle='#203945';b.font=`bold 42px ${family}`;b.fillText('ONE CONTINUOUS IDEA',32,82);b.font=`24px ${family}`;b.fillText('The pieces keep their identity.',32,140);b.fillText('The complete image returns.',32,182);b.fillStyle='#397587';b.fillRect(32,228,576,86);b.fillStyle='#f0f4ef';b.font=`bold 34px ${family}`;b.fillText('BUILD  /  RETURN  /  SIGN',52,284);
 const plans=sources.map((_,i)=>compileTileSignature({type:'recipe.tile-signature',version:1,sourceId:'source-'+i,signatureId:'signature-'+i,sourceRect:{x:0,y:0,width:641,height:359},grid:i?'5x3':'8x5',seed:'signature-study',instanceId:'card'+i,start:rational(0),displacement:{x:60,y:35},maxRotation:.16}));
 const rounded=(x,y,w,h,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();};
 return {font,renderFrame(frame){
  ctx.reset();ctx.fillStyle='#0e1821';ctx.fillRect(0,0,cfg.width,cfg.height);
  ctx.fillStyle='#e7eff2';ctx.font=`bold 46px ${family}`;ctx.fillText('Return, settle, sign',54,85);
  ctx.font=`24px ${family}`;ctx.fillStyle='#a0b4c1';ctx.fillText('One image → fixed fragments → the same image → a quiet signature',54,133);
  const at=framesToTime(frame,{n:30,d:1});
  for(let k=0;k<2;k++){
   const x=40+k*960;rounded(x,190,920,680,20,'#172632');
   ctx.fillStyle='#bacdd7';ctx.font=`bold 25px ${family}`;ctx.fillText(k?'02  Text snapshot / 15 fixed fragments':'01  Geometry with transparent hole / 40 fragments',x+28,238);
   const state=sampleTileSignature(plans[k],at,{reducedMotion,parentMatrix:[.45,0,0,.45,x+28,290]});
   withMotion(ctx,{matrix:state.source.matrix,opacity:1},()=>drawTileScatter(ctx,sources[k],state.source.tilePlan,state.source.tileState));
   withMotion(ctx,{matrix:state.signature.matrix,opacity:1},()=>withLocalReveal(ctx,{bounds:state.signature.bounds,radius:0,progress:state.signature.reveal,direction:'left-to-right'},()=>{
    const label=k?'A story, brought together':'Created with Studio';ctx.font=`bold 36px ${family}`;
    if(ctx.measureText(label).width>760)throw Error('Signature overflow; shorten content');
    ctx.fillStyle='#d5e5e9';ctx.textAlign='center';ctx.fillText(label,400,66);ctx.textAlign='left';
   },backend));
   ctx.fillStyle='#91a8b7';ctx.font=`20px ${family}`;ctx.fillText('Stage: '+state.phase,x+28,827);
  }
  ctx.fillStyle='#9eb2bf';ctx.font=`23px ${family}`;ctx.fillText(reducedMotion?'Reduced motion: intact source retained; fragment narrative omitted; signature midpoint cut.':'Same plan and source • global time reflection • no threshold snap • parent locked until home',54,946);
  ctx.font=`20px ${family}`;ctx.fillText('8 seconds • continuous sequence • synthetic content • silent technical study',54,990);
 }};
}
export const createScene=options=>createGalleryScene(options);
