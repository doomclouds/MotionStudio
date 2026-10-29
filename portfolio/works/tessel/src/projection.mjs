/** Canvas2D texture projection. No 3D renderer or mesh scene graph.
 * CSS order: translate(P) perspective(d) rotateZ(rz) rotateX(rx)
 * scale(s) translate(-O). CSS scale(s) scales x/y, NOT z.
 */
const rad=d=>d*Math.PI/180;
export function projectPoint(x,y,z=0,camera={}) {
  const {px=0,py=0,ox=0,oy=0,rx=0,rz=0,scale=1,perspective=2600}=camera;
  const a=rad(rx),b=rad(rz),u=(x-ox)*scale,v=(y-oy)*scale;
  const yy=v*Math.cos(a)-z*Math.sin(a),zz=v*Math.sin(a)+z*Math.cos(a);
  const den=1-zz/perspective;
  if(!Number.isFinite(den)||den<=1e-6) throw new RangeError('Plane reaches or crosses perspective eye');
  return {x:px+(u*Math.cos(b)-yy*Math.sin(b))/den,y:py+(u*Math.sin(b)+yy*Math.cos(b))/den};
}
function affine(ctx,image,s,d,expand) {
  const [a,b,c]=s,[p,q,r]=d;
  const det=(b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y);
  if(Math.abs(det)<1e-12)return;
  const A=((q.x-p.x)*(c.y-a.y)-(r.x-p.x)*(b.y-a.y))/det;
  const C=((r.x-p.x)*(b.x-a.x)-(q.x-p.x)*(c.x-a.x))/det;
  const B=((q.y-p.y)*(c.y-a.y)-(r.y-p.y)*(b.y-a.y))/det;
  const D=((r.y-p.y)*(b.x-a.x)-(q.y-p.y)*(c.x-a.x))/det;
  const E=p.x-A*a.x-C*a.y,F=p.y-B*a.x-D*a.y;
  const mid={x:(p.x+q.x+r.x)/3,y:(p.y+q.y+r.y)/3};
  // Expand every triangle edge by at least 0.6px to seal antialiased seams.
  // Intended for opaque UI textures; translucent textures may darken at overlaps.
  const distances=d.map((v,i)=>{const w=d[(i+1)%3];return Math.abs((w.x-v.x)*(mid.y-v.y)-(w.y-v.y)*(mid.x-v.x))/Math.hypot(w.x-v.x,w.y-v.y);});
  const grow=1+expand/Math.max(1e-6,Math.min(...distances));
  const v=d.map(v=>({x:mid.x+(v.x-mid.x)*grow,y:mid.y+(v.y-mid.y)*grow}));
  ctx.save();ctx.beginPath();ctx.moveTo(v[0].x,v[0].y);ctx.lineTo(v[1].x,v[1].y);ctx.lineTo(v[2].x,v[2].y);ctx.closePath();ctx.clip();
  ctx.transform(A,B,C,D,E,F);ctx.drawImage(image,0,0);ctx.restore();
}
export function drawProjectedTexture(ctx,image,rect,camera,options={}) {
  const {z=0,rotation=0,scale=1,columns=16,rows=12,clipExpansion=.6}=options;
  if(!Number.isInteger(columns)||columns<1||columns>128||!Number.isInteger(rows)||rows<1||rows>128) throw new RangeError('Grid must be integers 1..128');
  if(!(rect.w>0&&rect.h>0&&image.width>0&&image.height>0))throw new RangeError('Positive texture dimensions required');
  const angle=rad(rotation),co=Math.cos(angle),si=Math.sin(angle),cx=rect.x+rect.w/2,cy=rect.y+rect.h/2;
  const at=(u,v)=>{const x=(u-.5)*rect.w*scale,y=(v-.5)*rect.h*scale;return projectPoint(cx+x*co-y*si,cy+x*si+y*co,z,camera);};
  // With rx=0 every source point has the same denominator, so one exact affine
  // draw avoids antialias seams and is pixel-identical for identity projection.
  if(Math.abs(Math.sin(rad(camera.rx??0)))<1e-12){
    const p=at(0,0),q=at(1,0),r=at(0,1);ctx.save();
    ctx.transform((q.x-p.x)/image.width,(q.y-p.y)/image.width,(r.x-p.x)/image.height,(r.y-p.y)/image.height,p.x,p.y);
    ctx.drawImage(image,0,0);ctx.restore();return;
  }
  const points=Array.from({length:rows+1},(_,j)=>Array.from({length:columns+1},(_,i)=>at(i/columns,j/rows)));
  for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){
    const x=i*image.width/columns,y=j*image.height/rows,x1=(i+1)*image.width/columns,y1=(j+1)*image.height/rows;
    const a={x,y},b={x:x1,y},c={x:x1,y:y1},d={x,y:y1};
    const p=points[j][i],q=points[j][i+1],r=points[j+1][i+1],s=points[j+1][i];
    affine(ctx,image,[a,b,c],[p,q,r],clipExpansion);affine(ctx,image,[a,c,d],[p,r,s],clipExpansion);
  }
}
