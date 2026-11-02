'use strict';
const path=require('node:path');
const {loadFeatureStackEnvironment,writeExternal}=require('./runtime.cjs');
const {drawFeatureStack}=require('./feature-stack.cjs');
const {fieldNotes,workshop}=require('./examples.cjs');
function heading(g,s,x,y,size,color){g.fillStyle=color;g.font=`${size}px "FeatureStack600"`;g.fillText(s,x,y);}
function composeExamples(env){
 const a=env.canvasApi.createCanvas(720,1060),g=a.getContext('2d');g.fillStyle='#f5f2e7';g.fillRect(0,0,720,1060);
 heading(g,'FIELD NOTES / 01',64,84,15,'#326951');heading(g,'A little more',64,170,48,'#203b49');heading(g,'attention.',64,224,48,'#203b49');
 g.strokeStyle='#aab9af';g.lineWidth=1;g.beginPath();g.moveTo(64,267);g.lineTo(656,267);g.stroke();
 g.save();g.translate(64,324);g.scale(1.08,1.08);const ag=drawFeatureStack(g,fieldNotes,env);g.restore();
 heading(g,'SYNTHETIC STUDY / STATIC ONLY',64,964,15,'#50666d');heading(g,'One column. Three observations. No measured outcomes.',64,992,14,'#50666d');
 const b=env.canvasApi.createCanvas(1440,930),h=b.getContext('2d');h.fillStyle='#173c32';h.fillRect(0,0,1440,930);
 heading(h,'WORKSHOP SHEET / 02',88,78,15,'#c8e78e');heading(h,'Make the thinking visible.',88,152,52,'#eff8e9');
 h.strokeStyle='#5d7c6f';h.beginPath();h.moveTo(88,191);h.lineTo(1352,191);h.stroke();
 h.save();h.translate(88,256);h.scale(1.1,1.1);const bg=drawFeatureStack(h,workshop,env);h.restore();
 heading(h,'SIX SYNTHETIC PROMPTS / TWO COLUMNS / THE SAME BOUNDED COMPONENT',88,841,16,'#c8e78e');
 heading(h,'No live workflow, participant evidence or itemized owner approval is implied.',88,875,17,'#c3d3c8');
 return {fieldNotes:{canvas:a,geometry:ag},workshop:{canvas:b,geometry:bg}};
}
if(require.main===module){try{const env=loadFeatureStackEnvironment();const dir=process.env.FEATURE_STACK_OUTPUT;if(!dir)throw new Error('FEATURE_STACK_OUTPUT existing external directory required');for(const [name,value]of Object.entries(composeExamples(env))){writeExternal(path.join(dir,name+'.png'),value.canvas.toBuffer('image/png'));writeExternal(path.join(dir,name+'-geometry.json'),Buffer.from(JSON.stringify(value.geometry,null,2)+'\n'));}console.log('Two synthetic complete compositions rendered; not owner-accepted new works.');}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={composeExamples};
