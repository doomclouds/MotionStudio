import {registerGalleryFonts} from './gallery-fonts.mjs';
import {rational as T,framesToTime,sampleMotion,compileStagger,offsetCards,splitPanels,sampleTransition,sampleOffsetReassembly,withMotion,drawTransition} from '../lib/index.mjs';
export const config={width:1280,height:720,fps:30,duration:8};
export const dependencies=['./gallery-fonts.mjs','../../motion-render-core/lib/native.mjs','../lib/index.mjs','../lib/motions.mjs','../lib/transitions.mjs','../lib/layouts.mjs','../lib/recipes.mjs','../lib/stagger.mjs','../lib/matrix.mjs','../lib/math.mjs','../lib/time.mjs','../lib/validate.mjs','../adapters/canvas.mjs','../../motion-timeline-core/lib/timeline.mjs'];
const range={start:T(1,2),end:T(5,2)},fill=(ctx,color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
const box=(ctx,color='#85c7c3')=>{ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(-24,-24,48,48,8);ctx.fill();};
const names=['Transform','Opacity','Stagger','Anchored squash','Seeded shake','Push transition','Rect wipe','Offset cards','Split panels','Offset reassembly'];
const neutral={x:0,y:0,scaleX:1,scaleY:1,rotation:0};
export async function createGalleryScene({ctx,GlobalFonts,config:cfg=config},{reducedMotion=false}={}) {
  const font=registerGalleryFonts(GlobalFonts),family=font.family==='sans-serif'?'sans-serif':'"'+font.family+'"';
  return {font,renderFrame(frame){
    ctx.reset();fill(ctx,'#101720',0,0,cfg.width,cfg.height);
    ctx.fillStyle='#f0f5f8';ctx.font=`bold 28px ${family}`;ctx.fillText('Motion Elements / 01',32,42);
    ctx.fillStyle='#a1b0bc';ctx.font=`15px ${family}`;ctx.fillText(reducedMotion?'Reduced motion • identical timing':'10 mechanisms • synthetic examples • absolute-frame evaluation',32,68);
    // This exhibition explicitly repeats every four seconds; library samplers never wrap time.
    const at=framesToTime(frame%120,{n:30,d:1}),c={reducedMotion};
    for(let index=0;index<10;index++){
      const x=24+(index%5)*250,y=94+Math.floor(index/5)*300;
      ctx.save();try{
        ctx.translate(x,y);ctx.fillStyle='#1b2531';ctx.beginPath();ctx.roundRect(0,0,232,280,12);ctx.fill();
        ctx.fillStyle='#ced9e2';ctx.font=`bold 15px ${family}`;ctx.fillText(String(index+1).padStart(2,'0')+'  '+names[index],14,27);
        ctx.save();ctx.beginPath();ctx.rect(8,42,216,210);ctx.clip();ctx.translate(116,145);
        const spec=(type,params)=>({type,version:1,range,curve:{type:'smoothstep'},params});
        if(index===0)withMotion(ctx,sampleMotion(spec('motion.transform',{from:{...neutral,x:-55,scaleX:.55,scaleY:.55,rotation:-.5},to:{...neutral,x:45,scaleX:1.35,scaleY:1.35,rotation:.2}}),at,c),()=>box(ctx));
        if(index===1)withMotion(ctx,sampleMotion(spec('motion.opacity',{from:0,to:1}),at,c),()=>box(ctx,'#e8b875'));
        if(index===2){const ranges=compileStagger({itemIds:['a','b','c'],start:T(1,2),duration:T(4,5),step:T(1,4)});ranges.forEach((v,i)=>{ctx.save();ctx.translate((i-1)*60,0);withMotion(ctx,sampleMotion({...spec('motion.transform',{from:{...neutral,y:55,scaleX:.3,scaleY:.3},to:neutral}),range:v.range},at,c),()=>box(ctx));ctx.restore();});}
        if(index===3){ctx.strokeStyle='#8291a1';ctx.beginPath();ctx.moveTo(-65,45);ctx.lineTo(65,45);ctx.stroke();ctx.translate(0,20);withMotion(ctx,sampleMotion(spec('motion.anchored-squash',{amount:.42,axis:'y',origin:{x:0,y:24}}),at,c),()=>box(ctx));}
        if(index===4)withMotion(ctx,sampleMotion(spec('motion.shake',{amplitudeX:18,amplitudeY:11,rotation:.08,frequencyHz:10,seed:'gallery-1',elementId:'shake-card'}),at,c),()=>box(ctx,'#e8b875'));
        if(index===5||index===6){ctx.translate(-90,-70);const state=sampleTransition(spec(index===5?'transition.push':'transition.rect-wipe',{width:180,height:140,direction:'left'}),at,c);drawTransition(ctx,state,{outgoing:cx=>{fill(cx,'#417e8c',0,0,180,140);cx.fillStyle='#fff';cx.font=`bold 44px ${family}`;cx.fillText('A',70,86);},incoming:cx=>{fill(cx,'#d79a65',0,0,180,140);cx.fillStyle='#fff';cx.font=`bold 44px ${family}`;cx.fillText('B',70,86);}});}
        if(index===7){const cards=offsetCards({itemIds:['a','b','c'],origin:{x:-65,y:-45},card:{width:100,height:68},offset:{x:17,y:18},rotationStep:.08});cards.forEach((v,i)=>withMotion(ctx,{matrix:v.matrix,opacity:1},()=>{fill(ctx,['#486779','#628f99','#85c7c3'][i],0,0,v.rect.width,v.rect.height);}));}
        if(index===8){ctx.translate(-95,-65);splitPanels({itemIds:['a','b','c'],viewport:{width:190,height:130},axis:'x',gap:8}).forEach((v,i)=>withMotion(ctx,{matrix:v.matrix,opacity:1},()=>fill(ctx,['#85c7c3','#e8b875','#a7b7d8'][i],0,0,v.rect.width,v.rect.height)));}
        if(index===9){sampleOffsetReassembly({type:'recipe.offset-reassembly',version:1,range,params:{itemIds:['a','b','c'],origin:{x:-65,y:-45},card:{width:100,height:60},offset:{x:15,y:18},rotationStep:.04,step:T(1,4),travel:{x:-80,y:80}}},at,c).forEach((v,i)=>withMotion(ctx,{matrix:v.matrix,opacity:v.opacity},()=>fill(ctx,['#486779','#628f99','#85c7c3'][i],0,0,v.rect.width,v.rect.height)));}
        ctx.restore();ctx.fillStyle='#8c9ba9';ctx.font=`12px ${family}`;ctx.fillText(index===7||index===8?'Static layout; no hidden clock':'Absolute time / explicit hold',14,263);
      }finally{ctx.restore();}
    }
  }};
}
export const createScene=options=>createGalleryScene(options);
