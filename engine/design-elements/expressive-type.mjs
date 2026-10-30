/** Authored 2D text offsets and strip masks. Not perspective, physical extrusion, or font-outline decomposition. */
import{bounds,theme,array,text,number,color,font,state,local}from'./shared.mjs';
export const id='design.expressive-type.v1';
export const version=1;
export const guidance='./docs/expressive-type.md';
export function validate(p){
 bounds(p?.bounds);theme(p.theme);const d=p.data;if(!d)throw new TypeError('data required');
 if(!['layered-extrusion','sliced-text'].includes(d.variant))throw new RangeError('variant');
 array(d.lines,'lines',1,3).forEach(s=>{text(s,'line',24);if(/[\n\r]/.test(s))throw new TypeError('single authored line required')});
 number(d.fontSize,'fontSize',48,400);number(d.padding??24,'padding',0,100);number(d.lineGap??12,'lineGap',0,100);
 if(!['left','center','right'].includes(d.align??'left'))throw new RangeError('align');
 if(d.paintBackground!==undefined&&typeof d.paintBackground!=='boolean')throw new TypeError('paintBackground boolean');
 if(d.variant==='layered-extrusion'){
  number(d.depthX??18,'depthX',-60,60);number(d.depthY??18,'depthY',-60,60);number(d.layers??18,'layers',2,60);if(!Number.isInteger(d.layers??18))throw new TypeError('integer layers');
  array(p.theme.depthColors,'depthColors',1,6).forEach(c=>color(c,'depth color'));
 }else{
  array(d.offsets,'offsets',4,32).forEach(v=>number(v,'strip offset',-40,40));number(d.fillRatio??.6,'fillRatio',.2,1);
 }
 return p;
}
export function draw(ctx,p){
 validate(p);if(!ctx||typeof ctx.save!=='function')throw new TypeError('Canvas 2D context required');
 const {bounds:b,data:d,theme:t}=p,pad=d.padding??24,gap=d.lineGap??12;
 const layered=d.variant==='layered-extrusion',dx=layered?(d.depthX??18):0,dy=layered?(d.depthY??18):0;
 const minX=layered?Math.min(0,dx):Math.min(...d.offsets),maxX=layered?Math.max(0,dx):Math.max(...d.offsets),minY=Math.min(0,dy),maxY=Math.max(0,dy);
 // All glyph/line bounds are measured before any fill, including depth and slice excursions.
 const layout=state(ctx,()=>{font(ctx,d.fontSize,t.fontFamily,800);let top=pad;return d.lines.map(s=>{const m=ctx.measureText(s),left=m.actualBoundingBoxLeft,right=m.actualBoundingBoxRight,asc=m.actualBoundingBoxAscent,desc=m.actualBoundingBoxDescent;
  if(![left,right,asc,desc].every(Number.isFinite)||asc+desc<=0)throw new RangeError('font must provide visible finite glyph metrics');
  const inkWidth=left+right,inkHeight=asc+desc,width=inkWidth+maxX-minX,height=inkHeight+maxY-minY;
  if(width>b.width-2*pad)throw new RangeError('text plus effects overflow width');
  const x=pad+((d.align??'left')==='right'?b.width-2*pad-width:(d.align??'left')==='center'?(b.width-2*pad-width)/2:0),y=top;
  if(y+height>b.height-pad)throw new RangeError('text plus effects overflow height');top+=height+gap;
  return{text:s,x:x-minX+left,baseline:y-minY+asc,inkTop:y-minY,inkHeight,region:{x:b.x+x,y:b.y+y,width,height}};})});
 return local(ctx,b,()=>{
  if(d.paintBackground!==false){ctx.fillStyle=t.surface;ctx.fillRect(0,0,b.width,b.height)}font(ctx,d.fontSize,t.fontFamily,800);
  for(const line of layout){if(layered){const n=d.layers??18;for(let i=n;i>=1;i--){const q=i/n;ctx.fillStyle=t.depthColors[Math.min(t.depthColors.length-1,Math.floor(q*t.depthColors.length))];ctx.fillText(line.text,line.x+dx*q,line.baseline+dy*q)}ctx.fillStyle=t.ink;ctx.fillText(line.text,line.x,line.baseline);
   }else{const band=line.inkHeight/d.offsets.length;for(let i=0;i<d.offsets.length;i++){ctx.save();try{ctx.beginPath();ctx.rect(0,line.inkTop+i*band,b.width,band*(d.fillRatio??.6));ctx.clip();ctx.fillStyle=i%2?t.accent:t.ink;ctx.fillText(line.text,line.x+d.offsets[i],line.baseline)}finally{ctx.restore()}}}
  }
  return{id,variant:d.variant,regions:layout.map(l=>l.region),readingOrder:d.lines.map((_,i)=>'line-'+i),semantics:'authored expressive text; offsets are not measured data',staticOnly:true};
 });
}
