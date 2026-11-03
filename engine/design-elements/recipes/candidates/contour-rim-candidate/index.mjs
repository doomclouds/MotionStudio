// Original bounded raster helper. No artwork, fonts, Canvas dependency or 3D model.
export function shadeContourRim({width, height, alpha, bandWidth=5, face=[200,200,207], edgeBase=190, contrast=49, light=[.52,.85], enabled=true}={}) {
  if (!Number.isInteger(width)||!Number.isInteger(height)||width<5||height<5||width>2048||height>2048||width*height>1048576) throw new RangeError('Raster dimensions must be 5..2048 with at most 1048576 pixels');
  if (!(alpha instanceof Uint8Array || alpha instanceof Uint8ClampedArray)||alpha.length!==width*height) throw new TypeError('alpha must be a byte array matching dimensions');
  if (!Number.isFinite(bandWidth)||bandWidth<1||bandWidth>32) throw new RangeError('bandWidth must be 1..32 pixels');
  if (!Array.isArray(face)||face.length!==3||[0,1,2].some(k=>!Object.hasOwn(face,k)||!Number.isFinite(face[k])||face[k]<0||face[k]>255)) throw new TypeError('face must be three channel values in 0..255');
  if (!Number.isFinite(edgeBase)||edgeBase<0||edgeBase>255||!Number.isFinite(contrast)||contrast<0||contrast>127) throw new RangeError('Invalid edgeBase or contrast');
  if (!Array.isArray(light)||light.length!==2||[0,1].some(k=>!Object.hasOwn(light,k)||!Number.isFinite(light[k]))||!Number.isFinite(Math.hypot(...light))||Math.hypot(...light)<1e-6) throw new TypeError('light must be a finite nonzero 2D direction');
  if (typeof enabled!=='boolean') throw new TypeError('enabled must be boolean');
  for(let x=0;x<width;x++) if(alpha[x]||alpha[(height-1)*width+x]) throw new RangeError('Transparent one-pixel border required');
  for(let y=0;y<height;y++) if(alpha[y*width]||alpha[y*width+width-1]) throw new RangeError('Transparent one-pixel border required');
  const d=new Float32Array(alpha.length), output=new Uint8ClampedArray(alpha.length*4), diagonal=Math.SQRT2;
  for(let i=0;i<d.length;i++) d[i]=alpha[i]>127?width+height:0;
  for(let y=1;y<height-1;y++) for(let x=1;x<width-1;x++){const i=y*width+x;d[i]=Math.min(d[i],d[i-1]+1,d[i-width]+1,d[i-width-1]+diagonal,d[i-width+1]+diagonal);}
  for(let y=height-2;y>0;y--) for(let x=width-2;x>0;x--){const i=y*width+x;d[i]=Math.min(d[i],d[i+1]+1,d[i+width]+1,d[i+width+1]+diagonal,d[i+width-1]+diagonal);}
  const length=Math.hypot(...light),lx=light[0]/length,ly=light[1]/length;
  const at=(x,y)=>d[Math.max(0,Math.min(height-1,y))*width+Math.max(0,Math.min(width-1,x))];
  for(let y=0;y<height;y++) for(let x=0;x<width;x++){
    const i=y*width+x;output[i*4+3]=alpha[i];if(!alpha[i])continue;
    const nx=at(x+2,y)-at(x-2,y),ny=at(x,y+2)-at(x,y-2),norm=Math.hypot(nx,ny)||1;
    const rim=enabled&&d[i]<bandWidth, value=edgeBase+contrast*(nx*lx+ny*ly)/norm;
    for(let k=0;k<3;k++) output[i*4+k]=rim?value+face[k]-face[0]:face[k];
  }
  return output;
}
