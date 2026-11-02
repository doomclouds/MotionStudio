'use strict';
// Entirely new analytic synthetic fields. No screenshot, study mesh or artwork sampling.
function waveField(){const cols=9,rows=7,values=[];for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)values.push(.5+.38*Math.sin(x*.68+y*.41)*Math.cos(y*.57));return{cols,rows,values}}
function islandsField(){const cols=7,rows=9,values=[];for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=Math.exp(-((x-1.4)**2+(y-2.1)**2)/3.2),b=Math.exp(-((x-4.7)**2+(y-6)**2)/4.8);values.push(Math.min(1,.06+.88*a+.72*b))}return{cols,rows,values}}
const ocean=()=>({width:420,height:280,field:waveField(),pitch:11,angle:.34,grain:0,palette:{ink:[.055,.04,.13],accent:[.37,.28,.73],paper:[.97,.91,.86]}});
const orchard=()=>({width:280,height:420,field:islandsField(),pitch:8,angle:-.52,grain:.012,palette:{ink:[.12,.04,.12],accent:[.83,.3,.14],paper:[.99,.91,.65]}});
module.exports={waveField,islandsField,ocean,orchard};
