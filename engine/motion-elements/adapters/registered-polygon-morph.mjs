import {assertRegisteredPolygonState} from '../lib/registered-polygon-morph.mjs';
import {object,number} from '../lib/validate.mjs';
/** Caller owns parent transform. No current-path mutation, no automatic correspondence or repair. */
export function drawRegisteredPolygonMorph(ctx,state,style,backend){
 assertRegisteredPolygonState(state);
 object(style,['fill','stroke','lineWidth']);
 for(const key of Reflect.ownKeys(style))if(!['fill','stroke','lineWidth'].includes(key))throw Error('Unknown polygon style field');
 if(style.fill===undefined&&style.stroke===undefined)throw Error('Polygon fill or stroke required');
 for(const key of ['fill','stroke'])if(style[key]!==undefined&&(typeof style[key]!=='string'||!style[key].trim()))throw Error('Polygon colors must be nonempty Canvas color strings');
 const lineWidth=style.lineWidth===undefined?1:number(style.lineWidth,Number.MIN_VALUE,1e4);
 object(backend,['Path2D'],['Path2D']);
 for(const key of Reflect.ownKeys(backend))if(key!=='Path2D')throw Error('Unknown polygon backend field');
 if(typeof backend.Path2D!=='function')throw Error('Native or browser Path2D constructor required');
 const path=new backend.Path2D();
 const [first,...rest]=state.vertices;path.moveTo(first.x,first.y);for(const p of rest)path.lineTo(p.x,p.y);path.closePath();
 ctx.save();try{
  if(style.fill!==undefined){ctx.fillStyle=style.fill;ctx.fill(path,'nonzero');}
  if(style.stroke!==undefined){ctx.strokeStyle=style.stroke;ctx.lineWidth=lineWidth;ctx.stroke(path);}
 }finally{ctx.restore();}
}
