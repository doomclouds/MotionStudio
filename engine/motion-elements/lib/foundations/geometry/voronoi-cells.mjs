import {own,points,rect,dist} from '../../internal/geometry-validation.mjs';
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
