export const data=[
{n:'河流输入',hue:205,c:[['包装袋',52],['饮料瓶',41],['外卖餐盒',30],['轮胎磨损颗粒',26],['一次性餐具',18],['化纤洗涤',15],['吸管搅拌棒',6]]},
{n:'渔业',hue:22,c:[['废弃渔网',38],['浮标与绳索',22],['养殖设施',17],['泡沫箱',14],['钓具',9]]},
{n:'陆上其他',hue:330,c:[['农用地膜',19],['医疗废弃',7],['建筑碎屑',6],['气球',3]]},
{n:'海滩与旅游',hue:145,c:[['烟蒂',12],['塑料袋',11],['瓶盖',9],['防晒包装',5],['玩具',4]]},
{n:'航运',hue:275,c:[['货柜落海',15],['船舶生活垃圾',10],['压舱与油漆',8]]}];
export function sq(items,x,y,w,h){ // items:{v}, sorted desc; returns rects
 const tot=items.reduce((a,b)=>a+b.v,0),k=w*h/tot,out=[];let it=items.map(i=>({...i,a:i.v*k}));
 function worst(row,side){const s=row.reduce((a,b)=>a+b.a,0);let mx=Math.max(...row.map(r=>r.a)),mn=Math.min(...row.map(r=>r.a));return Math.max(side*side*mx/(s*s),s*s/(side*side*mn))}
 while(it.length){const side=Math.min(w,h);let row=[it[0]],i=1;
  while(i<it.length&&worst(row.concat(it[i]),side)<=worst(row,side)){row.push(it[i]);i++}
  const s=row.reduce((a,b)=>a+b.a,0);
  if(w>=h){const rw=s/h;let yy=y;row.forEach(r=>{const rh=r.a/rw;out.push({...r,x,y:yy,w:rw,h:rh});yy+=rh});x+=rw;w-=rw}
  else{const rh=s/w;let xx=x;row.forEach(r=>{const rw=r.a/rh;out.push({...r,x:xx,y,w:rw,h:rh});xx+=rw});y+=rh;h-=rh}
  it=it.slice(row.length)}
 return out}
