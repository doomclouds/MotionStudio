// Original restricted static candidate. Not auto-layout, obstacle routing or execution.
import assert from 'node:assert/strict';
export function drawDependencyMap(ctx,{bounds,nodes,edges,theme}){
 assert(bounds && ['x','y','width','height'].every(k=>Number.isFinite(bounds[k])),'finite bounds required');
 assert(bounds.x>=0&&bounds.y>=0&&bounds.width>0&&bounds.height>0,'positive bounds required');
 assert(bounds.x+bounds.width<=ctx.canvas.width&&bounds.y+bounds.height<=ctx.canvas.height,'bounds outside canvas');
 assert(Array.isArray(nodes)&&nodes.length>0&&nodes.length<=64&&Array.isArray(edges)&&edges.length<=256,'bounded nodes and edges required');
 assert(theme&&['ink','surface','edge'].every(k=>/^#[0-9a-f]{6}$/i.test(theme[k])),'hex theme colors required');
 assert(typeof theme.fontFamily==='string'&&/^[A-Za-z][A-Za-z0-9 ]{0,63}$/.test(theme.fontFamily),'plain font family required');
 assert(Number.isFinite(theme.fontSize)&&theme.fontSize>=8&&theme.fontSize<=64,'positive font size required');
 const ids=new Set(nodes.map(n=>n.id));assert.equal(ids.size,nodes.length,'duplicate node ID');
 const actual=nodes.map(n=>{assert(typeof n.id==='string'&&n.id.length&&typeof n.label==='string','node ID and label required');assert(['x','y','w','h'].every(k=>Number.isFinite(n[k])),'finite node geometry required');assert(n.w>0&&n.h>0,'positive node size required');assert(n.x>=0&&n.y>=0&&n.x+n.w<=1&&n.y+n.h<=1,'node outside normalized bounds');return {...n,x:bounds.x+n.x*bounds.width,y:bounds.y+n.y*bounds.height,w:n.w*bounds.width,h:n.h*bounds.height};});
 for(let i=0;i<actual.length;i++)for(let j=i+1;j<actual.length;j++){const a=actual[i],b=actual[j];assert(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),'node overlap');}
 const byId=new Map(actual.map(n=>[n.id,n]));const adjacency=new Map([...ids].map(id=>[id,[]]));const seenEdges=new Set();
 for(const e of edges){assert(ids.has(e.from)&&ids.has(e.to),'unknown edge endpoint');const key=JSON.stringify([e.from,e.to]);assert(!seenEdges.has(key),'duplicate edge');seenEdges.add(key);adjacency.get(e.from).push(e.to);}
 const visiting=new Set(),done=new Set();function visit(id){assert(!visiting.has(id),'cycle not supported');if(done.has(id))return;visiting.add(id);adjacency.get(id).forEach(visit);visiting.delete(id);done.add(id);}ids.forEach(visit);
 // Full validation before touching pixels; restore font state even if measurement fails.
 ctx.save();try{ctx.font=`700 ${theme.fontSize}px ${theme.fontFamily}`;for(const n of actual){assert(n.h>=theme.fontSize+12,'node too short for label');assert(ctx.measureText(n.label).width<=n.w-20,`node label overflow: ${n.label}`);}}finally{ctx.restore();}
 ctx.save();
 for(const e of edges){const a=byId.get(e.from),b=byId.get(e.to);const ax=a.x+a.w/2,ay=a.y+a.h,bx=b.x+b.w/2,by=b.y;ctx.strokeStyle=theme.edge;ctx.fillStyle=theme.edge;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();const angle=Math.atan2(by-ay,bx-ax),len=9;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx-len*Math.cos(angle-.42),by-len*Math.sin(angle-.42));ctx.lineTo(bx-len*Math.cos(angle+.42),by-len*Math.sin(angle+.42));ctx.closePath();ctx.fill();}
 for(const n of actual){ctx.fillStyle=n.focus?theme.ink:theme.surface;ctx.fillRect(n.x,n.y,n.w,n.h);ctx.strokeStyle=theme.edge;ctx.lineWidth=1;ctx.strokeRect(n.x+.5,n.y+.5,n.w-1,n.h-1);ctx.font=`700 ${theme.fontSize}px ${theme.fontFamily}`;ctx.textBaseline='middle';ctx.fillStyle=n.focus?theme.surface:theme.ink;const width=ctx.measureText(n.label).width;ctx.fillText(n.label,n.x+(n.w-width)/2,n.y+n.h/2);}
 ctx.restore();return {scope:'fixed-layout directed acyclic dependency diagram; not executed workflow; no obstacle routing',nodes:actual,edges,bounds};
}
