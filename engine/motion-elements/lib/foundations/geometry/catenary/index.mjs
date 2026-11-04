// Original implementation. Geometry only: equilibrium hanging cable, no dynamics.
const plans=new WeakSet();
const freeze=o=>{for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return Object.freeze(o);};
function obj(o,keys,name){if(!o||typeof o!=='object'||Array.isArray(o)||Object.getPrototypeOf(o)!==Object.prototype)throw TypeError(name+' must be plain object');for(const k of Reflect.ownKeys(o))if(typeof k!=='string'||!keys.includes(k))throw TypeError(name+' unknown field');for(const k of keys)if(!Object.hasOwn(o,k))throw TypeError(name+' missing '+k);}
function finite(v,name,lo=-1e6,hi=1e6){if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi)throw RangeError(name+' out of range');return v;}
function point(p,name){obj(p,['x','y'],name);return{x:finite(p.x,name+'.x'),y:finite(p.y,name+'.y')};}
function check(p){if(!plans.has(p))throw TypeError('Expected compiled catenary plan');}
/** Endpoints, total arc length and unit gravity direction. Caller controls time. */
export function compileCatenary(spec){
 obj(spec,['from','to','length','gravity'],'catenary');const from=point(spec.from,'from'),to=point(spec.to,'to'),gravity=point(spec.gravity,'gravity'),length=finite(spec.length,'length',1e-6,1e6);
 const gm=Math.hypot(gravity.x,gravity.y);if(gm<1e-12)throw RangeError('gravity norm must be >=1e-12');const g={x:gravity.x/gm,y:gravity.y/gm},h={x:g.y,y:-g.x};
 const dx=to.x-from.x,dy=to.y-from.y,chord=Math.hypot(dx,dy);if(chord<1e-6)throw RangeError('coincident/near-coincident endpoints unsupported');if(length<chord)throw RangeError('length shorter than endpoint distance');if(length/chord>32)throw RangeError('slack ratio exceeds 32');
 let transverse=dx*h.x+dy*h.y,vertical=dx*g.x+dy*g.y;const flip=transverse<0,base=flip?to:from;if(flip){transverse=-transverse;vertical=-vertical;}
 let kind,a=null,u=null,w=null,z0=null,z1=null;
 if(length===chord){kind='taut';}
 else{
  if(transverse/chord<1e-4)throw RangeError('slack vertical/near-vertical spans unsupported; supply transverse separation');
  // Solve the positive excess directly; never form 1 + a sub-ULP excess.
  const excess=((length-chord)/transverse)*((length+chord)/transverse);
  const target=excess/(Math.sqrt(1+excess)+1);
  const ratioExcess=v=>{
   if(v<=1){let term=v*v/6,sum=term;for(let k=2;k<=12;k++){term*=v*v/((2*k)*(2*k+1));sum+=term;}return sum;}
   return Math.sinh(v)/v-1;
  };
  let lo=0,hi=1;while(ratioExcess(hi)<target)hi*=2;
  for(let i=0;i<90;i++){const mid=(lo+hi)/2;if(ratioExcess(mid)<target)lo=mid;else hi=mid;}
  u=(lo+hi)/2;a=transverse/(2*u);w=Math.sign(vertical)*0.5*Math.log1p(2*Math.abs(vertical)/(length-Math.abs(vertical)));z0=-u-w;z1=u-w;kind='catenary';
 }
 const plan=freeze({kind,from,to,length,chord,gravity:g,transverseAxis:h,base:{...base},flip,transverse,vertical,a,u,w,z0,z1,analyticLength:kind==='taut'?chord:length,tautLengthError:kind==='taut'?length-chord:0});plans.add(plan);return plan;
}
/** Parameter addresses normalized analytic arc distance in floating-point arithmetic, not x or Bezier t. */
export function sampleCatenary(plan,fraction){check(plan);finite(fraction,'fraction',0,1);const q=plan.flip?1-fraction:fraction;let position,tangent;
 if(plan.kind==='taut'){const dx=plan.to.x-plan.from.x,dy=plan.to.y-plan.from.y;position={x:plan.from.x+dx*fraction,y:plan.from.y+dy*fraction};tangent={x:dx/plan.chord,y:dy/plan.chord};}
 else{
  // Work from the nearer endpoint. The asinh difference is evaluated by
  // tanh((z-zEnd)/2)=(sinh(z)-sinh(zEnd))/(cosh(z)+cosh(zEnd)).
  const right=q>0.5,r=right?1-q:q,ze=right?plan.z1:plan.z0;
  const se=Math.sinh(ze),ce=Math.hypot(1,se),ds=(right?-1:1)*r*plan.length/plan.a;
  const sz=se+ds,cz=Math.hypot(1,sz),dz=2*Math.atanh(ds/(cz+ce));
  const x=right?plan.transverse+plan.a*dz:plan.a*dz;
  const dy=-(right?-1:1)*r*plan.length*(sz+se)/(cz+ce);
  const y=(right?plan.vertical:0)+dy,sign=plan.flip?-1:1;
  const tx=sign/cz,ty=-sign*sz/cz;
  position={x:plan.base.x+x*plan.transverseAxis.x+y*plan.gravity.x,y:plan.base.y+x*plan.transverseAxis.y+y*plan.gravity.y};
  tangent={x:tx*plan.transverseAxis.x+ty*plan.gravity.x,y:tx*plan.transverseAxis.y+ty*plan.gravity.y};
 }

 // Exact endpoints; tangent remains analytic. Zero endpoint drift on repeated samples.
 if(fraction===0)position={...plan.from};if(fraction===1)position={...plan.to};return freeze({fraction,distance:fraction*plan.analyticLength,position,tangent,normal:{x:-tangent.y,y:tangent.x},angle:Math.atan2(tangent.y,tangent.x)});
}
export function sampleCatenaryPolyline(plan,options){check(plan);obj(options,["segments"],"polyline options");const {segments}=options;if(!Number.isInteger(segments)||segments<2||segments>4096)throw RangeError('segments must be 2..4096');return freeze(Array.from({length:segments+1},(_,i)=>sampleCatenary(plan,i/segments)));}
