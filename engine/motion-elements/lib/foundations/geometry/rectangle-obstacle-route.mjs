import {own,point,number,dense,rect,dist} from '../../internal/geometry-validation.mjs';
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
