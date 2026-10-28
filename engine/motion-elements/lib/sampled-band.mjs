import {object,number,freeze,fail} from './validate.mjs';
const bands=new WeakSet();
/** Experimental piecewise-linear envelope; halfWidth is vertical, not normal to the curve. */
export function compileSampledBand(input){
 object(input,['samples'],['samples']);
 const source=input.samples,n=source?.length;
 if(!Array.isArray(source)||n<2||n>1024)fail('Sampled band requires 2..1024 samples');
 const keys=new Set(['length',...Array.from({length:n},(_,i)=>String(i))]);
 for(const key of Reflect.ownKeys(source))if(!keys.has(key))fail('Unknown sampled band array field');
 const samples=[],upper=[],lower=[];let minY=Infinity,maxY=-Infinity,degenerate=true;
 for(let i=0;i<n;i++){
  if(!Object.hasOwn(source,i))fail('Sparse sampled band arrays are unsupported');
  const s=source[i];object(s,['x','y','halfWidth'],['x','y','halfWidth']);
  const x=number(s.x),y=number(s.y),halfWidth=number(s.halfWidth,0,1e9);
  if(i&&x<=samples[i-1].x)fail('Sampled band x must be strictly increasing');
  const top=number(y-halfWidth,-2e9,2e9),bottom=number(y+halfWidth,-2e9,2e9);
  if(halfWidth>0&&!(top<y&&bottom>y))fail('Sampled band positive halfWidth is numerically unrepresentable');
  samples.push({x,y,halfWidth});upper.push({x,y:top});lower.push({x,y:bottom});
  minY=Math.min(minY,top);maxY=Math.max(maxY,bottom);if(halfWidth>0)degenerate=false;
 }
 const bounds={x:samples[0].x,y:minY,width:number(samples.at(-1).x-samples[0].x,0,2e9),height:number(maxY-minY,0,4e9)};
 const band=freeze({samples,vertices:[...upper,...lower.reverse()],bounds,degenerate});
 bands.add(band);return band;
}
// Serialization is inspection only; recompile samples after transport.
export function assertSampledBand(band){if(!bands.has(band))fail('Expected compileSampledBand result from this module instance');}
