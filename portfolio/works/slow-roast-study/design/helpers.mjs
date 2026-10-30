import{fileURLToPath}from'node:url';import path from'node:path';
const assets=process.env.SLOW_ROAST_FONT_DIR;
export function helpers(c,fonts){if(!assets||!path.isAbsolute(assets))throw Error('Set SLOW_ROAST_FONT_DIR to the absolute external font directory');for(const f of ["PairSans500", "PairSerif900", "PairPlayfair700", "Anton-Regular"])if(!fonts.registerFromPath(assets+'/'+f+'.ttf',f))throw Error('Missing '+f);
return{rect:(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h)},text:(s,x,y,size,font,color='#0E0E0E',spacing=0)=>{c.font=`400 ${size}px ${font}`;c.textAlign='left';c.textBaseline='alphabetic';c.fillStyle=color;c.letterSpacing=spacing+'px';c.fillText(s,x,y);c.letterSpacing='0px'}}}
