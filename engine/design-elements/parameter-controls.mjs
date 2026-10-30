/** Semantic static parameter scale. This is a visual control, not an input widget. */
export const id='design.parameter-controls.v1';
export const version=1;
export const guidance='./docs/parameter-controls.md';
const styleKeys=['fillStyle','strokeStyle','font','textAlign','textBaseline','lineWidth','lineCap','globalAlpha'];
const snapshot=c=>Object.fromEntries(styleKeys.map(k=>[k,c[k]]));
const restore=(c,s)=>{c.restore();for(const k of styleKeys)c[k]=s[k];};
const finite=(v,k)=>{if(!Number.isFinite(v))throw new TypeError(`${k} must be finite`);return v;};
const range=(v,k,a,b)=>{finite(v,k);if(v<a||v>b)throw new RangeError(`${k}: ${a}..${b}`);return v;};
const text=(v,k,max=60)=>{if(typeof v!=='string'||v.length>max||/[\n\r]/.test(v))throw new TypeError(`${k} invalid`);return v;};
export function validate(p){
 if(!p?.bounds||!p?.data)throw new TypeError('bounds and data required');
 const b=p.bounds,d=p.data,t=p.theme||{};finite(b.x,'x');finite(b.y,'y');range(b.width,'width',180,1600);range(b.height,'height',160,1200);
 text(d.label,'label');text(d.unit??'','unit',12);finite(d.min,'min');finite(d.max,'max');if(d.max<=d.min)throw new RangeError('max must exceed min');range(d.value,'value',d.min,d.max);
 const orientation=d.orientation??'horizontal';if(!['horizontal','vertical'].includes(orientation))throw new RangeError('orientation invalid');
 if(orientation==='vertical'&&b.height<300)throw new RangeError('vertical scale needs 300px height');
 const ticks=d.ticks??5;if(!Number.isInteger(ticks)||ticks<2||ticks>21)throw new RangeError('ticks must be integer 2..21');
 const precision=d.precision??0;if(!Number.isInteger(precision)||precision<0||precision>3)throw new RangeError('precision must be 0..3');
 if(d.disabled!==undefined&&typeof d.disabled!=='boolean')throw new TypeError('disabled must be boolean');
 const f=t.fontSize??18;range(f,'fontSize',10,32);if(t.fontFamily!==undefined)text(t.fontFamily,'fontFamily',100);
 for(const k of ['surface','ink','muted','accent','track','edge'])if(t[k]!==undefined&&!(typeof t[k]==='string'&&/^#[0-9a-f]{6}$/i.test(t[k])))throw new TypeError(`${k} must be #RRGGBB`);
 const valueY=20+f*1.2+12,valueBottom=valueY+f*2.4*1.2;
 // Reserve text line boxes, a 24px clear gap, and the stroked thumb radius.
 const trackTop=orientation==='horizontal'?b.height-58:valueBottom+35;
 if(trackTop-10.5<valueBottom+24)throw new RangeError('height too small: value and track need 24px clearance');
 if(orientation==='vertical'&&b.height-42-trackTop<f*.65*2.2*(ticks-1))throw new RangeError('vertical track too short for text and ticks');
 return {bounds:{...b},data:{...d,unit:d.unit??'',orientation,ticks,precision,disabled:d.disabled??false},theme:{surface:'#11151b',ink:'#f3f4f6',muted:'#a3adbb',accent:'#ff822e',track:'#384150',edge:'#535c69',fontFamily:'sans-serif',fontSize:18,...t}};
}
export function draw(ctx,props){
 const {bounds:b,data:d,theme:t}=validate(props);if(!ctx||typeof ctx.save!=='function')throw new TypeError('Canvas 2D context required');
 const valueY=20+t.fontSize*1.2+12,valueBottom=valueY+t.fontSize*2.4*1.2;
 const verticalTop=valueBottom+35;
 const usable=d.orientation==='vertical'?b.height-42-verticalTop:b.width-48;if(usable/(d.ticks-1)<t.fontSize*.65*2.2)throw new RangeError('ticks too dense for bounds');
 const normalized=(d.value-d.min)/(d.max-d.min),pad=24,valueText=d.value.toFixed(d.precision)+(d.unit?' '+d.unit:'');
 const measureStyle=snapshot(ctx);ctx.save();try{ctx.font=`600 ${t.fontSize}px ${t.fontFamily}`;if(ctx.measureText(d.label).width>b.width-pad*2)throw new RangeError('label overflow');ctx.font=`700 ${t.fontSize*2.4}px ${t.fontFamily}`;if(ctx.measureText(valueText).width>b.width-pad*2)throw new RangeError('value overflow');ctx.font=`400 ${t.fontSize*.65}px ${t.fontFamily}`;for(let i=0;i<d.ticks;i++){const label=(d.min+(d.max-d.min)*i/(d.ticks-1)).toFixed(d.precision);const maxWidth=d.orientation==='horizontal'?Math.min(usable/(d.ticks-1)-8,48):b.width/2-36;if(ctx.measureText(label).width>maxWidth)throw new RangeError('tick label overflow');}}finally{restore(ctx,measureStyle);}
 const drawStyle=snapshot(ctx);ctx.save();try{
  ctx.translate(b.x,b.y);ctx.fillStyle=t.surface;ctx.beginPath();ctx.roundRect(0,0,b.width,b.height,16);ctx.fill();ctx.strokeStyle=t.edge;ctx.lineWidth=1;ctx.stroke();
  if(d.disabled)ctx.globalAlpha*=.45;
  ctx.textAlign='left';ctx.textBaseline='top';ctx.font=`600 ${t.fontSize}px ${t.fontFamily}`;ctx.fillStyle=t.muted;ctx.fillText(d.label,pad,20);
  ctx.font=`700 ${t.fontSize*2.4}px ${t.fontFamily}`;ctx.fillStyle=t.accent;ctx.fillText(valueText,pad,valueY);
  const vertical=d.orientation==='vertical',start=vertical?{x:b.width/2,y:b.height-42}:{x:pad,y:b.height-58},end=vertical?{x:b.width/2,y:verticalTop}:{x:b.width-pad,y:b.height-58};
  const length=Math.hypot(end.x-start.x,end.y-start.y),font=t.fontSize*.65;
  if(length/(d.ticks-1)<font*2.2)throw new RangeError('ticks too dense for bounds');
  const line=(a,z,color,w)=>{ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(z.x,z.y);ctx.stroke();};
  line(start,end,t.track,6);const thumb={x:start.x+(end.x-start.x)*normalized,y:start.y+(end.y-start.y)*normalized};line(start,thumb,t.accent,6);
  const tickRegions=[];
  for(let i=0;i<d.ticks;i++){
   const q=i/(d.ticks-1),x=start.x+(end.x-start.x)*q,y=start.y+(end.y-start.y)*q,v=d.min+(d.max-d.min)*q;
   line({x:x+(vertical?12:0),y:y+(vertical?0:12)},{x:x+(vertical?20:0),y:y+(vertical?0:20)},t.muted,1);
   ctx.font=`400 ${font}px ${t.fontFamily}`;ctx.fillStyle=t.muted;ctx.textBaseline=vertical?'middle':'top';ctx.textAlign=vertical?'left':'center';
   const s=v.toFixed(d.precision);ctx.fillText(s,x+(vertical?28:0),y+(vertical?0:27));tickRegions.push({value:v,x:b.x+x,y:b.y+y});
  }
  ctx.fillStyle=d.disabled?t.muted:t.ink;ctx.beginPath();ctx.arc(thumb.x,thumb.y,9,0,Math.PI*2);ctx.fill();ctx.strokeStyle=t.surface;ctx.lineWidth=3;ctx.stroke();
  return {id,bounds:{...b},textRegions:{label:{x:b.x+pad,y:b.y+20,width:b.width-pad*2,height:t.fontSize*1.2},value:{x:b.x+pad,y:b.y+valueY,width:b.width-pad*2,height:t.fontSize*2.4*1.2}},track:{start:{x:b.x+start.x,y:b.y+start.y},end:{x:b.x+end.x,y:b.y+end.y}},thumb:{x:b.x+thumb.x,y:b.y+thumb.y,radius:9},ticks:tickRegions,normalized,value:d.value,unit:d.unit,disabled:d.disabled,staticOnly:true};
 }finally{restore(ctx,drawStyle);}
}
