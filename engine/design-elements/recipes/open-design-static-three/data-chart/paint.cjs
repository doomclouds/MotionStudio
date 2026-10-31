'use strict';
// Native static interpretation of nexu-io/OpenDesign frame-data-chart-nyt (Apache-2.0).
// No image tracing, source raster, DOM, animation, I/O, fonts or network are loaded here.
const finite=(x,n)=>{if(!Number.isFinite(x))throw new TypeError(`${n}: finite number required`);return x};
const string=(s,n)=>{if(typeof s!=='string'||!s.trim())throw new TypeError(`${n}: nonempty string required`);return s};
const color=(s,n)=>{if(typeof s!=='string'||!/^#[a-f\d]{6}$/i.test(s))throw new TypeError(`${n}: #RRGGBB required`);return s};
const id='recipe.editorial-chart-frame.v1';
function checkGlyphs(strings,env){if(!env||!(env.glyphs instanceof Set))throw Error('Caller must supply checked font glyph coverage');for(const s of strings)for(const c of s)if(!env.glyphs.has(c.codePointAt(0)))throw Error(`Unsupported glyph U+${c.codePointAt(0).toString(16).toUpperCase()}`)}
function chartStrings(p){return [...p.points.map(x=>x.label),...p.ticks.map(x=>x.label),...(p.annotations||[]).map(x=>x.text),...(p.callout||[])];}

const stateKeys=['fillStyle','strokeStyle','font','textAlign','textBaseline','lineWidth','lineCap','lineJoin','miterLimit','globalAlpha','globalCompositeOperation','letterSpacing','lineDashOffset'];
function begin(ctx){const before=Object.fromEntries(stateKeys.filter(k=>k in ctx).map(k=>[k,ctx[k]]));ctx.save();return before}
function end(ctx,before){ctx.restore();for(const[k,v]of Object.entries(before))ctx[k]=v}
const family={mono:'ChartMono',sans:'ChartSans',serif:'ChartSerif',italic:'ChartItalic',cjk:'ChartCJK'};
function fontFor(role,size){return `${role==='italic'?'italic ':role==='sans'?'600 ':''}${size}px "${family[role]}", "${family.cjk}"`}
function measure(ctx,text,role,size,spacing=0){const prior=ctx.font;try{ctx.font=fontFor(role,size);return ctx.measureText(text).width+Math.max(0,[...text].length-1)*spacing}finally{ctx.font=prior}}
function text(ctx,s,x,y,{role='mono',size=11,fill='#1a1a1a',alpha=1,align='left',spacing=0,maxWidth=Infinity}={}){const w=measure(ctx,s,role,size,spacing);if(w>maxWidth+.1)throw Error(`Text overflow: ${s} (${w.toFixed(2)} > ${maxWidth})`);const prior=begin(ctx);try{ctx.font=fontFor(role,size);ctx.fillStyle=fill;ctx.globalAlpha=alpha;ctx.textBaseline='alphabetic';ctx.textAlign='left';let at=x-(align==='right'?w:align==='center'?w/2:0);if(!spacing){const parts=size===68?s.split(/([\u3000-\u9fff]+)/):[s];for(const part of parts){if(!part)continue;ctx.font=size===68&&/[\u3000-\u9fff]/.test(part)?`${role==='italic'?'italic ':''}${size}px \"${family.cjk}\"`:fontFor(role,size);ctx.fillText(part,at,y+(/[\u3000-\u9fff]/.test(part)&&size===68?5.5:0));at+=ctx.measureText(part).width;}}else for(const ch of s){ctx.fillText(ch,at,y);at+=ctx.measureText(ch).width+spacing;}}finally{end(ctx,prior)}return w}
function validateChart(p){
 if(!p||!['reference-geometry','linear-values'].includes(p.mode))throw Error('explicit chart mode required');
 if(p.dataKind!=='synthetic')throw Error('Only synthetic specimens supported by this bounded recipe');
 string(p.disclosure,'disclosure');if(!/synthetic|synthesized/i.test(p.disclosure))throw Error('Synthetic disclosure required');
 if(!Array.isArray(p.points)||p.points.length<2||p.points.length>12)throw Error('2–12 points required');
 if(!Array.isArray(p.ticks)||p.ticks.length<2||p.ticks.length>6)throw Error('2–6 ticks required');
 const b=p.bounds;if(!b)throw Error('bounds required');for(const k of ['x','y','width','height'])finite(b[k],k);if(b.width<=0||b.height<=0||Math.abs(b.width/b.height-1100/460)>1e-6)throw Error('chart bounds require positive 1100:460 ratio');
 if(!Number.isInteger(p.accentStart)||p.accentStart<0||p.accentStart>=p.points.length)throw Error('accentStart index required');
 if(p.mode==='linear-values'){if(!Array.isArray(p.domain)||p.domain.length!==2||!p.domain.every(Number.isFinite)||p.domain[0]!==0||p.domain[1]<=0)throw Error('linear zero-baseline positive domain required');}
 let prev=-Infinity;for(const [i,q]of p.points.entries()){string(q.label,'point label');if(p.mode==='reference-geometry'){finite(q.x,'x');finite(q.y,'y');if(q.x<60||q.x>1040||q.y<60||q.y>420||q.x<=prev)throw Error('reference points must be ordered within plot');prev=q.x}else{finite(q.value,'value');if(q.value<p.domain[0]||q.value>p.domain[1])throw Error('value outside domain')}}
 if(p.mode==='reference-geometry'&&p.acknowledgeAxisMismatch!==true)throw Error('Reference mode requires acknowledgeAxisMismatch:true');
 for(const t of p.ticks){string(t.label,'tick label');finite(p.mode==='reference-geometry'?t.y:t.value,'tick coordinate');if(p.mode==='reference-geometry'&&(t.y<60||t.y>420))throw Error('tick outside plot');if(p.mode==='linear-values'&&(t.value<p.domain[0]||t.value>p.domain[1]))throw Error('tick outside domain')}
 for(const a of p.annotations||[]){if(!Number.isInteger(a.index)||!p.points[a.index])throw Error('annotation index missing');string(a.text,'annotation text');finite(a.dx,'annotation dx');finite(a.dy,'annotation dy')}
 return true;
}
function chartGeometry(p){validateChart(p);const project=v=>420-(v-p.domain[0])/(p.domain[1]-p.domain[0])*360;return{points:p.points.map((q,i)=>({...q,x:p.mode==='reference-geometry'?q.x:60+i*960/(p.points.length-1),y:p.mode==='reference-geometry'?q.y:project(q.value)})),ticks:p.ticks.map(t=>({...t,y:p.mode==='reference-geometry'?t.y:project(t.value)}))}}
function drawChart(ctx,p,theme,env){const geo=chartGeometry(p);checkGlyphs(chartStrings(p),env);color(theme.ink,'ink');color(theme.accent,'accent');const prior=begin(ctx);try{ctx.globalAlpha=1;ctx.setLineDash([]);ctx.translate(p.bounds.x,p.bounds.y);ctx.scale(p.bounds.width/1100,p.bounds.height/460);
 ctx.strokeStyle=theme.ink;ctx.globalAlpha=.25;ctx.lineWidth=.5;for(const t of geo.ticks){ctx.beginPath();ctx.moveTo(60,t.y);ctx.lineTo(1040,t.y);ctx.stroke()}ctx.globalAlpha=1;
 for(const t of geo.ticks)text(ctx,t.label,20,t.y+4,{alpha:.6,fill:theme.ink});
 ctx.beginPath();geo.points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.lineTo(geo.points.at(-1).x,420);ctx.lineTo(geo.points[0].x,420);ctx.closePath();ctx.fillStyle=theme.accent;ctx.globalAlpha=.06;ctx.fill();ctx.globalAlpha=1;
 ctx.strokeStyle=theme.ink;ctx.lineWidth=2.5;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();geo.points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();
 ctx.strokeStyle=theme.accent;ctx.setLineDash([6,5]);ctx.beginPath();geo.points.slice(p.accentStart).forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();ctx.setLineDash([]);
 geo.points.forEach((q,i)=>{ctx.beginPath();ctx.arc(q.x,q.y,i>=p.accentStart?6:4,0,Math.PI*2);ctx.fillStyle=i>=p.accentStart?theme.accent:theme.ink;ctx.fill();text(ctx,q.label,q.x,445,{fill:theme.ink,alpha:.6,align:'center'})});
 for(const a of p.annotations||[]){const q=geo.points[a.index];text(ctx,a.text,q.x+a.dx,q.y+a.dy,{fill:a.accent?theme.accent:theme.ink,align:a.align||'left',maxWidth:220})}
 for(const [i,s]of (p.callout||[]).entries())text(ctx,s,800,380+i*18,{fill:theme.accent,role:'italic',size:14,maxWidth:220});
 }finally{end(ctx,prior)}return geo}
function validate(p){if(!p||p.width!==1920||p.height!==1080)throw Error('fixed 1920×1080 frame required');for(const k of ['paper','ink','accent'])color(p.theme[k],k);if(!Array.isArray(p.headline)||p.headline.length!==4)throw Error('four authored headline lines required');for(const line of p.headline){if(!Array.isArray(line)||!line.length)throw Error('headline runs required');for(const r of line){string(r.text,'run text');if(!['serif','italic'].includes(r.role))throw Error('headline role must be serif or italic')}}string(p.kicker,'kicker');string(p.frameLabel,'frame label');if(!Array.isArray(p.footer)||p.footer.length!==3)throw Error('three footer fields required');p.footer.forEach(s=>string(s,'footer'));if(!/synthetic|synthesized/i.test(p.footer[0]))throw Error('Visible footer must disclose synthetic data');validateChart(p.chart);return true}
function draw(ctx,p,env){validate(p);checkGlyphs([p.kicker,p.frameLabel,...p.headline.flat().map(r=>r.text),...p.footer,...chartStrings(p.chart)],env);const prior=begin(ctx);try{ctx.globalAlpha=1;ctx.setLineDash([]);ctx.fillStyle=p.theme.paper;ctx.fillRect(0,0,1920,1080);text(ctx,p.kicker,320,97,{role:'sans',size:11,fill:p.theme.accent,spacing:1.54,maxWidth:1000});text(ctx,p.frameLabel,1600,97,{size:11,fill:p.theme.ink,alpha:.6,spacing:1.54,align:'right',maxWidth:400});
 const widths=[];p.headline.forEach((runs,i)=>{let x=320;let total=0;for(const r of runs)total+=measure(ctx,r.text,r.role,68);if(total>1281)throw Error(`Headline line ${i+1} exceeds 1280px: ${total}`);for(const r of runs)x+=text(ctx,r.text,x,169+i*71.4,{role:r.role,size:68,fill:r.accent?p.theme.accent:p.theme.ink});widths.push(total)});
 const chart=drawChart(ctx,p.chart,p.theme,env);for(const[i,x]of[320,1010,1600].entries())text(ctx,p.footer[i],x,989,{size:10.5,fill:p.theme.ink,alpha:.6,align:i===0?'left':i===1?'center':'right',maxWidth:i===0?610:430});return{headlineWidths:widths,chart,dataKind:p.chart.dataKind,mode:p.chart.mode};}finally{end(ctx,prior)}}
module.exports={id,validate,draw,drawChart,chartGeometry,validateChart,measure,text};
