/** Original analytic planar reach geometry; not physics, a rig, or an integrator. */
import {object,number,choice,freeze,fail} from './validate.mjs';
const fields=['root','target','upperLength','lowerLength','bend','fallbackAxis'];
function position(p){object(p,['x','y'],['x','y']);return {x:number(p.x,-1e6,1e6),y:number(p.y,-1e6,1e6)};}
/** World-space two-link solve. Positive bend is (-axis.y,axis.x). */
export function solveTwoLinkIK(input){
 object(input,fields,fields);
 const root=position(input.root),target=position(input.target),fallback=position(input.fallbackAxis);
 const upper=number(input.upperLength,.001,1e5),lower=number(input.lowerLength,.001,1e5);
 const side=choice(input.bend,['positive','negative'])==='positive'?1:-1;
 const fallbackLength=Math.hypot(fallback.x,fallback.y);
 if(fallbackLength<1e-9)fail('Fallback axis length must be at least 1e-9');
 const dx=target.x-root.x,dy=target.y-root.y,requestedDistance=Math.hypot(dx,dy);
 if(requestedDistance>0&&requestedDistance<1e-9)fail('Nonzero root-target distance must be at least 1e-9');
 const usedFallback=requestedDistance===0;
 const ux=usedFallback?fallback.x/fallbackLength:dx/requestedDistance;
 const uy=usedFallback?fallback.y/fallbackLength:dy/requestedDistance;
 const inner=Math.abs(upper-lower),outer=upper+lower;
 const reach=requestedDistance<inner?'inside':requestedDistance>outer?'outside':'reachable';
 const solvedDistance=Math.max(inner,Math.min(outer,requestedDistance));
 let along,height;
 if(solvedDistance===0){along=0;height=upper;}
 else if(solvedDistance===outer){along=upper;height=0;}
 else if(solvedDistance===inner){along=upper>=lower?upper:-upper;height=0;}
 else{
  // Factor the difference of squares, and use the triangle-area product for
  // height instead of subtracting two almost equal squared link lengths.
  along=(solvedDistance+(upper-lower)*outer/solvedDistance)/2;
  height=Math.sqrt((outer-solvedDistance)*(outer+solvedDistance)*
    (solvedDistance-inner)*(solvedDistance+inner))/(2*solvedDistance);
 }
 const joint={x:root.x+ux*along-uy*height*side,y:root.y+uy*along+ux*height*side};
 const end=reach==='reachable'?{...target}:{x:root.x+ux*solvedDistance,y:root.y+uy*solvedDistance};
 const error={x:target.x-end.x,y:target.y-end.y};error.distance=Math.hypot(error.x,error.y);
 const angles={upper:Math.atan2(joint.y-root.y,joint.x-root.x),lower:Math.atan2(end.y-joint.y,end.x-joint.x)};
 return freeze({root,target,joint,end,angles,reach,projected:reach!=='reachable',usedFallback,requestedDistance,solvedDistance,error});
}
