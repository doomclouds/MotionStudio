/** Source-order, same-width shortest-column layout; no image loading or clock. */
import {object, number, integer, id, freeze, fail} from '../../validate.mjs';
import {composeTransform, transformBounds} from '../../matrix.mjs';
function dense(a) {
  if (!Array.isArray(a) || Object.getPrototypeOf(a) !== Array.prototype || a.length > 128) fail('Expected ordinary same-realm array of 0..128 items');
  for (let i=0;i<a.length;i++) if (!Object.hasOwn(a,i)) fail('Sparse array');
  for (const k of Reflect.ownKeys(a)) if (k !== 'length' && !(typeof k === 'string' && /^(0|[1-9][0-9]*)$/.test(k) && Number(k)<a.length)) fail('Unknown array field');
  return a;
}
export function masonryLayout(input) {
  object(input,['items','columns','columnWidth','columnGap','rowGap'],['items','columns','columnWidth','columnGap','rowGap']);
  const columnCount=integer(input.columns,1,128), columnWidth=number(input.columnWidth,.001,10000);
  const columnGap=number(input.columnGap,0,10000), rowGap=number(input.rowGap,0,10000), seen=new Set();
  const source=dense(input.items).map(item=>{
    object(item,['itemId','height'],['itemId','height']);
    const itemId=id(item.itemId),height=number(item.height,.001,10000);
    if(seen.has(itemId))fail('Duplicate item ID');
    seen.add(itemId);return {itemId,height};
  });
  const columns=Array.from({length:columnCount},(_,i)=>({itemIds:[],x:i*(columnWidth+columnGap),width:columnWidth,height:0}));
  const items=source.map((item,zIndex)=>{
    let index=0;
    for(let i=1;i<columnCount;i++)if(columns[i].height<columns[index].height)index=i;
    const column=columns[index],y=column.itemIds.length?column.height+rowGap:0;
    const rect={x:0,y:0,width:columnWidth,height:item.height},matrix=composeTransform({x:column.x,y});
    column.itemIds.push(item.itemId);column.height=y+item.height;
    return {itemId:item.itemId,rect,matrix,zIndex,geometryBounds:transformBounds(matrix,rect)};
  });
  return freeze({items,columns,columnCount,width:columns.at(-1).x+columnWidth,height:Math.max(...columns.map(c=>c.height))});
}
