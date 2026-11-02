/** Apache-2.0. Static recipe inspired by nexu-io/OpenDesign research-decision-room.
 * Renders authored recommendations WITH their limitations and proposed test.
 * It does not derive, validate, rank, or statistically certify the content.
 */
export const id='recipe.decision-support.v1';
const required=['recommendation','counter','measure','reversible'];
function finite(n,name,min){if(!Number.isFinite(n)||n<min)throw new RangeError(`${name} must be >= ${min}`);return n}
function authored(s,name){if(typeof s!=='string'||!s.trim()||s.length>800)throw new TypeError(`${name}: nonempty authored text <=800 chars required`);return s.trim()}
function wrap(ctx,s,width,font){ctx.font=font;const paragraphs=s.split('\n'),lines=[];for(const paragraph of paragraphs){const words=paragraph.trim().split(/\s+/);let line='';for(const word of words){if(ctx.measureText(word).width>width)throw new RangeError('unbreakable word exceeds content width');const candidate=line?`${line} ${word}`:word;if(ctx.measureText(candidate).width<=width)line=candidate;else{lines.push(line);line=word}}if(line)lines.push(line)}return lines}
export function layout(ctx,{bounds,theme,data}){
 if(!ctx?.measureText)throw new TypeError('Canvas text measurement required');
 const b=bounds;if(!b)throw new TypeError('bounds required');finite(b.x,'x',0);finite(b.y,'y',0);finite(b.width,'width',320);finite(b.height,'height',480);
 if(!theme)throw new TypeError('theme required');for(const k of ['font','ink','muted','line','inverse'])authored(theme[k],`theme.${k}`);if(!data)throw new TypeError('data required');required.forEach(k=>authored(data[k],k));
 const label=authored(data.label??'Recommended move','label');
 ctx.save();try{
 const rec=wrap(ctx,data.recommendation,b.width-44,`400 18px ${theme.font}`);if(rec.length>5)throw new RangeError('recommendation exceeds five lines');
 const recHeight=84+rec.length*27;
 const rows=[['counter','What could be wrong'],['measure','Measure next'],['reversible','Reversible step']].map(([role,title])=>({role,title,lines:wrap(ctx,data[role],b.width,`400 14px ${theme.font}`)}));
 if(rows.some(r=>r.lines.length>3))throw new RangeError('support note exceeds three lines');
 let total=0;for(const r of rows){r.height=57+r.lines.length*24;total+=r.height}total-=15;
 const start=b.y+b.height-total;if(start<b.y+recHeight+32)throw new RangeError('recommendation and limits overlap: increase height or shorten content');
 let y=start;for(const r of rows){r.y=y;y+=r.height}
 ctx.font=`700 12px ${theme.font}`;if(ctx.measureText(label.toUpperCase()).width>b.width-44)throw new RangeError('label exceeds width');
 return {id,bounds:{...b},recommendation:{x:b.x,y:b.y,width:b.width,height:recHeight,label:label.toUpperCase(),lines:rec},notes:rows,readingOrder:['recommendation',...rows.map(r=>r.role)]};
 }finally{ctx.restore()}
}
export function draw(ctx,props){
 const l=layout(ctx,props),t=props.theme,r=l.recommendation;
 const state={fillStyle:ctx.fillStyle,strokeStyle:ctx.strokeStyle,lineWidth:ctx.lineWidth,textBaseline:ctx.textBaseline,textAlign:ctx.textAlign,font:ctx.font,globalAlpha:ctx.globalAlpha};
 ctx.save();try{
 ctx.textBaseline='alphabetic';ctx.textAlign='left';ctx.fillStyle=t.ink;ctx.fillRect(r.x,r.y,r.width,r.height);
 ctx.font=`700 12px ${t.font}`;ctx.fillStyle=t.inverse;ctx.globalAlpha=state.globalAlpha*.68;ctx.fillText(r.label,r.x+22,r.y+40);ctx.globalAlpha=state.globalAlpha;
 ctx.font=`400 18px ${t.font}`;r.lines.forEach((s,i)=>ctx.fillText(s,r.x+22,r.y+82+i*27));
 for(const n of l.notes){ctx.fillStyle=t.line;ctx.fillRect(l.bounds.x,n.y,l.bounds.width,1);ctx.fillStyle=t.ink;ctx.font=`700 16px ${t.font}`;ctx.fillText(n.title,l.bounds.x,n.y+33);ctx.fillStyle=t.muted;ctx.font=`400 14px ${t.font}`;n.lines.forEach((s,i)=>ctx.fillText(s,l.bounds.x,n.y+61+i*24))}
 }finally{ctx.restore();Object.assign(ctx,state)}return l;
}
