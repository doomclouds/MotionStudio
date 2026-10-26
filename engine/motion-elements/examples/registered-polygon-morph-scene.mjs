import {registerGalleryFonts} from './gallery-fonts.mjs';
import {compileRegisteredPolygonMorph,sampleRegisteredPolygonMorph,drawRegisteredPolygonMorph} from '../lib/index.mjs';
const points=rows=>rows.map(([x,y])=>({x,y}));
export const cardInput={vertexIds:['tl','tr','br','bl'],from:points([[0,0],[240,0],[240,140],[0,140]]),to:points([[20,10],[200,0],[250,150],[0,120]])};
export const arrowInput={vertexIds:['tail-top','shoulder-top','neck-top','tip','neck-bottom','shoulder-bottom','tail-bottom'],from:points([[0,30],[100,30],[100,0],[170,60],[100,120],[100,90],[0,90]]),to:points([[10,40],[90,35],[95,5],[190,60],[95,115],[90,85],[10,80]])};
export const config={width:960,height:640,fps:30,duration:8};
// Forward 1..3s, read-shape hold 3..4.5s, reverse 4.5..6.5s, final hold.
export function galleryProgress(seconds){const p=seconds<1?0:seconds<3?(seconds-1)/2:seconds<4.5?1:seconds<6.5?1-(seconds-4.5)/2:0;return p*p*(3-2*p);}
export async function createGalleryScene({ctx,GlobalFonts,canvasApi,config:cfg=config},{reducedMotion=false,debug=false}={}){
 const font=registerGalleryFonts(GlobalFonts||canvasApi.GlobalFonts),backend={Path2D:canvasApi.Path2D};
 const family=font.family==='sans-serif'?'sans-serif':'"'+font.family+'"',plans=[cardInput,arrowInput].map(compileRegisteredPolygonMorph);
 return {font,renderFrame(frame){
  ctx.reset();ctx.fillStyle='#121c29';ctx.fillRect(0,0,cfg.width,cfg.height);
  ctx.fillStyle='#eaf0ed';ctx.font=`bold 25px ${family}`;ctx.fillText('Registered polygon / deliberate local change',28,40);
  ctx.fillStyle='#a7b7bc';ctx.font=`14px ${family}`;ctx.fillText('Experimental • explicit vertex correspondence • requested samples only, no continuous topology proof',28,66);
  const p=reducedMotion?1:galleryProgress(frame/cfg.fps);
  for(let i=0;i<4;i++){
   const col=i%2,row=Math.floor(i/2),x=28+col*466,y=92+row*256;
   ctx.fillStyle='#1c2a39';ctx.fillRect(x,y,438,238);
   ctx.fillStyle='#b9cdce';ctx.font=`15px ${family}`;ctx.fillText((col?'Concave arrow':'Non-affine four-corner card')+(row?' / transformed parent':' / local'),x+16,y+24);
   const state=sampleRegisteredPolygonMorph(plans[col],p);
   ctx.save();try{
    ctx.translate(x+(col?105:90),y+65);
    if(row){ctx.translate(10,0);ctx.rotate(-.12);ctx.scale(1.08,.82);}
    drawRegisteredPolygonMorph(ctx,state,{fill:col?'#b0d2c5':'#e4d9bd',stroke:'#f1f4ea',lineWidth:2},backend);
    if(debug){for(const v of state.vertices){ctx.fillStyle='#c5524d';ctx.beginPath();ctx.arc(v.x,v.y,3,0,2*Math.PI);ctx.fill();ctx.font=`11px ${family}`;ctx.fillStyle='#fff';ctx.fillText(v.vertexId,v.x+5,v.y-7);}}
   }finally{ctx.restore();}
  }
  ctx.fillStyle='#9bb4bf';ctx.font=`13px ${family}`;ctx.fillText(`Forward → read-shape hold → reverse    p=${p.toFixed(3)}    ${debug?'ID debug':'clean'} / visual review pending`,28,625);
 }};
}
export const createScene=options=>createGalleryScene(options);
