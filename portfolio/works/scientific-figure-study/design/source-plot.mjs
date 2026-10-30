export function buildSpecimen(){const s=[];function el(t,a,p){const e={tag:t,attrs:{...a},textContent:'',setAttribute(k,v){this.attrs[k]=v}};s.push(e);return e;}
function tx(x,y,str,o){const t=el('text',Object.assign({x,y,'font-size':13,fill:'#111','font-family':'Source Sans 3'},o||{}));t.textContent=str;return t}
const BL='#0072B2',OR='#E69F00',GR='#555';
function axes(x,y,w,h,xt,yt,xl,yl,ylab){
 el('line',{x1:x,y1:y+h,x2:x+w,y2:y+h,stroke:'#111','stroke-width':1.2});el('line',{x1:x,y1:y,x2:x,y2:y+h,stroke:'#111','stroke-width':1.2});
 xt.forEach(([v,l])=>{el('line',{x1:x+v*w,x2:x+v*w,y1:y+h,y2:y+h+5,stroke:'#111'});tx(x+v*w,y+h+20,l,{'text-anchor':'middle','font-family':'Roboto Mono','font-size':12})});
 yt.forEach(([v,l])=>{const yy=y+h-v*h;el('line',{x1:x-5,x2:x,y1:yy,y2:yy,stroke:'#111'});tx(x-9,yy+4,l,{'text-anchor':'end','font-family':'Roboto Mono','font-size':12})});
 tx(x+w/2,y+h+44,xl,{'text-anchor':'middle',fill:'#111'});
 const t=tx(0,0,yl,{'text-anchor':'middle'});t.setAttribute('transform',`translate(${x-52},${y+h/2}) rotate(-90)`)}
function eb(x,y,e,c){el('line',{x1:x,x2:x,y1:y-e,y2:y+e,stroke:c,'stroke-width':1.3});el('line',{x1:x-4,x2:x+4,y1:y-e,y2:y-e,stroke:c,'stroke-width':1.3});el('line',{x1:x-4,x2:x+4,y1:y+e,y2:y+e,stroke:c,'stroke-width':1.3})}
function lbl(x,y,l){tx(x,y,l,{'font-size':22,'font-weight':700})}
// a
{const x=100,y=104,w=290,h=400;lbl(48,y-12,'a');
 axes(x,y,w,h,[[0,'190'],[.25,'200'],[.5,'210'],[.75,'220'],[1,'230']].map(a=>a),[[0,'78'],[.25,'80'],[.5,'82'],[.75,'84'],[1,'86']],'烘焙终温 (℃)','杯测总分 (分)');
 const A=[[0,.28,.05],[.25,.58,.05],[.5,.82,.04],[.75,.62,.05],[1,.36,.06]],B=[[0,.22,.05],[.25,.4,.05],[.5,.52,.05],[.75,.7,.05],[1,.46,.05]];
 [[A,BL],[B,OR]].forEach(([d,c])=>{el('polyline',{points:d.map(p=>`${x+p[0]*w},${y+h-p[1]*h}`).join(' '),fill:'none',stroke:c,'stroke-width':1.8});
  d.forEach(p=>{eb(x+p[0]*w,y+h-p[1]*h,p[2]*h,c);el('circle',{cx:x+p[0]*w,cy:y+h-p[1]*h,r:4,fill:c,stroke:'#fff','stroke-width':1})})});
 tx(x+w*.52,y+h*.08,'埃塞俄比亚',{fill:BL,'font-weight':600});tx(x+w*.66,y+h*.52,'哥伦比亚',{fill:OR,'font-weight':600});tx(x+w-2,y-6,'n = 12',{'text-anchor':'end','font-family':'Roboto Mono','font-size':12})}
// b
{const x=500,y=104,w=250,h=400;lbl(448,y-12,'b');
 axes(x,y,w,h,[],[[0,'0'],[.25,'2'],[.5,'4'],[.75,'6'],[1,'8']],'','滴定酸度 (mL)');
 const D=[['A 低速升温',.52,.045,BL],['B 标准',.4,.04,'#56B4E9'],['C 高速升温',.3,.04,'#999']];
 D.forEach((d,i)=>{const bx=x+30+i*76,bh=d[1]*h;el('rect',{x:bx,y:y+h-bh,width:48,height:bh,fill:d[3]});eb(bx+24,y+h-bh,d[2]*h,'#111');
  tx(bx+24,y+h+20,['A','B','C'][i],{'text-anchor':'middle'});});
 tx(x+w/2,y+h+44,'三种升温处理',{'text-anchor':'middle'});
 const by=y+h-.52*h-48;el('path',{d:`M${x+54} ${by+12} V${by} H${x+54+152} V${by+12}`,fill:'none',stroke:'#111'});tx(x+54+76,by-6,'*',{'text-anchor':'middle','font-size':22,'font-weight':700});
 tx(x+w,y-6,'n = 12',{'text-anchor':'end','font-family':'Roboto Mono','font-size':12})}
// c
{const x=860,y=104,w=290,h=400;lbl(808,y-12,'c');
 axes(x,y,w,h,[[0,'11'],[.33,'12'],[.66,'13'],[1,'14']].map(a=>a),[[0,'78'],[.25,'80'],[.5,'82'],[.75,'84'],[1,'86']],'烘焙失重 (%)','杯测总分 (分)');
 let seed=5;const r=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
 for(let i=0;i<60;i++){const u=r(),v=.62-.3*u+(r()-.5)*.38;el('circle',{cx:x+u*w*.96+6,cy:y+h-Math.max(.04,Math.min(.96,v))*h,r:3.6,fill:BL,opacity:.65})}
 el('line',{x1:x+6,y1:y+h-.62*h,x2:x+w*.96+6,y2:y+h-.33*h,stroke:'#111','stroke-width':1.4,'stroke-dasharray':'6 4'});
 tx(x+w,y-6,'n = 60',{'text-anchor':'end','font-family':'Roboto Mono','font-size':12});tx(x+w*.55,y+h*.12,'r = −0.41',{'font-family':'Roboto Mono','font-size':13})}

return s;}