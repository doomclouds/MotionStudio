// Exact Act5 story/time model adapted from Tessel, Leonxlnx2026 (MIT).
import {C,APP,GRID,HOUR,COL,V,evRect,E as E0,prog,mix,cubic} from './math.mjs';
import {AFTER,FINAL,NOW} from './reference-data.mjs';
import {spr,SPR,hitPulse} from './full-common.mjs';
const E={...E0,glide:cubic(.47,.2,.15,1)};
export const A5={SPLIT:cubic(.33,0,.1,1),WHIP:cubic(.6,0,.15,1),APPROACH:cubic(.45,0,.9,.55),CLOSE:cubic(.55,0,.15,1),DETENT:{damping:24,stiffness:380,mass:.6},CHECK:{damping:12,stiffness:220,mass:.5},REPEL:{damping:20,stiffness:260,mass:.7},CLOSE_AT:326,CLOSE_END:360,YAW:-12,PERSP:2400};
const delayTo=(cfg,thr)=>{for(let f=0;f<120;f++)if(spr(f,0,cfg)>=thr)return f;return 30;};
const settleOf=(a,b,e,thr=.97)=>{for(let f=a;f<=b;f++)if(e((f-a)/(b-a))>=thr)return f;return b;};
const peakOf=(a,b,e)=>{let best=a,v=-1;for(let i=0;i<400;i++){const t=i/400,d=e(Math.min(1,t+1/400))-e(t);if(d>v){v=d;best=a+t*(b-a);}}return Math.round(best);};
const DETENT_AT=[20,110,230,320],CHECK_AT=[75,83,90,98].map(p=>p-delayTo(A5.CHECK,.5)),HIT=180,REPEL_AT=182,REPLY_AT=195-delayTo(SPR.pop,.5),SWAP=[192,199],EXIT=[210,228],LATE_AT=263-delayTo(A5.CHECK,.5),DESIGN_GLIDE=[269,281],CHAIN_GLIDE=[275,288];
export const FEAT_CUES={split:peakOf(0,42,A5.SPLIT),whipAB:peakOf(104,132,A5.WHIP),whipBC:peakOf(224,252,A5.WHIP),detentStarts:DETENT_AT,detents:DETENT_AT.slice(0,-1).map(t=>t+delayTo(A5.DETENT,1)),f1Land:60,f2Bounce:HIT,f2Reply:REPLY_AT+delayTo(SPR.pop,.5),f3Late:LATE_AT+delayTo(A5.CHECK,.5),f3LateSettle:settleOf(...DESIGN_GLIDE,E.glide),f3ShiftSettle:settleOf(...CHAIN_GLIDE,E.glide),close:peakOf(326,360,A5.CLOSE)};
const FULL={x:V.x,y:V.y,w:APP.W*V.s,h:APP.H*V.s},FRAME={x:0,y:0,w:1920,h:1080};
const lerpB=(a,b,t)=>({x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),w:mix(a.w,b.w,t),h:mix(a.h,b.h,t)});
const TILE_W=756,K=(1920-TILE_W)/(2*COL),SIDE_X=V.x+APP.side*V.s,ay=h=>GRID.y+(h-8.5)*HOUR;
const SHOT={A:{x0:GRID.x+3*COL,yc:15},B:{x0:APP.side,yc:10.57},C:{x0:APP.side,yc:14.6}};
const shot=s=>({ax:s.x0,ay:ay(s.yc),sx:TILE_W,sy:540,k:K}),full=s=>({ax:APP.side,ay:ay(s.yc),sx:SIDE_X,sy:V.y+ay(s.yc)*V.s,k:V.s});
const lc=(a,b,t)=>({ax:mix(a.ax,b.ax,t),ay:mix(a.ay,b.ay,t),sx:mix(a.sx,b.sx,t),sy:mix(a.sy,b.sy,t),k:Math.exp(mix(Math.log(a.k),Math.log(b.k),t))});
const r5=h=>Math.round(h*12)/12,clamp=t=>Math.max(0,Math.min(1,t));
export const nowAt=t=>mix(NOW,13.86,prog(t,224,252,A5.WHIP))+(14.3-13.86)*(1-(1-clamp((t-238)/(360-238)))**2);
const roadMove=t=>prog(t,36,60,E.smooth),designEnd=t=>mix(Math.max(14,nowAt(t)+.02),14.5,prog(t,...DESIGN_GLIDE,E.glide)),chainShift=t=>prog(t,...CHAIN_GLIDE,E.glide),CHAIN=['mo-maya','mo-road','mo-metric','mo-int'];
function keepLayout(h,hd){for(const th of[40,26]){if(hd<th&&h>=th)h=th-.01;else if(hd>=th&&h<th)h=th;}return h;}
export function featuresState(f){const fd=Math.round(f),split=prog(f,0,42,A5.SPLIT),wAB=prog(f,104,132,A5.WHIP),wBC=prog(f,224,252,A5.WHIP),close=prog(f,326,360,A5.CLOSE);
 const cam=lc(lc(lc(lc(full(SHOT.A),shot(SHOT.A),split),shot(SHOT.B),wAB),shot(SHOT.C),wBC),full(SHOT.C),close);
 const dip=1-.18*Math.sin(Math.PI*wAB)**2,breath=1+.025*(prog(f,42,104,E.smooth)*(1-wAB)+prog(f,132,224,E.smooth)*(1-wBC)+prog(f,252,326,E.smooth)*(1-close));
 const punch=1+.012*(hitPulse(f-60,3,7)+hitPulse(f-HIT,3,7)+hitPulse(f-FEAT_CUES.f3ShiftSettle,3,7));
 const k=cam.k*dip*breath*punch,yaw=A5.YAW*split*(1-close),Z=fd>=FEAT_CUES.split&&fd<FEAT_CUES.close?K*1.04:1;
 const win=lerpB(lerpB(FULL,FRAME,split),FULL,close),on=split*(1-close),rad=APP.R*V.s*(1-on),bgO=1-prog(f,0,36,E.smooth),tileA=prog(f,0,10,E.linear)*(1-prog(f,348,360,E.smooth));
 const reel=-1+DETENT_AT.reduce((a,t)=>a+spr(f,t,A5.DETENT),0),rows=[];
 for(const[i,words]of[['Meetings','move over.'],['Mornings','stay yours.'],['Overruns','fit too.']].entries())for(const[j,text]of words.entries()){const v=4*i+j-4*reel-.5;if(Math.abs(v)>4.8)continue;const a=Math.max(-1.45,Math.min(1.45,v*.2211)),cy=220+500*Math.sin(a);if(cy< -70||cy>510)continue;rows.push({text,cy,scaleY:Math.cos(a)/Math.cos(.5*.2211)});}
 const styled=[];let design;
 for(const e of AFTER){const r=evRect(e);if(e.id==='th-road'){
  const lift=prog(f,30,40,E.out),move=roadMove(f),land=prog(f,52,60,E.in),target=evRect({...e,day:4,start:15,end:16}),bounce=f>60?Math.exp(-(f-60)/4)*Math.sin((f-60)/1.6)*.035:0,st=r5(mix(14,15,roadMove(fd)));
  styled.push({ev:{...e,start:st,end:st+1},s:{rect:lerpB(r,target,move),z:(90*lift+60*Math.sin(Math.PI*move))*(1-land),scale:(1+.04*lift*(1-land))*(1-bounce),rot:-2.5*lift*(1-land),ring:prog(f,58,62)*(1-prog(f,74,96,E.smooth))},extra:{kind:'attendees',opacity:prog(f,20,30)*(1-prog(f,104,116,E.smooth)),checks:CHECK_AT.map(t=>spr(f,t,A5.CHECK))}});
 }else if(e.id==='mo-focus'){
  const pulse=1+.035*hitPulse(f-HIT),glow=hitPulse(f-HIT,2,4);styled.push({ev:e,s:{rect:r,scale:pulse,glow},extra:{kind:'protected',opacity:prog(f,HIT,HIT+6)*(1-prog(f,228,240,E.smooth)),scale:mix(.6,1,spr(f,HIT,SPR.pop))}});
 }else if(e.id==='mo-design'){
  const end=designEnd(f),lateS=spr(f,LATE_AT,A5.CHECK),rect=evRect({...e,start:13,end});rect.h=keepLayout(rect.h,evRect({...e,start:13,end:designEnd(fd)}).h);
  design={ev:{...e,start:13,end:r5(designEnd(fd))},s:{rect,glow:prog(f,FEAT_CUES.f3Late-3,FEAT_CUES.f3Late+3)*(1-prog(f,FEAT_CUES.f3ShiftSettle+1,FEAT_CUES.f3ShiftSettle+19,E.smooth))},extra:{kind:'late',opacity:Math.min(1,lateS)*(1-prog(f,336,352,E.smooth)),scale:mix(.8,1,lateS)}};
 }else if(CHAIN.includes(e.id)){
  const fin=FINAL.find(x=>x.id===e.id),at=t=>({start:mix(e.start,fin.start,chainShift(t)),end:mix(e.end,fin.end,chainShift(t))}),a=at(f),ad=at(fd),rect=evRect({...e,...a});rect.h=keepLayout(rect.h,evRect({...e,...ad}).h);styled.push({ev:{...e,start:r5(ad.start),end:r5(ad.end)},s:{rect,ring:prog(f,FEAT_CUES.f3ShiftSettle-2,FEAT_CUES.f3ShiftSettle+2)*(1-prog(f,FEAT_CUES.f3ShiftSettle+9,FEAT_CUES.f3ShiftSettle+27,E.smooth))}});
 }else styled.push({ev:e,s:{rect:r}});}
 if(design)styled.push(design);styled.sort((a,b)=>(a.s.z??0)-(b.s.z??0));
 const FOC=evRect(AFTER.find(e=>e.id==='mo-focus')),SLOT=evRect({day:1,start:12,end:13}),CW=154,CH=95,CS=.68,vw=CW*CS,vh=CH*CS,CONTACT={x:FOC.x+FOC.w-vw-20,y:ay(SHOT.B.yc)-GRID.y-vh/2},REST={x:SLOT.x-1,y:SLOT.y+(SLOT.h-vh)/2-3},START={x:CONTACT.x+40,y:CONTACT.y-80};
 const fall=A5.APPROACH(prog(f,140,HIT,E.linear)),repel=spr(f,REPEL_AT,A5.REPEL),away=prog(f,...EXIT,E.in),hitT=f-HIT,sw=prog(f,...SWAP,E.swift);
 const invite={show:f>=136&&f<228,x:(hitT<0?mix(START.x,CONTACT.x,fall):mix(CONTACT.x,REST.x,repel))+900*away,y:(hitT<0?mix(START.y,CONTACT.y,fall):mix(CONTACT.y,REST.y,repel))+110*away,z:(hitT<0?mix(560,30,fall):30+110*Math.exp(-hitT/7)*Math.abs(Math.sin(hitT/3.3)))+40*away,rotation:hitT>=0?3.5*Math.exp(-hitT/7)*Math.sin(hitT/2.2):0,opacity:prog(f,136,150,E.smooth),sw,pendO:1-clamp(sw*1.6),replyO:clamp((sw-.25)/.5),tick:spr(f,REPLY_AT,SPR.pop),w:CW,h:CH,scale:CS};
 return{f,fd,cam:{...cam,k,yaw,perspective:2400},Z,win,on,rad,bgO,tileA,rows,events:styled,invite,now:nowAt(f),nowLabel:Math.round(nowAt(fd)*60)/60};
}
// CSS zoom scales the local transform lengths including translateZ; outer
// scale3d z=1/Z cancels that zoom. Actual original high-Z invite pixels
// confirm z is preserved, not divided a second time by Z.
export function featureProject(x,y,z,st){const c=st.cam,a=c.yaw*Math.PI/180,u=(x-c.ax)*c.k,v=(y-c.ay)*c.k,zz=z,x1=u*Math.cos(a)+zz*Math.sin(a),z1=-u*Math.sin(a)+zz*Math.cos(a),d=1-z1/c.perspective;return{x:c.sx+x1/d,y:c.sy+v/d};}
