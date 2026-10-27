import {object,number,integer,point,freeze} from './validate.mjs';
const plans=new WeakSet();
/** Independent analytic orientations in local space; no velocities or history. */
export function compileAttractorField(input){
 object(input,['bounds','columns','rows'],['bounds','columns','rows']);
 object(input.bounds,['x','y','width','height'],['x','y','width','height']);
 const {bounds}=input,x=number(bounds.x,-1e6,1e6),y=number(bounds.y,-1e6,1e6),width=number(bounds.width,1e-6,1e6),height=number(bounds.height,1e-6,1e6);
 const columns=integer(input.columns,1,128),rows=integer(input.rows,1,128);
 if(columns*rows>4096)throw Error('Field is limited to 4096 cells');
 const cells=Array.from({length:columns*rows},(_,i)=>{const row=Math.floor(i/columns),column=i%columns;return {cellId:`row:${row}/col:${column}`,position:{x:x+(column+.5)*width/columns,y:y+(row+.5)*height/rows}};});
 const plan=freeze({bounds:{x,y,width,height},columns,rows,cells});plans.add(plan);return plan;
}
export function sampleAttractorField(plan,input){
 if(!plans.has(plan))throw Error('Expected compiled field plan');
 object(input,['attractor','radial','tangential'],['attractor','radial','tangential']);
 const a=point(input.attractor),r=number(input.radial,-1,1),t=number(input.tangential,-1,1),scale=Math.max(Math.abs(r),Math.abs(t)),weight=scale===0?0:Math.hypot(r/scale,t/scale);
 return freeze({cells:plan.cells.map(cell=>{
  const dx=a.x-cell.position.x,dy=a.y-cell.position.y,distance=Math.hypot(dx,dy);
  if(distance===0||weight===0)return {...cell,distance,direction:{x:0,y:0},angle:0,defined:false};
  const spatialScale=Math.max(Math.abs(dx),Math.abs(dy)),spatialNorm=Math.hypot(dx/spatialScale,dy/spatialScale);
  const ux=(dx/spatialScale)/spatialNorm,uy=(dy/spatialScale)/spatialNorm,rr=(r/scale)/weight,tt=(t/scale)/weight;
  const direction={x:rr*ux-tt*uy,y:rr*uy+tt*ux};
  return {...cell,distance,direction,angle:Math.atan2(direction.y,direction.x),defined:true};
 })});
}
