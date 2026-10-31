import resources from '../resources.cjs';import fs from 'node:fs';import {createHash}from'node:crypto';
import{drawPixelMotif}from'./pixel-card.mjs';import{drawTimeline}from'./timeline.mjs';
export const config={width:1024,height:576,stage:{x:170.6666667,y:96,scale:8/15,width:1280,height:720}};
export function registerFonts(G){for(const [file,name]of [['Display.ttf','HanaDisplay'],['Italic.ttf','HanaItalic'],['Mono.ttf','HanaMono'],['Japanese700.ttf','HanaJP']]){if(!G.registerFromPath(resources.font(file),name))throw Error('font registration')}}
export function render(c,{revision=false,Path2D}={}){
 c.reset();c.fillStyle='#1a1816';c.fillRect(0,0,1024,576);c.save();c.shadowColor='#0009';c.shadowBlur=43;c.shadowOffsetY=16;c.fillStyle='#f5efe2';c.fillRect(170.667,96,682.667,384);c.restore();
 c.save();c.translate(config.stage.x,96);c.scale(8/15,8/15);
 c.fillStyle='#f5efe2';c.fillRect(0,0,1280,720);
 for(const [step,alpha,ox,oy]of [[4,.06,0,0],[7,.04,2,3]]){c.fillStyle='rgba(120,90,40,'+alpha+')';for(let y=oy;y<720;y+=step)for(let x=ox;x<1280;x+=step){c.beginPath();c.arc(x,y,1,0,7);c.fill()}}
 const text=(s,x,y,size=11,f='HanaMono',color='#6f6a60',spacing=0)=>{c.font=(f==='HanaDisplay'?'bold ':'')+size+'px '+f;c.fillStyle=color;c.letterSpacing=spacing+'px';c.fillText(s,x,y);c.letterSpacing='0px'};
 c.strokeStyle='#18161255';c.lineWidth=1;
 for(const [x,y,sx,sy] of [[14,14,1,1],[1266,14,-1,1],[14,670,1,-1],[1266,670,-1,-1]]){c.beginPath();c.moveTo(x+14*sx,y);c.lineTo(x,y);c.lineTo(x,y+14*sy);c.stroke()}
 text('名次の番組',32,38,13,'HanaJP','#181612');text('EP. 01 · NINTENDO TRIVIA',110,37,11,'HanaMono','#6f6a60',1.98);
 for(let i=0;i<12;i++){c.fillStyle=i?'#1816122e':'#181612';c.beginPath();c.arc(993+i*10,33,3,0,7);c.fill()}
 text('01 / 12',1119,37,11,'HanaMono','#6f6a60',1.98);c.strokeRect(1192,23,54,18);text('• REC',1198,36,10,'HanaMono','#181612',1);
 text('花札',1010,178,96,'HanaJP','#181612');
 // Captured bob phase: sprite top 158.5px rather than a claimed animation implementation.
 c.save();c.translate(960,158.5);c.fillStyle='#181612';c.beginPath();c.roundRect(8,8,168,252,10);c.fill();c.fillStyle='#ede4d0';c.beginPath();c.roundRect(0,0,168,252,10);c.fill();c.strokeStyle='#181612';c.lineWidth=4;c.stroke();c.fillStyle='#181612';c.fillRect(8,14,152,4);c.fillRect(8,234,152,4);drawPixelMotif(c,{x:24,y:32,scale:5});text('花',30,218,28,'HanaJP','#d92b1c');text('HANA · FLOWER',30,231,10,'HanaMono','#6f6a60',1.8);c.restore();
 c.fillStyle='#18161280';c.fillRect(76.8,401,24,1);text('CHAPTER 01 · KYOTO · A PLAYING-CARD COMPANY',111,405,11,'HanaMono','#6f6a60',2.42);
 const yearY=revision?555:600;
 text('1889',67,yearY,200,'HanaDisplay','#181612',-6);text('年',430,yearY-8,120,'HanaJP','#181612');
 const capY=revision?605:548;
 text('Nintendo started as a',76.8,capY,18,'HanaItalic','#181612');text('hanafuda maker.',76.8,capY+25,18,'HanaItalic','#181612');
 const lines=revision?['Founded in Kyoto by Fusajiro Yamauchi to print hand-painted','playing cards. Mario wouldn’t show up for another ninety-six years.']:['Founded in Kyoto by Fusajiro','Yamauchi to print hand-painted','playing cards. Mario wouldn’t','show up for another ninety-six','years.'];
 lines.forEach((s,i)=>text(s,76.8,capY+53+i*18,12,'HanaMono','#181612',.48));
 drawTimeline(c,{Path2D,x:0,y:684,width:1280,height:36,items:[{x:54,label:'1949 YAMAUCHI III'},{x:283,label:'1977 COLOR TV-GAME'},{x:523,label:'1985 SUPER MARIO BROS.'},{x:799,label:'2006 WII'},{x:949,label:'2017 SWITCH'},{x:1125,label:'1889 HANAFUDA · KYOTO'}]});
 c.restore();
}
