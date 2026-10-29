// Project-local planar Canvas2D mapper. No scene graph or volumetric renderer.
// Full-film implementation supports explicit point map rather than assuming a
// rotate order. Source crop has guard pixels; translucent shadows stay separate.
function triangle(c,img,s,d,expand){const[a,b,v]=s,[p,q,r]=d,det=(b.x-a.x)*(v.y-a.y)-(v.x-a.x)*(b.y-a.y);if(Math.abs(det)<1e-12)return;
 const A=((q.x-p.x)*(v.y-a.y)-(r.x-p.x)*(b.y-a.y))/det,C=((r.x-p.x)*(b.x-a.x)-(q.x-p.x)*(v.x-a.x))/det,B=((q.y-p.y)*(v.y-a.y)-(r.y-p.y)*(b.y-a.y))/det,D=((r.y-p.y)*(b.x-a.x)-(q.y-p.y)*(v.x-a.x))/det,E=p.x-A*a.x-C*a.y,F=p.y-B*a.x-D*a.y;
 const m={x:(p.x+q.x+r.x)/3,y:(p.y+q.y+r.y)/3},dist=d.map((x,i)=>{const y=d[(i+1)%3];return Math.abs((y.x-x.x)*(m.y-x.y)-(y.y-x.y)*(m.x-x.x))/Math.hypot(y.x-x.x,y.y-x.y);}),grow=1+expand/Math.max(1e-6,Math.min(...dist)),g=d.map(x=>({x:m.x+(x.x-m.x)*grow,y:m.y+(x.y-m.y)*grow}));
 if(Math.max(...g.map(p=>p.x))< -2||Math.min(...g.map(p=>p.x))>1922||Math.max(...g.map(p=>p.y))< -2||Math.min(...g.map(p=>p.y))>1082)return;
 const x0=Math.max(0,Math.floor(Math.min(...s.map(p=>p.x))-3)),y0=Math.max(0,Math.floor(Math.min(...s.map(p=>p.y))-3)),x1=Math.min(img.width,Math.ceil(Math.max(...s.map(p=>p.x))+3)),y1=Math.min(img.height,Math.ceil(Math.max(...s.map(p=>p.y))+3));
 c.save();c.beginPath();c.moveTo(g[0].x,g[0].y);c.lineTo(g[1].x,g[1].y);c.lineTo(g[2].x,g[2].y);c.closePath();c.clip();c.transform(A,B,C,D,E,F);c.drawImage(img,x0,y0,x1-x0,y1-y0,x0,y0,x1-x0,y1-y0);c.restore();
}
export function texture(c,img,map,{columns=24,rows=6,expand=.6,affine=false}={}){
 if(affine){const p=map(0,0),q=map(1,0),r=map(0,1);c.save();c.transform((q.x-p.x)/img.width,(q.y-p.y)/img.width,(r.x-p.x)/img.height,(r.y-p.y)/img.height,p.x,p.y);c.drawImage(img,0,0);c.restore();return;}
 const points=Array.from({length:rows+1},(_,j)=>Array.from({length:columns+1},(_,i)=>map(i/columns,j/rows)));
 for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){const x=i*img.width/columns,y=j*img.height/rows,x1=(i+1)*img.width/columns,y1=(j+1)*img.height/rows,a={x,y},b={x:x1,y},v={x:x1,y:y1},w={x,y:y1},p=points[j][i],q=points[j][i+1],r=points[j+1][i+1],s=points[j+1][i];triangle(c,img,[a,b,v],[p,q,r],expand);triangle(c,img,[a,v,w],[p,r,s],expand);}
}
export function roundedPath(c,map,x,y,w,h,r,steps=8){c.beginPath();let first=true;for(const[cx,cy,start]of[[x+w-r,y+r,-90],[x+w-r,y+h-r,0],[x+r,y+h-r,90],[x+r,y+r,180]])for(let j=0;j<=steps;j++){const a=(start+j*90/steps)*Math.PI/180,p=map(cx+r*Math.cos(a),cy+r*Math.sin(a));if(first){c.moveTo(p.x,p.y);first=false;}else c.lineTo(p.x,p.y);}c.closePath();}
