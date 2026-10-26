import {object,number,id,choice,freeze,fail} from './validate.mjs';
const plans=new WeakSet(),states=new WeakMap();
const EPS=1e-8;
function record(value,keys,required=keys){
 object(value,keys,required);
 for(const key of Reflect.ownKeys(value))if(!keys.includes(key))fail('Unknown polygon field');
}
function array(value,n){
 if(!Array.isArray(value)||value.length!==n)fail('Polygon arrays must have equal length');
 for(let i=0;i<n;i++)if(!Object.hasOwn(value,i))fail('Sparse polygon arrays are unsupported');
 for(const key of Reflect.ownKeys(value))if(key!=='length'&&!Array.from({length:n},(_,i)=>String(i)).includes(key))fail('Unknown polygon array field');
 return value;
}
function point(p){record(p,['x','y']);return {x:number(p.x,-1e4,1e4),y:number(p.y,-1e4,1e4)};}
function bounds(points){const xs=points.map(p=>p.x),ys=points.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys);return {x,y,width:Math.max(...xs)-x,height:Math.max(...ys)-y};}
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const dot=(a,b)=>a.x*b.x+a.y*b.y;
const length=a=>Math.hypot(a.x,a.y);
function pointDistance(p,a,b){const d=sub(b,a),t=Math.max(0,Math.min(1,dot(sub(p,a),d)/dot(d,d)));return Math.hypot(p.x-a.x-t*d.x,p.y-a.y-t*d.y);}
function intersect(a,b,c,d){
 const ab=sub(b,a),cd=sub(d,c),u=cross(ab,sub(c,a)),v=cross(ab,sub(d,a)),w=cross(cd,sub(a,c)),z=cross(cd,sub(b,c));
 // Strict crossing first. Touches/collinear overlaps are caught by segment distance below.
 return ((u>0&&v<0)||(u<0&&v>0))&&((w>0&&z<0)||(w<0&&z>0));
}
function reject(reason,context,vertexIds=[],edgeIds=[]){
 const error=new Error(`Registered polygon rejected: ${reason}`);
 error.code='INVALID_REGISTERED_POLYGON';error.reason=reason;
 error.details=freeze({...context,vertexIds,edgeIds});throw error;
}
function geometry(points,ids,normalization,context,expected){
 const n=points.length,{origin,scale}=normalization;
 const p=points.map(v=>({x:(v.x-origin.x)/scale,y:(v.y-origin.y)/scale}));
 const edge=i=>[ids[i],ids[(i+1)%n]],edges=p.map((a,i)=>sub(p[(i+1)%n],a)),lens=edges.map(length);
 for(let i=0;i<n;i++)if(lens[i]<=EPS)reject('near-zero-edge',context,edge(i),[edge(i)]);
 for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(length(sub(p[i],p[j]))<=EPS)reject('duplicate-or-near-vertex',context,[ids[i],ids[j]]);
 for(let i=0;i<n;i++){
  const prev=(i+n-1)%n;
  if(Math.abs(cross({x:edges[prev].x/lens[prev],y:edges[prev].y/lens[prev]},{x:edges[i].x/lens[i],y:edges[i].y/lens[i]}))<=EPS)reject('near-collinear-adjacent-edges',context,[ids[i]],[edge(prev),edge(i)]);
 }
 for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
  if(j===i+1||(i===0&&j===n-1))continue;
  const a=p[i],b=p[(i+1)%n],c=p[j],d=p[(j+1)%n];
  if(intersect(a,b,c,d)||Math.min(pointDistance(a,c,d),pointDistance(b,c,d),pointDistance(c,a,b),pointDistance(d,a,b))<=EPS)reject('nonadjacent-edge-contact',context,[],[edge(i),edge(j)]);
 }
 const area=p.reduce((sum,a,i)=>sum+cross(a,p[(i+1)%n]),0)/2;
 if(Math.abs(area)<=n*EPS)reject('near-zero-area',context,ids.slice());
 const winding=area>0?'positive':'negative';
 if(expected&&winding!==expected)reject('winding-mismatch',context,ids.slice());
 return winding;
}
/** Experimental: explicit caller correspondence; validates requested samples, NOT continuous topology. */
export function compileRegisteredPolygonMorph(input){
 record(input,['vertexIds','from','to']);
 const n=input.vertexIds?.length;
 if(!Number.isInteger(n)||n<3||n>32)fail('Registered polygon requires 3..32 vertex IDs');
 const vertexIds=array(input.vertexIds,n).map(id);
 if(new Set(vertexIds).size!==n)fail('Duplicate vertex IDs');
 const from=array(input.from,n).map(point),to=array(input.to,n).map(point),box=bounds([...from,...to]);
 const normalization={origin:{x:box.x+box.width/2,y:box.y+box.height/2},scale:Math.max(1,box.width,box.height),epsilon:EPS};
 const winding=geometry(from,vertexIds,normalization,{endpoint:'from'});
 geometry(to,vertexIds,normalization,{endpoint:'to'},winding);
 const plan=freeze({vertexIds,from,to,normalization,winding});plans.add(plan);return plan;
}
export function sampleRegisteredPolygonMorph(plan,progress,options={}){
 if(!plans.has(plan))fail('Expected compileRegisteredPolygonMorph result from this module instance');
 number(progress,0,1);record(options,['direction'],[]);
 const direction=choice(options.direction===undefined?'forward':options.direction,['forward','reverse']);
 const q=direction==='forward'?progress:1-progress;
 const vertices=plan.from.map((a,i)=>{const b=plan.to[i];return {vertexId:plan.vertexIds[i],x:q===0?a.x:q===1?b.x:a.x+(b.x-a.x)*q,y:q===0?a.y:q===1?b.y:a.y+(b.y-a.y)*q};});
 const winding=geometry(vertices,plan.vertexIds,plan.normalization,{progress,sampleProgress:q,direction},plan.winding);
 const state=freeze({vertices,bounds:bounds(vertices),winding,progress,sampleProgress:q,direction});states.set(state,plan);return state;
}
// Adapter gate: immutable real state bound to a real compiled plan; structural lookalikes are rejected.
export function assertRegisteredPolygonState(state){if(!states.has(state)||!plans.has(states.get(state)))fail('Expected sampleRegisteredPolygonMorph state from this module instance');}
