// Canvas2D opening (source frames 0..599), adapted from Leonxlnx Tessel (MIT 2026).
import {C,APP,GRID,BAR,V,mix,prog,E,tw} from './math.mjs';
import {rr,circle,line,appBase,eventBlock,commandBar} from './full-base-ui.mjs';
import {measureTracked} from './full-common.mjs';
import {ACT1,RAIN,rainState,fitState,markState,weekLoad} from './full-opening-model.mjs';
// Native Canvas CSS filter parser cannot safely consume exponent notation.
// Decimal serialization only: no blur cutoff, sample-count or timing change.
const blurCSS=r=>`blur(${Math.max(0,r).toFixed(12)}px)`;
function setText(c,size,weight,track=0){c.font=`${size}px "TesselStudyGeist${weight}"`;c.letterSpacing=`${track*size}px`;c.textAlign='left';c.textBaseline='alphabetic';}
function text(c,s,x,y,size,weight,color,track=0,lineHeight=1){setText(c,size,weight,track);c.fillStyle=color;c.fillText(s,x,y+size*(1.005+(lineHeight-1.3)/2));}
function words(c,s,{frame,start,stagger=8,dur=26,blur=14,size=128,weight=600,track=-.05,y=0,color=C.ink,lineHeight=1}){const parts=s.split(' ');setText(c,size,weight,track);const widths=parts.map((w,i)=>c.measureText(w+(i<parts.length-1?' ':'')).width),total=widths.reduce((a,b)=>a+b,0);let x=960-total/2;for(let i=0;i<parts.length;i++){const p=prog(frame,start+i*stagger,start+i*stagger+dur,E.out);if(p>0){c.save();c.globalAlpha*=p;c.filter=blurCSS((1-p)*blur);text(c,parts[i]+(i<parts.length-1?' ':''),x,y+(1-p)*.32*size,size,weight,color,track,lineHeight);c.restore();}x+=widths[i];}}
function ellipseWash(c,x,y,rx,ry,alpha){c.save();c.translate(x,y);c.scale(rx,ry);const g=c.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(255,255,255,${alpha})`);g.addColorStop(.72,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore();}
function asymmetric(c,r,radii,fill){c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,radii.map(x=>Math.max(0,Math.min(x,r.w/2,r.h/2))));if(fill){c.fillStyle=fill;c.fill();}}
export async function createOpening({createCanvas,canvasApi,glowImage}){
 const shadow=createCanvas(1920,1080),shc=shadow.getContext('2d'),rain=createCanvas(2688,1848),rc=rain.getContext('2d'),app=createCanvas(APP.W,APP.H),ac=app.getContext('2d'),measure=createCanvas(1,1).getContext('2d');
 const fitW=measureTracked(measure,'doesn’t fit.',430,600,-.055),wmWidth=measureTracked(measure,'tessel',190,620,-.055);
 function drawRain(f){rc.reset();rc.clearRect(0,0,2688,1848);rc.translate(384,384);for(const b of RAIN){const s=rainState(b,f);if(!s)continue;rc.save();rc.translate(s.x+s.w/2,s.y+s.h/2);rc.rotate(s.rot*Math.PI/180);rc.translate(-s.w/2,-s.h/2);rc.shadowColor='rgba(11,11,12,.4)';rc.shadowBlur=24;rc.shadowOffsetY=10;rr(rc,8,8,s.w-16,s.h-16,6,b.ink?C.ink:b.outline?'#fff':'#EFF0F2');rc.shadowColor='transparent';rr(rc,0,0,s.w,s.h,14,b.ink?C.ink:b.outline?'#fff':'#EFF0F2',b.outline?C.ink:b.ink?null:'rgba(11,11,12,.05)',b.outline?2:1);rc.beginPath();rc.roundRect(0,0,s.w,s.h,14);rc.clip();text(rc,b.title,16,12,22,580,b.ink?'#fff':C.ink,-.015,1.3);if(s.h>60)text(rc,`${String(Math.floor(b.start)).padStart(2,'0')}:${b.start%1?'30':'00'}`,16,12+22*1.3+4,16,460,b.ink?'rgba(255,255,255,.55)':C.mute,0,1.3);rc.restore();}}
 function fit(f,c){const s=fitState(f,fitW);c.fillStyle='#fff';c.fillRect(0,0,1920,1080);if(s.imp<=.97){c.save();c.translate(960,540);c.scale(s.worldScale,s.worldScale);c.rotate(s.worldRot*Math.PI/180);c.translate(-960,-540);
  for(const h of [5,6,7,8,9,10,11,12,13]){const y=540+(h-ACT1.now)*120,start=60+Math.abs(y-540)/60,p=prog(f,start,start+40,E.out);c.fillStyle=C.line;c.fillRect(960-960*p,y,1920*p,1.5);c.save();c.globalAlpha*=prog(f,start+10,start+34)*mix(1,.35,prog(f,90,240,E.smooth));text(c,`${String(h).padStart(2,'0')}:00`,84,y+10,18,460,C.mute,0,1.3);c.restore();}
  for(const d of [1,2,3,4,5,6]){const start=66+Math.abs(d-3.5)*3,p=prog(f,start,start+50,E.out);c.fillStyle=C.line;c.fillRect(d*ACT1.colW,540-540*p,1.5,1080*p);}
  drawRain(f);c.save();c.globalAlpha*=s.rainDim;c.filter=blurCSS(s.rainBlur);c.drawImage(rain,-384,-384);c.restore();
  c.save();c.globalAlpha*=tw(f,120,150,0,1,E.smooth);ellipseWash(c,960,378,576,140.4,.7);c.restore();c.save();c.globalAlpha*=tw(f,232,250,0,1,E.smooth);ellipseWash(c,960,561.6,1152,453.6,.92);c.restore();c.fillStyle=C.red;c.fillRect(960-s.lineW/2,538.5,s.lineW,3);
  c.save();const lp=prog(f,61,75);c.globalAlpha*=lp*(1-s.lineRetract);const xx=78+(1-prog(f,61,79,E.out))*24;rr(c,xx,524,67,33.4,8,C.red);text(c,'08:42',xx+9,529,18,600,'#fff',0,1.3);c.restore();
  words(c,'Your week',{frame:f,start:120,stagger:9,dur:28,y:318+s.line1Y});
  if(s.slam>0){c.save();c.globalAlpha*=s.slam;c.filter=blurCSS((1-s.slam)*22);c.translate(950,s.bigTop+.45*s.bigSize);c.scale(s.bigScale,s.bigScale);c.translate(-950,-s.bigTop-.45*s.bigSize);setText(c,s.bigSize,600,-.055);const w=c.measureText('doesn’t fit.').width;text(c,'doesn’t fit.',950-w/2,s.bigTop,s.bigSize,600,C.ink,-.055,.9);c.restore();}c.restore();}circle(c,960,540,s.dotRadius,C.red);
 }
 function buildApp(abs){ac.reset();ac.clearRect(0,0,APP.W,APP.H);appBase(ac,{nowO:0,labelO:0,clashO:0});for(const b of weekLoad(abs)){if(b.s.opacity<=0)continue;ac.save();ac.translate(GRID.x+b.s.rect.x,GRID.y+b.s.rect.y);eventBlock(ac,b.ev,b.s);ac.restore();}ac.save();ac.translate(BAR.x,BAR.y);commandBar(ac,{shadowScale:1});ac.restore();}
 function mark(f,c){const s=markState(f,wmWidth);c.fillStyle='#fff';c.fillRect(0,0,1920,1080);circle(c,960,540,s.floodR,C.ink);c.save();c.globalAlpha*=s.flood;c.drawImage(glowImage,0,0,1920,1080);c.restore();
  if(f>=45&&s.wordOut<1){c.save();c.translate(960,540);c.scale(s.dolly,s.dolly);c.translate(-960,-540);const finalLeft=s.lockX+174,cl=Math.max(finalLeft-6,s.mx+s.size+34*s.size/140-6),right=finalLeft+wmWidth+60;c.save();c.beginPath();c.rect(cl,540-190*.66,Math.max(0,right-cl),190*1.25);c.clip();if(s.wordIn>.001){c.filter=blurCSS((1-s.wordIn)*5);text(c,'tessel',finalLeft+Math.max(1-s.wordIn,s.wordOut)*-(wmWidth+90),540-190*.66+190*.125,190,620,'#fff',-.055,1);}c.restore();if(s.descOut<1){c.save();c.globalAlpha*=1-s.descOut;words(c,'The calendar that plans itself.',{frame:f,start:67,stagger:5,dur:24,blur:10,size:44,weight:460,track:-.025,y:656+12*s.descOut,color:'#8E9098',lineHeight:1.3});c.restore();}c.restore();}
  c.save();c.translate(960,540);c.scale(s.punch,s.punch);c.translate(-960,-540);
  if(s.fly>0&&!s.landed){shc.reset();shc.clearRect(0,0,1920,1080);shc.shadowColor=`rgba(0,0,0,${Math.sqrt(.4*s.shadow)})`;shc.shadowBlur=90*s.fly;shc.shadowOffsetY=40*s.fly;rr(shc,s.U.x,s.U.y,s.U.w,s.U.h,mix(s.rPiece,s.rWin,s.fly),'#fff');shc.shadowColor='transparent';shc.globalCompositeOperation='destination-out';rr(shc,s.U.x-1.5,s.U.y-1.5,s.U.w+3,s.U.h+3,mix(s.rPiece,s.rWin,s.fly)+1.5,'#fff');c.drawImage(shadow,0,0);}
  const radiiA=[mix(s.rPiece,s.rWin,s.fly),s.rInner,mix(s.rPiece,0,s.fly),mix(s.rPiece,s.rWin,s.fly)],radiiB=[s.rInner,mix(s.rPiece,s.rWin,s.fly),mix(s.rPiece,s.rWin,s.fly),mix(s.rPiece,0,s.fly)];
  if(!s.landed){for(const [r,t,rads,fill]of[[s.A,s.aIn,radiiA,`rgb(${s.sideTone},${s.sideTone},${mix(255,251,s.fly)})`],[s.B,s.bIn,radiiB,'#fff']]){c.save();c.translate(r.x+t.x+r.w/2,r.y+t.y+r.h/2);c.rotate(t.r*Math.PI/180);asymmetric(c,{x:-r.w/2,y:-r.h/2,w:r.w,h:r.h},rads,fill);c.restore();}}
  if(s.landed||s.appIn>0){buildApp(360+f);if(s.landed){c.save();c.translate(V.x,V.y);c.scale(V.s,V.s);c.drawImage(app,0,0);c.restore();}else for(const [r,rads]of[[s.A,radiiA],[s.B,radiiB]]){c.save();asymmetric(c,r,rads);c.clip();c.globalAlpha*=s.appIn;c.translate(V.x,V.y);c.scale(V.s,V.s);c.drawImage(app,0,0);c.restore();}}
  circle(c,s.dot.x,s.dot.y,s.dot.r,C.red);c.restore();
 }
 function anchors(frame){
  if(frame<360){
   const s=fitState(frame,fitW),rot=s.worldRot*Math.PI/180;
   const project=(x,y)=>({x:960+s.worldScale*((x-960)*Math.cos(rot)-(y-540)*Math.sin(rot)),y:540+s.worldScale*((x-960)*Math.sin(rot)+(y-540)*Math.cos(rot))});
   const pts=[{id:'iris:left',x:960-s.dotRadius,y:540},{id:'iris:right',x:960+s.dotRadius,y:540}];
   if(s.imp<=.97){
    for(const b of RAIN){const r=rainState(b,frame);if(!r)continue;const a=r.rot*Math.PI/180;for(const [i,dx,dy]of[[0,-r.w/2,-r.h/2],[1,r.w/2,-r.h/2],[2,r.w/2,r.h/2],[3,-r.w/2,r.h/2]])pts.push({id:`rain:${b.i}:${i}`,...project(r.x+r.w/2+dx*Math.cos(a)-dy*Math.sin(a),r.y+r.h/2+dx*Math.sin(a)+dy*Math.cos(a))});}
    for(const [id,x]of[['line:left',960-s.lineW/2],['line:right',960+s.lineW/2]])pts.push({id,...project(x,540)});
    if(frame>=120&&frame<160){for(let i=0;i<2;i++){const p=prog(frame,120+i*9,148+i*9,E.out);pts.push({id:`week-word:${i}`,...project(700+i*240,318+s.line1Y+(1-p)*.32*128)});}}
    if(s.slam>0)for(const [id,x,y]of[['type:left',210,s.bigTop],['type:right',1690,s.bigTop+s.bigSize]])pts.push({id,...project(950+(x-950)*s.bigScale,s.bigTop+.45*s.bigSize+(y-s.bigTop-.45*s.bigSize)*s.bigScale)});
   }return pts;
  }
  const f=frame-360,s=markState(f,wmWidth),pts=[{id:'flood:left',x:960-s.floodR,y:540},{id:'flood:right',x:960+s.floodR,y:540},{id:'dot:left',x:s.dot.x-s.dot.r,y:s.dot.y},{id:'dot:right',x:s.dot.x+s.dot.r,y:s.dot.y}];
  for(const [id,r,t]of[['A',s.A,s.aIn],['B',s.B,s.bIn]]){const a=t.r*Math.PI/180;for(const [i,dx,dy]of[[0,-r.w/2,-r.h/2],[1,r.w/2,-r.h/2],[2,r.w/2,r.h/2],[3,-r.w/2,r.h/2]]){const x=r.x+t.x+r.w/2+dx*Math.cos(a)-dy*Math.sin(a),y=r.y+t.y+r.h/2+dx*Math.sin(a)+dy*Math.cos(a);pts.push({id:`${id}:${i}`,x:960+(x-960)*s.punch,y:540+(y-540)*s.punch});}}
  if(s.wordIn>.001&&s.wordOut<1){const x=s.lockX+174+Math.max(1-s.wordIn,s.wordOut)*-(wmWidth+90);pts.push({id:'wordmark:entry',x:960+(x-960)*s.dolly,y:540});}
  if(s.appIn>0)for(const b of weekLoad(frame)){if(b.s.opacity<=0)continue;pts.push({id:`event:${b.ev.id}`,x:V.x+(GRID.x+b.s.rect.x)*V.s,y:V.y+(GRID.y+b.s.rect.y)*V.s});}
  return pts;
 }
 return{renderAt(frame,c){c.reset();c.clearRect(0,0,1920,1080);if(frame<360)fit(frame,c);else mark(frame-360,c);},anchors,measurements:{fitW,wmWidth}};
}
