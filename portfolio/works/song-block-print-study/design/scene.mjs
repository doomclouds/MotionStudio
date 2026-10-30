import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
import path from'node:path';import{fileURLToPath,pathToFileURL}from'node:url';
const A=process.env.SONG_FONT_DIR,ui=process.env.MOTION_UI_ASSETS_ROOT;if(!ui)throw Error('MOTION_UI_ASSETS_ROOT required');if(!path.isAbsolute(ui))throw Error('MOTION_UI_ASSETS_ROOT must be absolute');for(const r of JSON.parse(readFileSync(new URL('../ui-dependencies.json',import.meta.url))).files)if(createHash('sha256').update(readFileSync(path.join(ui,r.path))).digest('hex')!==r.sha256)throw Error('UI dependency identity mismatch: '+r.path);
const{draw:surface}=await import(pathToFileURL(path.join(ui,'material-surfaces.mjs')));
function verifyFonts(){if(!A||!path.isAbsolute(A))throw Error('Set SONG_FONT_DIR to an absolute external font directory');const m=JSON.parse(readFileSync(new URL('../font-inputs.json',import.meta.url)));if(!m.expectedOutputs?.length||m.expectedOutputs.map(r=>r.filename).sort().join('|')!==m.outputNames.slice().sort().join('|'))throw Error('Incomplete font contract');for(const r of m.expectedOutputs)if(createHash('sha256').update(readFileSync(path.join(A,r.filename))).digest('hex')!==r.sha256)throw Error('Font identity mismatch: '+r.filename)}
export const config={width:1200,height:750,fps:1,duration:1};
export function createScene({ctx:c,GlobalFonts}){verifyFonts();for(const f of['Song400','Song600','Sans500'])if(!GlobalFonts.registerFromPath(A+'/'+f+'.ttf',f))throw Error(f);
const rect=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)},text=(s,x,y,z,f='Song400',col='#1F1B16',align='center',spacing=0)=>{c.font=`400 ${z}px ${f}`;c.textAlign=align;c.textBaseline='alphabetic';c.fillStyle=col;c.letterSpacing=spacing+'px';c.fillText(s,x,y);c.letterSpacing='0px'},v=(s,x,y,z,step,f='Song400',col='#1F1B16')=>{for(const[i,ch]of[...s].entries())text(ch,x,y+i*step,z,f,col)},tri=(x,y,w,h,up=false)=>{c.beginPath();c.moveTo(x,up?y+h:y);c.lineTo(x+w,up?y+h:y);c.lineTo(x+w/2,up?y:y+h);c.closePath();c.fillStyle='#1F1B16';c.fill()};const assetCalls=[];
return{assetCalls,render(){assetCalls.length=0;rect(0,0,1200,750,'#E4D6B0');assetCalls.push(surface(c,{bounds:{x:40,y:26,width:1120,height:698},data:{variant:'paper',radius:0,elevation:0,padding:8},theme:{surface:'#EDE0BC',edge:'#EDE0BC'}}));
// Inset paper shading: four smooth color fields, not a source texture.
for(const[x,y,w,h,ax,ay,bx,by]of[[40,26,1120,45,0,26,0,71],[40,679,1120,45,0,724,0,679],[40,26,45,698,40,0,85,0],[1115,26,45,698,1160,0,1115,0]]){let g=c.createLinearGradient(ax,ay,bx,by);g.addColorStop(0,'rgba(120,90,30,.11)');g.addColorStop(1,'rgba(120,90,30,0)');c.fillStyle=g;c.fillRect(x,y,w,h)}
c.strokeStyle='#1F1B16';c.lineWidth=1;c.strokeRect(96.5,112.5,1007,555);c.lineWidth=2;c.strokeRect(103,119,994,542);
for(let i=1;i<=9;i++)rect(104+i*53,120,1,538,'#1F1B16');rect(618,120,1,540,'#1F1B16');for(let i=1;i<9;i++)rect(619+i*53,120,1,538,'#1F1B16');
const left=['小雪前二日南風四級陰氣壓九九八','百帕氣溫九度露點七度午前小雨','二點四毫米自十時四十分至十一時','二十分屋頂雨量筒滿三分之一站員','校筒口水平差半格已改正風向標','南偏西十五度停擺二十分鐘後復','動疑為軸承受潮另紙記修理單','夜九時雨止星見能見度十二公里','明日當有寒潮預報已報縣局'];
const right=['立冬後三日北風二級晴氣壓一〇二一','百帕氣溫四度露點負一度夜間薄霜','起於西坡桿下百葉箱外壁結霜約半','寸晨六時十分霜盡北風轉三級雲量','二成午後復起層雲氣壓降至一〇一','六百帕雨量零是日候鳥過站計雁','一百三十七隻自北向南高度約三百','米站員記其隊形為人字形無雜行','此條併入霜降表備查不另立例'];
for(let i=0;i<9;i++){v(left[i],554.5-i*53-(i===4?13.5:0),153.5,27,29.16);v(right[i],1070.5-i*53-([5,6].includes(i)?13.5:0),153.5,27,29.16)}
function dot(x,y){c.beginPath();c.arc(x,y,6,0,Math.PI*2);c.fillStyle='#B3261E';c.fill()}for(let i=11;i<14;i++)dot(359,144.5+i*29.16);for(let i=0;i<6;i++)dot(768,144.5+i*29.16);dot(821,144.5+13*29.16);
rect(582,123,36,5,'#1F1B16');tri(583,134,34,26);tri(583,163,34,26);v('候風錄卷三',600,221,25,32.5,'Song600');v('十七',600,410,22,26.4);v('王仲刊',600,582,16,19.2);tri(583,626,34,26,true);
v('雁數宜',811,62,17,18.7,'Song600','#B3261E');v('逐日繪',789,62,17,18.7,'Song600','#B3261E');v('表',767,62,17,18.7,'Song600','#B3261E');v('風標軸',281,62,17,18.7,'Song600','#B3261E');v('承須換',259,62,17,18.7,'Song600','#B3261E');
rect(1034,656,34,34,'#B3261E');text('觀',1051,681,18,'Song600','#EDE0BC');text('觀測冊第三卷 · 西坡氣象站存本 · 朱筆為後人批校，墨為原刻',102,690,13,'Sans500','#6B5A36','left',1.82);
}}}
