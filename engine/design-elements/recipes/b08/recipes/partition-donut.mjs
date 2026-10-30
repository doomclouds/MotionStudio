/** One-ring composition of a total, NOT multiple progress rings. No rendering I/O. */
export const id='recipe.partition-donut.v1';
export const version=1;
export const guidance='../docs/partition-donut.md';
const finite=(v,k,min=-Infinity,max=Infinity)=>{if(!Number.isFinite(v)||v<min||v>max)throw new RangeError(`${k} must be finite in ${min}..${max}`);return v};
const text=(v,k,max)=>{if(typeof v!=='string'||!v.trim()||v!==v.trim()||v.length>max||/[\r\n\t]/.test(v))throw new TypeError(`${k}: trimmed single-line text required`);return v};
const color=(v,k)=>{if(typeof v!=='string'||!/^#[0-9a-fA-F]{6}$/.test(v))throw new TypeError(`${k}: #RRGGBB required`);return v};
const percent=s=>s>0&&s*100<0.05?'<0.1%':s<1&&s*100>=99.95?'>99.9%':(s*100).toFixed(1)+'%';
const keys=['fillStyle','strokeStyle','font','textAlign','textBaseline','lineWidth','lineCap','lineJoin','lineDashOffset','globalAlpha','globalCompositeOperation','letterSpacing','shadowColor','shadowBlur','shadowOffsetX','shadowOffsetY','filter'];
function state(ctx,fn){const dash=ctx.getLineDash();const old=Object.fromEntries(keys.filter(k=>k in ctx).map(k=>[k,ctx[k]]));ctx.save();try{return fn()}finally{ctx.restore();for(const [k,v]of Object.entries(old))ctx[k]=v;ctx.setLineDash(dash)}}
export function validate(props){
 const b=props?.bounds;if(!b)throw new TypeError('bounds required');finite(b.x,'x');finite(b.y,'y');finite(b.width,'width',500,2000);finite(b.height,'height',320,1600);
 const title=text(props.title,'title',100),unit=text(props.unit,'unit',16);
 if(!Array.isArray(props.data)||!props.data.length||props.data.length>12)throw new RangeError('data must contain 1..12 categories');
 const labels=new Set();let total=0;
 const data=props.data.map((d,i)=>{if(!d)throw new TypeError('category required');const label=text(d.label,`data[${i}].label`,80),key=label.normalize('NFKC').toLocaleLowerCase('en-US');if(labels.has(key))throw new RangeError('repeated category label');labels.add(key);finite(d.value,`data[${i}].value`,0);total+=d.value;return {label,value:d.value,color:color(d.color,`data[${i}].color`)}});
 finite(total,'total',Number.MIN_VALUE);
 const theme={surface:'#141a26',ink:'#f2f3f8',muted:'#abb5c8',fontFamily:'sans-serif',...props.theme};
 for(const k of ['surface','ink','muted'])color(theme[k],k);text(theme.fontFamily,'fontFamily',100);
 return {bounds:{...b},title,unit,data,total,theme};
}
export function draw(ctx,props){
 const p=validate(props),{bounds:b,data,total,theme:t}=p;if(!ctx||typeof ctx.measureText!=='function')throw new TypeError('Canvas 2D context required');
 const ringWidth=b.width*.42,cx=24+ringWidth/2,cy=64+(b.height-88)/2,r=Math.min((ringWidth-24)/2,(b.height-112)/2),inner=r*.64;
 const legendX=48+ringWidth,legendWidth=b.width-legendX-24,rowHeight=48;
 if(84+data.length*rowHeight>b.height-12)throw new RangeError('legend does not fit: enlarge height; no hidden categories');
 if(inner<44||legendWidth<160)throw new RangeError('ineffective ring or legend layout');
 const segments=[];let angle=-Math.PI/2;
 const lastPositive=data.findLastIndex(d=>d.value>0);
 for(let i=0;i<data.length;i++){
  const d=data[i],share=d.value/total,start=angle,end=d.value===0?start:i===lastPositive?Math.PI*1.5:start+share*Math.PI*2;
  if(d.value>0&&(!(end>start)||(end-start)*r<1))throw new RangeError('positive share too small to represent at this size');
  segments.push({...d,share,start,end});angle=end;
 }
 const fonts={title:22,label:16,value:13,total:24,unit:13};
 const setFont=(size,weight=400)=>{ctx.font=`${weight} ${size}px ${t.fontFamily}`;ctx.textAlign='left';ctx.textBaseline='alphabetic';if('letterSpacing'in ctx)ctx.letterSpacing='0px'};
 const fit=(str,width,size,weight=400)=>{setFont(size,weight);const m=ctx.measureText(str);const left=Math.max(0,m.actualBoundingBoxLeft||0),right=Math.max(m.width,m.actualBoundingBoxRight||0);if(left>4||right+left>width-8||Math.max(0,m.actualBoundingBoxAscent||0)+Math.max(0,m.actualBoundingBoxDescent||0)>size*1.35)throw new RangeError('text exceeds reserved region; change content/font/bounds')};
 // Validate ALL strings and geometry before drawing, including zero-value labels.
 state(ctx,()=>{fit(p.title,b.width-48,fonts.title,600);fit(String(total),inner*2-24,fonts.total,700);fit(p.unit,inner*2-24,fonts.unit);for(const d of segments){fit(d.label,legendWidth-28,fonts.label,600);fit(`${d.value} ${p.unit}  /  ${percent(d.share)}`,legendWidth-28,fonts.value)}});
 return state(ctx,()=>{
  ctx.translate(b.x,b.y);if('filter'in ctx)ctx.filter='none';ctx.globalAlpha=1;ctx.setLineDash([]);ctx.lineDashOffset=0;ctx.globalCompositeOperation='source-over';ctx.shadowColor='#00000000';ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
  ctx.fillStyle=t.surface;ctx.fillRect(0,0,b.width,b.height);
  setFont(fonts.title,600);ctx.fillStyle=t.ink;ctx.fillText(p.title,24,40);
  // Filled annular sectors have true angular shares: no round caps, artificial gaps or overlaps.
  for(const d of segments){if(d.value===0)continue;if(d.share===1){ctx.beginPath();ctx.arc(cx,cy,(r+inner)/2,0,Math.PI*2);ctx.strokeStyle=d.color;ctx.lineWidth=r-inner;ctx.lineCap='butt';ctx.stroke();continue}ctx.beginPath();ctx.arc(cx,cy,r,d.start,d.end,false);ctx.arc(cx,cy,inner,d.end,d.start,true);ctx.closePath();ctx.fillStyle=d.color;ctx.fill()}
  setFont(fonts.total,700);ctx.textAlign='center';ctx.fillStyle=t.ink;ctx.fillText(String(total),cx,cy-3);setFont(fonts.unit);ctx.textAlign='center';ctx.fillStyle=t.muted;ctx.fillText(p.unit,cx,cy+20);
  const legend=segments.map((d,i)=>{const y=84+i*rowHeight;ctx.fillStyle=d.color;ctx.fillRect(legendX,y-12,12,12);setFont(fonts.label,600);ctx.fillStyle=t.ink;ctx.fillText(d.label,legendX+24,y);setFont(fonts.value);ctx.fillStyle=t.muted;ctx.fillText(`${d.value} ${p.unit}  /  ${percent(d.share)}`,legendX+24,y+20);return {label:d.label,value:d.value,share:d.share,percentageDisplay:percent(d.share),color:d.color,bounds:{x:b.x+legendX,y:b.y+y-18,width:legendWidth,height:40}}});
  return {id,total,unit:p.unit,center:{x:b.x+cx,y:b.y+cy},radius:r,innerRadius:inner,segments:segments.map(d=>({...d})),legend,legendComplete:legend.length===data.length,percentageDisplayDecimals:1,staticOnly:true};
 });
}
