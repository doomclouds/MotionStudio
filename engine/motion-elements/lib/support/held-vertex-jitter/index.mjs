// Held, deterministic vertex offsets. No resampling, smoothing, renderer or implicit clock.
import {seededUnit} from '../../math.mjs';
import {compilePolylineSections} from '../polyline-sections.mjs';
const plans=new WeakSet();
export function compileHeldVertexJitter(input){
 if(!input||Object.getPrototypeOf(input)!==Object.prototype)throw TypeError('plain record required');
 const keys=['points','seed','amplitude','holdFrames','lockEndpoints'];
 for(const k of Reflect.ownKeys(input))if(!keys.includes(k)||!Object.hasOwn(Object.getOwnPropertyDescriptor(input,k),'value'))throw TypeError('own data fields only');
 const {points,seed,amplitude=1,holdFrames=4,lockEndpoints=true}=input;
 const path=compilePolylineSections({points});
 if(typeof seed!=='string'||seed.length>128)throw TypeError('bounded seed string required');
 if(!Number.isFinite(amplitude)||amplitude<0||amplitude>100)throw RangeError('amplitude 0..100 required');
 if(!Number.isSafeInteger(holdFrames)||holdFrames<1||holdFrames>10000)throw RangeError('holdFrames 1..10000 required');
 if(typeof lockEndpoints!=='boolean')throw TypeError('lockEndpoints must be boolean');
 for(let i=0;i<path.points.length;i++)if(!lockEndpoints||(i!==0&&i!==path.points.length-1)){
  const p=path.points[i];if(Math.abs(p.x)+amplitude>1e6||Math.abs(p.y)+amplitude>1e6)throw RangeError('movable vertex must reserve amplitude inside coordinate domain');
 }
 const plan=Object.freeze({points:path.points,seed,amplitude,holdFrames,lockEndpoints,closed:path.closedCoordinates});plans.add(plan);return plan;
}
export function sampleHeldVertexJitter(plan,frame){
 if(!plans.has(plan))throw TypeError('compileHeldVertexJitter plan required');
 if(!Number.isSafeInteger(frame)||frame<0||frame>1e9)throw RangeError('integer frame 0..1e9 required');
 const tick=Math.floor(frame/plan.holdFrames);
 const points=plan.points.map((p,i)=>{
  if(plan.lockEndpoints&&(i===0||i===plan.points.length-1))return Object.freeze({...p});
  const vertex=plan.closed&&i===plan.points.length-1?0:i;
  const noise=axis=>2*seededUnit(plan.seed,`vertex-${vertex}`,axis,tick)-1;
  return Object.freeze({x:p.x+plan.amplitude*noise('x'),y:p.y+plan.amplitude*noise('y')});
 });
 return Object.freeze({tick,points:Object.freeze(points)});
}
