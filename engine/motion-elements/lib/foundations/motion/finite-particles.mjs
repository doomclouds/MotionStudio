/** Original bounded one-shot particle plan. No integration, Canvas, or global RNG. */
const plans=new WeakSet();
function data(v,k){const d=Object.getOwnPropertyDescriptor(v,k);if(!d||!Object.hasOwn(d,'value'))throw Error('Accessors unsupported');return d.value;}
function obj(v,keys){if(!v||Object.getPrototypeOf(v)!==Object.prototype||Reflect.ownKeys(v).length!==keys.length||keys.some(k=>!Object.hasOwn(v,k)))throw Error('Invalid object shape');for(const k of keys)data(v,k);return v;}
function num(v,lo,hi){if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi)throw Error('Number outside declared bounds');return v;}
function array(v,n,max=n){if(!Array.isArray(v)||Object.getPrototypeOf(v)!==Array.prototype||v.length<n||v.length>max||Reflect.ownKeys(v).length!==v.length+1)throw Error('Invalid dense array');for(let i=0;i<v.length;i++){if(!Object.hasOwn(v,i))throw Error('Sparse array');data(v,String(i));}return v;}
function interval(v,lo,hi){array(v,2);const a=num(v[0],lo,hi),b=num(v[1],lo,hi);if(a>b)throw Error('Reversed interval');return [a,b];}
function vector(v,lo,hi){obj(v,['x','y']);return{x:interval(v.x,lo,hi),y:interval(v.y,lo,hi)};}
function freeze(v){if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v)}return v;}
// Per-ID, per-channel deterministic 32-bit mixer. Not cryptographic/statistical RNG.
function unit(seed,id,channel){let h=(seed^0x9e3779b9)>>>0;for(let i=0;i<id.length;i++)h=Math.imul(h^id.charCodeAt(i),16777619)>>>0;h=Math.imul(h^(channel+1),2246822519)>>>0;h^=h>>>15;h=Math.imul(h,3266489917)>>>0;h^=h>>>16;return(h>>>0)/4294967296;}
const choose=(ab,u)=>ab[0]+(ab[1]-ab[0])*u;
export function compileFiniteParticles(input){
 obj(input,['seed','emissions']);const seed=num(input.seed,0,4294967295);if(!Number.isInteger(seed))throw Error('Integer seed required');array(input.emissions,1,512);const ids=new Set();
 const particles=input.emissions.map(e=>{obj(e,['id','birth','position','velocity','acceleration','lifetime']);if(typeof e.id!=='string'||!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(e.id)||ids.has(e.id))throw Error('Unique bounded particle ID required');ids.add(e.id);
  const birth=num(e.birth,0,3600),position=vector(e.position,-16384,16384),velocity=vector(e.velocity,-4096,4096),lifetime=interval(e.lifetime,.001,60);obj(e.acceleration,['x','y']);const ax=num(e.acceleration.x,-1024,1024),ay=num(e.acceleration.y,-1024,1024);const life=choose(lifetime,unit(seed,e.id,4)),death=birth+life;if(!(death>birth))throw Error('Unrepresentable lifetime');
  return{id:e.id,birth,death,lifetime:life,x:choose(position.x,unit(seed,e.id,0)),y:choose(position.y,unit(seed,e.id,1)),vx:choose(velocity.x,unit(seed,e.id,2)),vy:choose(velocity.y,unit(seed,e.id,3)),ax,ay};
 });
 const plan=freeze({seed,particles});plans.add(plan);return plan;
}
export function sampleFiniteParticles(plan,at){
 if(!plans.has(plan))throw Error('Expected plan from this module instance');num(at,0,3660);const alive=[];
 for(const p of plan.particles){if(at<p.birth||at>=p.death)continue;const age=at-p.birth;alive.push({id:p.id,birth:p.birth,death:p.death,age,progress:age/p.lifetime,x:p.x+p.vx*age+.5*p.ax*age*age,y:p.y+p.vy*age+.5*p.ay*age*age,vx:p.vx+p.ax*age,vy:p.vy+p.ay*age});}
 return freeze({at,alive});
}
