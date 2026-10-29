import {record,number,coverage} from '../../internal/coverage-validation.mjs';
// Each padded line uses one monotone deque: each sample enters/leaves at most once.
function pass(src,w,h,r,horizontal,dilate,clamp) {
  const out=new Uint8Array(w*h),n=horizontal?w:h,lines=horizontal?h:w;
  const qIndices=new Int32Array(n+2*r),qValues=new Uint8Array(n+2*r);
  for(let line=0;line<lines;line++){
    let head=0,tail=0;
    for(let p=-r;p<n+r;p++){
      let v=0;
      if(clamp || (p>=0&&p<n)) {const k=Math.max(0,Math.min(n-1,p));v=src[horizontal?line*w+k:k*w+line];}
      while(tail>head && (dilate?qValues[tail-1]<=v:qValues[tail-1]>=v))tail--;
      qIndices[tail]=p;qValues[tail++]=v;
      while(tail>head && qIndices[head]<p-2*r)head++;
      const k=p-r;
      if(k>=0)out[horizontal?line*w+k:k*w+line]=qValues[head];
    }
  }
  return out;
}
export function morphologyCoverage(spec) {
  record(spec,['width','height','data','operation','radiusX','radiusY','boundary'],'morphology');
  const {width,height,data,operation,radiusX,radiusY,boundary}=spec;
  number(width,1,4096,'width',true);number(height,1,4096,'height',true);
  if(width*height>4194304)throw RangeError('mask: max 4194304 pixels');
  number(radiusX,0,64,'radiusX',true);number(radiusY,0,64,'radiusY',true);
  if(operation!=='dilate'&&operation!=='erode')throw RangeError('operation: dilate or erode');
  if(boundary!=='transparent'&&boundary!=='clamp')throw RangeError('boundary: transparent or clamp');
  let src=coverage(data,width*height);
  if(radiusX)src=pass(src,width,height,radiusX,true,operation==='dilate',boundary==='clamp');
  if(radiusY)src=pass(src,width,height,radiusY,false,operation==='dilate',boundary==='clamp');
  return Object.freeze({width,height,data:src});
}
