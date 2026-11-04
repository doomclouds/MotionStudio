import {object,number,integer,point,optional,choice,freeze} from '../../../validate.mjs';
import {composeTransform,transformBounds} from '../../../matrix.mjs';
import {itemIds,dimensions} from '../../../internal/layout-input.mjs';
export function splitPanels(input) {
  object(input,['itemIds','viewport','axis','gap'],['itemIds','viewport','axis']);
  const ids=itemIds(input.itemIds),v=dimensions(input.viewport),axis=choice(input.axis,['x','y']),gap=number(optional(input.gap,0),0,100000);
  integer(ids.length,2,8);const length=(axis==='x'?v.width:v.height)-(ids.length-1)*gap;if(length<=0)throw Error('Gaps exhaust viewport');
  const size=length/ids.length;
  return freeze(ids.map((itemId,i)=>{const rect={x:0,y:0,width:axis==='x'?size:v.width,height:axis==='y'?size:v.height};const m=composeTransform({x:axis==='x'?i*(size+gap):0,y:axis==='y'?i*(size+gap):0});return {itemId,rect,matrix:m,zIndex:i,geometryBounds:transformBounds(m,rect)};}));
}
