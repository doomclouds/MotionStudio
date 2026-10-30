import {readFileSync} from 'node:fs';
import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const config={width:1200,height:750,fps:1,duration:1};
export const dependencies=['./content.json'];
const fontRoot=process.env.MUQI_FONT_DIR;
export const content=JSON.parse(readFileSync(new URL('./content.json',import.meta.url),'utf8'));
export function createScene({ctx:c,GlobalFonts}){
if(!fontRoot||!path.isAbsolute(fontRoot))throw Error('Set MUQI_FONT_DIR to the absolute licensed-font directory');

for(const w of [400,500,600,700,900])if(!GlobalFonts.registerFromPath(fontRoot+`/MuqiSans${w}.ttf`,`MuqiSans${w}`))throw Error('Missing MuqiSans font '+w);for(const w of [400,500,600,700])if(!GlobalFonts.registerFromPath(fontRoot+`/MuqiLatin${w}.ttf`,`MuqiLatin${w}`))throw Error('Missing MuqiLatin font '+w);
const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h)},rr=(x,y,w,h,r,color)=>{c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=color;c.fill()};
const text=(s,x,y,size=16,weight=400,color='#0A2540',tracking=0)=>{c.font=`${size}px MuqiLatin${weight}, MuqiSans${weight}`;c.fillStyle=color;c.letterSpacing=tracking+'px';c.textBaseline='alphabetic';c.textAlign='left';c.fillText(s,x,y);c.letterSpacing='0px'};
const right=(s,x,y,size,weight,col)=>{c.font=`${size}px MuqiLatin${weight}, MuqiSans${weight}`;text(s,x-c.measureText(s).width,y,size,weight,col)};
return {render(){c.resetTransform();c.clearRect(0,0,1200,750);rect(0,0,1200,750,'#fff');
c.save();c.translate(-100,-260);c.transform(1,-Math.tan(9*Math.PI/180),0,1,0,0);let g=c.createLinearGradient(0,210,1820,530);[[0,'#635BFF'],[.22,'#8A5CFF'],[.48,'#00B8F0'],[.62,'#7AE6C0'],[.82,'#FF7AB8'],[1,'#FFB35C']].forEach(([p,v])=>g.addColorStop(p,v));rect(0,0,1400,740,g);let glow=c.createRadialGradient(1092,592,0,1092,592,500);glow.addColorStop(0,'rgba(255,255,255,.25)');glow.addColorStop(1,'rgba(255,255,255,0)');rect(0,0,1400,740,glow);c.restore();
text(content.brand,64,45,23,700,'#fff',-.5);['票务','场地','结算','开发者'].forEach((s,i)=>text(s,[156,218,280,342][i],42,15,700,'#fff'));rr(1036,16,100,41,22,'#fff');text('联系我们',1056,42,15,700,'#635BFF');
content.headline.forEach((s,i)=>text(s,64,184+i*66,60,900,'#fff',-2));content.description.forEach((s,i)=>text(s,64,305+i*30.4,19,500,'#fff'));
rr(64,372,132,50,25,'#0A2540');text('免费开通 →',88,404,16,700,'#fff');rr(208,372,98,50,25,'rgba(255,255,255,.2)');c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=1;c.stroke();text('看演示',233,404,16,700,'#fff');
// Complete editable payout evidence card; no screenshot asset.
c.save();c.translate(956,306);c.rotate(-1.5*Math.PI/180);c.translate(-216,-178);c.shadowColor='rgba(50,50,93,.65)';c.shadowBlur=36;c.shadowOffsetY=28;rr(0,0,432,356,14,'#fff');c.shadowColor='transparent';text('本周演出 · 青砖剧场',24,40,13,400,'#697386',.5);text('《雨巷里的人》第 3 场',24,72,21,900,'#0A2540',-.3);
for(let i=0;i<4;i++){rect(24,88+i*46,384,1,'#E3E8EE');text(content.rows[i][0],24,118+i*46,16,500);right(content.rows[i][1],408,118+i*46,16,600,'#0A2540')};rr(24,284,384,49,8,'#635BFF');text('已于周四 09:00 结算到账',128,315,16,700,'#fff');c.restore();
content.features.forEach((f,i)=>{let x=64+i*(333.333+36);rect(x,548,333.333,2,'#0A2540');text(f[0],x,580,13,700,'#635BFF',1);text(f[1],x,616,21,900,'#0A2540',-.3);f[2].forEach((s,j)=>text(s,x,645+j*25.6,16,500,'#425466'))});
}}}
