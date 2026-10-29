/** Original, absolute-input vertical sticky constraint. No DOM, clock or scroll state. */
import {object,number,id,freeze,fail} from './validate.mjs';
const coordinate=value=>number(value,-1e6,1e6);
export function stickyIntervalLayout(input){
 const fields=['itemId','rect','container','scrollOffset','pinY'];object(input,fields,fields);
 const itemId=id(input.itemId),r=input.rect;object(r,['x','y','width','height'],['x','y','width','height']);
 const rect={x:coordinate(r.x),y:coordinate(r.y),width:number(r.width,.001,1e6),height:number(r.height,.001,1e6)};
 const c=input.container;object(c,['start','end'],['start','end']);
 const start=coordinate(c.start),end=coordinate(c.end),scrollOffset=coordinate(input.scrollOffset),pinY=coordinate(input.pinY);
 if(end<=start)fail('Container interval must be positive');
 // Use the same subtraction for containment, the release threshold and release
 // placement. Testing rect.y + height instead can admit an inverted interval.
 const lastY=end-rect.height;
 if(rect.y<start||rect.y>lastY)fail('Rectangle must fit vertically inside container');
 const pin=rect.y-pinY,release=lastY-pinY,naturalY=rect.y-scrollOffset;
 const phase=scrollOffset<pin?'normal':scrollOffset>release?'released':'pinned';
 const y=phase==='normal'?naturalY:phase==='pinned'?pinY:lastY-scrollOffset;
 return freeze({itemId,phase,rect:{...rect,y},naturalY,shiftY:y-naturalY,thresholds:{pin,release}});
}
