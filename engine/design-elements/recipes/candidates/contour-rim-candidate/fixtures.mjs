// Original synthetic masks, not source glyphs or an illustration/font system.
export function createFixture(kind,width=160,height=120){
  if(!['ring','bridge','diamond'].includes(kind))throw new TypeError('Unknown fixture');
  const alpha=new Uint8Array(width*height);
  for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
    const a=(x-width/2)/(width*.36),b=(y-height/2)/(height*.36),r=Math.hypot(a,b);
    const inside=kind==='ring'?r<1&&r>.48:kind==='bridge'?Math.abs(a)<1&&Math.abs(b)<1&&!(Math.abs(a)<.35&&b>-.15):Math.abs(a)+Math.abs(b)<1;
    if(inside)alpha[y*width+x]=255;
  }return {width,height,alpha};
}
