import {compileOrderedStrokeReveal,sampleOrderedStrokeReveal} from './index.mjs';
const contour=points=>[{op:'M',values:points[0]},...points.slice(1).map(values=>({op:'L',values})),{op:'Z',values:[]}];
// Original non-font geometry: a short bar, a bent ribbon, and a detached bar.
export function buildExamples(){
 const short={outline:contour([[0,0],[20,0],[20,4],[0,4]]),median:[{x:0,y:2},{x:20,y:2}],duration:1,revealWidth:6};
 const bend={outline:contour([[0,0],[24,0],[24,24],[18,24],[18,6],[0,6]]),median:[{x:0,y:3},{x:21,y:3},{x:21,y:24}],duration:2,revealWidth:8};
 const detached={outline:contour([[40,8],[60,8],[60,12],[40,12]]),median:[{x:40,y:10},{x:60,y:10}],duration:.5,revealWidth:6};
 return [compileOrderedStrokeReveal({strokes:[short],startTime:0,liftDuration:0}),compileOrderedStrokeReveal({strokes:[bend,detached],startTime:1,liftDuration:.25})];
}
if(import.meta.url===`file://${process.argv[1]}`)console.log(JSON.stringify(buildExamples().map(p=>sampleOrderedStrokeReveal(p,1.5)),null,2));
