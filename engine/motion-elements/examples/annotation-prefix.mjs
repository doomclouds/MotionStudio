/** Original synthetic consumers of existing support; not a registered recipe. */
import {compilePolylineSections, extractPolylineSection} from '../lib/index.mjs';
import {transformPoint} from '../lib/matrix.mjs';

// Deliberately different content: a diagram leader and a measured span bracket.
export const annotationExamples = Object.freeze([
  Object.freeze({id:'diagram-leader', points:Object.freeze([
    {x:20,y:30},{x:80,y:30},{x:80,y:90},{x:140,y:90},
  ].map(Object.freeze)), matrix:Object.freeze([1,0,0,1,12,8])}),
  Object.freeze({id:'measured-span', points:Object.freeze([
    {x:30,y:70},{x:30,y:110},{x:150,y:110},{x:150,y:70},
  ].map(Object.freeze)), matrix:Object.freeze([0,1,-1,0,170,12])}),
]);
const plans = annotationExamples.map(example => compilePolylineSections({points:example.points}));

// The final section vertex is the pen anchor. There is no second clock,
// independently sampled path, or resampled trail that could cut a corner.
export function sampleAnnotationExample(index, progress, {reducedMotion=false}={}) {
  if (!Number.isInteger(index) || index<0 || index>=plans.length) throw RangeError('example index');
  if (!Number.isFinite(progress) || progress<0 || progress>1) throw RangeError('progress in [0,1]');
  if (typeof reducedMotion!=='boolean') throw TypeError('reducedMotion must be boolean');
  const plan=plans[index], p=reducedMotion ? 1 : progress;
  const section=extractPolylineSection(plan,{startDistance:0,endDistance:p*plan.totalLength});
  const screenVertices=section.vertices.map(v=>Object.freeze(transformPoint(annotationExamples[index].matrix,v.position)));
  return Object.freeze({section, screenVertices:Object.freeze(screenVertices),
    pen:screenVertices.at(-1), drawStroke:!section.empty,
    showPen:!reducedMotion && p>0 && p<1});
}

// Bounded technical Canvas consumer, not a general painter. Caller owns canvas,
// clearing, backdrop and frame export. Styles/transform/clip are restored;
// the current path is not preserved, as with standard Canvas path drawing.
export function drawAnnotationExample(ctx, index, progress, options={}) {
  const state=sampleAnnotationExample(index,progress,options);
  ctx.save();
  try {
    if(state.drawStroke){
      ctx.strokeStyle='#173554';ctx.lineWidth=4;ctx.lineCap='butt';ctx.lineJoin='miter';ctx.setLineDash([]);
      ctx.beginPath();
      state.screenVertices.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
      ctx.stroke();
    }
    if(state.showPen){
      ctx.fillStyle='#c94332';ctx.beginPath();ctx.arc(state.pen.x,state.pen.y,3,0,2*Math.PI);ctx.fill();
    }
  } finally {ctx.restore();}
  return state;
}
