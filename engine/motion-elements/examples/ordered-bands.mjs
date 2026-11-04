import {freeze, integer, number} from '../lib/validate.mjs';
import {compileOrderedBands, sampleOrderedBands} from '../lib/foundations/layout/ordered-bands.mjs';
// Synthetic allocations: illustrative only, not measurements or semantic inference.
export const orderedBandExamples = freeze([
  {name:'work-allocation', ids:['research','build','review'], from:[2,5,3], to:[4,2,4], colors:['#355C70','#B9C8A4','#E4BD84']},
  {name:'capacity-allocation', ids:['reserved','active','idle','buffer'], from:[0,7,2,1], to:[3,0,2,5], colors:['#796B91','#D29B88','#A6C3BF','#E4DAB6']},
  {name:'single-allocation', ids:['whole'], from:[1], to:[10], colors:['#355C70']},
]);
export function createOrderedBandExample(index) {
  integer(index,0,orderedBandExamples.length-1);
  const e = orderedBandExamples[index];
  if (!e) throw Error('unknown example');
  const plan = compileOrderedBands(Object.fromEntries(['from','to'].map(key=>[key,e.ids.map((id,i)=>({id,weight:e[key][i]}))])));
  // Existing Canvas composition can transform/clip this draw; no adapter registry addition.
  return {sample:progress=>sampleOrderedBands(plan,progress), draw(ctx,progress,width,height) {
    number(width,Number.MIN_VALUE,1e6); number(height,Number.MIN_VALUE,1e6);
    const result = sampleOrderedBands(plan,progress);
    ctx.save();
    try { for (const [i,b] of result.bands.entries()) {
      ctx.fillStyle=e.colors[i]; ctx.fillRect(b.start*width,0,b.fraction*width,height);
    }} finally {ctx.restore();}
    return result;
  }};
}
