/** Static, linear radial reading. Angles are degrees, clockwise from the right. */
import {number,text,color,state,local,font} from './shared.mjs';
export const id='design.radial-scale.v1';
export const version=1;
export const guidance='./docs/radial-scale.md';
export function validate(props){
 const b=props?.bounds,d=props?.data,t=props?.theme||{};
 if(!b||!d)throw new TypeError('bounds and data required');
 number(b.x,'x');number(b.y,'y');number(b.width,'width',280,1600);number(b.height,'height',340,1600);
 for(const k of ['label','unit']){text(d[k],k,k==='label'?60:12);if(/[\r\n]/.test(d[k]))throw new TypeError(`${k} must be single line`)}
 number(d.min,'min');number(d.max,'max');number(d.max-d.min,'span',Number.MIN_VALUE);number(d.value,'value',d.min,d.max);
 const startAngle=d.startAngle??135,endAngle=d.endAngle??405;
 number(startAngle,'startAngle',-360,360);number(endAngle,'endAngle',-330,660);number(endAngle-startAngle,'sweep',30,300);
 const ticks=d.ticks??7,precision=d.precision??0;
 number(ticks,'ticks',2,21);number(precision,'precision',0,3);if(!Number.isInteger(ticks)||!Number.isInteger(precision))throw new TypeError('ticks and precision must be integers');
 const variant=d.variant??'knob';if(!['knob','gauge'].includes(variant))throw new RangeError('variant must be knob or gauge');
 const theme={surface:'#171b22',ink:'#f6f1e9',muted:'#9da7b6',accent:'#ff8438',track:'#414956',fontFamily:'sans-serif',fontSize:18,...t};
 for(const k of ['surface','ink','muted','accent','track'])color(theme[k],k);
 text(theme.fontFamily,'fontFamily',100);number(theme.fontSize,'fontSize',12,28);
 return {bounds:{...b},data:{...d,startAngle,endAngle,ticks,precision,variant},theme};
}
const intersects=(a,b)=>a.x<b.x+b.width+6&&a.x+a.width+6>b.x&&a.y<b.y+b.height+6&&a.y+a.height+6>b.y;
export function draw(ctx,props){
 const {bounds:b,data:d,theme:t}=validate(props);
 if(!ctx||typeof ctx.measureText!=='function')throw new TypeError('Canvas 2D context required');
 const f=t.fontSize,pad=24,top=pad+f*1.2+22,bottom=b.height-pad-f*2.2*1.2-16;
 const cx=b.width/2,cy=(top+bottom)/2,r=Math.min(b.width/2-64,(bottom-top)/2-22-f*.432-8);
 if(r<55)throw new RangeError('bounds too small for radial scale and text');
 const angle=q=>(d.startAngle+(d.endAngle-d.startAngle)*q)*Math.PI/180;
 const point=(a,radius)=>({x:cx+Math.cos(a)*radius,y:cy+Math.sin(a)*radius});
 const normalized=(d.value-d.min)/(d.max-d.min),displayedValue=d.value.toFixed(d.precision)+' '+d.unit;
 const regions=[];
 // Complete text and pairwise geometry preflight before painting any pixels.
 state(ctx,()=>{
  font(ctx,f,t.fontFamily,600);if(ctx.measureText(d.label).width>b.width-2*pad)throw new RangeError('label overflow');
  font(ctx,f*2.2,t.fontFamily,700);if(ctx.measureText(displayedValue).width>b.width-2*pad)throw new RangeError('value overflow');
  font(ctx,f*.72,t.fontFamily);const seen=new Set();
  for(let i=0;i<d.ticks;i++){
   const q=i/(d.ticks-1),value=d.min+(d.max-d.min)*q,label=value.toFixed(d.precision);
   if(seen.has(label))throw new RangeError('tick precision hides distinct values');seen.add(label);
   const p=point(angle(q),r+22),width=ctx.measureText(label).width,height=f*.72*1.2;
   const box={x:p.x-width/2,y:p.y-height/2,width,height};
   if(box.x<pad||box.x+width>b.width-pad||box.y<top||box.y+height>bottom)throw new RangeError('tick labels outside reserved dial region');
   if(regions.some(other=>intersects(box,other.box)))throw new RangeError('tick labels overlap; reduce ticks or enlarge bounds');
   regions.push({value,label,point:p,box,angle:angle(q)});
  }
 });
 return local(ctx,b,()=>{
  ctx.fillStyle=t.surface;ctx.beginPath();ctx.roundRect(0,0,b.width,b.height,22);ctx.fill();
  font(ctx,f,t.fontFamily,600);ctx.textBaseline='top';ctx.textAlign='center';ctx.fillStyle=t.muted;ctx.fillText(d.label,cx,pad);
  const arc=(end,color,width)=>{ctx.beginPath();ctx.arc(cx,cy,r,angle(0),end);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke()};
  arc(angle(1),t.track,d.variant==='gauge'?12:4);arc(angle(normalized),t.accent,d.variant==='gauge'?12:4);
  for(const tick of regions){const a=point(tick.angle,r-9),z=point(tick.angle,r-2);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(z.x,z.y);ctx.strokeStyle=t.muted;ctx.lineWidth=1;ctx.stroke();font(ctx,f*.72,t.fontFamily);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=t.muted;ctx.fillText(tick.label,tick.point.x,tick.point.y)}
  const pointer=point(angle(normalized),d.variant==='knob'?r*.76:r);
  if(d.variant==='knob'){ctx.beginPath();ctx.arc(cx,cy,r*.7,0,Math.PI*2);ctx.fillStyle=t.track;ctx.fill();const p=point(angle(normalized),r*.43);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(pointer.x,pointer.y);ctx.strokeStyle=t.accent;ctx.lineWidth=5;ctx.lineCap='round';ctx.stroke()}
  else{ctx.beginPath();ctx.arc(pointer.x,pointer.y,8,0,Math.PI*2);ctx.fillStyle=t.ink;ctx.fill()}
  font(ctx,f*2.2,t.fontFamily,700);ctx.textAlign='center';ctx.textBaseline='top';ctx.fillStyle=t.ink;ctx.fillText(displayedValue,cx,bottom+16);
  return {id,bounds:{...b},center:{x:b.x+cx,y:b.y+cy},radius:r,normalized,value:d.value,displayedValue,unit:d.unit,pointer:{x:b.x+pointer.x,y:b.y+pointer.y},ticks:regions.map(z=>({value:z.value,label:z.label,bounds:{...z.box,x:z.box.x+b.x,y:z.box.y+b.y}})),staticOnly:true};
 });
}
