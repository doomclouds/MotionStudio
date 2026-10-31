'use strict';
// Bounded synthetic linear chart candidate, not the source's inconsistent illustration mode.
const source=require('../data-chart/paint.cjs');
function validate(ctx,p){
 if(!Array.isArray(p?.annotations)||p.annotations.length>12)throw Error('Zero to12 annotations required');
 if(p.mode!=='linear-values')throw Error('Candidate accepts linear-values only; reference geometry stays case-local');const geo=source.chartGeometry(p),b=p.bounds;
 if(p.ticks[0].value!==0||p.ticks.at(-1).value!==p.domain[1]||p.ticks.some((t,i)=>i&&t.value<=p.ticks[i-1].value))throw Error('Ticks must increase and include domain endpoints');
 if(!Number.isInteger(b.width)||!Number.isInteger(b.height)||b.width<660||b.width>2200||Math.abs(b.x)>8192||Math.abs(b.y)>8192)throw Error('Candidate integer bounds width660..2200 required');
 const line=s=>{if(typeof s!=='string'||!s.length||s.length>100||!/^[\x20-\x7e]+$/.test(s))throw Error('Candidate uses authored ASCII single-line labels only')};
 const box=(s,x,y,align='left',italic=false)=>{line(s);ctx.font=italic?'italic 14px "ChartItalic", "ChartCJK"':'11px "ChartMono", "ChartCJK"';const m=ctx.measureText(s),w=m.width,left=x-(align==='right'?w:align==='center'?w/2:0);if(!['left','center','right'].includes(align)||left-m.actualBoundingBoxLeft<0||left+m.actualBoundingBoxRight>1100||y-m.actualBoundingBoxAscent<0||y+m.actualBoundingBoxDescent>460)throw Error('Label ink exceeds chart bounds');return w};
 for(const t of geo.ticks)if(box(t.label,20,t.y+4)>35)throw Error('Tick label exceeds gutter');
 for(const q of geo.points)if(box(q.label,q.x,445,'center')>Math.min(95,960/(geo.points.length-1)-8))throw Error('Point label exceeds category slot');
 for(const a of p.annotations||[]){const q=geo.points[a.index];if(box(a.text,q.x+a.dx,q.y+a.dy,a.align||'left')>220)throw Error('Annotation width exceeds220')}
 if(!Array.isArray(p.callout)||p.callout.length>2)throw Error('Zero to two callout lines required');p.callout.forEach((s,i)=>{if(box(s,800,380+i*18,'left',true)>220)throw Error('Callout width exceeds220')});return geo;
}
function drawLinearChart(ctx,p,theme,env){if(!env?.canvasApi?.createCanvas)throw Error('canvasApi required');const measure=env.canvasApi.createCanvas(1,1).getContext('2d'),geo=validate(measure,p),b=p.bounds,tile=env.canvasApi.createCanvas(b.width,b.height);source.drawChart(tile.getContext('2d'),{...p,bounds:{...b,x:0,y:0}},theme,env);ctx.drawImage(tile,b.x,b.y);return{bounds:{...b},geometry:geo,mode:'linear-values',dataKind:'synthetic'}}
module.exports={drawLinearChart,validate};
