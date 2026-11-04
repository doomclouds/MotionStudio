import {object,number,integer,point,optional,choice,freeze} from '../../../validate.mjs';
import {composeTransform,transformBounds} from '../../../matrix.mjs';
import {itemIds,dimensions} from '../../../internal/layout-input.mjs';
export function offsetCards(input) {
  object(input,['itemIds','origin','card','offset','rotationStep','zOrder'],['itemIds','origin','card','offset']);
  const ids=itemIds(input.itemIds),origin=point(input.origin),card=dimensions(input.card),offset=point(input.offset);
  const step=number(optional(input.rotationStep,0),-Math.PI,Math.PI),z=choice(optional(input.zOrder,'ascending'),['ascending','descending']);
  return freeze(ids.map((itemId,i)=>{const rect={x:0,y:0,...card};const m=composeTransform({x:origin.x+offset.x*i,y:origin.y+offset.y*i,rotation:step*i,pivot:{x:card.width/2,y:card.height/2}});return {itemId,rect,matrix:m,zIndex:z==='ascending'?i:ids.length-1-i,geometryBounds:transformBounds(m,rect)};}));
}
