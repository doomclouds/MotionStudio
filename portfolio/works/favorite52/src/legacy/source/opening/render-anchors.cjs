/** Private reference reconstruction, source: https://x.com/AlchainHust/status/2113208707668729984
 * No video pixels used by renderer. Anchor approval stage: 0.5s and 3.5s only.
 */
const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');
const fs=require('fs'),path=require('path');
GlobalFonts.registerFromPath(path.resolve(__dirname,'../../assets/fonts/Opening-DejaVuSansMono.ttf'),'OpeningMono');
GlobalFonts.registerFromPath(path.resolve(__dirname,'../../assets/fonts/Inter-var.ttf'),'OpeningSans');
const W=1920,H=1080,ORANGE='#dc7d5c',Q05=[[262,114],[1823,24],[1788,1054],[306,943]],Q35=[[330,698],[1486,721],[1287,1065],[364,1090]];
function solve(a,b){let n=b.length; a=a.map((r,i)=>r.concat(b[i]));for(let i=0;i<n;i++){let k=i;for(let j=i+1;j<n;j++)if(Math.abs(a[j][i])>Math.abs(a[k][i]))k=j;[a[k],a[i]]=[a[i],a[k]];let v=a[i][i];for(let j=i;j<=n;j++)a[i][j]/=v;for(let k=0;k<n;k++)if(k!==i){v=a[k][i];for(let j=i;j<=n;j++)a[k][j]-=v*a[i][j];}}return a.map(r=>r[n]);}
function homography(src,dst){let A=[],B=[];src.forEach(([x,y],i)=>{let [u,v]=dst[i];A.push([x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]);B.push(u,v)});let h=solve(A,B);return(x,y)=>{let z=h[6]*x+h[7]*y+1;return[(h[0]*x+h[1]*y+h[2])/z,(h[3]*x+h[4]*y+h[5])/z]};}
function tri(c,img,s,d){let A=s.map(([x,y])=>[x,y,1]),u=solve(A,d.map(p=>p[0])),v=solve(A,d.map(p=>p[1]));c.save();c.beginPath();let mx=d.reduce((a,p)=>a+p[0],0)/3,my=d.reduce((a,p)=>a+p[1],0)/3;d.forEach(([x,y],i)=>{let l=Math.hypot(x-mx,y-my);x+=(x-mx)/l*.7;y+=(y-my)/l*.7;i?c.lineTo(x,y):c.moveTo(x,y)});c.closePath();c.clip();c.transform(u[0],v[0],u[1],v[1],u[2],v[2]);let x=Math.max(0,Math.floor(Math.min(...s.map(p=>p[0])))-2),y=Math.max(0,Math.floor(Math.min(...s.map(p=>p[1])))-2),w=Math.min(img.width-x,Math.ceil(Math.max(...s.map(p=>p[0])))-x+2),h=Math.min(img.height-y,Math.ceil(Math.max(...s.map(p=>p[1])))-y+2);c.drawImage(img,x,y,w,h,x,y,w,h);c.restore();}
function project(c,img,quad){
 // Inverse projective rasterizer: avoids alpha seams from Canvas triangle clips.
 const inv=homography(quad,[[0,0],[img.width,0],[img.width,img.height],[0,img.height]]);
 const left=Math.max(0,Math.floor(Math.min(...quad.map(p=>p[0])))),top=Math.max(0,Math.floor(Math.min(...quad.map(p=>p[1]))));
 const right=Math.min(c.canvas.width,Math.ceil(Math.max(...quad.map(p=>p[0])))),bottom=Math.min(c.canvas.height,Math.ceil(Math.max(...quad.map(p=>p[1]))));
 const ww=right-left,hh=bottom-top;if(ww<=0||hh<=0)return;
 const src=img.getContext('2d').getImageData(0,0,img.width,img.height).data,out=c.getImageData(left,top,ww,hh),dst=out.data;
 for(let y=0;y<hh;y++)for(let x=0;x<ww;x++){let [u,v]=inv(x+left+.5,y+top+.5);u-=.5;v-=.5;if(u<0||v<0||u>=img.width-1||v>=img.height-1)continue;let ix=u|0,iy=v|0,fx=u-ix,fy=v-iy,j=(iy*img.width+ix)*4,j2=j+img.width*4,w0=(1-fx)*(1-fy),w1=fx*(1-fy),w2=(1-fx)*fy,w3=fx*fy,k=(y*ww+x)*4,A=(src[j+3]*w0+src[j+7]*w1+src[j2+3]*w2+src[j2+7]*w3)/255;if(A<.001)continue;for(let z=0;z<3;z++)dst[k+z]=(src[j+z]*w0+src[j+4+z]*w1+src[j2+z]*w2+src[j2+4+z]*w3)*A+dst[k+z]*(1-A);dst[k+3]=Math.round(255*A+dst[k+3]*(1-A));}
 c.putImageData(out,left,top);
}
function round(c,x,y,w,h,r,fill,stroke,lw=1){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke()}}
function sprite(){let a=createCanvas(512,352),c=a.getContext('2d');c.fillStyle=ORANGE;c.fillRect(64,0,384,288);c.fillRect(0,128,512,64);[64,128,352,416].forEach(x=>c.fillRect(x,288,32,64));c.fillStyle='#141511';c.fillRect(128,64,32,64);c.fillRect(352,64,32,64);for(let y=0;y<11;y++)for(let x=0;x<16;x++){if((y<9&&x>=2&&x<14)||(y>=4&&y<6)||(y>=9&&[2,4,11,13].includes(x))){if((x===4||x===11)&&y>=2&&y<4)continue;let r=((x*31+y*17)%13)-6;c.fillStyle=`rgba(${r>0?'255,214,166':'98,52,34'},${Math.abs(r)*.006})`;c.fillRect(x*32+.4,y*32+.4,31.3,31.3);c.strokeStyle='rgba(114,63,41,.11)';c.lineWidth=.35;c.strokeRect(x*32+.3,y*32+.3,31.4,31.4);}}return a;}
const character=sprite();
function terminal(empty=false,options={}){let a=createCanvas(1600,940),c=a.getContext('2d');round(c,0,0,1600,940,25,'#1d1c19','#24231f');c.fillStyle='#282722';c.fillRect(0,60,1600,1);for(let i=0;i<3;i++){c.beginPath();c.ellipse(36+i*28,29,7.5,8.5,0,0,Math.PI*2);c.fillStyle=['#ff625f','#ffc141','#26c94a'][i];c.fill()};c.font='22px OpeningMono';c.fillStyle='#94938c';c.textAlign='center';c.fillText('claude – ~/projects/duet',790,39);c.textAlign='left';if(empty)return a;
const inv=homography(Q05,[[0,0],[1600,0],[1600,940],[0,940]]);function text(s,x,y,size,col='#bcbcb5',font='OpeningMono'){let p=inv(x,y);c.font=`${font==='OpeningSans'?'700 ':''}${size}px ${font}`;c.fillStyle=col;c.fillText(s,...p)}
round(c,49,105,1499,530,20,null,'#d98d73',2.4);c.fillStyle='#1d1c19';c.fillRect(119,90,207,31);text('Claude Code',390,210,26,'#da8b70');c.fillStyle='#34332e';c.fillRect(810,151,1.3,432);
text('Welcome back!',509,315,43,'#f8f8f3','OpeningSans');
// Character separate plane, so its cube grid remains editable.
let points=[[469,343],[819,337],[824,600],[480,597]].map(p=>inv(...p));if(!options.hideCharacter){let k=options.characterWidth??1,cx=points.reduce((s,p)=>s+p[0],0)/4;points=points.map(([x,y])=>[cx+(x-cx)*k,y+(options.characterDy||0)]);project(c,character,points,16,11);}
text('Opus 5.5 · Claude Max',514,636,26,'#93928a');text('~/projects/duet',554,681,26,'#93928a');
text('Tips for getting started',1018,266,27,'#d28a73');text('Run /init to create a CLAUDE.md file',1018,308,27);text('Use Claude to help with file analysis,',1018,350,27);text('editing, bash commands and git',1018,392,27);text('Recent activity',1020,460,27,'#d28a73');text('No recent activity',1020,501,27);
round(c,49,673,1499,96,14,null,'#69675d',1);let command=options.command??'break';text('> '+command,359,773,37,'#fafaf5');let p=inv(359,749);c.font='37px OpeningMono';p[0]+=c.measureText('> '+command).width+7;c.fillStyle='#fafaf5';if(options.cursor!==false)c.fillRect(...p,17,39);text('? for shortcuts',363,843,24,'#79786e');return a;}
let term=terminal(),blank=terminal(true);
function roundedPoly(c,p,r,color){c.beginPath();for(let i=0;i<p.length;i++){let prev=p[(i+3)%4],v=p[i],next=p[(i+1)%4],a=Math.hypot(prev[0]-v[0],prev[1]-v[1]),b=Math.hypot(next[0]-v[0],next[1]-v[1]),x=v[0]+(prev[0]-v[0])*r/a,y=v[1]+(prev[1]-v[1])*r/a;i?c.lineTo(x,y):c.moveTo(x,y);c.quadraticCurveTo(...v,v[0]+(next[0]-v[0])*r/b,v[1]+(next[1]-v[1])*r/b)}c.closePath();c.fillStyle=color;c.fill();}
function polygon(c,p,color){c.fillStyle=color;c.beginPath();p.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.closePath();c.fill()}
function render(ctx,t=.5){let own=!ctx;if(own){ctx=createCanvas(W,H).getContext('2d')}const c=ctx;c.save();c.fillStyle=t<2.9?'#12130f':'#c8c7d8';c.fillRect(0,0,W,H);if(t<2.9){c.save();c.shadowColor='#000';c.shadowBlur=45;c.shadowOffsetY=35;roundedPoly(c,Q05,22,'#191a15');c.restore();project(c,term,Q05);}else{let g=c.createRadialGradient(1000,480,80,1000,500,1200);g.addColorStop(0,'#dfdeea');g.addColorStop(1,'#b7b6cb');c.fillStyle=g;c.fillRect(0,0,W,H);c.save();c.shadowColor='#55515f66';c.shadowBlur=48;c.shadowOffsetY=30;roundedPoly(c,Q35,14,'#1d1c19');c.restore();project(c,blank,Q35);
polygon(c,[[653,742],[876,739],[663,751]],'#292824');polygon(c,[[1115,751],[1295,798],[1257,871]],'#24231f');polygon(c,[[730,887],[736,839],[751,945]],'#292824');polygon(c,[[608,799],[651,780],[625,807]],'#302f29');
project(c,character,[[790,374],[1291,343],[1314,686],[812,719]],16,11);
// Glass/UI shards visible at the exact anchor, not photographic overlays.
polygon(c,[[197,589],[220,536],[377,596]],'#ffffff05');polygon(c,[[0,821],[101,693],[157,799],[0,921]],'#ffffff09');c.strokeStyle='#b9826a';c.lineWidth=.7;[[[0,821],[112,708]],[[1496,125],[1606,119]],[[1858,189],[1889,284]]].forEach(p=>{c.beginPath();c.moveTo(...p[0]);c.lineTo(...p[1]);c.stroke()});c.save();c.translate(1800,529);c.rotate(.18);c.scale(.7,1);c.fillStyle='#cc907a';c.font='26px OpeningMono';c.fillText('Re',0,0);c.restore();c.save();c.translate(499,541);c.rotate(-1.05);c.fillStyle='#ffffff';c.font='bold 27px OpeningSans';c.fillText('on',0,0);c.restore();c.save();c.translate(1398,186);c.rotate(-.5);c.scale(1,.6);c.fillStyle='#fff';c.font='bold 25px OpeningSans';c.fillText('ck!',0,0);c.restore();}c.restore();return c.canvas;}
if(require.main===module){for(let t of [.5,3.5])fs.writeFileSync(path.join(__dirname,`rebuilt-${t.toFixed(1)}.png`),render(null,t).toBuffer('image/png'));}
module.exports={render,project,homography,character,terminal,anchorsOnly:true,source:'https://x.com/AlchainHust/status/2113208707668729984'};
