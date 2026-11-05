import {compilePaperSurface,drawPaperSurface,drawMarker} from '../index.mjs';
export const papers=Object.freeze([
 compilePaperSurface({width:320,height:200,seed:21,paper:'#fbf8ed',fiber:'#7a6650',fiberCount:500,grainCount:750,strength:.16}),
 compilePaperSurface({width:320,height:200,seed:38,paper:'#f0f7fb',fiber:'#526f88',fiberCount:350,grainCount:450,strength:.13,dotSpacing:20}),
]);
// Two synthetic drawing consumers, not film templates or font examples.
export function drawExample(ctx,index){
 if(!Number.isInteger(index)||index<0||index>1)throw RangeError('example 0 or 1');
 drawPaperSurface(ctx,papers[index]);ctx.save();try{
  ctx.strokeStyle='#243a55';ctx.lineWidth=3;ctx.lineJoin='round';ctx.lineCap='round';ctx.setLineDash([]);
  ctx.beginPath();
  if(index===0){ // folded envelope instruction
   ctx.moveTo(40,55);ctx.lineTo(210,55);ctx.lineTo(210,145);ctx.lineTo(40,145);ctx.closePath();ctx.moveTo(40,55);ctx.lineTo(125,108);ctx.lineTo(210,55);
  }else{ // path through three process stations
   ctx.moveTo(35,140);ctx.lineTo(100,140);ctx.lineTo(100,70);ctx.lineTo(210,70);
  }
  ctx.stroke();
 }finally{ctx.restore();}
 return drawMarker(ctx,{x:210,y:index===0?55:70,angle:-.45,ink:index===0?'#9f4536':'#276e94',length:76,width:12});
}
