import {object,number,point,optional,choice,id} from '../../../validate.mjs';
import {lerp,seededUnit} from '../../../math.mjs';
import {composeTransform,identity} from '../../../matrix.mjs';

export function validateParameters(p) {
    object(p,['from','to'],['from','to']);p={from:number(p.from,0,1),to:number(p.to,0,1)};
    return p;
}
export function sampleLocal(p,u) {
    let opacity=1;
    opacity=lerp(p.from,p.to,u);
    return opacity;
}
