const {createCanvas,loadImage}=require('@napi-rs/canvas'),path=require('path'),B=require('./baseline.cjs'),D=require('./measured-fall.json');
const R=B.rect,clamp=x=>Math.max(0,Math.min(1,x));let icon;
async function prepare(){if(icon)return;let im=await loadImage(path.resolve(__dirname,'../../../assets/claude-duet-official.svg'));icon=createCanvas(20,20);icon.getContext('2d').drawImage(im,138,138,1024,1024,0,0,20,20)}
function txt(c,s,x,y,z=48,col='#131310'){c.font=z+'px Pixel';c.fillStyle=col;c.fillText(s,x,y)}
function zh(c,s,x,y,z=72,col='#131310'){let k=3,ca=createCanvas(Math.ceil(s.length*z/k+8),Math.ceil(z/k*1.6)),q=ca.getContext('2d');q.font=z/k+'px CJK';q.fillStyle=col;q.fillText(s,0,z/k);let id=q.getImageData(0,0,ca.width,ca.height);for(let i=3;i<id.data.length;i+=4)id.data[i]=id.data[i]>127?255:0;q.putImageData(id,0,0);c.imageSmoothingEnabled=false;c.drawImage(ca,x,y-z,ca.width*k,ca.height*k)}
function dressed(c,x,y,pose='idle'){B.player(c,x,y,undefined,pose);R(c,x+9,y,63,18,'#e74351');R(c,x,y+18,90,9,'#e74351');R(c,x+18,y,18,9,'#fafaf7');R(c,x+72,y+9,9,9,'#4a89f3');R(c,x+9,y+36,72,9,'#151515');R(c,x-27,y+81,27,18,'#f3c74d');R(c,x-27,y+81,9,9,'#fafaf7');R(c,x+90,y+72,18,27,'#131310');R(c,x+90,y+72,9,18,'#70c3c8');}
function render(t){let f=Math.round(t*30),s=D.find(v=>v.frame===f)||D[0],ca=createCanvas(1920,1080),c=ca.getContext('2d');c.imageSmoothingEnabled=false;
 if(f<990){
 R(c,0,0,1920,1080,'#cdcbdc');for(let y=0;y<890;y+=72)R(c,0,y,1920,6,'#d5d3e1');R(c,0,888,1920,9,'#656179');R(c,0,897,1920,183,'#938ea8');
 let box=s.blue_bbox,x=box?box[0]:759,y=744;if(f>=960)x=759;if(f>=983)y=s.hat_top??(744+(f-982)**2*12);if(s.hat_left!=null)x=s.hat_left;
 if(f>=974)R(c,720,888,168,192,'#2d1c18');dressed(c,x,y,f>=983?'air':'idle');
 if(f<960){if(icon)c.drawImage(icon,1380,120,120,120);let g=s.greeting_white_bbox;if(g){let [l,top,r,bot]=g;R(c,1002,top-9,816,bot-top+18,'#131310');R(c,1011,top,798,bot-top,'#fafaf7');R(c,1011,top,18,bot-top,'#d07855');if(f>=922){txt(c,'MORNING!',1050,366);txt(c,'HOW CAN I HELP?',1050,426);}}
 if(f>=930){R(c,687,597,234,120,'#131310');R(c,696,606,216,102,'#fafaf7');R(c,780,708,24,18,'#fafaf7');if(f>=933)zh(c,'你好',726,678,72);}
 }else{
 // Reference alarm is a color flash over the existing room, not a different invented room.
 if(f===960&&icon)c.drawImage(icon,1380,120,120,120);let rgb=s.background_rgb;let flash=clamp((201-rgb[1])/(201-55));c.fillStyle=`rgba(230,55,70,${flash})`;c.fillRect(0,0,1920,1080);
 if(f>=961){let q=s.disabled_white_bbox,dy=q?q[3]-660:0;R(c,48,60+dy,1824,612,'#131310');R(c,60,72+dy,1800,90,'#e74351');R(c,60,162+dy,1800,498,'#fafaf7');txt(c,'ACCOUNT DISABLED',102,144+dy,48,'#fafaf7');zh(c,'账号已停用',1440,138+dy,72,'#fafaf7');['YOUR ACCOUNT HAS BEEN DISABLED','AFTER AN AUTOMATIC REVIEW OF','YOUR RECENT ACTIVITIES.'].forEach((v,i)=>txt(c,v,114,255+dy+i*66));zh(c,'经过对您近期活动的自动审查，',114,474+dy,72,'#e74351');zh(c,'您的账号已被停用。',114,570+dy,72,'#e74351');}
 }
 }else if(f<1013){R(c,0,0,1920,1080,'#131310');let phase=(s.mortar_first_y??42)-42;for(let y=-48+phase;y<1128;y+=48){for(let x of[0,1560]){R(c,x,y,360,42,'#a75035');R(c,x,y,360,3,'#ab563e')}}
 if(s.fall_label||f===1010){let label=s.fall_label||'REGION',cn={CARD:'付款',PHONE:'手机号',REGION:'地区'}[label],yy=s.fall_label_baseline??-66;c.font='72px Pixel';txt(c,label,(1920-c.measureText(label).width)/2-3,yy+3,72,'#fafaf7');zh(c,cn,954-cn.length*36,yy+84,72,'#d99076')}
 let box=s.blue_bbox,xx=s.blue_center?.[0]??960,yy=s.blue_center?.[1]??500;let sprite=createCanvas(180,180),sc=sprite.getContext('2d');dressed(sc,45,18,'air');let layer=createCanvas(640,360),lc=layer.getContext('2d');lc.imageSmoothingEnabled=false;lc.translate(xx/3,yy/3);lc.rotate(s.angle||0);lc.drawImage(sprite,-90/3,-103.5/3,60,60);c.drawImage(layer,0,0,1920,1080);
 }else{let bg=B.render({hidePlayer:true,hideGate:true,hideQuestion:true});c.drawImage(bg,0,6);R(c,0,600,1920,294,'#2d2b40');B.player(c,447,780);txt(c,'ATTEMPT #2',576,255,72,'#f3c74d');zh(c,'第 2 次尝试',738,360,72,'#fafaf7');for(let x of[438,495,552]){R(c,x-9,720,18,3,'#f3c74d');R(c,x-3,714,6,15,'#f3c74d')}}
 return ca;}
module.exports={prepare,render,dressed};
if(require.main===module)prepare().then(()=>{const fs=require('fs');for(let f of[945,969,996])fs.writeFileSync(path.resolve(__dirname,`../qa/fall-study/rebuilt-${f}.png`),render(f/30).toBuffer('image/png'))});
