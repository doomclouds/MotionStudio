/** Bounded, approximate distance addressing of authored cubic Bezier geometry. */
import {object,number,freeze} from '../../validate.mjs';

const plans = new WeakMap();
const MAX_DEPTH = 24, MAX_LEAVES = 32768;
const point = value => {
  object(value,['x','y'],['x','y']);
  return {x:number(value.x,-16384,16384),y:number(value.y,-16384,16384)};
};
const equal = (a,b) => a.x===b.x && a.y===b.y;
const distance = (a,b) => Math.hypot(b.x-a.x,b.y-a.y);
const mix = (a,b,u) => ({x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u});
function split(c) {
  const a=mix(c[0],c[1],.5),b=mix(c[1],c[2],.5),d=mix(c[2],c[3],.5);
  const e=mix(a,b,.5),f=mix(b,d,.5),g=mix(e,f,.5);
  return [[c[0],a,e,g],[g,f,d,c[3]]];
}
function metrics(c) {
  const chord=distance(c[0],c[3]);
  const polygon=distance(c[0],c[1])+distance(c[1],c[2])+distance(c[2],c[3]);
  // These are IEEE stopping diagnostics, not a certified real-arithmetic bound.
  const gap=Math.max(0,polygon-chord);
  const deviation=Math.max(distance(c[1],mix(c[0],c[3],1/3)),distance(c[2],mix(c[0],c[3],2/3)));
  return {chord,polygon,gap,deviation};
}
function denseSegments(value) {
  if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length<1||value.length>16)throw Error('Expected 1..16 ordinary dense cubic segments');
  for(let i=0;i<value.length;i++)if(!Object.hasOwn(value,i))throw Error('Sparse cubic segments');
  for(const key of Reflect.ownKeys(value))if(key!=='length'&&!(typeof key==='string'&&/^(0|[1-9][0-9]*)$/.test(key)&&Number(key)<value.length))throw Error('Unknown cubic segment array field');
  return value;
}

export function compileCubicPath(input) {
  object(input,['segments','tolerance'],['segments','tolerance']);
  const tolerance=number(input.tolerance,.001,1);
  const segments=denseSegments(input.segments).map(s=>{
    object(s,['p0','p1','p2','p3'],['p0','p1','p2','p3']);
    return {p0:point(s.p0),p1:point(s.p1),p2:point(s.p2),p3:point(s.p3)};
  });
  for(let i=0;i<segments.length;i++){
    const s=segments[i];
    if(equal(s.p0,s.p1)&&equal(s.p0,s.p2)&&equal(s.p0,s.p3))throw Error('Zero-length cubic segment');
    if(i&&!equal(segments[i-1].p3,s.p0))throw Error('Cubic segments must meet at exactly equal endpoints');
  }
  const leaves=[];let totalLength=0,lengthBracketGap=0,maxParameterDeviation=0,visited=0;
  for(let segmentIndex=0;segmentIndex<segments.length;segmentIndex++){
    const s=segments[segmentIndex],stack=[{c:[s.p0,s.p1,s.p2,s.p3],t0:0,t1:1,depth:0}];
    while(stack.length){
      if(++visited>2*MAX_LEAVES)throw Error('Cubic subdivision work limit exceeded');
      const node=stack.pop(),m=metrics(node.c),budget=tolerance*(node.t1-node.t0)/segments.length;
      if(m.chord>0&&m.gap<=budget&&m.deviation<=tolerance){
        const endDistance=totalLength+m.chord;
        if(!Number.isFinite(endDistance)||endDistance<=totalLength)throw Error('Cubic cumulative distance is not representable');
        if(leaves.length===MAX_LEAVES)throw Error('Cubic subdivision leaf limit exceeded');
        leaves.push({segmentIndex,t0:node.t0,t1:node.t1,startDistance:totalLength,endDistance,length:m.chord});
        totalLength=endDistance;lengthBracketGap+=m.gap;maxParameterDeviation=Math.max(maxParameterDeviation,m.deviation);
      }else{
        if(node.depth===MAX_DEPTH)throw Error('Cubic subdivision depth limit exceeded');
        const [left,right]=split(node.c),mid=(node.t0+node.t1)/2,depth=node.depth+1;
        stack.push({c:right,t0:mid,t1:node.t1,depth},{c:left,t0:node.t0,t1:mid,depth});
      }
    }
  }
  if(totalLength<1e-6)throw Error('Cubic path length must be at least 0.000001');
  // Accumulation can round above the per-node allocation; do not relax the request.
  if(lengthBracketGap>tolerance||maxParameterDeviation>tolerance)throw Error('Cubic stopping diagnostics exceed tolerance');
  const plan=freeze({segments,totalLength,tolerance,approximation:{lengthMethod:'subdivision-chord-sum',leafCount:leaves.length,lengthBracketGap,maxParameterDeviation}});
  plans.set(plan,{leaves,segments});return plan;
}

function evaluate(s,t) {
  if(t===0)return {...s.p0};
  if(t===1)return {...s.p3};
  const a=mix(s.p0,s.p1,t),b=mix(s.p1,s.p2,t),c=mix(s.p2,s.p3,t);
  return mix(mix(a,b,t),mix(b,c,t),t);
}
function tangent(s,t) {
  const u=1-t;
  let x=u*u*(s.p1.x-s.p0.x)+2*u*t*(s.p2.x-s.p1.x)+t*t*(s.p3.x-s.p2.x);
  let y=u*u*(s.p1.y-s.p0.y)+2*u*t*(s.p2.y-s.p1.y)+t*t*(s.p3.y-s.p2.y);
  if(x===0&&y===0&&(t===0||t===1)){
    const candidates=t===0?[[s.p0,s.p1],[s.p0,s.p2],[s.p0,s.p3]]:[[s.p2,s.p3],[s.p1,s.p3],[s.p0,s.p3]];
    for(const [a,b] of candidates){x=b.x-a.x;y=b.y-a.y;if(x!==0||y!==0)break;}
  }
  const scale=Math.max(Math.abs(x),Math.abs(y));
  if(scale===0)return {unitTangent:null,angle:null,tangentDefined:false};
  const sx=x/scale,sy=y/scale,norm=Math.hypot(sx,sy),unitTangent={x:sx/norm,y:sy/norm};
  return {unitTangent,angle:Math.atan2(unitTangent.y,unitTangent.x),tangentDefined:true};
}

export function sampleCubicPath(plan,progress) {
  const data=plans.get(plan);
  if(!data)throw Error('Expected compileCubicPath result from this module instance');
  number(progress,0,1);
  const distance=progress*plan.totalLength,{leaves,segments}=data;
  let lo=0,hi=leaves.length-1;
  // Exact distance boundaries choose the outgoing interval; the final endpoint is incoming.
  while(lo<hi){const mid=(lo+hi)>>1;if(distance>=leaves[mid].endDistance)lo=mid+1;else hi=mid;}
  const leaf=leaves[lo],fraction=(distance-leaf.startDistance)/(leaf.endDistance-leaf.startDistance);
  const parameter=progress===1?1:distance===leaf.startDistance?leaf.t0:leaf.t0+(leaf.t1-leaf.t0)*fraction;
  const s=segments[leaf.segmentIndex];
  return freeze({position:evaluate(s,parameter),...tangent(s,parameter),distance,segmentIndex:leaf.segmentIndex,parameter});
}
