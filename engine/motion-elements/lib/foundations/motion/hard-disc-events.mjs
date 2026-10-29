/** Private candidate: finite, isolated, perfectly elastic 2D hard-disc events.
 * No imports, frame stepping, position nudges, friction, rotation or gravity.
 */
const plans=new WeakMap(),EPS=Number.EPSILON,PG=1e-8,VG=1e-7;
const fail=m=>{throw new RangeError(m)};
function record(o,keys){if(!o||Object.getPrototypeOf(o)!==Object.prototype)throw new TypeError('ordinary record required');const own=Reflect.ownKeys(o);if(own.length!==keys.length)throw new TypeError('exact fields required');for(const k of keys){const d=Object.getOwnPropertyDescriptor(o,k);if(!d||!Object.hasOwn(d,'value'))throw new TypeError('data fields required')}for(const k of own)if(!keys.includes(k))throw new TypeError('unknown field');return o}
function number(v,lo,hi){if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi)fail('finite bounded number required');return Object.is(v,-0)?0:v}
function array(a,max){if(!Array.isArray(a)||Object.getPrototypeOf(a)!==Array.prototype||a.length<1||a.length>max)throw new TypeError('bounded ordinary dense array required');const keys=Reflect.ownKeys(a);if(keys.length!==a.length+1)throw new TypeError('dense slots only');for(let i=0;i<a.length;i++){const d=Object.getOwnPropertyDescriptor(a,String(i));if(!d||!Object.hasOwn(d,'value'))throw new TypeError('data array slots required')}return a}
function freeze(o){if(o&&typeof o==='object'){for(const v of Object.values(o))freeze(v);Object.freeze(o)}return o}
const copy=a=>a.map(q=>({...q}));
function pairTime(a,b,remaining,tg){const x=b.x-a.x,y=b.y-a.y,u=b.vx-a.vx,v=b.vy-a.vy,R=a.r+b.r,rr=Math.hypot(x,y),gap=rr-R,bb=x*u+y*v,aa=u*u+v*v;
 if(gap < -PG)fail('overlap during event compilation');
 if(gap<=PG){if(bb>0)return Infinity;fail('unresolved touching or closing pair')}
 if(aa===0||bb>=0)return Infinity;
 const cc=x*x+y*y-R*R,D=bb*bb-aa*cc,de=64*EPS*(Math.abs(bb*bb)+Math.abs(aa*cc));
 if(D < -de)return Infinity;
 if(Math.abs(D)<=de){const closest=-bb/aa;if(closest>=0&&closest<=remaining+tg)fail('ambiguous grazing discriminant');return Infinity}
 const root=Math.sqrt(D),dt=cc/(-bb+root);
 if(dt>remaining+tg)return Infinity;
 if(root/R<=VG)fail('near grazing contact');
 if(!(dt>tg))fail('event too close to previous event');
 return dt;
}
function certify(state,dt,endEvent,previous,audit){const contactPairs=new Set();for(const e of [endEvent,previous])if(e?.kind==='pair')contactPairs.add(`${e.i}:${e.j}`);
 for(let i=0;i<state.length;i++){const a=state[i];for(let j=i+1;j<state.length;j++){const b=state[j],x=b.x-a.x,y=b.y-a.y,u=b.vx-a.vx,v=b.vy-a.vy,vv=u*u+v*v,t=vv?Math.max(0,Math.min(dt,-(x*u+y*v)/vv)):0,gap=Math.hypot(x+u*t,y+v*t)-a.r-b.r;audit.pairIntervals++;audit.minimumPairGap=Math.min(audit.minimumPairGap,gap);if(gap< -PG)fail('continuous segment penetration');if(gap<=PG&&!contactPairs.has(`${i}:${j}`))fail('unresolved near contact inside segment')}
 const x=a.x+a.vx*dt,y=a.y+a.vy*dt;for(const gap of[Math.min(a.x,x)-a.r,Math.min(a.y,y)-a.r,audit.w-Math.max(a.x,x)-a.r,audit.h-Math.max(a.y,y)-a.r]){audit.wallIntervals++;audit.minimumWallGap=Math.min(audit.minimumWallGap,gap);if(gap< -PG)fail('continuous wall penetration')}}
}
export function compileHardDiscs(spec){record(spec,['bounds','discs','duration','maxEvents']);record(spec.bounds,['x','y','width','height']);const B={x:number(spec.bounds.x,-1e4,1e4),y:number(spec.bounds.y,-1e4,1e4),width:number(spec.bounds.width,1,1e4),height:number(spec.bounds.height,1,1e4)},S=Math.max(B.width,B.height),w=B.width/S,h=B.height/S,duration=number(spec.duration,.001,30),maxEvents=number(spec.maxEvents,0,256);if(!Number.isInteger(maxEvents))fail('integer event budget required');const tg=1e-9*Math.max(1,duration),ids=new Set(),input=[];
 const ds=array(spec.discs,16);for(let k=0;k<ds.length;k++){const d=record(ds[k],['id','x','y','radius','mass','vx','vy']);if(typeof d.id!=='string'||!/^[A-Za-z0-9_-]{1,32}$/.test(d.id)||ids.has(d.id))throw new TypeError('unique ASCII disc id required');ids.add(d.id);input.push({id:d.id,x:number(d.x,B.x,B.x+B.width),y:number(d.y,B.y,B.y+B.height),radius:number(d.radius,S/1000,S*.49),mass:number(d.mass,.1,100),vx:number(d.vx,-4*S,4*S),vy:number(d.vy,-4*S,4*S)})}input.sort((a,b)=>a.id<b.id?-1:1);
 let state=input.map(d=>({id:d.id,x:(d.x-B.x)/S,y:(d.y-B.y)/S,r:d.radius/S,m:d.mass,vx:d.vx/S,vy:d.vy/S}));for(let i=0;i<state.length;i++){const a=state[i];if(Math.min(a.x-a.r,a.y-a.r,w-a.x-a.r,h-a.y-a.r)<=PG)fail('initial wall contact or overlap');for(let j=0;j<i;j++){const b=state[j];if(Math.hypot(a.x-b.x,a.y-b.y)-a.r-b.r<=PG)fail('initial disc contact or overlap')}}
 const events=[],segments=[],audit={w,h,pairIntervals:0,wallIntervals:0,minimumPairGap:Infinity,minimumWallGap:Infinity};let time=0,previous=null;
 const world=a=>a.map(d=>({id:d.id,x:B.x+d.x*S,y:B.y+d.y*S,radius:d.r*S,mass:d.m,vx:d.vx*S,vy:d.vy*S}));
 while(time<duration){const remaining=duration-time,candidates=[];
  for(let i=0;i<state.length;i++){const a=state[i];for(let j=i+1;j<state.length;j++){const dt=pairTime(a,state[j],remaining,tg);if(Number.isFinite(dt))candidates.push({kind:'pair',i,j,dt})}
   for(const [axis,limit]of[['x',w],['y',h]]){const vel=a[axis==='x'?'vx':'vy'];if(vel===0)continue;const side=vel>0?'max':'min',dt=(vel>0?limit-a.r-a[axis]:a.r-a[axis])/vel;if(dt<=remaining+tg){if(!(dt>tg))fail('wall event too close or unresolved');candidates.push({kind:'wall',i,axis,side,dt})}}
  }
  candidates.sort((a,b)=>a.dt-b.dt);let event=candidates[0]??null;if(event&&candidates[1]&&candidates[1].dt-event.dt<=tg)fail('simultaneous or near simultaneous contacts');
  if(event&&Math.abs(event.dt-remaining)<=tg&&event.dt!==remaining)fail('event ambiguous at horizon');if(event&&event.dt>remaining)event=null;
  const dt=event?event.dt:remaining;certify(state,dt,event,previous,audit);segments.push({start:time,end:time+dt,state:copy(state)});for(const a of state){a.x+=a.vx*dt;a.y+=a.vy*dt}time+=dt;if(!event)break;if(events.length>=maxEvents)fail('event budget exceeded');
  const pre=world(state);let normal,contact;
  if(event.kind==='pair'){const a=state[event.i],b=state[event.j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(Math.abs(d-a.r-b.r)>PG)fail('contact root residual too large');normal={x:dx/d,y:dy/d};const rel=(b.vx-a.vx)*normal.x+(b.vy-a.vy)*normal.y;if(!(rel < -VG))fail('contact is not distinctly closing');const J=-2*rel/(1/a.m+1/b.m);a.vx-=J*normal.x/a.m;a.vy-=J*normal.y/a.m;b.vx+=J*normal.x/b.m;b.vy+=J*normal.y/b.m;contact={x:B.x+(a.x+a.r*normal.x+b.x-b.r*normal.x)*S/2,y:B.y+(a.y+a.r*normal.y+b.y-b.r*normal.y)*S/2};}
  else{const a=state[event.i],key=event.axis==='x'?'vx':'vy',expected=event.side==='min'?a.r:(event.axis==='x'?w:h)-a.r;if(Math.abs(a[event.axis]-expected)>PG)fail('wall root residual too large');normal=event.axis==='x'?{x:event.side==='min'?1:-1,y:0}:{x:0,y:event.side==='min'?1:-1};a[key]=-a[key];contact={x:B.x+(a.x-a.r*normal.x)*S,y:B.y+(a.y-a.r*normal.y)*S}}
  events.push({time,kind:event.kind,discIds:event.kind==='pair'?[state[event.i].id,state[event.j].id]:[state[event.i].id],wall:event.kind==='wall'?`${event.axis}-${event.side}`:null,normal,contact,pre,post:world(state)});previous=event;
 }
 if(segments.length===0||segments.at(-1).end===duration&&events.at(-1)?.time===duration)segments.push({start:duration,end:duration,state:copy(state)});
 const identity=JSON.stringify({algorithm:'hard-disc-isolated-elastic-v1',bounds:B,discs:input,duration,maxEvents,positionGuard:PG,timeGuard:tg,normalSpeedGuard:VG});const plan=freeze({duration,eventCount:events.length,events,segments:segments.map(s=>({start:s.start,end:s.end,discs:world(s.state)})),numericContract:{positionTolerance:PG*S,eventSeparationSeconds:tg,minimumNormalImpactSpeed:VG*S},clearanceAudit:{pairIntervals:audit.pairIntervals,wallIntervals:audit.wallIntervals,minimumPairGap:Number.isFinite(audit.minimumPairGap)?audit.minimumPairGap*S:null,minimumWallGap:audit.minimumWallGap*S},identity});plans.set(plan,{segments,B,S});return plan;
}
export function sampleHardDiscs(plan,spec){const stored=plans.get(plan);if(!stored)throw new TypeError('authentic compiled plan required');record(spec,['time']);const time=number(spec.time,0,plan.duration),a=stored.segments;let lo=0,hi=a.length;while(lo+1<hi){const mid=(lo+hi)>>1;if(a[mid].start<=time)lo=mid;else hi=mid}const s=a[lo],dt=time-s.start;return{time,discs:s.state.map(d=>({id:d.id,x:stored.B.x+(d.x+d.vx*dt)*stored.S,y:stored.B.y+(d.y+d.vy*dt)*stored.S,radius:d.r*stored.S,mass:d.m,vx:d.vx*stored.S,vy:d.vy*stored.S}))}}
