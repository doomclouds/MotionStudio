// Private static reconstruction from independently sourced CC BY photograph.
// No reference image is loaded by this renderer.
const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');const path=require('path');const root=path.resolve(__dirname,'../../assets/boss-calibration-v4');GlobalFonts.registerFromPath(path.join(root,'../fonts/PressStart2P-400.ttf'),'Pixel');
const W=1920,H=1080;
let portrait,base;
async function prepare(){if(base)return;const c=createCanvas(W,H),g=c.getContext('2d');g.fillStyle='#131310';g.fillRect(0,0,W,H);const bg=g.createRadialGradient(1000,450,10,1000,450,1030);bg.addColorStop(0,'#3b251d');bg.addColorStop(.7,'#2a1e19');bg.addColorStop(1,'#171511');g.fillStyle=bg;g.fillRect(63,0,1777,1080);for(let i=0;i<6;i++){g.fillStyle=i%2?'#211a1660':'#412c2230';g.fillRect(141+i*310,0,80,700)}
const horizon=697;g.fillStyle='#321f19';g.fillRect(0,horizon,W,H-horizon);g.strokeStyle='#a25c48';g.lineWidth=3;for(const yy of [697,704,722,751,795,850,916,997]){g.beginPath();g.moveTo(0,yy);g.lineTo(W,yy);g.stroke()}g.fillStyle='#9a5847';for(let end=-5000;end<=6920;end+=100)for(let yy=709;yy<1080;yy+=14){const t=(yy-horizon)/(1080-horizon);const xx=960+(end-960)*t;g.fillRect(Math.round(xx),yy,3,5);}
// Reference floor is horizontal rules plus dotted perspective rays; no added solid rays.

const photo=await loadImage(path.join(root,'../dario-techcrunch-2023.jpg'));const cut=createCanvas(W,H),d=cut.getContext('2d');d.save();d.translate(85,-10);d.beginPath();const points=[[315,1300],[325,1130],[350,1000],[390,890],[442,800],[530,748],[630,707],[706,681],[739,656],[730,621],[705,565],[699,500],[700,435],[724,390],[735,332],[744,280],[766,238],[770,205],[809,182],[842,160],[875,169],[905,153],[941,162],[975,153],[1009,174],[1035,167],[1070,191],[1108,190],[1127,218],[1148,241],[1141,275],[1160,310],[1154,349],[1169,386],[1154,430],[1142,467],[1130,506],[1122,547],[1095,590],[1072,617],[1040,643],[1045,713],[1095,756],[1155,780],[1215,815],[1270,855],[1335,911],[1380,982],[1410,1080],[1415,1300]];points.forEach(([x,y],i)=>i?d.lineTo(x,y):d.moveTo(x,y));d.closePath();d.clip();d.drawImage(photo,0,0,1920,1280);d.restore();
// 12px output grid sampled from licensed photo; explicit eye/spectacle pixel accents follow below.
const small=createCanvas(160,90),s=small.getContext('2d');s.imageSmoothingEnabled=false;s.drawImage(cut,0,0,160,90);const data=s.getImageData(0,0,160,90);const z=data.data;const blues=['#090c26','#17267d','#4b5ed0','#9eacff'];const warm=['#100d0d','#4c100c','#713f49','#b99b78','#c6a17a','#ffb1cc','#f2cebb'];const rgb=h=>[1,3,5].map(n=>parseInt(h.slice(n,n+2),16));for(let i=0;i<z.length;i+=4){if(z[i+3]<100){z[i+3]=0;continue}let r=z[i],gg=z[i+1],b=z[i+2],l=.2126*r+.7152*gg+.0722*b;const yy=Math.floor(i/4/160),xx=i/4%160;let pal,index;if(b>r*1.06&&b>gg*1.04){pal=blues;index=l<35?0:l<65?1:l<119?2:3;}else{pal=warm;index=l<48?0:l<70?1:l<106?2:l<151?3:l<175?4:l<209?5:6;}let q=rgb(pal[index]);if(r>gg*1.5&&r>b*1.3&&l<150)q=l<80?[76,16,12]:l<115?[115,40,22]:[201,101,55];
// Photo-derived eyes and mouth retain dark cores instead of mapping all warm shadows red.

if(yy>=49&&yy<=54&&xx>=71&&xx<=82&&l<95)q=[61,14,8];
z[i]=q[0];z[i+1]=q[1];z[i+2]=q[2];z[i+3]=255;}s.putImageData(data,0,0);
// Measured independent code overlay for the reference's stylized block spectacles.
// Eyewear is an explicit pixel-art treatment; source face/pose remains photographic.
const blocks=[[67,35,30,1],[67,36,1,5],[69,41,12,1],[81,36,1,5],[84,36,1,5],[85,41,12,1],[96,36,1,5],[82,37,2,1],[97,36,3,1]];s.fillStyle='#101210';for(const q of blocks)s.fillRect(...q);s.fillStyle='#252c51';s.fillRect(68,35,27,1);s.fillRect(68,36,1,4);s.fillRect(69,41,12,1);s.fillRect(85,41,11,1);
// Two small pupil accents preserve the source's gaze and restore readability lost in quantization.
// This is measured pixel stylization, not extracted original portrait pixels.
s.fillStyle='#f2cebb';s.fillRect(75,38,4,2);s.fillRect(90,38,4,2);s.fillStyle='#181a14';s.fillRect(76,38,2,2);s.fillRect(91,38,2,2);
const outlined=createCanvas(160,90),o=outlined.getContext('2d');const aa=s.getImageData(0,0,160,90);const oo=o.createImageData(160,90);for(let yy=1;yy<89;yy++)for(let xx=1;xx<159;xx++){const i=(yy*160+xx)*4;if(aa.data[i+3])continue;let edge=false;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(aa.data[((yy+dy)*160+xx+dx)*4+3])edge=true;if(edge){oo.data[i]=13;oo.data[i+1]=14;oo.data[i+2]=13;oo.data[i+3]=255;}}o.putImageData(oo,0,0);o.drawImage(small,0,0);g.imageSmoothingEnabled=false;g.drawImage(outlined,0,0,W,H);
g.fillStyle='#faf9f3';g.font='48px Pixel';g.fillText('DARIO',108,88);g.fillStyle='#cc7757';g.font='24px Pixel';g.fillText('LV.99 · CEO',1520,85);g.fillStyle='#f5f4ed';g.fillRect(111,102,1680,36);g.fillStyle='#141411';g.fillRect(117,108,1668,24);for(let x=123;x<1773;x+=24){g.fillStyle='#e4464f';g.fillRect(x,111,18,18);g.fillStyle='#f04b54';g.fillRect(x+2,112,14,5)}
// Frame1215 has no subtitle yet. Do not add later-frame wording here.
portrait=outlined;base=c;
}
module.exports={prepare,get portrait(){return portrait},get base(){return base}};
