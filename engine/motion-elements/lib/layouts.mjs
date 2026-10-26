import {object,number,integer,point,optional,id,choice,freeze} from './validate.mjs';
import {composeTransform,transformBounds} from './matrix.mjs';
export function itemIds(values) {
  if(!Array.isArray(values)||!values.length||values.length>128)throw Error('Expected 1..128 item IDs');
  const ids=values.map(id);if(new Set(ids).size!==ids.length)throw Error('Duplicate item ID');return ids;
}
function dimensions(input) {object(input,['width','height'],['width','height']);return {width:number(input.width,.001,100000),height:number(input.height,.001,100000)};}
export function offsetCards(input) {
  object(input,['itemIds','origin','card','offset','rotationStep','zOrder'],['itemIds','origin','card','offset']);
  const ids=itemIds(input.itemIds),origin=point(input.origin),card=dimensions(input.card),offset=point(input.offset);
  const step=number(optional(input.rotationStep,0),-Math.PI,Math.PI),z=choice(optional(input.zOrder,'ascending'),['ascending','descending']);
  return freeze(ids.map((itemId,i)=>{const rect={x:0,y:0,...card};const m=composeTransform({x:origin.x+offset.x*i,y:origin.y+offset.y*i,rotation:step*i,pivot:{x:card.width/2,y:card.height/2}});return {itemId,rect,matrix:m,zIndex:z==='ascending'?i:ids.length-1-i,geometryBounds:transformBounds(m,rect)};}));
}
export function splitPanels(input) {
  object(input,['itemIds','viewport','axis','gap'],['itemIds','viewport','axis']);
  const ids=itemIds(input.itemIds),v=dimensions(input.viewport),axis=choice(input.axis,['x','y']),gap=number(optional(input.gap,0),0,100000);
  integer(ids.length,2,8);const length=(axis==='x'?v.width:v.height)-(ids.length-1)*gap;if(length<=0)throw Error('Gaps exhaust viewport');
  const size=length/ids.length;
  return freeze(ids.map((itemId,i)=>{const rect={x:0,y:0,width:axis==='x'?size:v.width,height:axis==='y'?size:v.height};const m=composeTransform({x:axis==='x'?i*(size+gap):0,y:axis==='y'?i*(size+gap):0});return {itemId,rect,matrix:m,zIndex:i,geometryBounds:transformBounds(m,rect)};}));
}
