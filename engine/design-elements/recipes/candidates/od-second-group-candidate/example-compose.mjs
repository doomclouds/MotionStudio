// Synthetic transfer, not an additional accepted work. Writes only if caller chooses to encode the returned canvas.
import {renderFrame,drawFrame,drawTiltedType} from './runtime.mjs';
export async function composeExample(canvasApi,assetRoot){
 const diagram=await renderFrame('decision-tree',{canvasApi,assetDir:assetRoot+'/decision-tree',nodeCopy:['Ready to publish?','Yes','Wait','Run test suite','Review scope','Check resource rights','Ask for feedback']});
 const sheet=canvasApi.createCanvas(1920,1080),g=sheet.getContext('2d');g.fillStyle='#f5f2ef';g.fillRect(0,0,1920,1080);
 drawFrame(diagram,g,{x:0,y:220,scale:.5});
 // Text helper consumes a registered family from Decision Tree; no hidden extra font dependency.
 drawTiltedType(g,{canvasApi,text:'Scope before style.',x:1020,y:440,size:48,font:'DecisionStudy600',angle:-3,color:'#d8000f',maxWidth:820});
 drawTiltedType(g,{canvasApi,text:'Small reusable parts.',x:1020,y:530,size:36,font:'DecisionStudy500',angle:2,maxWidth:820});
 return sheet;
}
