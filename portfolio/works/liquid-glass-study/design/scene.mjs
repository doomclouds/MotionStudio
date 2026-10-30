import {readFileSync} from 'node:fs';
import path from 'node:path';import{fileURLToPath}from'node:url';
const fontRoot=process.env.LIQUID_GLASS_FONT_DIR;
export const config={width:1200,height:750,fps:1,duration:1};
export const dependencies=['./content.json'];
export const content=JSON.parse(readFileSync(new URL('./content.json',import.meta.url),'utf8'));
export function createScene({ctx:c,GlobalFonts,canvasApi}){
if(!fontRoot||!path.isAbsolute(fontRoot))throw Error('Set LIQUID_GLASS_FONT_DIR to an absolute licensed-font directory');
for(const w of [400,500,600,700,800])for(const prefix of ['GlassSans','GlassInter'])if(!GlobalFonts.registerFromPath(path.join(fontRoot,`${prefix}${w}.ttf`),prefix+w))throw Error('Font registration failed');
const rr=(x,y,w,h,r,fill,stroke)=>{c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke()}};
const text=(s,x,y,size=16,weight=600,color='#fff',tracking=0,align='left')=>{c.font=`${size}px GlassInter${weight},GlassSans${weight}`;c.fillStyle=color;c.textBaseline='alphabetic';c.textAlign=align;c.letterSpacing=tracking+'px';c.fillText(s,x,y);c.letterSpacing='0px'};
const grad=(x,y,w,h,deg,stops)=>{const a=deg*Math.PI/180,dx=Math.sin(a),dy=-Math.cos(a),l=Math.abs(w*dx)+Math.abs(h*dy),cx=x+w/2,cy=y+h/2;let g=c.createLinearGradient(cx-dx*l/2,cy-dy*l/2,cx+dx*l/2,cy+dy*l/2);stops.forEach(([t,col])=>g.addColorStop(t,col));return g};
const palettes={coral:[[0,'#FF9A5A'],[.28,'#F45B8B'],[.62,'#6A4CD6'],[1,'#143B8F']],sea:[[0,'#0F8F9E'],[.45,'#18C0A8'],[1,'#E6F6A8']],violet:[[0,'#1B2A6B'],[.45,'#4D4AC2'],[1,'#F27A9B']]};
const softShadow=(x,y,w,h,r)=>{const pad=48,W=Math.ceil(w)+pad*2,H=Math.ceil(h)+pad*2,off=canvasApi.createCanvas(W,H),q=off.getContext('2d');q.fillStyle='#fff';q.beginPath();q.roundRect(pad,pad,w,h,r);q.fill();const pix=q.getImageData(0,0,W,H);let v=new Float32Array(W*H);for(let i=0;i<v.length;i++)v[i]=pix.data[i*4+3];const R=10;
for(let pass=0;pass<3;pass++){const t=new Float32Array(v.length),u=new Float32Array(v.length);for(let yy=0;yy<H;yy++){let sum=0;for(let k=0;k<=R;k++)sum+=v[yy*W+k];for(let xx=0;xx<W;xx++){t[yy*W+xx]=sum/(2*R+1);if(xx-R>=0)sum-=v[yy*W+xx-R];if(xx+R+1<W)sum+=v[yy*W+xx+R+1]}}for(let xx=0;xx<W;xx++){let sum=0;for(let k=0;k<=R;k++)sum+=t[k*W+xx];for(let yy=0;yy<H;yy++){u[yy*W+xx]=sum/(2*R+1);if(yy-R>=0)sum-=t[(yy-R)*W+xx];if(yy+R+1<H)sum+=t[(yy+R+1)*W+xx]}}v=u}
for(let i=0;i<v.length;i++){pix.data[i*4]=8;pix.data[i*4+1]=25;pix.data[i*4+2]=70;pix.data[i*4+3]=v[i]*.28}q.putImageData(pix,0,0);c.drawImage(off,x-pad,y-pad+12);
};
const glass=(x,y,w,h,r=30,strong=false)=>{c.save();
// Source-independent backdrop: sample only this native scene, then saturate.
const m=c.getTransform(),ax=Math.floor(m.a*x+m.e),ay=Math.floor(m.d*y+m.f),aw=Math.ceil(w*m.a),ah=Math.min(Math.ceil(h*m.d),750-ay);let off=null;
if(ax>=0&&ay>=0&&aw>0&&ah>0&&ax+aw<=1200){const pixels=c.getImageData(ax,ay,aw,ah),d=pixels.data;for(let i=0;i<d.length;i+=4){const l=.213*d[i]+.715*d[i+1]+.072*d[i+2];for(let j=0;j<3;j++)d[i+j]=Math.max(0,Math.min(255,l+1.8*(d[i+j]-l)))}off=canvasApi.createCanvas(aw,ah);off.getContext('2d').putImageData(pixels,0,0)}
softShadow(x,y,w,h,r);if(off){c.save();c.beginPath();c.roundRect(x,y,w,h,r);c.clip();c.drawImage(off,x,y,aw/m.a,ah/m.d);c.restore()}
rr(x,y,w,h,r,grad(x,y,w,h,135,[[0,`rgba(255,255,255,${strong?.4:.34})`],[1,`rgba(255,255,255,${strong?.4:.08})`]]));rr(x+.5,y+.5,w-1,h-1,r-.5,null,'rgba(255,255,255,.45)');
c.save();c.beginPath();c.rect(x,y,w,18);c.clip();c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=1.5;c.beginPath();c.roundRect(x+.8,y+1.1,w-1.6,h-2,r);c.stroke();c.restore();c.restore()};
const tab=(on)=>{glass(24,670,312,64,34);['浪况','潮汐','地图'].forEach((s,i)=>{if(i===on)rr(38+i*99,681,76,42,24,'rgba(255,255,255,.35)','rgba(255,255,255,.6)');text(s,76+i*99,710,14,700,'#fff',0,'center')})};
const phone=(x,y,scale,kind,fn)=>{c.save();c.translate(x,y);c.scale(scale,scale);c.save();c.shadowColor='rgba(5,15,50,.50)';c.shadowBlur=70;c.shadowOffsetY=34;rr(-11,-11,382,782,63,'#4B5778');c.restore();rr(-9,-9,378,778,61,'#0A1022');c.save();c.beginPath();c.roundRect(0,0,360,760,52);c.clip();rr(0,0,360,760,52,grad(0,0,360,760,kind==='violet'?190:170,palettes[kind]));fn();rr(130,11,100,28,20,'#000');text('9:41',30,29,15,700);text('●●●',330,29,15,600,'#fff',0,'right');c.restore();c.restore()};
const blob=(x,y,rx,ry,col)=>{c.save();c.translate(x,y);c.scale(rx,ry);let g=c.createRadialGradient(0,0,0,0,0,1.2);g.addColorStop(0,col);g.addColorStop(.65,col);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(-1.2,-1.2,2.4,2.4);c.restore()};
return{render(){c.resetTransform();c.clearRect(0,0,1200,750);c.fillStyle=grad(0,0,1200,750,135,[[0,'#0F2A63'],[.35,'#2A56C8'],[.65,'#18A5C9'],[1,'#7BE3C6']]);c.fillRect(0,0,1200,750);blob(640,100,160,160,'rgba(255,122,168,.5)');blob(260,690,200,130,'rgba(154,240,212,.45)');blob(1110,570,150,150,'rgba(242,122,160,.5)');
phone(60,90,.92,'sea',()=>{text(content.site,24,72,14,700,'rgba(255,255,255,.9)',.56);text(content.headline,24,110,28,700);glass(18,132,324,144,30);text('浪高',38,166,14,700);text(content.wave,38,220,54,700,'#fff',-2);text('米',111,220,22,700);text('周期 9 秒，西南涌，适合长板。',38,251,16,500);glass(18,292,324,163,30);content.metrics.forEach(([l,r],i)=>{text(l,38,335+i*43,16,600);text(r,322,335+i*43,16,700,'#fff',0,'right');if(i<2){c.fillStyle='rgba(255,255,255,.22)';c.fillRect(38,348+i*43,284,1)}});tab(0)});
phone(430,36,1,'coral',()=>{glass(24,56,52,52,26);text('‹',50,91,28,700,'#fff',0,'center');glass(284,56,52,52,26);text('编辑',310,89,16,700,'#fff',0,'center');text('岬角北湾 · 周六',24,139,14,700,'rgba(255,255,255,.9)',.56);text(content.focus,24,220,84,700,'#fff',-3);text('米',138,220,30,700);text('涌浪抬升，日出前最干净',24,260,18,700);glass(10,477,340,273,44);rr(158,489,44,5,3,'rgba(255,255,255,.7)');text('逐小时',32,524,14,700);content.times.forEach(([t,v],i)=>{const x=32+i*76.5;glass(x,539,66.5,70,22,i===1);text(t,x+33.25,567,15,500,'#fff',0,'center');text(v,x+33.25,591,22,700,'#fff',0,'center')});text('潮位上升，建议 7 点前下水。',32,643,16,600);tab(1)});
phone(820,150,.92,'violet',()=>{text('我的浪点',24,88,28,700);content.spots.forEach(([icon,name,sub],i)=>{const y=111+i*103;glass(18,y,324,89,30);rr(38,y+18,52,52,26,'rgba(255,255,255,.3)');text(icon,64,y+53,20,700,'#fff',0,'center');text(name,104,y+43,18,700);text(sub,104,y+65,15,500,'rgba(255,255,255,.9)')});tab(2)});
glass(326,604,117,56,30);text('分享浪况',384.5,640,17,700,'#fff',0,'center');glass(800,56,60,60,30);text('+',830,95,22,700,'#fff',0,'center');
}}}
