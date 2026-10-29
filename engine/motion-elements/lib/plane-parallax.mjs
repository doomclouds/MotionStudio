/** Original calibrated, screen-parallel plane projection. No camera clock or 3D renderer. */
import {object,number,id,freeze,fail} from './validate.mjs';
const dimension=value=>number(value,.001,1e6);
function size(input){object(input,['width','height'],['width','height']);return {width:dimension(input.width),height:dimension(input.height)};}
function planes(input){
 if(!Array.isArray(input)||Object.getPrototypeOf(input)!==Array.prototype||input.length<1||input.length>64)fail('Expected 1..64 ordinary dense planes');
 for(const key of Reflect.ownKeys(input))if(key!=='length'&&!(typeof key==='string'&&/^(0|[1-9][0-9]*)$/.test(key)&&Number(key)<input.length))fail('Unknown planes array field');
 const ids=new Set(),result=[];
 for(let i=0;i<input.length;i++){
  if(!Object.hasOwn(input,i))fail('Sparse planes array');
  const plane=input[i];object(plane,['itemId','depth'],['itemId','depth']);
  const itemId=id(plane.itemId),depth=dimension(plane.depth);if(ids.has(itemId))fail('Duplicate plane ID');ids.add(itemId);result.push({itemId,depth});
 }
 return result;
}
/** Returns input-order Canvas affine matrices for absolute camera and viewport inputs. */
export function planeParallaxLayout(input){
 const fields=['planes','reference','camera','viewport','near'];object(input,fields,fields);
 const layers=planes(input.planes),reference=size(input.reference),near=dimension(input.near);
 const c=input.camera;object(c,['x','y','z','focalLength'],['x','y','z','focalLength']);
 const camera={x:number(c.x,-1e6,1e6),y:number(c.y,-1e6,1e6),z:number(c.z,-1e6,1e6),focalLength:dimension(c.focalLength)};
 const v=input.viewport;object(v,['x','y','width','height'],['x','y','width','height']);
 const viewport={x:number(v.x,-1e6,1e6),y:number(v.y,-1e6,1e6),width:dimension(v.width),height:dimension(v.height)};
 const fit=Math.min(viewport.width/reference.width,viewport.height/reference.height);
 const cx=viewport.x+viewport.width/2,cy=viewport.y+viewport.height/2;
 return freeze(layers.map(({itemId,depth})=>{
  const distance=depth-camera.z;if(distance<near)fail('Plane must be at or beyond near distance');
  // Ratio first makes the zero-z calibration exact for every declared depth.
  const scale=fit*(depth/distance);number(scale,0,1000);if(scale===0)fail('Projected scale must be positive');
  const x=number(cx-scale*reference.width/2-fit*camera.focalLength*camera.x/distance);
  const y=number(cy-scale*reference.height/2-fit*camera.focalLength*camera.y/distance);
  return {itemId,depth,distance,scale,matrix:[scale,0,0,scale,x,y]};
 }));
}
