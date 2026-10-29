// Exact opening choreography adapted from Tessel, Copyright (c) 2026 Leonxlnx (MIT).
import {E,cubic,mix,prog,tw,rand,APP,GRID,COL,HOUR,V,evRect} from './math.mjs';
import {spr,hitPulse} from './full-common.mjs';
import {BEFORE,NOW,H0} from './reference-data.mjs';
export const CUE={dotIn:30,lineDraw:45,gridDraw:60,yourWeek:120,rainStart:90,doesntFit:240,implodeStart:330,silence:345,lockup:45,flyIn:180};
export const ACT1={colW:1920/7,hourH:120,nowY:540,now:NOW};
export const STACK_LIFT=12;
const TITLES=['Sync','Standup','1:1','Review','Planning','Interview','Roadmap','Check-in','Budget','Retro','Kickoff','Hiring panel','Customer call','All-hands','Design crit','QBR prep','Vendor call','Offsite','Onboarding','Pricing','Demo','Board prep','Quick chat','Follow-up','Metrics','Handoff','Launch sync','Catch-up'];
export const restBox=b=>({x:b.day*ACT1.colW+6+b.jx*.6,y:540+(b.start-NOW)*120-12*b.depth,w:ACT1.colW-12,h:b.dur*120-6});
const underHeadline=b=>{const r=restBox(b);return r.x<1332&&r.x+r.w>588&&r.y<482&&r.y+r.h>268;};
const BANDS=[[5,6],[6.5,8],[8.5,10],[10.5,12.5]],shuffled=(n,key)=>[...Array(n).keys()].sort((a,b)=>rand(`${key}-${a}`)-rand(`${key}-${b}`));
const DAY_ORDER=shuffled(7,'rain-day'),BAND_ORDER=shuffled(4,'rain-band');let dealt=0;const dealCell=()=>{const k=dealt++;return {day:DAY_ORDER[k%7],band:BANDS[BAND_ORDER[k%4]]};};
export const RAIN=[];
const onDay=d=>RAIN.filter(x=>x.day===d).length;
const pickParent=q=>[10,12,13].map(n=>RAIN[Math.floor(q(n)*RAIN.length)]).filter(x=>x.depth<4).sort((a,b)=>onDay(a.day)-onDay(b.day))[0];
for(let i=0;i<60;i++){
 const r=n=>rand(`rain-${i}-${n}`),dur=[.5,.75,1,1,1.5][Math.floor(r(3)*5)],jx=(r(7)-.5)*70;let place={day:0,start:5,depth:0},cell;
 for(let attempt=0;attempt<60;attempt++){const q=n=>rand(attempt?`rain-${i}-${n}-${attempt}`:`rain-${i}-${n}`),onTop=i>10&&attempt<4&&q(9)<.7?pickParent(q):undefined;
 if(!onTop&&(cell===undefined||attempt%6===5))cell=dealCell();const [lo,hi]=cell?cell.band:[5,12.5];const cand=onTop?{day:onTop.day,start:onTop.start+(q(11)<.5?0:.5),depth:onTop.depth+1}:{day:cell.day,start:lo+Math.floor(q(2)*((hi-lo)*2+1))*.5,depth:0};place=cand;if(cand.start<=12.5&&!underHeadline({...cand,dur,jx}))break;}
 RAIN.push({i,title:TITLES[Math.floor(r(4)*TITLES.length)],...place,dur,land:Math.round(90+Math.pow(i/59,.8)*238),ink:r(5)<.16,outline:r(6)<.12,jx,rot:(r(8)-.5)*16});
}
export function rainState(b,f){const t=f-b.land;if(t< -16)return null;const fall=t<0?Math.pow((t+16)/16,2.2):1,settle=t>=0?Math.exp(-t/5)*Math.sin(t/2.2)*10:0,r=restBox(b);return{...r,y:r.y+mix(-260-(r.y+60),0,fall)-settle,rot:mix(b.rot*(b.depth>0?.55:.22),b.rot,1-fall)};}
const IRIS=cubic(.4,0,.7,.92);
export function fitState(f,fitW){const imp=prog(f,330,349,E.in),open=Math.exp(Math.log(80)*(1-IRIS(prog(f,0,30,E.linear)))),push=tw(f,0,330,1,1.07,E.smooth)*mix(1,1.12,(open-1)/79);let tick=0;for(let k=1;k<8;k++)tick=Math.max(tick,hitPulse(f-k*30)*(k<=3?.3:.18));const lineRetract=prog(f,330,345,E.in),slam=prog(f,239,254,E.out),bigSize=430*1480/fitW;return{imp,worldScale:push*(1-imp),worldRot:-14*imp,open,dotRadius:14*(1+tick)*open*mix(1,1.25,imp),lineRetract,lineW:1920*prog(f,45,85,E.out)*(1-lineRetract),slam,bigScale:mix(1.2,1,slam)*tw(f,240,330,1,1.05,E.smooth),bigSize,bigTop:590+.45*430-.45*bigSize,line1Y:tw(f,234,256,0,-40,E.out),rainBlur:tw(f,236,258,0,2,E.smooth),rainDim:tw(f,240,260,1,.75,E.smooth)};}
export const MARK={A:{x:0,y:0,w:46,h:100},B:{x:54,y:0,w:46,h:46},D:{cx:77,cy:77,r:23},r:13};
const SPR_A={damping:17,stiffness:230,mass:.8},SPR_B={damping:17,stiffness:210,mass:.8},SPR_D={damping:16,stiffness:190,mass:.7};
const firstHit=(start,cfg)=>{for(let f=0;f<120;f++)if(spr(f,0,cfg)>=1)return start+f;return start+30;};
export const SNAP={a:firstHit(8,SPR_A),b:firstHit(10,SPR_B)};
const DOLLY=cubic(.35,0,.65,1),lerpR=(a,b,t)=>({x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),w:mix(a.w,b.w,t),h:mix(a.h,b.h,t)});
export function markState(f,wmWidth){
 const flood=prog(f,-1,18,E.out),lockX=960-(140+34+wmWidth)/2,lk=prog(f,45,79,E.inOut),ctr=prog(f,154,188,E.smooth),size=mix(240,140,lk),mx=mix(mix(840,lockX,lk)-(size-140)*.5*lk,960-size/2,ctr),my=540-size/2-8*lk*(1-ctr),u=size/100,dolly=mix(1,1.1,prog(f,65,190,DOLLY)),beat=[90,120,150].reduce((m,at)=>Math.max(m,hitPulse(f-at)),0),K=(1+.015*beat)*dolly,cx=mx+size/2,cy=my+size/2;
 const toScreen=r=>({x:960+(cx-960)*dolly+(r.x-cx)*K,y:540+(cy-540)*dolly+(r.y-cy)*K,w:r.w*K,h:r.h*K});
 const sa=spr(f,8,SPR_A),sb=spr(f,10,SPR_B),aIn={x:Math.min(0,(1-sa)*-1150),y:Math.max(0,(1-sa)*140),r:Math.min(0,(1-sa)*-18)},bIn={x:Math.max(0,(1-sb)*150),y:Math.min(0,(1-sb)*-760),r:Math.max(0,(1-sb)*10)};
 const fly=prog(f,180,226,E.inOut),appIn=prog(f,186,228,E.smooth),winR={x:V.x,y:V.y,w:APP.W*V.s,h:APP.H*V.s},markR=toScreen({x:mx,y:my,w:size,h:size});
 const A=lerpR(toScreen({x:mx,y:my,w:46*u,h:100*u}),{x:V.x,y:V.y,w:APP.side*V.s,h:APP.H*V.s},fly),B=lerpR(toScreen({x:mx+54*u,y:my,w:46*u,h:46*u}),{x:V.x+APP.side*V.s,y:V.y,w:(APP.W-APP.side)*V.s,h:APP.H*V.s},fly),join=prog(fly,0,.35,E.smooth);
 const ar=A.x+A.w,mid=(ar+B.x)/2,g=mix(B.x-ar,-2,join),br=B.x+B.w;A.w=mid-g/2-A.x;B.x=mid+g/2;B.w=br-B.x;B.h=mix(B.h,A.y+A.h-B.y,join);
 const U=lerpR(markR,winR,fly),kk=mix(K,1,fly),rPiece=13*u*K,rWin=22*V.s,rInner=mix(rPiece,0,Math.max(fly,join)),sd=spr(f,2,SPR_D),dotFly=prog(f,190,236,E.inOut),inMark={x:U.x+mix(.77,GRID.x/APP.W,dotFly)*U.w,y:U.y+mix(.77,(GRID.y+Math.round((NOW-H0)*HOUR-6)+6)/APP.H,dotFly)*U.h,r:mix(23*u*K,6*V.s,fly)};
 const dot={x:mix(960,inMark.x,sd),y:mix(540,inMark.y,sd),r:mix(17.5,inMark.r,sd)*(1+.3*beat)};
 return{f,flood,floodR:1250*flood,lockX,lk,ctr,size,mx,my,u,dolly,beat,K,aIn,bIn,fly,appIn,A,B,U,kk,rPiece,rWin,rInner,dot,landed:fly>=1,punch:1+.025*hitPulse(f-SNAP.a)+.03*hitPulse(f-SNAP.b),wordIn:prog(f,59,95,E.out),wordOut:prog(f,150,180,E.in),descOut:prog(f,150,168,E.smooth),sideTone:mix(255,250,fly),shadow:fly<1?Math.sin(Math.PI*fly):0};
}
export const weekLoad=abs=>BEFORE.map(ev=>{const at=566+ev.day*3+(ev.start-9)*1.6,p=prog(abs,at,at+16,E.out),sp=spr(abs,at,{damping:15,stiffness:240,mass:.6}),dy=Math.abs(1-sp)<.01?0:(1-sp)*14,r=evRect(ev);return{ev,s:{rect:{...r,y:r.y-dy},opacity:p,glow:0}};});
