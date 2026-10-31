import{createRequire}from'node:module';
const{Path2D}=createRequire(import.meta.url)('@napi-rs/canvas');
const trustedPlans=new WeakSet();
export function planHorizon({x=0,y,width,height,vanishing=.5,rays=11,rows=[.2,.4,.6,.8,.975]}){
 if(![x,y,width,height,vanishing].every(Number.isFinite)||Math.abs(x)>1e6||Math.abs(y)>1e6||width<1||height<1||width>16384||height>16384||vanishing<0||vanishing>1||!Number.isInteger(rays)||rays<2||rays>100||!Array.isArray(rows)||rows.length>100||Array.from(rows).some((v,i)=>!Number.isFinite(v)||v<=0||v>=1||(i&&v<=rows[i-1])))throw Error('bounded horizon contract');
 const p={rays:Array.from({length:rays},(_,i)=>Object.freeze([x+vanishing*width,y,x+i*width/(rays-1),y+height])),rows:rows.map(t=>Object.freeze([x,y+t*height,x+width,y+t*height]))};
 Object.freeze(p.rays);Object.freeze(p.rows);Object.freeze(p);trustedPlans.add(p);return p;
}
export function drawHorizon(c,p,{stroke='rgba(0,0,0,.12)',lineWidth=1.5}={}){
 if(!p||!trustedPlans.has(p)||!Number.isFinite(lineWidth)||lineWidth<=0||lineWidth>32)throw Error('use an unchanged planHorizon result; bounded lineWidth required');
 // A caller current path is not part of save/restore state. Never call beginPath here.
 const paths=[...p.rays,...p.rows].map(([a,b,d,e])=>{const line=new Path2D();line.moveTo(a,b);line.lineTo(d,e);return line;});
 c.save();try{c.globalAlpha=1;c.globalCompositeOperation='source-over';c.shadowBlur=0;c.shadowOffsetX=0;c.shadowOffsetY=0;c.shadowColor='rgba(0,0,0,0)';c.filter='none';c.setLineDash([]);c.strokeStyle=stroke;c.lineWidth=lineWidth;for(const line of paths)c.stroke(line);}finally{c.restore();}
}
