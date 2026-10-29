// Full-film chrome/clock adaptation of Tessel CalendarApp (Leonxlnx2026, MIT).
// Frozen 8s ui.mjs is intentionally unchanged.
import {C,APP,GRID,HOUR,COL,BAR,clamp} from './math.mjs';
import {DAYS,fmt,NOW,H0} from './reference-data.mjs';
import {gridLayout,consumeLayout} from './full-api-trace.mjs';
import {rr,txt,circle,line,sidebar,eventBlock,commandBar} from './full-base-ui.mjs';
const DAYS_LAYOUT=gridLayout({itemIds:DAYS.map(x=>x.dow),width:COL,height:58,columns:5,gap:0});
export function check(c,x,y,size=12,color='#fff',sw=2.4){c.save();c.translate(x,y);c.scale(size/16,size/16);c.beginPath();c.moveTo(3.5,8.5);c.lineTo(6.5,11.5);c.lineTo(12.5,4.5);c.strokeStyle=color;c.lineWidth=sw;c.lineJoin='round';c.lineCap='round';c.stroke();c.restore();}
function chevron(c,x,y,dir=1,size=14){c.save();c.translate(x,y);c.scale(size/16,size/16);c.beginPath();c.moveTo(dir===1?6:10,3.5);c.lineTo(dir===1?10.5:5.5,8);c.lineTo(dir===1?6:10,12.5);c.strokeStyle=C.mute2;c.lineWidth=1.6;c.lineCap='round';c.stroke();c.restore();}
export function fullNowLine(c,{now=NOW,nowO=1,lineT=1,strong=true,dotO=nowO>0||lineT<1?1:0}={}){const y=GRID.y+(now-H0)*HOUR;if(!strong){line(c,GRID.x,y,GRID.x+GRID.w*lineT,y,`rgba(236,42,58,${.28*nowO})`);return;}c.save();c.globalAlpha*=nowO;line(c,GRID.x,y,GRID.x+COL*lineT,y,C.red,2);c.restore();c.save();c.globalAlpha*=dotO;circle(c,GRID.x,y,6,C.red);c.restore();}
export function fullNowPill(c,{now=NOW,label=fmt(now),labelO=1}={}){c.save();c.globalAlpha*=labelO;const y=GRID.y+(now-H0)*HOUR-10;rr(c,278+(1-labelO)*-6,y,47,21,6,C.red);txt(c,label,301.5+(1-labelO)*-6,y+4,11.5,600,'#fff','center');c.restore();}
export function drawFullAppBase(c,{prioIn=[0,0,0],clashes=12,clashO=1,resolved=0,now=NOW,nowO=1,labelO=nowO,lineT=1,chrome=1,frame=1,shadow=false,gutter=true,faintNow=true}={}){
 consumeLayout('gridLayout:full-weekday-columns');c.save();
 if(shadow&&frame>0){c.shadowColor=`rgba(11,11,12,${Math.sqrt(.16*frame)})`;c.shadowBlur=60;c.shadowOffsetY=30;}
 rr(c,0,0,APP.W,APP.H,APP.R,`rgba(255,255,255,${frame})`,`rgba(11,11,12,${.06*frame})`);c.shadowColor='transparent';
 if(chrome>0){c.save();c.globalAlpha*=chrome;c.beginPath();c.roundRect(0,0,APP.W,APP.H,APP.R);c.clip();sidebar(c,prioIn);
 line(c,268,68,1560,68,C.line);txt(c,'September 2026',292,23,20,620,C.ink,'left',-.5);txt(c,'Week 38',468,23,20,450,C.mute,'left',-.4);
 if(clashO>0){c.save();c.globalAlpha*=clashO;const y=21+(1-clashO)*6;rr(c,570,y,110,27,14,resolved>.5?'#F1F2F4':'rgba(236,42,58,.08)');if(resolved>.5)check(c,578,y+7,13,C.ink,2);else circle(c,582,y+13.5,3.5,C.red);txt(c,resolved>.5?'No clashes':`${clashes} ${clashes===1?'clash':'clashes'}`,595,y+6,13,560,resolved>.5?C.ink:C.red);c.restore();}
 chevron(c,1220,26,-1,16);chevron(c,1240,26,1,16);rr(c,1272,18,60,32,9,'#fff',C.line);txt(c,'Today',1302,27,13,540,C.ink,'center');rr(c,1344,18,190,32,10,'#F1F2F4');rr(c,1399,21,62,26,7,'#fff');txt(c,'Day',1374,27,13,540,C.mute2,'center');txt(c,'Week',1430,27,13,540,C.ink,'center');txt(c,'Month',1496,27,13,540,C.mute2,'center');
 for(const it of DAYS_LAYOUT){const d=DAYS[it.zIndex],x=GRID.x+it.matrix[4];txt(c,d.dow,x+14,90,13,500,it.zIndex===0?C.ink:C.mute);if(it.zIndex===0){rr(c,x+51,82,32,28,8,C.ink);txt(c,String(d.date),x+67,88,17,600,'#fff','center');}else txt(c,String(d.date),x+51,88,17,600,C.ink);}
 if(gutter)for(let h=9;h<19.5;h++){const y=GRID.y+(h-H0)*HOUR,o=1-nowO*clamp((22-Math.abs(h-now)*HOUR)/6);c.save();c.globalAlpha*=o;txt(c,`${String(h).padStart(2,'0')}:00`,324,y-7,11.5,460,C.mute,'right');c.restore();}
 fullNowPill(c,{now,labelO});line(c,GRID.x,126,1560,126,C.line);c.restore();}
 for(let d=1;d<5;d++)line(c,GRID.x+d*COL,GRID.y,GRID.x+d*COL,APP.H,C.line);
 for(let h=9;h<19.5;h++){const y=GRID.y+(h-H0)*HOUR;line(c,GRID.x,y,1560,y,C.line);}
 if(faintNow)fullNowLine(c,{now,nowO,lineT,strong:false});c.restore();
}
export function drawFullApp(c,opts={}){
 drawFullAppBase(c,opts);for(const b of opts.events??[]){const r=b.s.rect;c.save();c.translate(GRID.x+r.x+r.w/2,GRID.y+r.y+r.h/2);c.rotate((b.s.rot??0)*Math.PI/180);c.scale(b.s.scale??1,b.s.scale??1);c.translate(-r.w/2,-r.h/2);eventBlock(c,b.ev,b.s);if(b.extra)b.extra(c,r);c.restore();}
 fullNowLine(c,opts);if(!opts.hideBar&&(opts.chrome??1)>0){c.save();c.globalAlpha*=opts.chrome??1;c.translate(BAR.x,BAR.y);commandBar(c,{tokens:opts.prompt??[],caret:opts.caret,chipIn:opts.chipIn,press:opts.press,focus:opts.barFocus,status:opts.status??0,shadows:opts.barShadows??true});c.restore();}
 if(opts.overlay)opts.overlay(c);
}
