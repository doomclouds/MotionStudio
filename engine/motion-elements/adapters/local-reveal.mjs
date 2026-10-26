import {object,number,choice} from '../lib/validate.mjs';
/** Local geometry only. Caller owns transforms; the adapter never changes current path. */
export function withLocalReveal(ctx,spec,draw,backend){
 object(spec,['bounds','progress','direction','radius'],['bounds','progress','direction','radius']);
 object(spec.bounds,['x','y','width','height'],['x','y','width','height']);
 const {bounds}=spec,x=number(bounds.x,-1e6,1e6),y=number(bounds.y,-1e6,1e6),w=number(bounds.width,Number.MIN_VALUE,1e6),h=number(bounds.height,Number.MIN_VALUE,1e6);
 const p=number(spec.progress,0,1),radius=number(spec.radius,0,Math.min(w,h)/2);
 const direction=choice(spec.direction,['left-to-right','right-to-left','top-to-bottom','bottom-to-top']);
 object(backend,['Path2D'],['Path2D']);
 if(typeof backend.Path2D!=='function')throw Error('Native or browser Path2D constructor required');
 if(typeof draw!=='function'||draw.constructor?.name==='AsyncFunction')throw Error('Draw must be synchronous');
 if(p===0)return;
 const boundary=new backend.Path2D(),strip=new backend.Path2D();
 if(typeof boundary.roundRect!=='function'||typeof strip.rect!=='function')throw Error('Path2D roundRect/rect required');
 boundary.roundRect(x,y,w,h,radius);
 if(direction==='left-to-right')strip.rect(x,y,w*p,h);
 if(direction==='right-to-left')strip.rect(x+w*(1-p),y,w*p,h);
 if(direction==='top-to-bottom')strip.rect(x,y,w,h*p);
 if(direction==='bottom-to-top')strip.rect(x,y+h*(1-p),w,h*p);
 ctx.save();try{
  ctx.clip(boundary);ctx.clip(strip);
  const result=draw(ctx);
  if(result&&typeof result.then==='function')throw Error('Draw returned a promise; asynchronous drawing is unsupported');
 }finally{ctx.restore();}
}
