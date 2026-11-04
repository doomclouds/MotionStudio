import {dense,number} from '../../../internal/geometry-validation.mjs';
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
