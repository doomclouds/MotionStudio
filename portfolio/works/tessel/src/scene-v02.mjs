// Tessel 10–18s native Canvas2D study. Copyright (c) 2026 Leonxlnx (MIT),
// adaptation and renderer integration by MotionStudio. See LICENSE-TESSEL and README.
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readdirSync} from 'node:fs';
import {C,APP,GRID,BAR,mix,prog,E} from './math.mjs';
import {appBase,eventBlock,nowLine,commandBar,cursor,rr} from './ui.mjs';
import {promptState,promptEvents,planState} from './choreography.mjs';
import {drawProjectedTexture,projectPoint} from './projection.mjs';
import {beginFrame,writeUsage} from './api-trace.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const ref=process.env.TESSEL_REFERENCE_ROOT;
if(!ref)throw Error('TESSEL_REFERENCE_ROOT must point to the prepared external resource cache');
const sans=resolve(ref,'font-packages/geist-5.3.0/package/files/geist-latin-wght-normal.woff2');
const mono=resolve(ref,'font-packages/geist-mono-5.3.0/package/files/geist-mono-latin-wght-normal.woff2');
const glow=resolve(ref,'source/public/fx/glow-ink.png'),table=resolve(ref,'source/public/fx/table.png');
const fontDir=process.env.TESSEL_FONT_ROOT;
if(!fontDir)throw Error('TESSEL_FONT_ROOT must point to the prepared external font cache');
const weights=[400,450,460,480,500,540,560,580,600,620];
const staticFonts=weights.map(w=>resolve(fontDir,`TesselGeist-${w}.ttf`));
export const config={width:1920,height:1080,fps:60,duration:8};
const elements=resolve(here,'../../../../engine/motion-elements');
const imported=['lib/structured-layouts.mjs','lib/keyframe-track.mjs','lib/recipes/layout-handoff.mjs','lib/motions.mjs','lib/math.mjs','lib/matrix.mjs','lib/validate.mjs','lib/layouts.mjs','lib/time.mjs'];
export const dependencies=['./api-trace.mjs','./math.mjs','./ui.mjs','./choreography.mjs','./reference-data.mjs','./projection.mjs',...imported.map(p=>resolve(elements,p)),resolve(elements,'../motion-timeline-core/lib/timeline.mjs'),sans,mono,glow,table,...staticFonts];
export async function createScene({ctx,createCanvas,GlobalFonts,canvasApi}){
 if(!GlobalFonts.registerFromPath(sans,'Geist Variable')||!GlobalFonts.registerFromPath(mono,'Geist Mono Variable'))throw Error('Exact reference fonts failed registration');
 for(let i=0;i<weights.length;i++)if(!GlobalFonts.registerFromPath(staticFonts[i],`TesselStudyGeist${weights[i]}`))throw Error('Static instance registration failed');
 const [glowImage,tableImage]=await Promise.all([canvasApi.loadImage(glow),canvasApi.loadImage(table)]);
 const app=createCanvas(1560,960),ac=app.getContext('2d');
 const screen=createCanvas(2080,1240),sc=screen.getContext('2d');
 const sub=createCanvas(1920,1080),dc=sub.getContext('2d');
 const bar=createCanvas(700,64),bc=bar.getContext('2d');
 const cards=new Map();
 const accumulator=new Uint16Array(1920*1080*4),outImage=ctx.createImageData(1920,1080);
 function getCard(key,w,h){let c=cards.get(key);if(!c){c=createCanvas(w,h);cards.set(key,c);}if(c.width!==w)c.width=w;if(c.height!==h)c.height=h;const cc=c.getContext('2d');cc.reset();cc.clearRect(0,0,w,h);return[c,cc];}
 function event2D(c,ev,s){c.save();c.translate(GRID.x+s.rect.x,GRID.y+s.rect.y);eventBlock(c,ev,s);c.restore();}
 function prompt(f,c){const state=promptState(f),events=promptEvents(f);ac.reset();ac.clearRect(0,0,1560,960);appBase(ac,{clashO:prog(f,6,20,E.out),labelO:prog(f,10,24,E.out),lineT:prog(f,4,34,E.out)});for(const b of events)event2D(ac,b.ev,b.s);nowLine(ac,{lineT:prog(f,4,34,E.out)});
  sc.reset();sc.clearRect(0,0,2080,1240);sc.save();sc.translate(80,80);sc.translate(-16*state.typeT,0);sc.translate(960,590);sc.scale(1+.025*state.typeT,1+.025*state.typeT);sc.translate(-960,-590);sc.translate(state.tx,state.ty);sc.scale(state.SA,state.SA);sc.drawImage(app,0,0);sc.restore();
  c.fillStyle=C.ink;c.fillRect(0,0,1920,1080);c.drawImage(glowImage,0,0,1920,1080);
  if(state.z1<.999)c.drawImage(screen,-80,-80);
  if(state.z1>.001){c.save();c.globalAlpha=Math.min(1,state.z1*1.8);c.filter='blur(10px)';c.drawImage(screen,-80,-80);c.restore();}
  c.fillStyle=`rgba(11,11,12,${.1*state.z1})`;c.fillRect(0,0,1920,1080);
  c.save();c.translate(state.bx+BAR.x*state.SB,state.by+BAR.y*state.SB);c.scale(state.SB,state.SB);c.shadowColor=`rgba(11,11,12,${.22*state.z1})`;c.shadowBlur=50*state.z1/state.SB;c.shadowOffsetY=30*state.z1/state.SB;commandBar(c,{...state,shadowScale:state.SB,shadowLift:state.z1});c.restore();
  cursor(c,state.curX,state.curY,mix(1.4,2.2,state.z2),state.press,state.cursorO);
  if(state.fl>0){c.fillStyle=C.red;c.beginPath();c.arc(state.sendScreen.x,state.sendScreen.y,state.floodR,0,Math.PI*2);c.fill();}
 }
 function plan(f,c){const st=planState(f);c.drawImage(tableImage,0,0,1920,1080);ac.reset();ac.clearRect(0,0,1560,960);appBase(ac,st);
  // Ground shadows are sampled at z=0; lifted artwork is projected separately.
  for(const b of st.blocks){const z=b.s.z??0;if(z>1&&(b.s.opacity??1)>.02){ac.save();ac.translate(GRID.x,GRID.y);ac.filter=`blur(${3+z*.06}px)`;rr(ac,b.s.rect.x+z*.1,b.s.rect.y+z*.22,b.s.rect.w,b.s.rect.h,10,`rgba(11,11,12,${(.2-.1*Math.min(1,z/200))*(b.s.opacity??1)})`);ac.restore();}}
  nowLine(ac,{});
  // Soft window shadow is a separate 2D projected silhouette, not a 3D light.
  c.save();c.shadowColor='rgba(11,11,12,.4)';c.shadowBlur=42;c.shadowOffsetY=26;c.beginPath();let started=false;for(const [cx,cy,start] of [[1538,22,-90],[1538,938,0],[22,938,90],[22,22,180]])for(let j=0;j<=12;j++){const a=(start+j*90/12)*Math.PI/180;const p=projectPoint(cx+22*Math.cos(a),cy+22*Math.sin(a),0,st.camera);if(started)c.lineTo(p.x,p.y);else{c.moveTo(p.x,p.y);started=true;}}c.closePath();c.fillStyle='#fff';c.fill();c.restore();drawProjectedTexture(c,app,{x:0,y:0,w:1560,h:960},st.camera,{columns:16,rows:12});
  for(const b of st.blocks){if((b.s.opacity??1)<.001)continue;const r=b.s.rect,pad=4,w=Math.ceil(r.w+pad*2),h=Math.ceil(r.h+pad*2);const[card,cc]=getCard(b.key,w,h);cc.translate(pad,pad);eventBlock(cc,b.ev,{...b.s,opacity:1});c.save();c.globalAlpha*=b.s.opacity??1;drawProjectedTexture(c,card,{x:GRID.x+r.x-pad,y:GRID.y+r.y-pad,w,h},st.camera,{z:b.s.z??0,rotation:b.s.rot??0,scale:b.s.scale??1,columns:4,rows:3});c.restore();}
  // A soft shadow must never be texture-mesh-composited: triangle overlap
  // would multiply its alpha and reveal the mesh. Paint one projected outline.
  c.save();c.shadowColor='rgba(11,11,12,.316227766)';c.shadowBlur=40*st.camera.scale;c.shadowOffsetY=18*st.camera.scale;c.beginPath();let bp=false;for(const [cx,cy,start]of[[BAR.x+668,BAR.y+32,-90],[BAR.x+668,BAR.y+32,0],[BAR.x+32,BAR.y+32,90],[BAR.x+32,BAR.y+32,180]])for(let j=0;j<=12;j++){const a=(start+j*90/12)*Math.PI/180,p=projectPoint(cx+32*Math.cos(a),cy+32*Math.sin(a),0,st.camera);if(bp)c.lineTo(p.x,p.y);else{c.moveTo(p.x,p.y);bp=true;}}c.closePath();c.fillStyle='#fff';c.fill();c.restore();
  bc.reset();bc.clearRect(0,0,700,64);commandBar(bc,{status:st.status,shadows:false});drawProjectedTexture(c,bar,{x:BAR.x,y:BAR.y,w:700,h:64},st.camera,{columns:8,rows:2});
  if(st.retract<1){const px=st.camera.px,py=st.camera.py,hw=mix(1270,6,st.retract),hh=mix(790,1.5,st.shut);c.save();c.translate(px,py);c.rotate(st.camera.rz*st.shut*Math.PI/180);rr(c,-hw,-hh,hw*2,hh*2,st.retract>.9?6:0,C.red);c.restore();}
 }
 function renderAt(frame,c){c.reset();c.clearRect(0,0,1920,1080);if(frame<240)prompt(Math.max(0,frame),c);else plan(frame-240,c);}
 return {renderFrame(frame){beginFrame(frame);
  // Analytic bound-driven temporal sampling: 240° shutter, <=1 screen pixel
  // between moving planar anchors, bounded at 48 samples. Not optical-flow parity.
  const anchors=f=>{if(f<240){const s=promptState(Math.max(0,f));return[{x:s.bx+BAR.x*s.SB,y:s.by+BAR.y*s.SB},{x:s.bx+(BAR.x+700)*s.SB,y:s.by+(BAR.y+64)*s.SB},{x:s.tx,y:s.ty},{x:s.tx+1560*s.SA,y:s.ty+960*s.SA},{x:s.curX,y:s.curY},{x:s.sendScreen.x+s.floodR,y:s.sendScreen.y}];}const s=planState(f-240),points=[];for(const [i,xy] of [[0,[0,0]],[1,[1560,0]],[2,[1560,960]],[3,[0,960]]])points.push({...projectPoint(xy[0],xy[1],0,s.camera),id:`window:${i}`});if(s.retract<1){const hw=mix(1270,6,s.retract),hh=mix(790,1.5,s.shut),r=s.camera.rz*s.shut*Math.PI/180;for(const [i,xy] of [[0,[-hw,-hh]],[1,[hw,-hh]],[2,[hw,hh]],[3,[-hw,hh]]])points.push({x:s.camera.px+xy[0]*Math.cos(r)-xy[1]*Math.sin(r),y:s.camera.py+xy[0]*Math.sin(r)+xy[1]*Math.cos(r),id:`shutter:${i}`});}for(const b of s.blocks){const r=b.s.rect,rot=(b.s.rot??0)*Math.PI/180,k=b.s.scale??1;for(const [corner,[dx,dy]]of[[0,[-r.w/2,-r.h/2]],[1,[r.w/2,r.h/2]]]){const x=GRID.x+r.x+r.w/2+k*(dx*Math.cos(rot)-dy*Math.sin(rot)),y=GRID.y+r.y+r.h/2+k*(dx*Math.sin(rot)+dy*Math.cos(rot));points.push({...projectPoint(x,y,b.s.z??0,s.camera),id:`${b.key}:${corner}`});}}return points;};
  const lower=frame<240?0:240,upper=frame<240?239.999:479.999,a=anchors(Math.max(lower,frame-1/3)),b=anchors(Math.min(upper,frame+1/3));let maxMove=0;const bm=new Map(b.map((p,i)=>[p.id??`prompt:${i}`,p]));for(let i=0;i<a.length;i++){const p=a[i],q=bm.get(p.id??`prompt:${i}`);if(!q)continue;const off=(p.x< -100&&q.x< -100)||(p.x>2020&&q.x>2020)||(p.y< -100&&q.y< -100)||(p.y>1180&&q.y>1180);if(off&&p.id&&!p.id.startsWith('shutter'))continue;maxMove=Math.max(maxMove,Math.hypot(p.x-q.x,p.y-q.y));}
  const n=maxMove<.5?1:Math.min(48,Math.max(2,Math.ceil(maxMove)+1));
  if(n===1){renderAt(frame,ctx);return;}
  accumulator.fill(0);const lo=frame<240?0:240,hi=frame<240?239.999:479.999;for(let k=0;k<n;k++){const time=Math.max(lo,Math.min(hi,frame+((k+.5)/n-.5)*(240/360)));renderAt(time,dc);const pixels=dc.getImageData(0,0,1920,1080).data;for(let i=0;i<pixels.length;i++)accumulator[i]+=pixels[i];}for(let i=0;i<accumulator.length;i++)outImage.data[i]=Math.round(accumulator[i]/n);ctx.reset();ctx.putImageData(outImage,0,0);
 },async close(){await writeUsage();cards.clear();}};
}
