// Fixed-canvas author-positioned type: not automatic copy fitting or a new public family.
export function drawTiltedType(ctx,{text,x,y,size,font,angle=0,originX=x,originY=y,color='#1c1410',spacing=0,maxWidth=4096,canvasApi}={}){
 if(typeof text!=='string'||!text.length||text.length>200||typeof font!=='string'||!/^[A-Za-z0-9 -]{1,64}$/.test(font)||![x,y,size,angle,originX,originY,spacing,maxWidth].every(Number.isFinite)||[x,y,originX,originY].some(n=>Math.abs(n)>8192)||size<4||size>512||Math.abs(angle)>15||Math.abs(spacing)>12||maxWidth<1||maxWidth>4096||!/^#[0-9a-f]{6}$/i.test(color))throw Error('invalid tilted type contract');
 if(!canvasApi||typeof canvasApi.createCanvas!=='function')throw Error('canvasApi.createCanvas required');
 const previous={font:ctx.font,fillStyle:ctx.fillStyle,letterSpacing:ctx.letterSpacing,textAlign:ctx.textAlign,textBaseline:ctx.textBaseline};
 ctx.save();try{
  // Measure and paint with identical fresh-context typography, never inherited caller wordSpacing/direction.
  const measure=canvasApi.createCanvas(1,1).getContext('2d');
  const configure=g=>{g.font=size+'px '+font;g.letterSpacing=spacing+'px';g.wordSpacing='0px';g.direction='ltr';g.textAlign='left';g.textBaseline='alphabetic'};
  configure(measure);
  const width=measure.measureText(text).width;if(width>maxWidth)throw Error('authored type exceeds width');
  const m=measure.measureText(text),rad=angle*Math.PI/180,cs=Math.cos(rad),sn=Math.sin(rad);
  const rot=(px,py)=>[originX+(px-originX)*cs-(py-originY)*sn,originY+(px-originX)*sn+(py-originY)*cs];
  const left=x-m.actualBoundingBoxLeft-3,right=x+m.actualBoundingBoxRight+3,top=y-m.actualBoundingBoxAscent-3,bottom=y+m.actualBoundingBoxDescent+3;
  const corners=[[left,top],[right,top],[right,bottom],[left,bottom]].map(p=>rot(...p));
  const bx=Math.floor(Math.min(...corners.map(p=>p[0]))),by=Math.floor(Math.min(...corners.map(p=>p[1]))),bw=Math.ceil(Math.max(...corners.map(p=>p[0])))-bx,bh=Math.ceil(Math.max(...corners.map(p=>p[1])))-by;
  if(bw<1||bh<1||bw>8192||bh>8192||bw*bh>8388608)throw Error('type surface budget');
  const tile=canvasApi.createCanvas(bw,bh),g=tile.getContext('2d');configure(g);g.translate(-bx,-by);g.translate(originX,originY);g.rotate(rad);g.translate(-originX,-originY);g.fillStyle=color;g.fillText(text,x,y);
  ctx.drawImage(tile,bx,by);return {width,angle,bounds:{x:bx,y:by,width:bw,height:bh}};
 }finally{ctx.restore();Object.assign(ctx,previous)}
}
