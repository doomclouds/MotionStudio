import {own,points,number,dist} from '../../../internal/geometry-validation.mjs';
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
