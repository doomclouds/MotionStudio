const B=require('./baseline.cjs'),{createCanvas}=require('@napi-rs/canvas');const M=require('./measured-player-motion.json').samples,labels=require('./label-bitmaps.json');
const flash=require('./measured-failure-flash.json'),scans=require('./measured-scan-lines.json').frames,cams=require('./measured-camera.json'),statuses=require('./measured-status-labels.json');const clamp=x=>Math.max(0,Math.min(1,x));function type(c,s,x,y,z=24,col='#fafaf7'){c.font=z+'px Pixel';c.fillStyle=col;c.fillText(s,x,y)}
function chinese(c,s,x,y,z,col){const scale=3,w=Math.ceil(s.length*z/scale+4),h=Math.ceil(z/scale*1.5),a=createCanvas(w,h),q=a.getContext('2d');q.font=z/scale+'px CJK';q.fillStyle=col;q.fillText(s,0,z/scale);c.imageSmoothingEnabled=false;c.drawImage(a,x,y-z,w*scale,h*scale);}
function render(t){let frame=Math.round(t*30),dx=(cams.find(q=>q.frame===frame)||{dx:0}).dx,status=statuses.find(q=>q.frame===frame)||{};let ca=B.render({hidePlayer:true}),c=ca.getContext('2d');let fail=t>=24.1667&&t<25.4,pass=t>=25.8,col=fail?'#e34a54':pass?'#60b780':'#fafaf7';
 if(fail||pass){B.rect(c,1098,426,528,126,col);B.rect(c,1104,432,516,114,'#131310');type(c,'REGION CHECK',1214,471,24,col);labels.chinese.forEach((r,yy)=>[...r].forEach((v,xx)=>{if(v==='1')B.rect(c,1286+xx*3,486+yy*3,3,3,col)}));}
 if(t<23.7){c.globalAlpha=1-clamp((t-23.5)/.2);type(c,'LEVEL 1 : REGION',573,78,48,'#743f34');type(c,'LEVEL 1 : REGION',570,72,48);chinese(c,'第一关 · 地区',831,120,36,'#c57e63');c.globalAlpha=1;}
 if(fail){let p=clamp((t-24.1667)/.1),y=153;B.rect(c,924,y-9,864,276,'#131310');B.rect(c,933,y,846,258,'#fafaf7');B.rect(c,933,y,18,258,'#e34a54');if(p>.7){type(c,'NOT AVAILABLE IN',975,225,48,'#131310');type(c,'YOUR REGION.',975,285,48,'#131310');chinese(c,'您所在的地区暂不可用',975,363,72,'#e34a54');}if((flash.find(q=>q.frame===frame)||{}).red_x){c.strokeStyle='#e34a54';c.lineWidth=12;c.beginPath();c.moveTo(1302,702);c.lineTo(1416,816);c.moveTo(1416,702);c.lineTo(1302,816);c.stroke();}}
 if(t>=24.2&&t<24.5){B.rect(c,1080,750,90,90,'#131310');B.rect(c,1086,756,78,78,'#fafaf7');for(let i=0;i<3;i++)B.rect(c,1092,774+i*18,30,3,'#131310');if(t<24.4){type(c,'POW!',849,687,72,'#e34a54');type(c,'POW!',843,681,72,'#f3cb4d');}}
 if(status.connected&&frame<789)type(c,'CONNECTED: LOS ANGELES',555,501,24,'#60b780');
 if(pass){let open=clamp((t-25.7)/.17);B.rect(c,1290,666,144,228,'#263a2f');B.rect(c,1299,666,126,222,'#395e48');c.save();c.beginPath();c.rect(1290,552,144,342);c.clip();for(let i=0;i<6;i++)B.rect(c,1299+i*24,666-204*open,9,222,'#aba5b5');for(let yy of [732,816,888])B.rect(c,1290,yy-204*open,144,9,'#aba5b5');c.restore();if(status.pass)type(c,'PASS!',1236,435,48,'#60b780');}
 const n=Math.round((t-23)*30),sample=M.find(q=>q.frame===690+n)||M.reduce((a,b)=>Math.abs(a.t-t)<Math.abs(b.t-t)?a:b);let x=sample.x-dx,y=t>=25.4?744:sample.y+9;B.player(c,x,y,t>=25.4&&t<25.65?'#d07855':undefined);
 if(t>=25.65){B.rect(c,x+9,y,63,18,'#d93651');B.rect(c,x,y+18,90,9,'#d93651');B.rect(c,x+18,y,18,9,'#fafaf7');B.rect(c,x+9,y+36,72,9,'#151515');}
 drawScan(c,frame);
 if(dx){let out=B.render({hidePlayer:true});out.getContext('2d').drawImage(ca,dx,0);return out;}
 return ca;}
function drawScan(c,frame){const scan=scans.find(q=>q.frame===frame);if(scan)for(const r of scan.rectangles)B.rect(c,...r,'#fafaf7');}
module.exports={render,drawScan};
