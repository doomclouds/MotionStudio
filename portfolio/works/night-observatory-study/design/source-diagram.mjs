import{auditWindow}from'./window-audit.mjs';export const windowSpec={plotStart:21.5,plotEnd:25.5,labelStart:23.5,labelEnd:25.5,sampleCount:13,intervalCount:12};export function buildDiagram(){auditWindow(windowSpec);
const nodes=[];const NS='svg';const s={appendChild(e){nodes.push(e)}};const document={createElementNS(ns,tag){return {tag,attrs:{},setAttribute(k,v){this.attrs[k]=v}}}};
function el(t,a,p){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);(p||s).appendChild(e);return e}
const cx=380,cy=375,rs=[70,120,170,220,270];
const ang=h=>((h-18)/12)*300-150;
const P=(r,a)=>[cx+r*Math.sin(a*Math.PI/180),cy-r*Math.cos(a*Math.PI/180)];
function arc(r,a0,a1){const p=P(r,a0),q=P(r,a1);return `M${p[0]},${p[1]}A${r},${r} 0 ${a1-a0>180?1:0} 1 ${q[0]},${q[1]}`}
rs.forEach(r=>el('path',{d:arc(r,-150,150),fill:'none',stroke:'#8a877a','stroke-width':.5}));
for(let h=18;h<=30;h++){const a=ang(h),p=P(rs[0]-16,a),q=P(rs[4]+(h%3==0?22:12),a);
 el('line',{x1:p[0],y1:p[1],x2:q[0],y2:q[1],stroke:'#8a877a','stroke-width':.5});
 if(h%3==0){const l=P(rs[4]+42,a),t=el('text',{x:l[0],y:l[1]+4,'text-anchor':'middle','font-size':12,'letter-spacing':'.1em',fill:'#6d6b60'});t.textContent=String(h%24).padStart(2,'0')+':00'}}
const tr=[.5,.6,.78,.9,.95,.9,.8,.7,.82,.9,.7,.5,.4];
tr.forEach((v,i)=>{const p=P(rs[1],ang(18+i));el('circle',{cx:p[0],cy:p[1],r:2+v*8,fill:'#7c8f6e',opacity:.85})});
const mp=[0,0,0,0,0,.1,.3,.5,.7,.85,.95,1,1];
mp.forEach((v,i)=>{if(i<12){const a0=ang(18+i),a1=ang(19+i);el('path',{d:arc(rs[3],a0+.8,a1-.8),fill:'none',stroke:'#b0694c','stroke-width':.8+v*5,opacity:v>0?1:0})}});
const cl=[.8,.6,.3,.1,0,0,.1,.2,.5,.7,.3,.1,0];
cl.forEach((v,i)=>{const p=P(rs[2],ang(18+i));el('circle',{cx:p[0],cy:p[1],r:3+v*14,fill:'none',stroke:'#6d6b60','stroke-width':.6})});
el('path',{d:arc(rs[4]+8,ang(windowSpec.plotStart),ang(windowSpec.plotEnd)),fill:'none',stroke:'#3b3b36','stroke-width':1.2});
el('circle',{cx,cy,r:3,fill:'#3b3b36'});el('circle',{cx,cy,r:rs[0]-30,fill:'none',stroke:'#8a877a','stroke-width':.5,'stroke-dasharray':'1 5'});
const t1=el('text',{x:cx,y:cy+34,'text-anchor':'middle','font-size':12,'letter-spacing':'.28em',fill:'#6d6b60'});t1.textContent='N 40°';
const w=el('text',{x:cx,y:30,'font-size':13,'letter-spacing':'.2em',fill:'#3b3b36','text-anchor':'middle'});w.textContent='最佳窗口 23:30 – 01:30';

return nodes;}