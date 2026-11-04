/** Original 2D geometric-optics branch tracer. Single convex medium only.
 * Chooses transmission below critical angle, TIR above it; no Fresnel splitting.
 * Explicit numerical exclusion bands are part of this API, not epsilon nudging.
 */
const media=new WeakMap();
function data(o,keys){if(!o||Object.getPrototypeOf(o)!==Object.prototype)throw Error('plain data required');const v={};for(const k of Reflect.ownKeys(o)){if(!keys.includes(k))throw Error('unknown field');const d=Object.getOwnPropertyDescriptor(o,k);if(!Object.hasOwn(d,'value'))throw Error('accessor forbidden');v[k]=d.value;}for(const k of keys)if(!Object.hasOwn(v,k))throw Error('missing field');return v;}
function num(n,a,b){if(typeof n!=='number'||!Number.isFinite(n)||n<a||n>b)throw Error('finite domain');return n===0?0:n;}
function pt(p,limit){const a=data(p,['x','y']);return{x:num(a.x,-limit,limit),y:num(a.y,-limit,limit)};}
function dense(a){if(!Array.isArray(a)||Object.getPrototypeOf(a)!==Array.prototype||a.length<3||a.length>32)throw Error('polygon3..32');const out=new Array(a.length);for(const k of Reflect.ownKeys(a)){if(k==='length')continue;if(typeof k!=='string'||!/^(0|[1-9][0-9]*)$/.test(k)||+k>=a.length)throw Error('array property');const d=Object.getOwnPropertyDescriptor(a,k);if(!Object.hasOwn(d,'value'))throw Error('array accessor');out[+k]=d.value;}for(let i=0;i<out.length;i++)if(!Object.hasOwn(out,i))throw Error('dense polygon');return out;}
const cross=(a,b)=>a.x*b.y-a.y*b.x,dot=(a,b)=>a.x*b.x+a.y*b.y,sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const norm=v=>{const n=Math.hypot(v.x,v.y);if(!(n>1e-12))throw Error('nonzero direction');return{x:v.x/n,y:v.y/n};};
const freeze=o=>{if(o&&typeof o==='object'){for(const v of Object.values(o))freeze(v);Object.freeze(o);}return o;};
export function compileOpticalMedium(input){const s=data(input,['width','height','polygon','ior']),width=num(s.width,1,10000),height=num(s.height,1,10000),ior=num(s.ior,1.01,4),scale=Math.hypot(width,height),distanceGuard=scale*1e-7,angularGuard=1e-10,criticalGuard=1e-9;
const polygon=dense(s.polygon).map(p=>pt(p,10000));for(const p of polygon)if(p.x<=distanceGuard||p.y<=distanceGuard||p.x>=width-distanceGuard||p.y>=height-distanceGuard)throw Error('polygon must be strictly within viewport guard');
const edges=polygon.map((a,i)=>{const b=polygon[(i+1)%polygon.length],e=sub(b,a),length=Math.hypot(e.x,e.y);if(length<=distanceGuard*4)throw Error('short edge');return{a,b,e,length,outward:{x:e.y/length,y:-e.x/length},index:i};});
for(const e of edges)for(let j=0;j<polygon.length;j++)if(j!==e.index&&j!==(e.index+1)%polygon.length&&cross(e.e,sub(polygon[j],e.a))<=distanceGuard*e.length)throw Error('strict convex CCW polygon required');
const identity=JSON.stringify({algorithm:'single-convex-snell-tir-chain/v1',width,height,polygon,ior,distanceGuard,angularGuard,criticalGuard});const plan=freeze({identity,width,height,ior,vertexCount:polygon.length,distanceGuard,angularGuard,criticalGuard});media.set(plan,{polygon,edges});return plan;}
function distanceToEdge(p,e){const q=sub(p,e.a),u=Math.max(0,Math.min(1,dot(q,e.e)/(e.length*e.length)));return Math.hypot(q.x-u*e.e.x,q.y-u*e.e.y);}
function viewportHit(p,d,plan){const ts=[];if(d.x>0)ts.push((plan.width-p.x)/d.x);else if(d.x<0)ts.push(-p.x/d.x);if(d.y>0)ts.push((plan.height-p.y)/d.y);else if(d.y<0)ts.push(-p.y/d.y);const t=Math.min(...ts.filter(x=>x>0));if(!Number.isFinite(t))throw Error('viewport intersection');return{t,point:{x:p.x+t*d.x,y:p.y+t*d.y}};}
export function traceOpticalRay(plan,input){const m=media.get(plan);if(!m)throw Error('compiled optical medium required');const s=data(input,['origin','direction','maxInteractions']),origin=pt(s.origin,10000),direction=norm(pt(s.direction,1e6)),maxInteractions=num(s.maxInteractions,1,64);if(!Number.isInteger(maxInteractions))throw Error('integer interaction budget');const g=plan.distanceGuard;
if(origin.x<=g||origin.y<=g||origin.x>=plan.width-g||origin.y>=plan.height-g)throw Error('origin viewport guard');for(const e of m.edges)if(distanceToEdge(origin,e)<=g)throw Error('origin boundary guard');let inside=m.edges.every(e=>cross(e.e,sub(origin,e.a))>0),p=origin,d=direction,last=-1;const segments=[];
for(let iteration=0;iteration<=maxInteractions;iteration++){
 const border=viewportHit(p,d,plan),hits=[];
 for(const e of m.edges){if(e.index===last)continue;const den=cross(d,e.e),q=sub(e.a,p),unitDen=Math.abs(den)/e.length;
  if(unitDen<=plan.angularGuard){if(Math.abs(cross(q,d))<=g&&Math.max(dot(sub(e.a,p),d),dot(sub(e.b,p),d))>0)throw Error('grazing supporting line guard');continue;}
  const t=cross(q,e.e)/den,u=cross(q,d)/den,ug=g/e.length;
  if(t< -g||u< -ug||u>1+ug)continue;if(t<=g)throw Error('near-origin interface guard');if(t<=border.t+g)hits.push({t,u,e});
 }
 hits.sort((a,b)=>a.t-b.t);
 if(!hits.length){if(inside)throw Error('lost enclosing boundary');segments.push({from:p,to:border.point,medium:'outside',ending:'viewport',edgeIndex:null,direction:d});return freeze({planIdentity:plan.identity,origin,direction,segments,interactions:segments.length-1});}
 const hit=hits[0];if(Math.min(hit.u,1-hit.u)*hit.e.length<=g)throw Error('vertex guard');if(hits[1]&&Math.abs(hits[1].t-hit.t)<=g)throw Error('ambiguous nearest boundary guard');if(iteration===maxInteractions)throw Error('interaction budget exceeded');
 const outward=hit.e.outward,orientedDot=dot(d,outward);if(Math.abs(orientedDot)<=plan.angularGuard)throw Error('grazing incidence guard');if(inside?orientedDot<=0:orientedDot>=0)throw Error('medium orientation mismatch');
 const n=inside?{x:-outward.x,y:-outward.y}:outward,cosI=-dot(d,n),n1=inside?plan.ior:1,n2=inside?1:plan.ior,eta=n1/n2,sin2T=eta*eta*Math.max(0,1-cosI*cosI),k=1-sin2T;if(Math.abs(k)<=plan.criticalGuard)throw Error('critical-angle guard');
 const tir=k<0,out=tir?norm({x:d.x-2*orientedDot*outward.x,y:d.y-2*orientedDot*outward.y}):norm({x:eta*d.x+(eta*cosI-Math.sqrt(k))*n.x,y:eta*d.y+(eta*cosI-Math.sqrt(k))*n.y});
 const end={x:p.x+hit.t*d.x,y:p.y+hit.t*d.y};segments.push({from:p,to:end,medium:inside?'inside':'outside',ending:tir?'tir':'transmit',edgeIndex:hit.e.index,direction:d,outgoing:out,normalAgainstIncident:n,n1,n2,cosI,sin2T});if(!tir)inside=!inside;p=end;d=out;last=hit.e.index;
}
throw Error('unreachable budget');}
