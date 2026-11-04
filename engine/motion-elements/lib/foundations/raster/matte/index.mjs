import {object,number,choice,bool} from '../../../validate.mjs';
import {byte,keep,pair} from '../../../internal/raster-snapshot.mjs';
/** Alpha/luma are modes of one coverage mechanism, in encoded sRGB byte space. */
export function sampleRasterMatte(input){
 object(input,['source','mask','mode','invert'],['source','mask','mode','invert']);
 const mode=choice(input.mode,['alpha','luma']),invert=bool(input.invert);
 const [source,,pixels,mask]=pair(input.source,input.mask),out=new Uint8ClampedArray(pixels);
 for(let i=0;i<pixels.length;i+=4){
  let coverage=mask[i+3]/255;
  if(mode==='luma')coverage*=(.2126*mask[i]+.7152*mask[i+1]+.0722*mask[i+2])/255;
  if(invert)coverage=1-coverage;
  out[i+3]=byte(pixels[i+3]*coverage);
 }
 return keep(source.width,source.height,out);
}
