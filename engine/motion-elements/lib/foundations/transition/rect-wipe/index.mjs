import {composeTransform} from '../../../matrix.mjs';
export function applyLocal(a,b,w,h,dir,p){
    // A stays fully behind B. A zero-width incoming clip is skipped by the adapter.
    if(dir==='left')b.clip={x:w*(1-p),y:0,width:w*p,height:h};
    if(dir==='right')b.clip={x:0,y:0,width:w*p,height:h};
    if(dir==='up')b.clip={x:0,y:h*(1-p),width:w,height:h*p};
    if(dir==='down')b.clip={x:0,y:0,width:w,height:h*p};
}
