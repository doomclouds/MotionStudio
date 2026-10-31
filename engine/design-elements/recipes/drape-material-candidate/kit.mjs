// SPDX-License-Identifier: MIT
import {record,number,def} from './input.mjs';
import {assertModel,paintDrape} from './drape.mjs';
export function createDrapeKit(provider) {
  const p=record(provider,['createCanvas']);if(typeof p.createCanvas!=='function')throw TypeError('trusted fresh Canvas factory');
  const handles=new WeakMap(),surfaces=new WeakSet();
  function tile(model, options={}) {
    const m=assertModel(model),o=record(options,['ratio'],[]),ratio=number(def(o.ratio,1),1,2,true);
    const w=m.width*ratio,h=m.height*ratio;if(w*h>4800000)throw RangeError('per-tile pixel budget');
    const canvas=p.createCanvas(w,h);
    if(!canvas||typeof canvas!=='object'||canvas.width!==w||canvas.height!==h||typeof canvas.getContext!=='function'||surfaces.has(canvas))throw TypeError('fresh requested-size surface');
    surfaces.add(canvas);const ctx=canvas.getContext('2d');
    if(!ctx||typeof ctx.scale!=='function'||typeof ctx.createLinearGradient!=='function'||typeof ctx.createRadialGradient!=='function'||typeof ctx.fillRect!=='function')throw TypeError('Canvas2D surface');
    ctx.scale(ratio,ratio);paintDrape(ctx,m);
    const result=Object.freeze({width:m.width,height:m.height,ratio,model:m});handles.set(result,canvas);return result;
  }
  function source(t) {const c=handles.get(t);if(!c)throw TypeError('same-kit tile');return c;}
  function place(ctx,t,x=0,y=0) {const c=source(t);number(x,-16384,16384);number(y,-16384,16384);if(!ctx||typeof ctx.drawImage!=='function')throw TypeError('trusted destination');ctx.drawImage(c,x,y,t.width,t.height);}
  function png(t) {const c=source(t);if(typeof c.toBuffer!=='function')throw TypeError('PNG-capable trusted provider');return c.toBuffer('image/png');}
  return Object.freeze({tile,place,png});
}
