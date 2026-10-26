import {registerGalleryFonts} from './gallery-fonts.mjs';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
import {compileFocusHandoff,sampleFocusHandoff,withMotion,withLocalReveal,rational,framesToTime} from '../lib/index.mjs';
export const config={width:1920,height:1080,fps:30,duration:7};
export const dependencies=['./gallery-fonts.mjs','../lib/recipes/focus-handoff.mjs','../lib/index.mjs','../lib/validate.mjs','../lib/time.mjs','../lib/matrix.mjs','../lib/math.mjs','../lib/motions.mjs','../lib/layouts.mjs','../lib/recipes.mjs','../lib/transitions.mjs','../lib/stagger.mjs','../lib/path.mjs','../lib/settle.mjs','../lib/tiles.mjs','../adapters/canvas.mjs','../adapters/local-reveal.mjs','../adapters/tiles.mjs','../../motion-timeline-core/lib/timeline.mjs','../../motion-render-core/lib/native.mjs'];
export async function createGalleryScene({ctx,GlobalFonts,canvasApi,config:cfg=config},{reducedMotion=false}={}){
 const api=canvasApi||loadNativeCanvas().api,backend={Path2D:api.Path2D},font=registerGalleryFonts(GlobalFonts||api.GlobalFonts),family=font.family==='sans-serif'?'sans-serif':'"'+font.family+'"';
 const sets=[
  {ids:['draft','structure','output'],selected:'structure',labels:['DRAFT','STRUCTURE','OUTPUT'],detail:'Arrange the signal into a sequence.',next:'Make the priority visible.',kind:'data'},
  {ids:['story','image','caption'],selected:'story',labels:['STORY','IMAGE','CAPTION'],detail:'One visual. One clear thought.',next:'Give the next idea a place.',kind:'image'}
 ];
 const plans=sets.map(v=>compileFocusHandoff({type:'recipe.focus-handoff',version:1,cardIds:v.ids,selectedId:v.selected,detailId:v.kind+'-detail',nextId:v.kind+'-next',start:rational(0),travel:{x:0,y:55},rotationStep:.03,focusScale:1.6}));
 const rounded=(x,y,w,h,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();};
 function text(value,x,y,size,color='#213743',align='left'){ctx.font=`bold ${size}px ${family}`;ctx.textAlign=align;if(ctx.measureText(value).width>590)throw Error('Synthetic card text overflow; edit content rather than shrinking');ctx.fillStyle=color;ctx.fillText(value,x,y);ctx.textAlign='left';}
 function previous(v,layer){
  rounded(0,0,640,360,20,'#dce8e9');
  const i=v.ids.indexOf(layer.itemId);text(v.labels[i],i===0?26:614,62,43,'#203945',i===0?'left':'right');
  if(v.kind==='data'){
   for(let n=0;n<4;n++)rounded(42+n*140,235-(n+1)*26,100,(n+1)*26,5,n===i?'#2f6776':'#85b8ba');
  }else{
   rounded(32,92,576,170,12,'#456b7e');ctx.fillStyle='#e9c783';ctx.beginPath();ctx.arc(450,145,32,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#85b8ba';ctx.beginPath();ctx.moveTo(32,262);ctx.lineTo(205,125);ctx.lineTo(390,262);ctx.fill();
  }
  if(layer.content.detailId)withLocalReveal(ctx,{bounds:{x:24,y:285,width:592,height:50},radius:0,progress:layer.content.detailReveal,direction:'left-to-right'},()=>text(v.detail,28,321,26),backend);
 }
 function next(v){rounded(0,0,640,360,20,'#173f51');text('NEXT',30,60,32,'#9fcacb');text(v.next,30,134,30,'#f0f5ef');for(let j=0;j<3;j++)rounded(40+j*195,202,160,90,12,j===0?'#e7bd7c':'#61949e');}
 return {font,renderFrame(frame){
  ctx.reset();ctx.fillStyle='#0e1821';ctx.fillRect(0,0,cfg.width,cfg.height);
  ctx.fillStyle='#e7eff2';ctx.font=`bold 46px ${family}`;ctx.fillText('Focus handoff',54,85);
  ctx.font=`24px ${family}`;ctx.fillStyle='#a0b4c1';ctx.fillText('Choose → focus → read → pass the same frame to the next idea',54,133);
  const at=framesToTime(frame,{n:30,d:1});
  for(let k=0;k<2;k++){
   const x=40+k*960;rounded(x,190,920,680,20,'#172632');
   ctx.fillStyle='#bacdd7';ctx.font=`bold 25px ${family}`;ctx.fillText(k?'02  Visual story / first card selected':'01  Data summary / middle card selected',x+28,238);
   const state=sampleFocusHandoff(plans[k],at,{reducedMotion,parentMatrix:[.45,0,0,.45,x+28,290]});
   for(const layer of [...state.layers].sort((a,b)=>a.zIndex-b.zIndex)){
    withMotion(ctx,{matrix:layer.matrix,opacity:layer.opacity},()=>{
     if(layer.content.drawPrevious)previous(sets[k],layer);
     if(layer.content.nextReveal>0)withLocalReveal(ctx,{bounds:{x:0,y:0,width:640,height:360},radius:20,progress:layer.content.nextReveal,direction:'left-to-right'},()=>next(sets[k]),backend);
    });
   }
   ctx.fillStyle='#91a8b7';ctx.font=`20px ${family}`;ctx.fillText('Stage: '+state.phase,x+28,827);
  }
  ctx.fillStyle='#9eb2bf';ctx.font=`23px ${family}`;ctx.fillText(reducedMotion?'Reduced motion: fixed phase times, layout and content cuts; reading holds remain.':'One transform writer per card • persistent identity and z-order • explicit content handoff',54,946);
  ctx.font=`20px ${family}`;ctx.fillText('7 seconds • no loop • synthetic content • silent technical study',54,990);
 }};
}
export const createScene=options=>createGalleryScene(options);
