// 1200×750 fixed-frame reconstruction of Huashu's vinyl-shop specimen.
// No reference raster, generated raster, screenshot texture, or animation.
import {readFileSync} from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const config={width:1200,height:750,fps:1,duration:1};
export const dependencies=['./content.json'];
const fontRoot=process.env.VINYL_FONT_DIR; // External, licensed font directory; no fonts redistributed.

export const palette={paper:'#EBDDBF',ink:'#1B1B1B',red:'#C8382B',yellow:'#E9A800',blue:'#1F3FA8',purple:'#6B3FA0',olive:'#6B7A2A',cream:'#F6EEDC'};
export const layout={title:[70,96,447.12,235.6,-4],bluePaper:[620,90,420,300,5],olivePaper:[60,470,330,190,-3],record:[840,270,150],weekly:[446,456,346,123,3],event:[90,500,316,99,-4],price:[850,540,268,100,-6]};
export function createScene({ctx:c,GlobalFonts}){
 if(!fontRoot||!path.isAbsolute(fontRoot))throw Error('Set VINYL_FONT_DIR to an absolute directory containing the documented licensed fonts');
 for(const [file,family]of [['VinylSerif900.ttf','Serif900'],['VinylSerif700.ttf','Serif700'],['VinylSans500.ttf','Sans500'],['VinylSans600.ttf','Sans600'],['VinylSans700.ttf','Sans700'],['VinylSans900.ttf','Sans900'],['Bungee-Regular.ttf','Bungee'],['SpaceMono-Bold.ttf','SpaceMono'],['DMSerifDisplay-Regular.ttf','DMSerif']])if(!GlobalFonts.registerFromPath(fontRoot+'/'+file,family))throw Error('Font failed '+file);
 const data=JSON.parse(readFileSync(root+'/design/content.json','utf8')),p=palette;
 const rect=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)};
 const disk=(x,y,r,col)=>{c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=col;c.fill()};
 const txt=(s,x,y,size,family,col=p.ink,tracking=0)=>{c.font=`400 ${size}px ${family}`;c.fillStyle=col;c.textBaseline='alphabetic';c.textAlign='left';c.letterSpacing=tracking+'px';c.fillText(s,x,y);c.letterSpacing='0px'};
 const mixedMono=(s,x,y,right=null)=>{let runs=[...s].map(ch=>({ch,fam:/[\u2E80-\u9FFF№]/.test(ch)?'Sans700':'SpaceMono'}));for(const r of runs){c.font=`400 16px ${r.fam}`;r.w=c.measureText(r.ch).width}if(right!==null)x=right-runs.reduce((a,r)=>a+r.w,0);for(const r of runs){txt(r.ch,x,y,16,r.fam);x+=r.w}};
 const rotate=(x,y,w,h,deg,fn)=>{c.save();c.translate(x+w/2,y+h/2);c.rotate(deg*Math.PI/180);c.translate(-w/2,-h/2);fn();c.restore()};
 const tag=(s,x,y,w,deg,col,textColor=p.ink)=>rotate(x,y,w,43,deg,()=>{rect(0,0,w,43,p.ink);rect(3,3,w-6,37,col);txt(s,17,29,17,'Sans900',textColor,.68)});
 const card=(box,content)=>rotate(...box,()=>{const w=box[2],h=box[3];rect(8,8,w,h,p.ink);rect(0,0,w,h,p.ink);rect(3,3,w-6,h-6,p.cream);txt(content.heading,23,45,30,'Serif700');content.lines.forEach((s,i)=>txt(s,23,74+i*24,16,'Sans600'));});
 return{render(){
 rect(0,0,1200,750,p.paper);
 // Regular radial paper dots, not a photographic texture overlay.
 for(let y=3;y<750;y+=7)for(let x=3;x<1200;x+=7)for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const alpha=.155*Math.exp(-(dx*dx+dy*dy)/(2*.85*.85));rect(x+dx,y+dy,1,1,`rgba(60,40,10,${alpha})`)}
 tag(data.navigation[0],48,30,86,-3,p.cream);tag(data.navigation[1],150,44,87,2,p.yellow);tag(data.navigation[2],252,28,105,-1,p.purple,p.cream);
 mixedMono(data.identity,915,50,1152);
 rotate(...layout.bluePaper,()=>rect(0,0,420,300,p.blue));disk(685,505,125,p.yellow);rotate(...layout.olivePaper,()=>rect(0,0,330,190,p.olive));rotate(960,420,220,190,14,()=>rect(0,0,220,190,p.red));
 // Record groove field with the source's hard 6px lower-right shadow.
 disk(846,276,150,p.ink);disk(840,270,150,p.ink);c.save();c.beginPath();c.arc(840,270,150,0,Math.PI*2);c.clip();c.strokeStyle='#2c2c2c';c.lineWidth=1;for(let rad=4.5;rad<152;rad+=5){c.beginPath();c.arc(840,270,rad,0,Math.PI*2);c.stroke()}c.restore();disk(840,270,47,p.red);
 txt('A',825,277,18,'Bungee',p.cream);txt('面',838,277,18,'Sans700',p.cream);
 rotate(...layout.title,()=>{txt(data.title[0],0,112.53,124,'Serif900',p.ink,-4.96);txt(data.title[1],95,235.33,124,'Serif900',p.ink,-4.96);txt(data.title[1],90,230.33,124,'Serif900',p.red,-4.96)});
 // Red audio-wave cue, clipped exactly as the SVG viewport in the source.
 c.save();c.beginPath();c.rect(40,420,300,40);c.clip();c.beginPath();c.moveTo(40,440);for(let i=0;i<8;i++){c.quadraticCurveTo(40+i*37.5+18.75,440+(i%2===0?-26:26),40+(i+1)*37.5,440)}c.strokeStyle=p.red;c.lineWidth=6;c.lineCap='round';c.stroke();c.restore();
 for(let row=0;row<3;row++)for(let col=0;col<4;col++)disk(1050+30*col,310+30*row,5,p.ink);
 card(layout.weekly,data.weekly);card(layout.event,data.event);
 rotate(...layout.price,()=>{txt(data.price,5,91,100,'Bungee',p.yellow);txt(data.price,0,86,100,'Bungee',p.blue)});
 rotate(800,664,205,24,-6,()=>txt(data.priceNote,0,19,16,'Sans900'));
 mixedMono(data.hours,150,716);
 }};
}
