/** Original bounded 2D Bridson-style minimum-distance sampler. Not dynamics or maximal packing. */
function fail(m){throw new TypeError(m)}
function plain(v,allowed,required=allowed){if(!v||Object.getPrototypeOf(v)!==Object.prototype)fail('Plain object required');const ds=Object.getOwnPropertyDescriptors(v);for(const k of Reflect.ownKeys(ds)){if(typeof k!=='string'||!allowed.includes(k)||!('value'in ds[k]))fail('Unknown field/accessor');}for(const k of required)if(!Object.hasOwn(ds,k))fail('Missing field');return v}
function number(v,min,max){if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)fail('Number outside supported domain');return v}
function integer(v,min,max){number(v,min,max);if(!Number.isInteger(v))fail('Integer required');return v}
function circle(v){plain(v,['x','y','radius']);return{x:number(v.x,-1e6,1e6),y:number(v.y,-1e6,1e6),radius:number(v.radius,.001,1e5)}}
function frozen(v){if(v&&typeof v==='object'){Object.values(v).forEach(frozen);Object.freeze(v)}return v}
export function samplePoissonDisc(input){
 plain(input,['domain','exclusion','minDistance','seed','maxPoints','attempts'],['domain','minDistance','seed','maxPoints']);const domain=circle(input.domain),exclusion=Object.hasOwn(input,'exclusion')?circle(input.exclusion):null;
 const r=number(input.minDistance,.001,2e5),seed=integer(input.seed,0,4294967295),maxPoints=integer(input.maxPoints,1,128),attempts=Object.hasOwn(input,'attempts')?integer(input.attempts,1,64):30;
 if(exclusion&&Math.hypot(exclusion.x-domain.x,exclusion.y-domain.y)+exclusion.radius>=domain.radius)fail('Exclusion must lie strictly inside domain');
 const cell=r/Math.SQRT2,n=Math.ceil(2*domain.radius/cell);if(!Number.isSafeInteger(n)||n*n>262144)fail('Spatial grid resource limit');const grid=new Int32Array(n*n).fill(-1),points=[],active=[];let state=seed,proposals=0;
 const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
 const valid=p=>Math.hypot(p.x-domain.x,p.y-domain.y)<=domain.radius&&(!exclusion||Math.hypot(p.x-exclusion.x,p.y-exclusion.y)>=exclusion.radius);
 const origin={x:domain.x-domain.radius,y:domain.y-domain.radius};
 const index=p=>({x:Math.min(n-1,Math.floor((p.x-origin.x)/cell)),y:Math.min(n-1,Math.floor((p.y-origin.y)/cell))});
 const accept=p=>{const g=index(p);if(grid[g.y*n+g.x]!==-1)return false;for(let y=Math.max(0,g.y-2);y<=Math.min(n-1,g.y+2);y++)for(let x=Math.max(0,g.x-2);x<=Math.min(n-1,g.x+2);x++){const i=grid[y*n+x];if(i!==-1&&Math.hypot(p.x-points[i].x,p.y-points[i].y)<r)return false;}const i=points.length;points.push({...p,id:'p'+i});active.push(i);grid[g.y*n+g.x]=i;return true};
 // Rejection is explicitly bounded; a narrow remaining domain may fail initialization.
 let initial=null;for(let k=0;k<4096;k++){proposals++;const a=random()*Math.PI*2,rad=Math.sqrt(random())*domain.radius,p={x:domain.x+rad*Math.cos(a),y:domain.y+rad*Math.sin(a)};if(valid(p)){initial=p;break}}
 if(!initial)fail('No valid initial sample within initialization budget');accept(initial);
 while(active.length&&points.length<maxPoints){const ai=Math.floor(random()*active.length),p=points[active[ai]];let accepted=false;for(let k=0;k<attempts;k++){proposals++;const a=random()*Math.PI*2,rad=r*Math.sqrt(1+3*random()),q={x:p.x+rad*Math.cos(a),y:p.y+rad*Math.sin(a)};if(valid(q)&&accept(q)){accepted=true;break}}if(!accepted){active[ai]=active.at(-1);active.pop()}}
 return frozen({algorithm:'bounded-bridson-2d',domain,exclusion,minDistance:r,seed,maxPoints,attempts,points,proposals,gridCells:n*n,termination:points.length===maxPoints?'point-limit':'active-list-exhausted',claims:{minimumCenterDistance:true,maximalPacking:false,exactRequestedCount:false,collisionFreeMotion:false}});
}
