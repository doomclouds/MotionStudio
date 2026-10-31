// Pixel coordinates transcribed from OpenDesign sprite-animation example (MIT manifest).
export const flowerRects=Object.freeze([
[0,0,24,32,'#f5efe2'],[3,2,18,10,'#1a1614'],[14,4,5,5,'#f7c95b'],[13,5,1,3,'#f7c95b'],[19,5,1,3,'#f7c95b'],
[9,14,6,2,'#d92b1c'],[7,16,10,2,'#d92b1c'],[6,18,12,2,'#d92b1c'],[7,20,10,2,'#d92b1c'],[9,22,6,2,'#d92b1c'],
[10,15,2,1,'#ff6b5e'],[8,17,2,1,'#ff6b5e'],[14,19,2,1,'#ff6b5e'],[11,18,2,2,'#f7c95b'],
[11,24,2,6,'#3b6b3b'],[8,26,3,2,'#3b6b3b'],[13,27,3,2,'#3b6b3b']].map(Object.freeze));
export function drawPixelMotif(ctx,{x=0,y=0,scale=1,rects=flowerRects}={}){
 if(![x,y,scale].every(Number.isFinite)||Math.abs(x)>8192||Math.abs(y)>8192||scale<0.125||scale>64||!Array.isArray(rects)||rects.length>4096)throw Error('bounded pixel motif');
 for(const [a,b,w,h,color] of rects)if(![a,b,w,h].every(Number.isSafeInteger)||a<0||b<0||w<=0||h<=0||a+w>24||b+h>32||!/^#[0-9a-f]{6}$/i.test(color))throw Error('invalid rect');
 const previous={fillStyle:ctx.fillStyle,font:ctx.font,letterSpacing:ctx.letterSpacing};ctx.save();try{ctx.translate(x,y);ctx.scale(scale,scale);for(const [a,b,w,h,color]of rects){ctx.fillStyle=color;ctx.fillRect(a,b,w,h)}}finally{ctx.restore();Object.assign(ctx,previous)}
 return {x,y,width:24*scale,height:32*scale,rectCount:rects.length};
}
