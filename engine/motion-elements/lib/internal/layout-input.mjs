import {object,number,id} from '../validate.mjs';
export function itemIds(values) {
  if(!Array.isArray(values)||!values.length||values.length>128)throw Error('Expected 1..128 item IDs');
  const ids=values.map(id);if(new Set(ids).size!==ids.length)throw Error('Duplicate item ID');return ids;
}
export function dimensions(input) {object(input,['width','height'],['width','height']);return {width:number(input.width,.001,100000),height:number(input.height,.001,100000)};}
