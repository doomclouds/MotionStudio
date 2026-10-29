// Adapted from Act3Prompt/Act4Plan, Copyright (c) 2026 Leonxlnx (MIT).
import {rational} from '../../../../engine/motion-elements/lib/time.mjs';
import {sampleKeyframeTrack,compileLayoutHandoff,sampleLayoutHandoff} from './api-trace.mjs';
import {BEFORE,AFTER} from './reference-data.mjs';
import {E,mix,prog,rand,evRect,inverseSmoothstep,GRID,HOUR,V,BAR,SEND} from './math.mjs';
export const PROMPT=[{text:'Protect my '},{text:'mornings',chip:true},{text:'. '},{text:'Gym Tue + Thu',chip:true},{text:'. Ship the deck by '},{text:'Friday',chip:true},{text:'.'}];
export const FULL=PROMPT.map(t=>t.text).join('');
export const CHAR_AT=(()=>{const weights=[...FULL].map((ch,i)=>{let w=.75+rand(`k${i}`)*.6;if(ch===' ')w*=.7;if(FULL[i-1]==='.')w+=2.2;return w;});let acc=0,total=weights.reduce((a,b)=>a+b,0);return weights.map(w=>(acc+=w,60+acc/total*120));})();
const TYPE_SPEC={range:{start:rational(0),end:rational(4)},params:{knots:[{at:0,value:0,interpolation:'hold'},...CHAR_AT.map((f,i)=>({at:f/240,value:i+1,interpolation:'hold'})),{at:1,value:FULL.length,interpolation:'hold'}]}};
const tokenDone=(()=>{let i=0;return PROMPT.map(t=>(i+=t.text.length,CHAR_AT[i-1]));})();
const clock=f=>rational(Math.round(Math.max(0,f)*1000000),60000000);
export function promptState(f){const fd=Math.round(f),n=Math.round(sampleKeyframeTrack(TYPE_SPEC,clock(fd)).value),tokens=[],chipIn=[];let idx=0;const ink=age=>{let k=Math.max(0,Math.min(1,age/12)),e=1-(1-k)**2;return`rgb(${Math.round(mix(236,11,e))},${Math.round(mix(42,11,e))},${Math.round(mix(58,12,e))})`;};
 PROMPT.forEach((t,ti)=>{const vis=Math.max(0,Math.min(t.text.length,n-idx));if(t.chip){if(vis>0){tokens.push({text:t.text.slice(0,vis),chip:true,color:ink(fd-CHAR_AT[idx+vis-1])});chipIn.push(prog(fd,tokenDone[ti]+1,tokenDone[ti]+12,E.out));}}else for(let j=0;j<vis;j++){tokens.push({text:t.text[j],color:ink(fd-CHAR_AT[idx+j])});chipIn.push(0);}idx+=t.text.length;});
 const z1=prog(f,30,84,E.cam),z2=prog(f,176,208,E.inOut),typingPush=mix(0,.16,prog(f,60,180,E.smooth)),typeT=prog(f,50,210,E.linear),breathe=mix(1,1.02,prog(f,0,40,E.smooth)),focus={x:948,y:900};
 const SA=mix(mix(V.s*breathe,1.6,z1),1.78,z2),start={x:V.x+focus.x*V.s*breathe,y:V.y+focus.y*V.s*breathe};const aScreen={x:mix(start.x,960,z1),y:mix(mix(start.y,1045,z1),1080,z2)};const cover=prog(f,30,42,E.smooth),txRaw=aScreen.x-focus.x*SA,appW=1560*SA,txFit=appW>=2000?Math.min(-40,Math.max(1960-appW,txRaw)):(1920-appW)/2,tx=mix(txRaw,txFit,cover),ty=aScreen.y-focus.y*SA;
 const SB=mix(mix(V.s*breathe,2.12+typingPush,z1),3.5,z2),bf={x:mix(focus.x,SEND.x,z2),y:mix(focus.y,SEND.y,z2)},bs={x:mix(start.x,960,z1)+mix(0,150,z2),y:mix(start.y,590,z1)},bx=bs.x-bf.x*SB,by=bs.y-bf.y*SB;
 const sendScreen={x:bx+SEND.x*SB,y:by+SEND.y*SB},cur=prog(f,184,213,E.out),q=(a,b,c,t)=>(1-t)**2*a+2*(1-t)*t*b+t*t*c;
 const curX=q(sendScreen.x+560,sendScreen.x+140,sendScreen.x+6,cur),curY=q(sendScreen.y+360,sendScreen.y+300,sendScreen.y+8,cur),squash=prog(f,210,214,E.out),recoil=prog(f,214,222,E.out),press=squash*(1-recoil)*1.8-recoil*.6*(1-prog(f,222,230,E.smooth));
 const fl=prog(f,214,240,E.in),floodR=mix(21*SB*(1-.1*press),2300,fl);
 return{tokens,chipIn,caret:fd<8?false:fd<60?Math.floor(fd/16)%2===0:fd>186?Math.floor(fd/16)%2===0:true,z1,z2,typeT,SA,tx,ty,SB,bx,by,curX,curY,press,fl,floodR,sendScreen,focus:prog(f,50,60,E.out),cursorO:prog(f,176,184)};
}
const layout=(id,r)=>({itemId:id,rect:{x:0,y:0,width:r.w,height:r.h},matrix:[1,0,0,1,r.x,r.y],zIndex:0,geometryBounds:{x:r.x,y:r.y,width:r.w,height:r.h}});
export const PLANS=(()=>{const ids=[...new Set([...BEFORE.map(e=>e.id),...AFTER.map(e=>e.id)])],moving=ids.filter(id=>BEFORE.some(e=>e.id===id)&&AFTER.some(e=>e.id===id));return ids.map(id=>{const b=BEFORE.find(e=>e.id===id),a=AFTER.find(e=>e.id===id),r=n=>rand(`${id}-${n}`),lift=22+(b?b.day*3+(b.start-9)*1.2:0),k=moving.indexOf(id);let t2;if(b&&a)t2=70+k/Math.max(1,moving.length-1)*(138-70-26)+r(1)*4;else if(a){const late=['mo-focus','tu-focus','th-focus','fr-deck','tu-gym','th-gym'].indexOf(id);t2=114+late*5;}else t2=lift+40;t2=Math.round(Math.round(t2/7.5)*7.5)+(b&&a?Math.round(r(4)*3):0);return{id,b,a,t0:lift,t1:lift+14,t2,zUp:70+r(2)*60,wob:(r(3)-.5)*7,handoff:b&&a?compileLayoutHandoff({from:[layout(id,evRect(b))],to:[layout(id,evRect(a))],range:{start:rational(0),end:rational(1)}}):null};});})();
const CLEAR=PLANS.filter(p=>p.b&&(p.b.lanes??1)>1).map(p=>p.a?p.t2:p.t1+30);
export const LANDINGS=PLANS.filter(p=>p.a).map(p=>({id:p.id,sourceFrame:p.t2+840,localFrame:p.t2+240,heavy:p.a.kind==='focus'&&!['tu-gym','th-gym','fr-deck'].includes(p.id)}));
export function planState(f){const straighten=prog(f,130,240,t=>{ // original bezier(.4,0,.1,1), separately evaluated below
 return E_ST(t);}),orbit=prog(f,0,170,E.smooth),rx=mix(mix(46,36,orbit),0,straighten),rz=mix(mix(-11,-5,orbit),0,straighten),scale=mix(mix(1.75,1.22,prog(f,0,170,E.smooth)),V.s,straighten),camera={rx,rz,scale,ox:mix(GRID.x,780,straighten),oy:mix(GRID.y+(.2)*HOUR,480,straighten),px:mix(720,960,straighten),py:mix(360,540,straighten),perspective:2600};
 const blocks=[];for(const p of PLANS){const rb=p.b?evRect(p.b):null,ra=p.a?evRect(p.a):null,lift=prog(f,p.t0,p.t1,E.out);if(rb&&ra){let tp=prog(f,p.t1,p.t2,E.inOut),drop=prog(f,p.t2-10,p.t2,E.in),z=(p.zUp*lift+Math.sin(Math.PI*tp)*50)*(1-drop),bounce=f>p.t2?Math.exp(-(f-p.t2)/4)*Math.sin((f-p.t2)/1.6)*.035:0,flash=f>=p.t2?Math.exp(-(f-p.t2)/9):0;
 const remap=inverseSmoothstep(tp),result=sampleLayoutHandoff(p.handoff,rational(Math.round(remap*1e9),1e9)).items[0],rect={x:result.matrix[4],y:result.matrix[5],w:result.rect.width,h:result.rect.height};
 const s={rect,z,rot:p.wob*lift*(1-drop),scale:1-bounce,ring:flash};if(p.b.kind!==p.a.kind){s.z+=60*Math.sin(Math.PI*tp);s.inkT=prog(f,p.t1+8,p.t2-8,E.smooth);}blocks.push({ev:tp>.5?p.a:p.b,s,key:p.id});
 }else if(rb){let go=prog(f,p.t1,p.t1+46,E.in);blocks.push({ev:p.b,s:{rect:{...rb,x:rb.x+go*(900+rb.x*.3),y:rb.y-go*80},z:p.zUp*lift+go*260,rot:p.wob*lift+go*8,opacity:1-prog(f,p.t1+22,p.t1+46)},key:p.id});}
 else{let appear=prog(f,p.t2-24,p.t2-22),drop=prog(f,p.t2-24,p.t2,E.in),bounce=f>p.t2?Math.exp(-(f-p.t2)/4)*Math.sin((f-p.t2)/1.6)*.05:0;if(appear>0)blocks.push({ev:p.a,s:{rect:ra,z:mix(700,0,drop),opacity:appear,scale:1-bounce,ring:f>=p.t2?Math.exp(-(f-p.t2)/10):0},key:p.id});}}
 for(const b of blocks){const at=210+b.ev.day*2.5,w=f>=at&&f<at+12?Math.sin((f-at)/12*Math.PI):0;if(w>0)b.s.scale=(b.s.scale??1)*(1+.03*w);}
 const lastLanding=Math.max(...PLANS.filter(p=>p.a).map(p=>p.t2));return{camera,blocks:blocks.sort((a,b)=>(a.s.z??0)-(b.s.z??0)),clashes:Math.max(1,Math.ceil(12*(1-CLEAR.filter(t=>Math.round(f)>=t).length/Math.max(1,CLEAR.length)))),resolved:prog(f,lastLanding+2,lastLanding+12,E.out),status:prog(f,210,228,E.out),prioIn:[0,1,2].map(i=>prog(f,214+i*5,232+i*5,E.out)),shut:prog(f,-1,15,E_SH),retract:prog(f,13,26,E.inOut)};
}
import {cubic} from './math.mjs';
const E_ST=cubic(.4,0,.1,1),E_SH=cubic(.2,.7,.2,1);
export function promptEvents(f){return BEFORE.map(ev=>{const at=-34+ev.day*3+(ev.start-9)*1.6,p=prog(f,at,at+16,E.out);let elapsed=Math.max(0,(f-at)/60),omega=Math.sqrt(240/.6),zeta=15/(2*Math.sqrt(240*.6)),wd=omega*Math.sqrt(1-zeta*zeta),spr=1-Math.exp(-zeta*omega*elapsed)*(Math.cos(wd*elapsed)+zeta/Math.sqrt(1-zeta*zeta)*Math.sin(wd*elapsed)),dy=Math.abs(1-spr)<.01?0:(1-spr)*14;const rect=evRect(ev);return{ev,s:{rect:{...rect,y:rect.y-dy},opacity:p,glow:(ev.lanes??1)>1?prog(f,4+ev.day*2.5,14+ev.day*2.5,E.out)*(1-.5*prog(f,52,70,E.smooth)):0}};});}
