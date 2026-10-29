// Timing/seed formulas adapted from Tessel, Copyright (c) 2026 Leonxlnx (MIT).
export const clamp=x=>Math.max(0,Math.min(1,x));
export const mix=(a,b,t)=>a+(b-a)*t;
export function cubic(x1,y1,x2,y2){return u=>{if(u<=0)return 0;if(u>=1)return 1;const b=(t,a,b)=>3*(1-t)**2*t*a+3*(1-t)*t*t*b+t*t*t;let lo=0,hi=1;for(let i=0;i<28;i++){let m=(lo+hi)/2;if(b(m,x1,x2)<u)lo=m;else hi=m;}return b((lo+hi)/2,y1,y2);};}
export const E={out:cubic(.16,1,.3,1),outSoft:cubic(.22,1,.36,1),in:cubic(.7,0,.84,0),inOut:cubic(.87,0,.13,1),smooth:cubic(.65,0,.35,1),swift:cubic(.4,0,.2,1),cam:cubic(.48,.1,0,.9),linear:t=>t};
export const prog=(f,a,b,e=E.out)=>e(clamp((f-a)/(b-a)));
export const tw=(f,a,b,x,y,e=E.out)=>mix(x,y,prog(f,a,b,e));
export function rand(seed){let h=typeof seed==='number'?seed*2654435761:0;if(typeof seed==='string')for(let i=0;i<seed.length;i++)h=Math.imul(h^seed.charCodeAt(i),2654435761);h^=h>>>16;h=Math.imul(h,2246822507);h^=h>>>13;h=Math.imul(h,3266489909);h^=h>>>16;return(h>>>0)/4294967296;}
export const inverseSmoothstep=y=>.5-Math.sin(Math.asin(1-2*clamp(y))/3);
export const C={ink:'#0B0B0C',paper:'#FFFFFF',line:'#E3E4E8',line2:'#D5D7DC',mute:'#8A8D96',mute2:'#5E616A',red:'#EC2A3A'};
export const APP={W:1560,H:960,R:22,side:268,top:68,head:58,gutter:68};
export const GRID={x:336,y:126,w:1224,h:834};
export const HOUR=834/11,COL=1224/5;
export const BAR={x:598,y:868,w:700,h:64};
export const SEND={x:1265,y:900};
export const V={s:.94,x:226.8,y:88.8};
export function evRect(e){const lanes=e.lanes??1,lane=e.lane??0,laneW=(COL-8)/lanes;return{x:e.day*COL+4+lane*laneW-(lane>0?18:0),y:(e.start-8.5)*HOUR+1.5,w:laneW+(lanes>1?18*(lane>0?1:.4):0),h:(e.end-e.start)*HOUR-3};}
