// Cross-library technical consumer: one sampled geometry supplies both ink and pen.
import {drawMarker} from '../index.mjs';
import {compileHeldVertexJitter,sampleHeldVertexJitter} from '../../../../../motion-elements/lib/support/held-vertex-jitter/index.mjs';
import {compilePolylineSections,extractPolylineSection} from '../../../../../motion-elements/lib/support/polyline-sections.mjs';
const plan=compileHeldVertexJitter({points:[{x:25,y:90},{x:80,y:90},{x:80,y:35},{x:150,y:35}],seed:'annotation',amplitude:1,holdFrames:4});
export function drawHeldAnnotation(ctx,frame,progress){
 if(!Number.isFinite(progress)||progress<0||progress>1)throw RangeError('progress 0..1');
 const geometry=sampleHeldVertexJitter(plan,frame),path=compilePolylineSections({points:geometry.points}),section=extractPolylineSection(path,{startDistance:0,endDistance:path.totalLength*progress});
 if(section.empty)return {section,marker:null};
 ctx.save();try{ctx.strokeStyle='#245681';ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';ctx.setLineDash([]);ctx.beginPath();section.vertices.forEach((v,i)=>i?ctx.lineTo(v.position.x,v.position.y):ctx.moveTo(v.position.x,v.position.y));ctx.stroke();}finally{ctx.restore();}
 const tip=section.vertices.at(-1).position,marker=drawMarker(ctx,{...tip,angle:-.45,length:60,width:10,ink:'#b44634'});
 return {section,marker};
}
