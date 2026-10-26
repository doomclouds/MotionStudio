import {number, object, optional, point} from './validate.mjs';
export const identity = () => [1, 0, 0, 1, 0, 0];
export function matrix(value) {
  if (!Array.isArray(value) || value.length !== 6) throw Error('Affine matrix must contain six numbers');
  return value.map(v => number(v));
}
/** Column-vector affine matrices: multiply(A,B) applies B first, then A. */
export function multiply(left, right) {
  const [a,b,c,d,e,f] = matrix(left), [g,h,i,j,k,l] = matrix(right);
  return matrix([a*g+c*h,b*g+d*h,a*i+c*j,b*i+d*j,a*k+c*l+e,b*k+d*l+f]);
}
export function transformPoint(m, p) { const [a,b,c,d,e,f] = matrix(m); p=point(p); return {x:a*p.x+c*p.y+e,y:b*p.x+d*p.y+f}; }
export function composeTransform(input = {}) {
  object(input, ['x','y','scaleX','scaleY','rotation','pivot']);
  const x=number(optional(input.x,0)), y=number(optional(input.y,0));
  const sx=number(optional(input.scaleX,1),-1000,1000), sy=number(optional(input.scaleY,1),-1000,1000);
  const r=number(optional(input.rotation,0),-1e6,1e6), p=point(optional(input.pivot,{x:0,y:0}));
  const c=Math.cos(r),s=Math.sin(r), a=c*sx,b=s*sx,cc=-s*sy,d=c*sy;
  return matrix([a,b,cc,d,x+p.x-a*p.x-cc*p.y,y+p.y-b*p.x-d*p.y]);
}
export function transformBounds(m, bounds) {
  object(bounds,['x','y','width','height'],['x','y','width','height']);
  const x=number(bounds.x), y=number(bounds.y), w=number(bounds.width,0),h=number(bounds.height,0);
  const ps=[{x,y},{x:x+w,y},{x,y:y+h},{x:x+w,y:y+h}].map(p=>transformPoint(m,p));
  const xs=ps.map(p=>p.x),ys=ps.map(p=>p.y),minX=Math.min(...xs),minY=Math.min(...ys);
  return {x:minX,y:minY,width:Math.max(...xs)-minX,height:Math.max(...ys)-minY};
}
