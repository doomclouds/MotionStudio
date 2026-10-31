const {drawCard,validate}=require('../snapshots/social-card.cjs');
function drawSeries(ctx,{x,y,size=260,gap=36,cards},{createCanvas}){
 if(![x,y,size,gap].every(Number.isFinite)||Math.abs(x)>16384||Math.abs(y)>16384||size<160||size>500||gap<12||gap>100||!Array.isArray(cards)||cards.length<2||cards.length>4||typeof createCanvas!=='function')throw Error('series contract');cards=Array.from(cards);cards.forEach(validate);
 const pad=Math.ceil(120*size/380),w=Math.ceil(cards.length*size+(cards.length-1)*gap+2*pad),h=Math.ceil(size+2*pad);const c=createCanvas(w,h),g=c.getContext('2d');
 cards.forEach((d,i)=>drawCard(g,d,{x:pad+i*(size+gap),y:pad,size}));ctx.drawImage(c,x-pad,y-pad);
 return {count:cards.length,readingOrder:cards.map(d=>d.index),bounds:{x,y,width:w-pad*2,height:size},shadowPadding:pad};
}module.exports={drawSeries};
