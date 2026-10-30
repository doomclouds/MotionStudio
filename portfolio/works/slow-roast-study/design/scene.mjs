import{helpers}from'./helpers.mjs';
export const config={width:1200,height:750,fps:1,duration:1};
export function createScene({ctx:c,GlobalFonts}){const{rect,text}=helpers(c,GlobalFonts);return{render(){rect(0,0,1200,750,'#fff');rect(600,0,600,750,'#000');
text('烘焙 / 豆单 / 订阅',44,43,16,'PairSans500','#000',2.24);
c.font='400 16px PairSans500';c.letterSpacing='2.24px';let nav='NO. 07 · 云南保山 · 2026 秋季批次';let w=c.measureText(nav).width;c.letterSpacing='0px';text(nav,1164-w,43,16,'PairSans500','#fff',2.24);
text('慢',14,354,350,'PairSerif900','#000',-24.5);text('火',14,662,350,'PairSerif900','#000',-24.5);
text('Slow, then',386,558,28,'PairPlayfair700','#000');text('slower.',386,591.6,28,'PairPlayfair700','#000');
for(const[i,l]of ['每一批只烘 6 公斤，铁锅','滚筒，十四分钟下豆。深','一点，是为了让甜先出','来。'].entries())text(l,386,625+i*27.2,16,'PairSans500','#000');
c.font='400 150px Anton-Regular';c.letterSpacing='.75px';w=c.measureText('SLOW').width;c.letterSpacing='0px';text('SLOW',1164-w,206.5,150,'Anton-Regular','#fff',.75);
c.font='400 130px PairPlayfair700';c.letterSpacing='-2.6px';w=c.measureText('roast').width;c.letterSpacing='0px';text('roast',1164-w,342,130,'PairPlayfair700','#E8C4C0',-2.6);
text('14′20″',636,649,90,'Anton-Regular','#E8C4C0');text('从下豆到出锅，一秒不抢。',636,680,16,'PairSans500','#fff');text('订阅用户每月 20 日收到当月批次。',636,707.2,16,'PairSans500','#fff');
rect(914,424,250,290,'#E8C4C0');text('照片位 · 烘豆机特写',926,701,14,'PairSans500','#000');
}}}
