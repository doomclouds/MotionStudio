import {object,point,number,integer,freeze,fail} from './validate.mjs';
const compiled=new WeakSet();
function valid(path){if(!compiled.has(path))fail('Expected compilePolyline result from this module instance');}
export function compilePolyline(input){
  object(input,['points'],['points']);
  if(!Array.isArray(input.points)||input.points.length<2||input.points.length>1024)fail('Polyline requires 2..1024 points');
  const points=input.points.map(point),segments=[];let totalLength=0;
  for(let i=0;i<points.length-1;i++){
    const dx=points[i+1].x-points[i].x,dy=points[i+1].y-points[i].y,length=Math.hypot(dx,dy),end=totalLength+length;
    if(length<2.2250738585072014e-308||!Number.isFinite(end)||end<=totalLength)fail('Zero, subnormal or numerically unrepresentable polyline segment');
    segments.push({startDistance:totalLength,endDistance:end,length,unitTangent:{x:dx/length,y:dy/length}});
    totalLength=end;
  }
  const path=freeze({points,segments,totalLength});compiled.add(path);return path;
}
function atDistance(path,distance){
  const {points,segments,totalLength}=path;
  let lo=0,hi=segments.length-1;
  // Exact vertices belong to the outgoing segment; the endpoint uses the incoming one.
  while(lo<hi){const mid=(lo+hi)>>1;if(distance>=segments[mid].endDistance)lo=mid+1;else hi=mid;}
  const s=segments[lo],u=(distance-s.startDistance)/s.length;
  const position=distance===totalLength?{...points.at(-1)}:distance===s.startDistance?{...points[lo]}:{
    x:points[lo].x+(points[lo+1].x-points[lo].x)*u,y:points[lo].y+(points[lo+1].y-points[lo].y)*u};
  return freeze({position,unitTangent:{...s.unitTangent},distance,segmentIndex:lo});
}
export function samplePath(path,progress){
  valid(path);number(progress,0,1);return atDistance(path,progress*path.totalLength);
}
export function sampleTrail(path,input){
  valid(path);object(input,['headProgress','length','samples'],['headProgress','length','samples']);
  number(input.headProgress,0,1);number(input.length,0,Number.MAX_VALUE);integer(input.samples,2,256);
  const headDistance=input.headProgress*path.totalLength,tailDistance=Math.max(0,headDistance-input.length);
  const points=Array.from({length:input.samples},(_,i)=>atDistance(path,i===input.samples-1?headDistance:Math.min(headDistance,tailDistance+(headDistance-tailDistance)*i/(input.samples-1))));
  return freeze({tailDistance,headDistance,points});
}
