import{helpers}from'./helpers.mjs';
export const config={width:1200,height:750,fps:1,duration:1};
export const palette={paper:'#EFEBE1',ink:'#0E0E0E',red:'#E4351E',ghost:'#D8D2C4'};
export function createScene({ctx:c,GlobalFonts}){let{rect,text}=helpers(c,GlobalFonts),p=palette;
function stroke(n,col,large=false){c.fillStyle=col;if(n===0){c.save();c.translate(305,82);c.rotate(-8*Math.PI/180);c.fillRect(-29,-52,58,104);c.restore()}if(n===1)c.fillRect(50,176,500,58);if(n===2)c.fillRect(118,large?322:300,58,270);if(n===3){c.save();if(large)c.translate(0,22);c.beginPath();for(const[i,[x,y]]of [[118,300],[484,300],[484,600],[428,656],[392,618],[428,600],[428,356],[118,356]].entries())i?c.lineTo(x,y):c.moveTo(x,y);c.closePath();c.fill();c.restore()}if(n===4)c.fillRect(276,176,58,500)}
return{render(){rect(0,0,1200,750,p.paper);c.save();c.translate(34,22);for(let i=0;i<5;i++)stroke(i,i===4?p.red:p.ink,true);c.restore();
text('SHI · 5 STROKES · 老菜市场改造展',690,49,13,'PairSans500','#555',3.9);
text('一个“市”字，',690,124,64,'PairSans900',p.ink,-.64);text('被拆成',690,195.4,64,'PairSans900',p.ink,-.64);text('五笔',880,195.4,64,'PairSans900',p.red,-.64);
text('点是吆喝，横是摊位，竖是人流。南塘街菜市场翻建',692,234.2,18,'PairSerif450','#222');text('前，我们把它的名字拆开，一笔一笔还给街坊。',692,266.6,18,'PairSerif450','#222');
for(let i=0;i<5;i++){let x=690+i*90;rect(x,340,80,2,p.ink);c.save();c.translate(x,348);c.scale(80/600,93/700);for(let j=0;j<5;j++)stroke(j,j===i?p.ink:p.ghost);c.restore();text(String(i+1),x+73,362,12,'PairSans500');text(['点','横','竖','横折钩','竖'][i],x,461,14,'PairSans500',p.ink,1.4)}
rect(690,614,462,2,p.ink);for(const[i,[a,b]]of [['展期','2026.11.06 – 11.30　每日 09:00–18:00'],['地点','南塘街菜市场　东门旧肉铺'],['免费','周六下午 15:00 街坊讲解场']].entries()){text(a,690,649+i*30,16,'PairSans900',p.red,3.2);text(b,754,649+i*30,16,'PairSans550')}
}}}
