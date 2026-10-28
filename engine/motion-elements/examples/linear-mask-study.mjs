import {sampleTransition,drawTransition,rational as T} from '../lib/index.mjs';
// Neutral synchronous Canvas2D recipe; no assets, brand content, clock or I/O.
export function drawLinearMaskStudy(ctx,at,{width=640,height=360,variant='band',reducedMotion=false,Path2D}={}){
 const variants={band:{mode:'band',angle:Math.PI/2},diagonal:{mode:'sweep',angle:.17},reverse:{mode:'sweep',angle:Math.PI}};
 if(!Object.hasOwn(variants,variant))throw Error('Unknown study variant');
 const state=sampleTransition({type:'transition.linear-mask',version:1,range:{start:T(1),end:T(3)},curve:{type:'smoothstep'},params:{width,height,...variants[variant]}},at,{reducedMotion});
 const outgoing=c=>{c.fillStyle='#14212d';c.fillRect(0,0,width,height);c.fillStyle='#6fa6bd';for(let i=0;i<4;i++)c.fillRect(width*(.12+i*.2),height*.3,width*.12,height*.4);};
 const incoming=c=>{c.fillStyle='#f0eadb';c.fillRect(0,0,width,height);c.fillStyle='#263944';for(let i=0;i<3;i++){c.beginPath();c.arc(width*(.25+i*.25),height*.5,Math.min(width,height)*.1,0,Math.PI*2);c.fill();}};
 drawTransition(ctx,state,{outgoing,incoming},{Path2D});return state;
}
