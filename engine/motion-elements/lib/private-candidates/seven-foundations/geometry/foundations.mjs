/** Private 2D foundation candidates. No registration/publication implied. */
const own = (v,keys,optional=[]) => {if(!v || Object.getPrototypeOf(v)!==Object.prototype)throw new TypeError('Plain object required');const d=Object.getOwnPropertyDescriptors(v);if(Reflect.ownKeys(d).some(k=>!keys.includes(k)||!('value' in d[k]))||keys.some(k=>!optional.includes(k)&&!d[k]))throw new TypeError('Exact data fields required');return v;};
const dense=(v,min,max)=>{if(!Array.isArray(v)||v.length<min||v.length>max)throw new RangeError('Array count');return Array.from({length:v.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d||!('value' in d))throw new TypeError('Dense data array required');return d.value;});};
const number=(v,min=-1e4,max=1e4)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw new RangeError('Finite bounded number required');return v;};
const point=p=>{own(p,['x','y']);return {x:number(p.x),y:number(p.y)};};
const points=(ps,min=1,max=64)=>{return dense(ps,min,max).map(point);};
const rect=r=>{own(r,['x','y','width','height']);return {x:number(r.x),y:number(r.y),width:number(r.width,1e-4,1e4),height:number(r.height,1e-4,1e4)};};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
/** Nearest-site clipped convex cells. Coincident sites rejected; input order is identity. */
export function voronoiCells(options) {
 const {sites,bounds}=own(options,['sites','bounds']);
 const s=points(sites),r=rect(bounds);
 for(let i=0;i<s.length;i++)for(let j=0;j<i;j++)if(dist(s[i],s[j])<1e-6)throw new RangeError('Sites too close');
 return s.map((a,i)=>{
  let poly=[{x:r.x,y:r.y},{x:r.x+r.width,y:r.y},{x:r.x+r.width,y:r.y+r.height},{x:r.x,y:r.y+r.height}];
  for(let j=0;j<s.length;j++)if(i!==j){
   const b=s[j],nx=b.x-a.x,ny=b.y-a.y,mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
   const side=p=>(p.x-mx)*nx+(p.y-my)*ny;let out=[];
   for(let k=0;k<poly.length;k++){const p=poly[k],q=poly[(k+1)%poly.length],u=side(p),v=side(q);if(u<=0)out.push(p);if((u<=0)!==(v<=0)){const t=u/(u-v);out.push({x:p.x+t*(q.x-p.x),y:p.y+t*(q.y-p.y)});}}
   poly=out;if(!poly.length)break;
  }
  return {index:i,site:{...a},vertices:poly};
 });
}
/** Hungarian minimum-cost perfect assignment; unlike layout, resolves unknown identity correspondence. */
export function minimumCostAssignment(costs) {
 if(!Array.isArray(costs)||costs.length<1||costs.length>128)throw new RangeError('Matrix size 1..128');const n=costs.length;
 const c=dense(costs,1,128).map(row=>{if(!Array.isArray(row)||row.length!==n)throw new RangeError('Square matrix required');return dense(row,n,n).map(x=>number(x,0,1e9));});
 const u=Array(n+1).fill(0),v=[...u],p=[...u],way=[...u];
 for(let i=1;i<=n;i++){
  p[0]=i;let j0=0;const minv=Array(n+1).fill(Infinity),used=Array(n+1).fill(false);
  do {used[j0]=true;const i0=p[j0];let delta=Infinity,j1=0;
   for(let j=1;j<=n;j++)if(!used[j]){const cur=c[i0-1][j-1]-u[i0]-v[j];if(cur<minv[j]){minv[j]=cur;way[j]=j0;}if(minv[j]<delta){delta=minv[j];j1=j;}}
   for(let j=0;j<=n;j++)if(used[j]){u[p[j]]+=delta;v[j]-=delta;}else minv[j]-=delta;
   j0=j1;
  }while(p[j0]!==0);
  do {const j1=way[j0];p[j0]=p[j1];j0=j1;}while(j0);
 }
 const columns=Array(n);for(let j=1;j<=n;j++)columns[p[j]-1]=j-1;
 return {columns,totalCost:columns.reduce((sum,j,i)=>sum+c[i][j],0)};
}
// Segment enters OPEN obstacle interior. Boundary travel is allowed, no hidden safety margin.
function crosses(a,b,r){let lo=0,hi=1;for(const [key,start,end] of [['x',r.x,r.x+r.width],['y',r.y,r.y+r.height]]){const d=b[key]-a[key];if(d===0){if(a[key]<=start||a[key]>=end)return false;}else {let t0=(start-a[key])/d,t1=(end-a[key])/d;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);}}return lo<hi && hi>0 && lo<1;}
/** Euclidean shortest polyline among nonoverlapping axis-aligned inflated rectangles. */
export function routeRectangles(options) {
 const {start,end,obstacles,clearance=0}=own(options,['start','end','obstacles','clearance'],['clearance']);
 const a=point(start),b=point(end),margin=number(clearance,0,1000);
 if(!Array.isArray(obstacles)||obstacles.length>24)throw new RangeError('0..24 obstacles');
 const rs=dense(obstacles,0,24).map(r0=>{const r=rect(r0);return {x:r.x-margin,y:r.y-margin,width:r.width+2*margin,height:r.height+2*margin};});
 const inside=(p,r)=>p.x>r.x&&p.x<r.x+r.width&&p.y>r.y&&p.y<r.y+r.height;
 for(let i=0;i<rs.length;i++){if(inside(a,rs[i])||inside(b,rs[i]))throw new RangeError('Endpoint in inflated obstacle');for(let j=0;j<i;j++){const x=rs[i],y=rs[j];if(x.x<y.x+y.width&&x.x+x.width>y.x&&x.y<y.y+y.height&&x.y+x.height>y.y)throw new RangeError('Inflated obstacles overlap');}}
 const nodes=[a,b,...rs.flatMap(r=>[{x:r.x,y:r.y},{x:r.x+r.width,y:r.y},{x:r.x+r.width,y:r.y+r.height},{x:r.x,y:r.y+r.height}])],n=nodes.length;
 const d=Array(n).fill(Infinity),prev=Array(n).fill(-1),done=Array(n).fill(false);d[0]=0;
 for(let k=0;k<n;k++){let i=-1;for(let j=0;j<n;j++)if(!done[j]&&(i<0||d[j]<d[i]))i=j;if(i<0||!Number.isFinite(d[i]))break;done[i]=true;if(i===1)break;
  for(let j=0;j<n;j++)if(!done[j]&&!rs.some(r=>crosses(nodes[i],nodes[j],r))){const alt=d[i]+dist(nodes[i],nodes[j]);if(alt<d[j]){d[j]=alt;prev[j]=i;}}
 }
 if(!Number.isFinite(d[1]))return {reachable:false,vertices:[],length:null};
 const path=[];for(let i=1;i!==-1;i=prev[i])path.push({...nodes[i]});path.reverse();return {reachable:true,vertices:path,length:d[1]};
}
/** Global Gaussian radial basis interpolation of authored landmark displacement. */
export function compileRadialWarp(options){
 const {source,target,radius}=own(options,['source','target','radius']);
 const a=points(source,1,32),b=points(target,1,32),r=number(radius,1e-4,1e4);if(a.length!==b.length)throw new RangeError('Landmark count mismatch');const n=a.length;
 const mat=a.map((p,i)=>[...a.map(q=>Math.exp(-((dist(p,q)/r)**2))),b[i].x-p.x,b[i].y-p.y]);
 for(let k=0;k<n;k++) {let pivot=k;for(let i=k+1;i<n;i++)if(Math.abs(mat[i][k])>Math.abs(mat[pivot][k]))pivot=i;if(Math.abs(mat[pivot][k])<1e-9)throw new RangeError('Ill-conditioned landmarks/radius');[mat[k],mat[pivot]]=[mat[pivot],mat[k]];const div=mat[k][k];for(let j=k;j<n+2;j++)mat[k][j]/=div;for(let i=0;i<n;i++)if(i!==k){const factor=mat[i][k];for(let j=k;j<n+2;j++)mat[i][j]-=factor*mat[k][j];}}
 const w=mat.map(row=>[row[n],row[n+1]]);if(w.some(row=>row.some(x=>!Number.isFinite(x)||Math.abs(x)>1e8)))throw new RangeError('Warp coefficient envelope');
 for(let j=0;j<n;j++){let dx=0,dy=0;for(let i=0;i<n;i++){const g=Math.exp(-((dist(a[j],a[i])/r)**2));dx+=g*w[i][0];dy+=g*w[i][1];}if(Math.abs(a[j].x+dx-b[j].x)>1e-7||Math.abs(a[j].y+dy-b[j].y)>1e-7)throw new RangeError('Landmark residual exceeds 1e-7');}
 return Object.freeze({sample(input,strength=1){const ps=points(input,0,8192),s=number(strength,0,1);return ps.map(p=>{let dx=0,dy=0;for(let i=0;i<n;i++){const g=Math.exp(-((dist(p,a[i])/r)**2));dx+=g*w[i][0];dy+=g*w[i][1];}return {x:p.x+s*dx,y:p.y+s*dy};});}});
}
