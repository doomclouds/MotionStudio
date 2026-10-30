/** Parameterized native surfaces; no remote resources, fonts or source images. */
export const id = 'design.material-surfaces.v1';
export const version = 1;
export const guidance = './docs/material-surfaces.md';
const styleKeys=['fillStyle','strokeStyle','font','textAlign','textBaseline','lineWidth','lineCap','globalAlpha'];
const snapshot=c=>Object.fromEntries(styleKeys.map(k=>[k,c[k]]));
const restore=(c,s)=>{c.restore();for(const k of styleKeys)c[k]=s[k];};
const finite=(n,k)=>{if(!Number.isFinite(n))throw new TypeError(`${k} must be finite`);return n;};
const bounded=(n,k,a,b)=>{finite(n,k);if(n<a||n>b)throw new RangeError(`${k}: ${a}..${b}`);return n;};
function color(v,k){if(typeof v!=='string'||!/^#[0-9a-f]{6}$/i.test(v))throw new TypeError(`${k} must be #RRGGBB`);return v;}
function text(v,k){if(v!==undefined&&(typeof v!=='string'||v.length>100||/[\n\r]/.test(v)))throw new TypeError(`${k} must be a single line <=100 characters`);return v||'';}
export function validate(props){
 if(!props||!props.bounds||!props.data)throw new TypeError('bounds and data required');
 const b=props.bounds,d=props.data,t=props.theme||{};
 finite(b.x,'x');finite(b.y,'y');bounded(b.width,'width',120,1600);bounded(b.height,'height',100,1200);
 if(!['glass','paper','opaque'].includes(d.variant))throw new RangeError('variant must be glass, paper or opaque');
 const p=d.padding??24;bounded(p,'padding',8,80);if(p*2>=Math.min(b.width,b.height))throw new RangeError('padding leaves no content');
 const r=d.radius??(d.variant==='paper'?0:24);bounded(r,'radius',0,Math.min(b.width,b.height)/2);
 bounded(d.elevation??1,'elevation',0,3);bounded(d.opacity??.18,'opacity',.04,.75);
 text(d.title,'title');text(d.subtitle,'subtitle');
 const size=t.fontSize??24;bounded(size,'fontSize',10,60);
 if(t.fontFamily!==undefined&&(typeof t.fontFamily!=='string'||/[;\n\r]/.test(t.fontFamily)||t.fontFamily.length>100))throw new TypeError('fontFamily invalid');
 for(const k of ['surface','ink','muted','edge','shadow'])if(t[k]!==undefined)color(t[k],k);
 const header=(d.title?size*1.3:0)+(d.subtitle?size*.9:0);
 if(header+p*2>b.height)throw new RangeError('heading leaves no content');
 return {bounds:{...b},data:{...d,padding:p,radius:r,elevation:d.elevation??1,opacity:d.opacity??.18,title:d.title||'',subtitle:d.subtitle||''},theme:{surface:'#ffffff',ink:'#182334',muted:'#556070',edge:'#ffffff',shadow:'#081946',fontFamily:'sans-serif',fontSize:24,...t}};
}
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const rgba=(h,a)=>`rgba(${rgb(h).join(',')},${a})`;
function rr(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r);}
// Exact bounded separable box blur on an alpha mask. Three passes approximate a soft shadow,
// independent of Native shadowBlur behavior under transforms or clip regions.
function softShadow(ctx,b,d,t,api){
 const e=d.elevation;if(e===0)return;
 if(!api||typeof api.createCanvas!=='function')throw new TypeError('elevated surfaces require env.canvasApi.createCanvas');
 const R=Math.ceil(4+e*3),pad=R*3+3,W=Math.ceil(b.width)+pad*2,H=Math.ceil(b.height)+pad*2;
 const off=api.createCanvas(W,H),c=off.getContext('2d');c.fillStyle='#ffffff';rr(c,pad,pad,b.width,b.height,d.radius);c.fill();
 const pixels=c.getImageData(0,0,W,H),len=W*H;let a=new Float32Array(len);
 for(let i=0;i<len;i++)a[i]=pixels.data[i*4+3];
 for(let pass=0;pass<3;pass++){
  const h=new Float32Array(len),v=new Float32Array(len);
  for(let y=0;y<H;y++){let sum=0;for(let k=0;k<=R;k++)sum+=a[y*W+k];for(let x=0;x<W;x++){h[y*W+x]=sum/(R*2+1);if(x-R>=0)sum-=a[y*W+x-R];if(x+R+1<W)sum+=a[y*W+x+R+1];}}
  for(let x=0;x<W;x++){let sum=0;for(let k=0;k<=R;k++)sum+=h[k*W+x];for(let y=0;y<H;y++){v[y*W+x]=sum/(R*2+1);if(y-R>=0)sum-=h[(y-R)*W+x];if(y+R+1<H)sum+=h[(y+R+1)*W+x];}}
  a=v;
 }
 const [red,green,blue]=rgb(t.shadow);for(let i=0;i<len;i++){pixels.data[i*4]=red;pixels.data[i*4+1]=green;pixels.data[i*4+2]=blue;pixels.data[i*4+3]=Math.round(a[i]*.24);}
 c.putImageData(pixels,0,0);ctx.drawImage(off,-pad,-pad+e*8);
}
export function draw(ctx,props,env={}){
 const {bounds:b,data:d,theme:t}=validate(props);if(!ctx||typeof ctx.save!=='function')throw new TypeError('Canvas 2D context required');
 if(d.variant==='glass'&&(typeof env.backdrop!=='function'||!env.canvasApi))throw new TypeError('glass requires env.backdrop and env.canvasApi');
 const font=`600 ${t.fontSize}px ${t.fontFamily}`,small=`400 ${t.fontSize*.65}px ${t.fontFamily}`;
 // Check before painting: overflow is explicit, never silently shrink/crop the title.
 const measureStyle=snapshot(ctx);ctx.save();try{ctx.font=font;if(ctx.measureText(d.title).width>b.width-d.padding*2)throw new RangeError('title overflow');ctx.font=small;if(ctx.measureText(d.subtitle).width>b.width-d.padding*2)throw new RangeError('subtitle overflow');}finally{restore(ctx,measureStyle);}
 const drawStyle=snapshot(ctx);ctx.save();try{
  ctx.translate(b.x,b.y);
  if(d.variant==='paper'){
   if(d.elevation){ctx.fillStyle=t.shadow;ctx.fillRect(d.elevation*5,d.elevation*5,b.width,b.height);}
  }else softShadow(ctx,b,d,t,env.canvasApi);
  if(d.variant==='glass'){
   const off=env.canvasApi.createCanvas(Math.ceil(b.width),Math.ceil(b.height)),q=off.getContext('2d');
   q.save();try{env.backdrop({ctx:q,width:b.width,height:b.height,bounds:{...b}});}finally{q.restore();}
   ctx.save();rr(ctx,0,0,b.width,b.height,d.radius);ctx.clip();ctx.drawImage(off,0,0,b.width,b.height);ctx.restore();
   const gradient=ctx.createLinearGradient(0,0,b.width,b.height);gradient.addColorStop(0,rgba(t.surface,d.opacity+.18));gradient.addColorStop(1,rgba(t.surface,d.opacity));ctx.fillStyle=gradient;
  }else ctx.fillStyle=t.surface;
  rr(ctx,0,0,b.width,b.height,d.radius);ctx.fill();ctx.strokeStyle=d.variant==='glass'?rgba(t.edge,.65):t.edge;ctx.lineWidth=d.variant==='paper'?2:1;rr(ctx,1,1,b.width-2,b.height-2,Math.max(0,d.radius-1));ctx.stroke();
  let y=d.padding;ctx.textBaseline='top';ctx.textAlign='left';ctx.fillStyle=t.ink;ctx.font=font;if(d.title){ctx.fillText(d.title,d.padding,y);y+=t.fontSize*1.3;}
  ctx.fillStyle=t.muted;ctx.font=small;if(d.subtitle){ctx.fillText(d.subtitle,d.padding,y);y+=t.fontSize*.9;}
  return {id,bounds:{...b},contentBounds:{x:b.x+d.padding,y:b.y+y,width:b.width-d.padding*2,height:b.height-y-d.padding},material:d.variant,headingHeight:y-d.padding,staticOnly:true};
 }finally{restore(ctx,drawStyle);}
}
