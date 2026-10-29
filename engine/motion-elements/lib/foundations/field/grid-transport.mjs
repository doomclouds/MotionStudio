/** Original static-grid material transport. Finite RK2 midpoint compilation,
 * bilinear spatial sampling, piecewise-linear absolute-time cache addressing.
 * NOT fluid dynamics, incompressibility, collision avoidance or adaptive solving.
 */
const fields=new WeakMap(), paths=new WeakMap();
const algorithm='grid-transport/rk2-midpoint-linear-seek/reject-boundary/v1';
function data(o,keys){
 if(!o||Object.getPrototypeOf(o)!==Object.prototype)throw Error('plain data object required');
 const out={};for(const k of Reflect.ownKeys(o)){if(!keys.includes(k))throw Error('unknown field');const d=Object.getOwnPropertyDescriptor(o,k);if(!Object.hasOwn(d,'value'))throw Error('accessor forbidden');out[k]=d.value;}
 for(const k of keys)if(!Object.hasOwn(out,k))throw Error('missing field');return out;
}
function number(n,a,b){if(typeof n!=='number'||!Number.isFinite(n)||n<a||n>b)throw Error('finite domain');return n===0?0:n;}
function integer(n,a,b){number(n,a,b);if(!Number.isInteger(n))throw Error('integer required');return n;}
function dense(a,min,max){
 if(!Array.isArray(a)||Object.getPrototypeOf(a)!==Array.prototype)throw Error('ordinary array required');const n=a.length;if(n<min||n>max)throw Error('array resource bound');
 const copy=new Array(n);for(const k of Reflect.ownKeys(a)){if(k==='length')continue;if(typeof k!=='string'||!/^(0|[1-9][0-9]*)$/.test(k)||Number(k)>=n)throw Error('array extra field');const d=Object.getOwnPropertyDescriptor(a,k);if(!Object.hasOwn(d,'value'))throw Error('array accessor forbidden');copy[Number(k)]=d.value;}
 for(let i=0;i<n;i++)if(!Object.hasOwn(copy,i))throw Error('dense array required');return copy;
}
// Canonical data identity; a caller may SHA256 this string. No Node-only dependency.
function identity(value){return JSON.stringify(value);}
export function compileVelocityGrid(spec){
 const s=data(spec,['columns','rows','vectors']),columns=integer(s.columns,2,128),rows=integer(s.rows,2,128);
 const input=dense(s.vectors,columns*rows,columns*rows),vectors=input.map(v=>{const p=data(v,['x','y']);return Object.freeze({x:number(p.x,-4,4),y:number(p.y,-4,4)});});
 const identityKey=identity({kind:'unit-square-bilinear-velocity/v1',columns,rows,vectors});
 const plan=Object.freeze({identity:identityKey,columns,rows,vectorCount:vectors.length});fields.set(plan,{columns,rows,vectors});return plan;
}
function inside(x,y){if(x<0||x>1||y<0||y>1||!Number.isFinite(x)||!Number.isFinite(y))throw Error('integration stage outside closed unit square');}
function velocity(f,x,y){
 inside(x,y);const gx=x*(f.columns-1),gy=y*(f.rows-1),ix=Math.min(Math.floor(gx),f.columns-2),iy=Math.min(Math.floor(gy),f.rows-2),u=gx-ix,v=gy-iy;
 const a=f.vectors[iy*f.columns+ix],b=f.vectors[iy*f.columns+ix+1],c=f.vectors[(iy+1)*f.columns+ix],d=f.vectors[(iy+1)*f.columns+ix+1];
 return{x:(a.x+(b.x-a.x)*u)*(1-v)+(c.x+(d.x-c.x)*u)*v,y:(a.y+(b.y-a.y)*u)*(1-v)+(c.y+(d.y-c.y)*u)*v};
}
export function sampleVelocityGrid(plan,spec){const f=fields.get(plan);if(!f)throw Error('compiled grid required');const p=data(spec,['x','y']);return velocity(f,number(p.x,0,1),number(p.y,0,1));}
export function compileGridTransport(grid,spec){
 const f=fields.get(grid);if(!f)throw Error('compiled grid required');const s=data(spec,['seeds','duration','steps']);const input=dense(s.seeds,1,256),duration=number(s.duration,.0001,30),steps=integer(s.steps,1,4096);
 if(input.length*(steps+1)>262144)throw Error('maximum262144 cached point states');
 const seeds=input.map(v=>{const p=data(v,['x','y']);return{x:number(p.x,0,1),y:number(p.y,0,1)};}),dt=duration/steps;
 const cache=new Float64Array(input.length*(steps+1)*2);let evaluations=0;
 for(let j=0;j<seeds.length;j++){
  let {x,y}=seeds[j];const base=j*(steps+1)*2;cache[base]=x;cache[base+1]=y;
  for(let i=1;i<=steps;i++){
   const first=velocity(f,x,y);evaluations++;const midpoint=velocity(f,x+first.x*dt/2,y+first.y*dt/2);evaluations++;
   x+=midpoint.x*dt;y+=midpoint.y*dt;inside(x,y);cache[base+i*2]=x;cache[base+i*2+1]=y;
  }
 }
 const identityKey=identity({algorithm,gridIdentity:grid.identity,seeds,duration,steps});
 const plan=Object.freeze({identity:identityKey,gridIdentity:grid.identity,algorithm,duration,steps,seedCount:seeds.length,states:seeds.length*(steps+1),velocityEvaluations:evaluations,cacheBytes:cache.byteLength});
 paths.set(plan,cache);return plan;
}
export function sampleGridTransport(plan,spec){
 const cache=paths.get(plan);if(!cache)throw Error('compiled transport required');const s=data(spec,['time']),time=number(s.time,0,plan.duration),at=time/plan.duration*plan.steps,index=Math.min(Math.floor(at),plan.steps-1),fraction=at-index;
 const points=new Array(plan.seedCount);for(let j=0;j<points.length;j++){const k=(j*(plan.steps+1)+index)*2;points[j]={x:cache[k]+(cache[k+2]-cache[k])*fraction,y:cache[k+1]+(cache[k+3]-cache[k+1])*fraction};}
 return{planIdentity:plan.identity,time,index,fraction,points};
}
