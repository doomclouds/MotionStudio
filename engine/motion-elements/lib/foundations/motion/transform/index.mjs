import {object,number,point,optional,choice,id} from '../../../validate.mjs';
import {lerp,seededUnit} from '../../../math.mjs';
import {composeTransform,identity} from '../../../matrix.mjs';
const transform=v=>{object(v,['x','y','scaleX','scaleY','rotation'],['x','y','scaleX','scaleY','rotation']);return {x:number(v.x),y:number(v.y),scaleX:number(v.scaleX,-1000,1000),scaleY:number(v.scaleY,-1000,1000),rotation:number(v.rotation,-1e6,1e6)};};

export function validateParameters(p) {
    object(p,['from','to','origin'],['from','to']);p={from:transform(p.from),to:transform(p.to),origin:point(optional(p.origin,{x:0,y:0}))};
    return p;
}
export function sampleLocal(p,u,reduced) {
    let m=identity();
    const t=reduced?1:u,values=Object.fromEntries(Object.keys(p.from).map(k=>[k,lerp(p.from[k],p.to[k],t)]));
    m=composeTransform({...values,pivot:p.origin});
    return m;
}
