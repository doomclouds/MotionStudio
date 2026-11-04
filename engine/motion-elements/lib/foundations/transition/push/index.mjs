import {composeTransform} from '../../../matrix.mjs';
export function validateViewport(w,h){if(!Number.isSafeInteger(w)||!Number.isSafeInteger(h))throw Error('Push requires integer viewport dimensions for pixel-aligned seams');}
export function applyLocal(a,b,w,h,dir,p){
    const x=dir==='left'?-w:dir==='right'?w:0,y=dir==='up'?-h:dir==='down'?h:0;
    const dx=Math.round(x*p),dy=Math.round(y*p);
    a.matrix=composeTransform({x:dx,y:dy});b.matrix=composeTransform({x:dx-x,y:dy-y});
}
