import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {coverageGlyph} from '../index.mjs';

// Two original, synthetic content consumers. Not footage, real telemetry, or a font test.
export function buildExamples() {
 const columns=30,rows=24;
 const inputs=[
  {name:'shaded-ring',ramp:' .,:;-/+*%$0MW#',sample(x,y){const X=(x-15)/11,Y=(y-12)/10,r=Math.hypot(X,Y);return {coverage:r>.45&&r<1?1:0,luminance:Math.max(0,Math.min(1,.5+.5*X))};}},
  {name:'three-level-thermal-map',ramp:' .#',sample(x,y){return {coverage:x>1&&x<28&&y>2&&y<22?1:0,luminance:Math.max(0,Math.min(1,.5+.3*Math.sin(x*.24)+.2*Math.cos(y*.31)))};}},
 ];
 return inputs.map(s=>{
  const tokens=Array.from({length:rows},(_,y)=>Array.from({length:columns},(_,x)=>coverageGlyph({...s.sample(x,y),ramp:s.ramp})));
  return {name:s.name,tokens,rows:tokens.map(row=>row.map(c=>c??' ').join(''))};
 });
}
const examples=buildExamples();
assert.equal(examples.length,2);
for(const example of examples){assert.equal(example.rows.length,24);assert(example.rows.every(row=>row.length===30));}
const thermal=examples[1].tokens.flat().filter(token=>token!==null);assert(thermal.includes('#')&&thermal.includes('.')&&thermal.includes(' '));
if(process.argv[1] && fileURLToPath(import.meta.url)===process.argv[1])for(const example of examples)console.log(example.name+'\n'+example.rows.join('\n'));
