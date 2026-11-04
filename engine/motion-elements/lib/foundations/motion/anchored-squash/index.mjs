import {object,number,point,optional,choice,id} from '../../../validate.mjs';
import {lerp,seededUnit} from '../../../math.mjs';
import {composeTransform,identity} from '../../../matrix.mjs';

export function validateParameters(p) {
    object(p,['amount','axis','origin'],['amount','axis','origin']);p={amount:number(p.amount,0,.8),axis:choice(p.axis,['x','y']),origin:point(p.origin)};
    return p;
}
export function sampleLocal(p,u) {
    let m=identity();
    const compression=1-p.amount*Math.sin(Math.PI*u)**2;
    m=composeTransform({scaleX:p.axis==='x'?compression:1/compression,scaleY:p.axis==='y'?compression:1/compression,pivot:p.origin});
    return m;
}
