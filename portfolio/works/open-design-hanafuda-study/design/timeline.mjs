export function drawTimeline(ctx,{x=0,y=0,width=1280,height=36,items,font='11px HanaMono',Path2D}){
 if(![x,y,width,height].every(Number.isFinite)||Math.abs(x)>8192||Math.abs(y)>8192||width<1||height<1||width>4096||height>256||!Array.isArray(items)||items.length>64||typeof font!=='string'||font.length>256)throw Error('invalid bounded timeline');
 // Densify and snapshot before any drawing; sparse holes are undefined and rejected.
 const rows=Array.from(items,v=>{
  if(v===null||typeof v!=='object'||Array.isArray(v))throw Error('invalid timeline item');
  const label=v.label,ix=v.x;
  if(typeof label!=='string'||label.length>160||!Number.isFinite(ix)||ix<0||ix>width)throw Error('invalid timeline item');
  return {label,x:ix};
 });
 if(typeof Path2D!=='function')throw Error('Path2D constructor required');
 const clipPath=new Path2D();clipPath.rect(x,y,width,height);
 const dots=rows.map(item=>{const p=new Path2D();p.arc(x+item.x,y+height/2,3,0,7);return p;});
 const previous={fillStyle:ctx.fillStyle,font:ctx.font,letterSpacing:ctx.letterSpacing};ctx.save();try{ctx.clip(clipPath);ctx.fillStyle='#181612';ctx.fillRect(x,y,width,height);ctx.font=font;ctx.letterSpacing='2.42px';for(const [i,item] of rows.entries()){ctx.fillStyle='#d92b1c';ctx.fill(dots[i]);ctx.fillStyle='#f5efe2aa';ctx.fillText(item.label,x+item.x+9,y+height/2+3)}}finally{ctx.restore();Object.assign(ctx,previous)}
}
