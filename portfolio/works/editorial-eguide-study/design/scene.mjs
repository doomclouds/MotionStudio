import fs from'node:fs';import{createRequire}from'node:module';const runtime=createRequire(import.meta.url)('../runtime.cjs');import{createHash}from'node:crypto';import{drawEditorialSheet}from'./editorial-sheet.mjs';
export const config={width:1024,height:576};const root=new URL('../',import.meta.url);
export function registerFonts(G){for(const f of JSON.parse(fs.readFileSync(new URL('resources.json',root))).fonts){let p=runtime.resource(f.file);if(createHash('sha256').update(fs.readFileSync(p)).digest('hex')!==f.sha256)throw Error('font hash');G.registerFromPath(p,'EG'+f.file.slice(0,-4))}}
export function render(c){c.reset();const ink='#1f1c14',muted='#837964',rule='#d3c9b3',red='#c44a47',orange='#e07d52';
 const tx=(s,x,y,size=14,font='DM',col=ink,weight=400,spacing=0)=>{c.font=`${weight} ${size}px EG${font.startsWith('Cormorant')?font+weight:font}`;c.fillStyle=col;c.letterSpacing=spacing+'px';c.fillText(s,x,y);const w=c.measureText(s).width;c.letterSpacing='0px';return w};
 const line=(x,y,x2,y2,color=rule,width=1,dash=[])=>{c.save();c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();c.restore()};
 const lines=(arr,x,y,size=14,font='DM',leading=22,col=ink,weight=400)=>arr.forEach((s,i)=>tx(s,x,y+i*leading,size,font,col,weight));
 c.fillStyle='#d8c8c0';c.fillRect(0,0,1920,1080);
 function glow(x,y,rx,ry,col){c.save();c.translate(x,y);c.scale(rx,ry);let g=c.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,col);g.addColorStop(.7,col+'00');g.addColorStop(1,col+'00');c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore()}
 glow(1536,972,1152,648,'#c79a8e');glow(960,216,1536,648,'#e8d4cc');
 function eyebrow(left,right){c.fillStyle=red;c.beginPath();c.arc(47,48,3,0,7);c.fill();tx(left,60,53,10.5,'Mono',muted,400,2.31);c.font='400 10.5px EGMono';c.letterSpacing='2.31px';let w=c.measureText(right).width;tx(right,496-w,53,10.5,'Mono',muted,400,2.31);line(44,78,496,78)}
 function footer(left,right,h){line(44,h-53,496,h-53);tx(left,44,h-28,10.5,'Mono',muted,400,1.89);c.font='400 10.5px EGMono';c.letterSpacing='1.89px';let w=c.measureText(right).width;tx(right,496-w,h-28,10.5,'Mono',muted,400,1.89)}
 drawEditorialSheet(c,{x:402,y:60,width:540,height:748,rotation:-.6},()=>{
 eyebrow('STYLE & FORMAT GUIDE FOR CREATORS','2026 EDITION');
 let w=tx('The ',44,183,92,'Cormorant',ink,700,-.92);tx("Creator's",44+w,183,92,'CormorantItalic',red,700,-.92);
 w=tx('Style ',44,271.32,92,'Cormorant',ink,700,-.92);tx('&',44+w+6,271.32,92,'CormorantItalic',orange,500,-.92);
 tx('Format guide',44,359.64,92,'CormorantItalic',ink,500,-.92);
 tx('— BY AUNY · CREATOR EDUCATOR · 18 / 04 / 2026',44,399,12,'Mono',muted,400,2.16);
 line(44,424,496,424);[['16',['PRINCIPLES','OF STYLE']],['38',["DO’S &","DON’TS"]],['1',['BLOCK, ZERO','TEMPLATES']]].forEach(([n,ls],i)=>{tx(n,44+i*156.67,471,36,'Cormorant',ink,700,-.18);lines(ls,44+i*156.67,493,10,'Mono',14,muted)});line(44,529,496,529);
 let ww=tx("What's ",44,589,36,'CormorantItalic',ink,700,-.18);tx('inside.',44+ww,589,36,'CormorantItalic',red,700,-.18);
 const toc=[['Find your voice','04'],['Pick a format','12'],['Tone & tension','18'],['Visual rhythm','24'],['Headlines that hold','32'],['Editing the cut','40']];toc.forEach(([s,n],i)=>{let x=44+(i%2)*244,y=625+Math.floor(i/2)*40.3,w=tx(s,x,y,14.5,'DMItalic');line(x+w+10,y-3,x+190,y-3,muted,.6,[1,3]);tx(n,x+198,y,11,'Mono',muted)});
 footer('FIND YOUR VOICE','01 / 64',748);
 c.save();c.translate(450,326);c.rotate(8*Math.PI/180);c.beginPath();c.arc(0,0,46,0,7);c.fillStyle=orange;c.fill();c.beginPath();c.arc(0,0,40,0,7);c.strokeStyle='#ffffff80';c.setLineDash([3,3]);c.lineWidth=1;c.stroke();c.setLineDash([]);['FOR THE','FIRST','DRAFT'].forEach((s,i)=>{c.font='700 14px EGCormorantItalic';const w=c.measureText(s).width;tx(s,-w/2,-10+i*15.4,14,'CormorantItalic','#fff',700)});c.restore();
 });
 drawEditorialSheet(c,{x:978,y:60,width:540,height:795,rotation:.6,paper:'#f4ecdf'},()=>{
 eyebrow('CHAPTER 02 · TONE','3 — RULES, 1 — EXERCISE');
 tx('Write like you talk —',44,147,44,'CormorantItalic',ink,700,-.22);tx('only sharper.',44,191,44,'CormorantItalic',red,700,-.22);
 lines(['Your voice already exists. The work is to remove the parts that',"aren’t you, then put what’s left in the order people remember.",'Three small rules and one Sunday-morning exercise.'],44,225,16,'DMItalic',24,muted);
 line(44,299,496,299);tx('S',44,346,38,'CormorantItalic',red,700);lines(['trong writing has the cadence','of speech and the precision of'],68,332,14.5,'DM',23.2);lines(['editing. Most beginners pick one','and stop. Read your draft aloud.','The sentences that catch in your','throat are the ones to cut.'],44,378.4,14.5,'DM',23.2);
 const rows=[['Pick the rule. One idea per','paragraph. If two appear,','split the paragraph.'],['Drop the filler. “I think”,','“kind of”, “in my opinion” —','they soften, then they erase.'],['End with a verb. The last','beat lands harder when it','asks for an action, not an','adjective.'],['Read aloud once. Always.','The microphone is the','editor.']];let yy=337;rows.forEach((ls,i)=>{tx('0'+(i+1),282,yy,12,'Mono',red,400,.96);lines(ls,320,yy,14,'DM',20.3);yy+=ls.length*20.3+26;line(282,yy-14,496,yy-14,rule,1,[3,3])});
 c.strokeStyle=red;c.lineWidth=1;c.fillStyle='#c44a470d';c.beginPath();c.roundRect(44,694,452,66,4);c.fill();c.stroke();c.strokeRect(61,713,84,25);tx('EXERCISE',69,729,10.5,'Mono',red,400,2.1);lines(['Rewrite your last three captions without the words','just, really, or very. Keep what survives.'],160,721,14,'DMItalic',19.6);
 footer('TONE & TENSION','18 / 64',795);
 // Source quote intentionally occludes first two rule rows, as in the reference.
 c.save();c.translate(431,361);c.rotate(2.4*Math.PI/180);c.translate(-125,-81);c.shadowColor='#1f1c141a';c.shadowBlur=18;c.shadowOffsetY=8;c.fillStyle='#faf3ea';c.beginPath();c.roundRect(0,0,250,162,4);c.fill();c.shadowColor='transparent';c.shadowBlur=0;c.shadowOffsetY=0;c.strokeStyle=rule;c.lineWidth=1;c.stroke();tx('"',22,46,56,'CormorantItalic',red,700);lines(['Specificity is the unlock','— write what only you','saw.'],22,66,22,'CormorantItalic',26.4,ink,700);tx('— AUNY · CHAPTER 02',22,148,11,'Mono',muted,400,1.54);c.restore();
 });
}
