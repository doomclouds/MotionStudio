import {object,number,point,optional,choice,id} from '../../../validate.mjs';
import {lerp,seededUnit} from '../../../math.mjs';
import {composeTransform,identity} from '../../../matrix.mjs';

export function validateParameters(p) {
    object(p,['amplitudeX','amplitudeY','rotation','frequencyHz','seed','elementId','origin'],['amplitudeX','amplitudeY','rotation','frequencyHz','seed','elementId']);
    p={amplitudeX:number(p.amplitudeX,0,10000),amplitudeY:number(p.amplitudeY,0,10000),rotation:number(p.rotation,0,Math.PI),frequencyHz:number(p.frequencyHz,.01,120),seed:p.seed,elementId:id(p.elementId),origin:point(optional(p.origin,{x:0,y:0}))};
    seededUnit(p.seed,p.elementId,'x');
    return p;
}
export function sampleLocal(p,r,phase) {
    let m=identity();
    const seconds=Number(r.duration.n)/Number(r.duration.d)*phase.progress;
    const tick=seconds*p.frequencyHz,i=Math.floor(tick),blend=tick-i,sm=blend*blend*(3-2*blend);
    const noise=channel=>lerp(seededUnit(p.seed,p.elementId,channel,i)*2-1,seededUnit(p.seed,p.elementId,channel,i+1)*2-1,sm);
    const envelope=Math.sin(Math.PI*phase.progress)**2;
    m=composeTransform({x:noise('x')*p.amplitudeX*envelope,y:noise('y')*p.amplitudeY*envelope,rotation:noise('rotation')*p.rotation*envelope,pivot:p.origin});
    return m;
}
