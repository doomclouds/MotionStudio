// Fixed 1200x750 Native Canvas port of Huashu's cinematic sound specimen.
// Text and geometric layers, no screenshot raster. Wave coordinates are ported from source SVG.
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const config={width:1200,height:750,fps:1,duration:1};
export const dependencies=['./content.json','./waveform.json','../fonts.lock.json'];
const fontRoot=process.env.TEA_FONT_DIR;

export const palette={background:'#000000',white:'#ffffff',nav:'#c9c9d6',subtitle:'#d8d8e6',body:'#b4b4c6',label:'#8f93ff',border:'#2a2a38',surfaceTop:'#0d0d16',surfaceBottom:'#050508',wave:['#2F6BFF','#6A5CFF','#B26BFF']};
export function createScene({ctx:c,GlobalFonts}){
 if(!fontRoot||!path.isAbsolute(fontRoot))throw Error('Set TEA_FONT_DIR to an absolute directory containing the documented licensed fonts');
 for(const item of JSON.parse(readFileSync(root+'/fonts.lock.json','utf8')).fonts){const bytes=readFileSync(path.join(fontRoot,item.output));if(createHash('sha256').update(bytes).digest('hex')!==item.sha256)throw Error('Font hash mismatch: '+item.output);}
 for(const prefix of ['Sans','Sora'])for(const weight of prefix==='Sans'?[300,400,500,700,900]:[300,500,800])if(!GlobalFonts.registerFromPath(fontRoot+`/Tea${prefix}${weight}.ttf`,prefix+weight))throw Error('Font registration failed');
 const data=JSON.parse(readFileSync(root+'/design/content.json','utf8')),wave=JSON.parse(readFileSync(root+'/design/waveform.json','utf8')).bars,p=palette;
 const rr=(x,y,w,h,r,fill,stroke=null)=>{c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke()}};
 const text=(s,x,y,size,family,color=p.white,spacing=0)=>{c.font=`400 ${size}px ${family}`;c.textBaseline='alphabetic';c.textAlign='left';c.fillStyle=color;c.letterSpacing=spacing+'px';c.fillText(s,x,y);c.letterSpacing='0px'};
 const label=(s,x,y)=>{let a=s.split('今晚');text(a[0],x,y,13,'Sora300',p.label,1.3);if(a.length>1){c.font='400 13px Sora300';c.letterSpacing='1.3px';const w=c.measureText(a[0]).width;c.letterSpacing='0px';text('今晚',x+w,y,13,'Sans500',p.label,1.3)}};
 return{render(){
 c.fillStyle=p.background;c.fillRect(0,0,1200,750);
 const g=c.createLinearGradient(0,0,1200,0);p.wave.forEach((v,i)=>g.addColorStop(i/2,v));c.save();c.globalAlpha=.95;for(const [x,y,w,h,r]of wave)rr(x,350+y,w,h,r,g);c.restore();
 const fade=c.createLinearGradient(0,0,1200,0);fade.addColorStop(0,'rgba(0,0,0,.75)');fade.addColorStop(.35,'rgba(0,0,0,.35)');fade.addColorStop(.6,'rgba(0,0,0,0)');fade.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=fade;c.fillRect(0,0,1200,750);
 text(data.brand,48,58,22,'Sans700',p.white,-.44);
 data.navigation.forEach((s,i)=>text(s,[834,900,966][i],57,16,'Sans700',p.nav));rr(1048,30,104,40,20,p.white);text(data.cta,1068,57,16,'Sans700','#000');
 data.title.forEach((s,i)=>text(s,48,214.17+i*110.16,108,'Sans900',p.white,-4.32));
 data.subtitle.forEach((s,i)=>text(s,52,400.46+i*36,24,'Sans300',p.subtitle));
 data.cards.forEach((d,i)=>{const x=48+i*(1104/3+20/3),w=1064/3;const bg=c.createLinearGradient(0,586,0,714);bg.addColorStop(0,p.surfaceTop);bg.addColorStop(1,p.surfaceBottom);rr(x+.5,586.5,w-1,127,17.5,bg,p.border);label(d.label,x+23,621);text(d.title,x+23,659,22,'Sans700');text(d.body,x+23,688,16,'Sans700',p.body)});
 }};
}
