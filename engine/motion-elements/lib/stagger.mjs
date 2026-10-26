import {rational,add,compare} from '../../motion-timeline-core/lib/timeline.mjs';
import {time,timing} from './time.mjs';
import {object,freeze} from './validate.mjs';
import {itemIds} from './layouts.mjs';
export function compileStagger(input) {
  object(input,['itemIds','start','duration','step'],['itemIds','start','duration','step']);
  const ids=itemIds(input.itemIds),start=time(input.start),duration=time(input.duration),step=time(input.step);
  if(compare(step,rational(0))<0)throw Error('Stagger step must be nonnegative');
  return freeze(ids.map((itemId,i)=>{const at=add(start,rational(BigInt(step.n)*BigInt(i),step.d));const r=timing(at,duration);return {itemId,range:{start:r.start,end:r.end}};}));
}
