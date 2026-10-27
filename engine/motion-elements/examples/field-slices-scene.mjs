import {compileAttractorField,sampleAttractorField,compileSliceDisplacement,sampleSliceDisplacement,withSliceDisplacement,rational} from '../lib/index.mjs';
export const config={width:960,height:640,fps:30,duration:6};
export const fieldInput={bounds:{x:15,y:15,width:360,height:160},columns:18,rows:8};
export const sliceInput={width:380,height:170,bands:11,maxOffset:55,seed:'study',instanceId:'panel',range:{start:rational(1),end:rational(5)},jitterCycles:3};
/** Four synthetic semantic examples, no source media, fonts or film data. */
export async function createGalleryScene({ctx,canvasApi,config:cfg=config},{reducedMotion=false}={}){
 const field=compileAttractorField(fieldInput),slice=compileSliceDisplacement(sliceInput),backend={Path2D:canvasApi.Path2D};
 return {renderFrame(frame){
  ctx.reset();ctx.fillStyle='#15232d';ctx.fillRect(0,0,cfg.width,cfg.height);ctx.fillStyle='#e4e9e7';ctx.font='22px sans-serif';ctx.fillText('Analytic orientation / masked slice displacement',28,35);
  ctx.font='13px sans-serif';ctx.fillText('Experimental technical study • no optical flow, simulation or glyph decomposition',28,60);
  const seconds=frame/cfg.fps,phase=reducedMotion?0:seconds;
  for(let panel=0;panel<4;panel++){
   const x=28+(panel%2)*466,y=86+Math.floor(panel/2)*266;
   ctx.fillStyle='#243642';ctx.fillRect(x,y,438,246);ctx.fillStyle='#dce5df';ctx.font='16px sans-serif';ctx.fillText(['Compass needles / radial attraction','Ribbon marks / circulating orientation','Sliced diagram / signal interruption','Sliced text card / temporary distortion'][panel],x+14,y+25);
   ctx.save();try{ctx.translate(x+24,y+49);
    if(panel<2){
     if(panel===1){ctx.translate(10,3);ctx.rotate(-.04);ctx.scale(.96,.9);}
     const state=sampleAttractorField(field,{attractor:{x:190+60*Math.cos(phase),y:85+40*Math.sin(phase)},radial:panel===0?1:.15,tangential:panel===0?0:1});
     for(const cell of state.cells){if(!cell.defined)continue;ctx.save();ctx.translate(cell.position.x,cell.position.y);ctx.rotate(cell.angle);ctx.fillStyle=panel===0?'#e3bd85':'#91c9c4';
      if(panel===0){ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-5,-3);ctx.lineTo(-5,3);ctx.closePath();ctx.fill();}else ctx.fillRect(-8,-2,16,4);ctx.restore();}
    }else{
     const state=sampleSliceDisplacement(slice,rational(frame,cfg.fps),{reducedMotion});
     withSliceDisplacement(ctx,state,c=>{
      c.fillStyle='#d7ded7';c.fillRect(0,0,380,170);
      if(panel===2){c.strokeStyle='#31546b';c.lineWidth=3;c.beginPath();c.moveTo(20,130);c.lineTo(360,130);c.stroke();for(let j=0;j<5;j++){c.fillStyle=j%2?'#53857b':'#345f7c';c.fillRect(30+j*66,120-j*18,35,10+j*18);}}
      else{c.fillStyle='#284453';c.font='bold 35px sans-serif';c.fillText('OPEN SIGNAL',20,70);c.font='17px sans-serif';c.fillText('Independent channels',20,109);c.clearRect(305,122,45,24);}
     },backend);
    }
   }finally{ctx.restore();}
  }
  ctx.fillStyle='#aabfc4';ctx.font='13px sans-serif';ctx.fillText('Local geometry only • endpoint identity • parent applied once • no artistic approval claimed',28,630);
 }};
}
export const createScene=options=>createGalleryScene(options);
