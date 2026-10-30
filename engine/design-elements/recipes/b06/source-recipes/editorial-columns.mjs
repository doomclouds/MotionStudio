// Candidate authored fixed-line recipe, not automatic pagination or a published family.
import{state}from'./shared.mjs';
export function drawAuthoredColumns(ctx,p){
 const{x,gap,width,font,ink,columns}=p;if(![x,gap,width].every(Number.isFinite)||width<=0||gap<0)throw Error('Finite positive column width and nonnegative gap required');if(typeof font!=='string'||typeof ink!=='string'||!Array.isArray(columns)||columns.length<1||columns.length>3)throw Error('Explicit font, ink and 1..3 authored columns required');
 return state(ctx,()=>{ctx.font=font;ctx.fillStyle=ink;ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.letterSpacing='0px';
 const prepared=columns.map((col,i)=>{let previous=-Infinity;if(!Array.isArray(col)||!col.length)throw Error('Empty column');return col.map(line=>{if(typeof line.text!=='string'||!line.text.length||!Number.isFinite(line.y)||line.y<=previous||typeof line.justify!=='boolean')throw Error('Authored lines require text, ascending baselines and explicit justification');previous=line.y;const chars=[...line.text],advances=chars.map(ch=>ctx.measureText(ch).width),natural=advances.reduce((a,b)=>a+b,0);if(natural>width+.01)throw Error('Authored line exceeds column width; edit line breaks, do not silently shrink');return{...line,x:x+i*(width+gap),chars,advances,spacing:line.justify&&chars.length>1?(width-natural)/(chars.length-1):0};})});
 for(const col of prepared)for(const line of col){if(!line.justify){ctx.fillText(line.text,line.x,line.y);continue}let px=line.x;line.chars.forEach((ch,j)=>{ctx.fillText(ch,px,line.y);px+=line.advances[j]+line.spacing})}
 return{kind:'authored-editorial-columns',automaticFlow:false,columnCount:columns.length,lineCount:prepared.flat().length,readingOrder:'column-major',sourceOfTruth:'authored lines supplied by caller'};
 });
}
