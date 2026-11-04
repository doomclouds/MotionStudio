import {object,number,choice,bool} from '../../../validate.mjs';
import {byte,keep,pair} from '../../../internal/raster-snapshot.mjs';
function pixelIndex(x,y,w,h,edge){
 if(edge==='transparent'&&(x<0||y<0||x>=w||y>=h))return -1;
 return(Math.max(0,Math.min(h-1,y))*w+Math.max(0,Math.min(w-1,x)))*4;
}
function copyPixel(src,index,out,dest){
 if(index<0){out[dest]=out[dest+1]=out[dest+2]=out[dest+3]=0;return;}
 for(let c=0;c<4;c++)out[dest+c]=src[index+c];
}
/** Inverse pixel lookup; RG128 neutral, map alpha gates offset, blue unused. */
export function sampleRasterDisplacement(input){
 object(input,['source','map','scaleX','scaleY','edge','filter'],['source','map','scaleX','scaleY','edge','filter']);
 const sx=number(input.scaleX,-4096,4096),sy=number(input.scaleY,-4096,4096),edge=choice(input.edge,['clamp','transparent']),filter=choice(input.filter,['nearest','bilinear']);
 const [source,,pixels,map]=pair(input.source,input.map),w=source.width,h=source.height,out=new Uint8ClampedArray(pixels.length);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,a=map[i+3]/255;
  let px=x+(map[i]-128)/128*sx*a,py=y+(map[i+1]-128)/128*sy*a;
  if(filter==='nearest'){
   // Ties choose floor(v + .5), including negative coordinates.
   copyPixel(pixels,pixelIndex(Math.floor(px+.5),Math.floor(py+.5),w,h,edge),out,i);continue;
  }
  if(edge==='clamp'){px=Math.max(0,Math.min(w-1,px));py=Math.max(0,Math.min(h-1,py));}
  const x0=Math.floor(px),y0=Math.floor(py),tx=px-x0,ty=py-y0;
  // Exact integer lookup preserves source bytes, even invisible RGB. Fractional
  // interpolation uses premultiplied channels; zero resulting alpha yields RGB0.
  if(tx===0&&ty===0){copyPixel(pixels,pixelIndex(x0,y0,w,h,edge),out,i);continue;}
  let alpha=0,r=0,g=0,b=0;
  for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++){
   const k=pixelIndex(x0+xx,y0+yy,w,h,edge);if(k<0)continue;
   const weight=(xx?tx:1-tx)*(yy?ty:1-ty),aw=pixels[k+3]*weight;
   alpha+=aw;r+=pixels[k]*aw;g+=pixels[k+1]*aw;b+=pixels[k+2]*aw;
  }
  out[i+3]=byte(alpha);
  if(out[i+3]){out[i]=byte(r/alpha);out[i+1]=byte(g/alpha);out[i+2]=byte(b/alpha);}
 }
 return keep(w,h,out);
}
