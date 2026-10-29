/** Original bounded polyline interval extraction. No resampling, renderer or clock. */
const plans=new WeakSet();
const MIN_SEGMENT=1e-9,MAX_TOTAL=1e9;
function record(v,keys,label){
 if(v===null||typeof v!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(v)))throw TypeError(label+': expected plain record');
 const own=Reflect.ownKeys(v);if(own.length!==keys.length||own.some(k=>!keys.includes(k)))throw TypeError(label+': exact fields required');
 for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(!d||!Object.hasOwn(d,'value'))throw TypeError(label+': data fields required');}
}
function number(v,lo,hi,label){if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi)throw RangeError(label+': outside finite domain');return v===0?0:v;}
function pointsArray(v){
 if(!Array.isArray(v)||Object.getPrototypeOf(v)!==Array.prototype||v.length<2||v.length>4096)throw TypeError('points: expected2..4096 ordinary dense points');
 if(Reflect.ownKeys(v).length!==v.length+1)throw TypeError('points: extra fields or holes');
 for(let i=0;i<v.length;i++){const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d||!Object.hasOwn(d,'value'))throw TypeError('points: data entries required');}
}
function freeze(v){if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;}
export function compilePolylineSections(spec){
 record(spec,['points'],'path');pointsArray(spec.points);
 const points=spec.points.map(p=>{record(p,['x','y'],'point');return{x:number(p.x,-1e6,1e6,'x'),y:number(p.y,-1e6,1e6,'y')};});
 const vertexDistances=[0],segmentLengths=[];let totalLength=0;
 for(let i=1;i<points.length;i++){
  const d=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y),end=totalLength+d;
  if(d<MIN_SEGMENT||end<=totalLength||!Number.isFinite(end)||end>MAX_TOTAL)throw RangeError('zero/short segment or nonrepresentable/excessive cumulative distance');
  segmentLengths.push(d);vertexDistances.push(end);totalLength=end;
 }
 const plan=freeze({points,vertexDistances,segmentLengths,totalLength,closedCoordinates:points[0].x===points.at(-1).x&&points[0].y===points.at(-1).y});plans.add(plan);return plan;
}
function boundary(plan,d){
 const a=plan.vertexDistances;let lo=0,hi=a.length-1;
 while(lo<hi){const mid=(lo+hi+1)>>1;if(a[mid]<=d)lo=mid;else hi=mid-1;}
 if(a[lo]===d)return{position:{...plan.points[lo]},distance:d,sourceVertexIndex:lo,segmentIndex:lo===a.length-1?lo-1:lo,parameter:lo===a.length-1?1:0};
 const t=(d-a[lo])/(a[lo+1]-a[lo]),p=plan.points[lo],q=plan.points[lo+1];
 return{position:{x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t},distance:d,sourceVertexIndex:null,segmentIndex:lo,parameter:t};
}
export function extractPolylineSection(plan,range){
 if(!plans.has(plan))throw TypeError('Expected compilePolylineSections plan from this module instance');
 record(range,['startDistance','endDistance'],'range');const start=number(range.startDistance,0,plan.totalLength,'startDistance'),end=number(range.endDistance,0,plan.totalLength,'endDistance');
 if(end<start)throw RangeError('Reverse or seam-wrapped intervals are not supported');
 const first=boundary(plan,start),vertices=[first];
 if(end>start){
  for(let i=first.segmentIndex+1;i<plan.points.length&&plan.vertexDistances[i]<end;i++)if(plan.vertexDistances[i]>start)vertices.push(boundary(plan,plan.vertexDistances[i]));
  vertices.push(boundary(plan,end));
 }
 return freeze({startDistance:start,endDistance:end,length:end-start,empty:start===end,vertices});
}
