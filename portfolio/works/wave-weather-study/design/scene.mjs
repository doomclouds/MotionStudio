import{fileURLToPath}from'node:url';import path from'node:path';
const assets=process.env.WAVE_FONT_DIR;
import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
function verifyFonts(){if(!assets||!path.isAbsolute(assets))throw Error('Set WAVE_FONT_DIR to an absolute licensed external font directory');const m=JSON.parse(readFileSync(new URL('../font-inputs.json',import.meta.url)));if(!Array.isArray(m.expectedOutputs)||!m.expectedOutputs.length||m.expectedOutputs.map(r=>r.filename).sort().join('|')!==m.outputNames.slice().sort().join('|'))throw Error('Incomplete font output contract');for(const row of m.expectedOutputs){const b=readFileSync(path.join(assets,row.filename));if(createHash('sha256').update(b).digest('hex')!==row.sha256)throw Error('Font identity mismatch: '+row.filename)}}
export const config={width:1200,height:750,fps:1,duration:1};
export function createScene({ctx:c,GlobalFonts,canvasApi}){verifyFonts();for(const[f,n]of [['PairSans500.ttf','S500'],['PairSans900.ttf','S900'],['ZCOOLKuaiLe-Regular.ttf','Play']])if(!GlobalFonts.registerFromPath(assets+'/'+f,n))throw Error(f);
const rect=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)},text=(s,x,y,size,fam,col='#111',spacing=0)=>{c.font=`400 ${size}px ${fam}`;c.fillStyle=col;c.textAlign='left';c.textBaseline='alphabetic';c.letterSpacing=spacing+'px';if(fam==='Play'){c.strokeStyle=col;c.lineWidth=.45;c.strokeText(s,x,y)}c.fillText(s,x,y);c.letterSpacing='0px'};
function rotate(x,y,w,h,deg,fn){c.save();c.translate(x+w/2,y+h/2);c.rotate(deg*Math.PI/180);c.translate(-w/2,-h/2);fn();c.restore()}
function stripe(x,y,col){const layer=canvasApi.createCanvas(1200,750),q=layer.getContext('2d');q.save();q.beginPath();q.rect(x,y,640,640);q.clip();q.font='400 640px S900';q.fillStyle='#fff';q.fillText('水',x,y+599.04);q.globalCompositeOperation='source-in';q.fillStyle=col;q.beginPath();for(let yy=y+631;yy>y-18;yy-=18)q.rect(x,yy,640,9);q.fill();q.restore();return layer}
const blue=stripe(56,40,'#2F7FF2'),red=stripe(20,10,'#F0553E');
return{render(){rect(0,0,1200,750,'#F3EFE2');c.drawImage(blue,0,0);c.drawImage(red,0,0);c.beginPath();c.moveTo(30,640);c.bezierCurveTo(130,580,190,700,290,640);c.bezierCurveTo(390,580,440,580,540,650);c.lineWidth=30;c.lineCap='round';c.strokeStyle='#111';c.stroke();
rotate(640,58,260,236,6,()=>rect(0,0,260,236,'#F2DE2B'));rotate(870,300,230,120,-4,()=>rect(0,0,230,120,'#111'));c.beginPath();c.arc(675,635,75,0,Math.PI*2);c.fillStyle='#F0553E';c.fill();
c.save();c.translate(664,92);c.rotate(6*Math.PI/180);for(const[i,ch]of [...'今天的浪不太正经'].entries()){let row=Math.floor(i/4),x=i%4*55.2,y=57+row*72;if(i===1){x+=8;y+=10}if(i===4)y-=8;text(ch,x,y,60,'Play')}c.restore();
c.save();c.translate(668,338);c.rotate(-4*Math.PI/180);text('但是，能冲。',0,24,20,'S900','#111',.8);c.restore();
rotate(900,314,139,74,-4,()=>{text('1.5',0,69,74,'S900','#F3EFE2',-2.22);text('m',114,69,24,'S900','#F3EFE2')});rotate(900,396,151,22,-4,()=>text('明日 · 最大浪高',0,18,15,'S500','#F3EFE2',2.1));
for(const[i,[label,value]]of [['风','西北 4 级'],['满潮','06:42'],['水温','19.5 ℃']].entries()){let y=509+i*45;text(label,780,y,18,'S500');c.font='400 18px S900';let w=c.measureText(value).width;text(value,1120-w,y,18,'S900');rect(780,522+i*45,340,3,'#111')}
text('海岬湾 · 冲浪天气预报',772,716,14,'S900','#111',4.2);
}}}
