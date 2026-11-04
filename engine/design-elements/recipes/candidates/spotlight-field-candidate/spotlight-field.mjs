// SPDX-License-Identifier: MIT
/** Art-directed 2D spotlight state. No simulation, Canvas, assets, clock or global RNG. */
const states=new WeakSet();
function record(v,keys){if(!v||Object.getPrototypeOf(v)!==Object.prototype||Reflect.ownKeys(v).length!==keys.length)throw Error('Expected exact plain data object');for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(!d||!Object.hasOwn(d,'value'))throw Error('Missing field or accessor');}return v;}
function num(v,lo,hi){if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi)throw Error('Number outside bounds');return v;}
function point(p,limit=32768){record(p,['x','y']);return{x:num(p.x,-limit,limit),y:num(p.y,-limit,limit)}}
function freeze(v){if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v)}return v;}
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
/** All positions in one caller-owned world coordinate system, angles in radians. */
export function solveSpotlight(input){
 record(input,['mount','target','emitterOffset','halfAngle','feather','intensity','receiver']);
 const mount=point(input.mount),target=point(input.target),offset=num(input.emitterOffset,0,4096),halfAngle=num(input.halfAngle,.005,Math.PI/3),feather=num(input.feather,.001,1),intensity=num(input.intensity,0,1);
 record(input.receiver,['aspect','rotation','projectionScale']);const projectionScale=num(input.receiver.projectionScale,.1,10),aspect=num(input.receiver.aspect,.1,10),rotation=num(input.receiver.rotation,-Math.PI,Math.PI);
 const dx=target.x-mount.x,dy=target.y-mount.y,total=Math.hypot(dx,dy);if(total<.01||total>32768||offset>=total-.01)throw Error('Target must lie beyond emitter with bounded positive reach');
 const direction={x:dx/total,y:dy/total},normal={x:-dy/total,y:dx/total},emitter={x:mount.x+direction.x*offset,y:mount.y+direction.y*offset},length=total-offset,radius=length*Math.tan(halfAngle);
 if(radius>16384||radius*projectionScale>16384||radius*aspect*projectionScale>16384)throw Error('Receiver radius budget exceeded');
 const state=freeze({type:'candidate.spotlight-field',mount,target,emitter,emitterOffset:offset,direction,normal,angle:Math.atan2(dy,dx),length,radius,feather,intensity,receiver:{center:{...target},radiusX:radius*aspect*projectionScale,radiusY:radius*projectionScale,rotation},polygon:[emitter,{x:target.x+normal.x*radius,y:target.y+normal.y*radius},{x:target.x-normal.x*radius,y:target.y-normal.y*radius}]});
 states.add(state);return state;
}
export function assertSpotlight(light){if(!states.has(light))throw Error('Expected spotlight state from this module instance');}
export function coverageAt(light,p){
 assertSpotlight(light);p=point(p,131072);const dx=p.x-light.emitter.x,dy=p.y-light.emitter.y,along=dx*light.direction.x+dy*light.direction.y,across=Math.abs(dx*light.normal.x+dy*light.normal.y),u=along/light.length,halfWidth=light.radius*u;
 const lateral=halfWidth>0?smooth((1-across/halfWidth)/light.feather):0;
 // Near/far fade avoids a luminous hard cap and singular bright point at the emitter.
 const axial=u>0&&u<1?Math.sin(Math.PI*u):0;
 const r=light.receiver,rx=p.x-r.center.x,ry=p.y-r.center.y,c=Math.cos(r.rotation),s=Math.sin(r.rotation),rho=Math.hypot((rx*c+ry*s)/r.radiusX,(-rx*s+ry*c)/r.radiusY);
 return Object.freeze({beam:light.intensity*lateral*axial,receiver:light.intensity*smooth((1-rho)/light.feather)});
}
