import {readFileSync} from 'node:fs';
import path from 'node:path';import{fileURLToPath}from'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const config={width:1200,height:750,fps:1,duration:1};
export const dependencies=['./content.json'];
const fontRoot=process.env.CYCLING_FONT_DIR;
export const content=JSON.parse(readFileSync(new URL('./content.json',import.meta.url),'utf8'));
export function createScene({ctx:c,GlobalFonts,canvasApi}){
if(!fontRoot||!path.isAbsolute(fontRoot))throw Error('Set CYCLING_FONT_DIR to the absolute licensed-font directory');
for(const w of [500,700,900])if(!GlobalFonts.registerFromPath(fontRoot+`/CyclingSans${w}.ttf`,`CyclingSans${w}`))throw Error('Missing CyclingSans font '+w);if(!GlobalFonts.registerFromPath(fontRoot+'/ArchivoBlack-Regular.ttf','CyclingArchivo'))throw Error('Missing Archivo font');
const rect=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)},rr=(x,y,w,h,r,col)=>{c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=col;c.fill()},txt=(s,x,y,size,weight=900,col='#fff',tracking=0)=>{c.font=`${size}px CyclingSans${weight}`;c.letterSpacing=tracking+'px';c.fillStyle=col;c.textAlign='left';c.textBaseline='alphabetic';c.fillText(s,x,y);c.letterSpacing='0px'};
// Self-generated typography mask, blurred in pixel space; never a source screenshot.
const sh=canvasApi.createCanvas(1000,450),sc=sh.getContext('2d');sc.font='300px CyclingArchivo';sc.letterSpacing='-18px';sc.fillStyle='#000';sc.fillText(content.distance,40,300);const im=sc.getImageData(0,0,1000,450);let a=new Float32Array(450000);for(let i=0;i<a.length;i++)a[i]=im.data[i*4+3];
function box(src,w,h,r,horizontal){const out=new Float32Array(src.length),n=horizontal?w:h,m=horizontal?h:w;for(let j=0;j<m;j++){let sum=0;const at=i=>horizontal?j*w+i:i*w+j;for(let k=-r;k<=r;k++)if(k>=0&&k<n)sum+=src[at(k)];for(let i=0;i<n;i++){out[at(i)]=sum/(2*r+1);if(i-r>=0)sum-=src[at(i-r)];if(i+r+1<n)sum+=src[at(i+r+1)]}}return out}for(let k=0;k<3;k++){a=box(a,1000,450,15,true);a=box(a,1000,450,15,false)}for(let i=0;i<a.length;i++){im.data[i*4]=0;im.data[i*4+1]=0;im.data[i*4+2]=0;im.data[i*4+3]=Math.round(a[i]*.45)}sc.putImageData(im,0,0);
return{render(){c.resetTransform();c.clearRect(0,0,1200,750);rect(0,0,1200,750,'#FF2E93');c.beginPath();c.moveTo(916.2,0);c.lineTo(1200,0);c.lineTo(1200,750);c.lineTo(770,750);c.closePath();c.fillStyle='#00D9E8';c.fill();
c.save();c.beginPath();c.roundRect(854,70,290,380,[150,150,24,24]);c.clip();let grad=c.createLinearGradient(884,70,1114,450);grad.addColorStop(0,'#FF2E93');grad.addColorStop(1,'#2B1BFF');rect(854,70,290,380,grad);c.strokeStyle='rgba(255,255,255,.14)';c.lineWidth=2;for(let a=-390;a<400;a+=19.8){c.beginPath();c.moveTo(854+a,70);c.lineTo(854+a+380,450);c.stroke()}c.restore();txt(content.portrait,945,430,13,500,'#fff',1.3);
c.save();c.translate(174,71);c.rotate(-3*Math.PI/180);rr(-114,-23,228,46,30,'#000');txt(content.title,-98,9,22,900);c.restore();
// Flat typography with layered 2D offsets and affine tilt, not a 3D scene.
c.save();c.translate(40,300);c.rotate(-5*Math.PI/180);c.scale(.984,.99);c.translate(0,-150);c.font='300px CyclingArchivo';c.letterSpacing='-18px';c.textBaseline='alphabetic';c.drawImage(sh,-12,-31);for(let n=24;n>=2;n-=2){c.fillStyle=n>=22?'#7A2400':n>=16?'#B03C00':n>=10?'#E0600A':'#FF8A00';c.fillText(content.distance,n,235+n)}c.fillStyle='#FFE600';c.fillText(content.distance,0,235);c.letterSpacing='0px';c.restore();
txt(content.unit,68,510,60,900);txt(content.context,68,555,22,500);rect(0,630,1200,120,'#FF8A00');txt(content.route,68,700,30,900,'#000',.6);txt(content.hashtag,1012,697,28,900,'#000');
}}}
