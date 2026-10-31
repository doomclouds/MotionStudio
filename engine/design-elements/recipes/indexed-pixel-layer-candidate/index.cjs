'use strict';
// Original bounded extraction/reimplementation. MIT; see LICENSE and CREDITS.md.
// No source image/model, font, filesystem, network, editor or native import here.
const usedCanvases=new WeakSet();
const MAX_PIXELS=1600*1100;
function record(value,allowed,required=[]){
  if(!value||typeof value!=='object'||Object.getPrototypeOf(value)!==Object.prototype)throw TypeError('ordinary record required');
  for(const key of Reflect.ownKeys(value)){
    const d=Object.getOwnPropertyDescriptor(value,key);
    if(typeof key!=='string'||!allowed.includes(key)||!d.enumerable||!('value'in d))throw TypeError('unknown or non-data field');
  }
  for(const key of required)if(!Object.hasOwn(value,key))throw TypeError('missing '+key);
  return value;
}
function number(value,min,max,name,integer=false){
  if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max||(integer&&!Number.isInteger(value)))throw RangeError(name+' out of range');
  return value;
}
function array(value,min,max=min){
  if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length<min||value.length>max||Reflect.ownKeys(value).length!==value.length+1)throw TypeError('ordinary dense array required');
  const copy=[];
  for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d||!d.enumerable||!('value'in d))throw TypeError('dense data array required');copy.push(d.value);}
  return copy;
}
function color(value){if(typeof value!=='string'||!/^#[0-9a-fA-F]{6}$/.test(value))throw TypeError('six-digit RGB required');return value.toLowerCase();}
function rgbToHsv(rgb){
  const [r,g,b]=rgb.map(v=>v/255),v=Math.max(r,g,b),min=Math.min(r,g,b),d=v-min;
  const h=d===0?0:v===r?((g-b)/d)%6:v===g?(b-r)/d+2:(r-g)/d+4;
  return [((h*60)%360+360)%360,v===0?0:d/v,v];
}
function hsvToRgb(h,s,v){
  const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;
  const q=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
  return q.map(n=>Math.round((n+m)*255));
}
function adjusted(palette,hsv){
  if(hsv.hue===0&&hsv.saturation===0&&hsv.value===0)return palette.slice();
  return palette.map(hex=>{
    const [h,s,v]=rgbToHsv([1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)));
    const rgb=hsvToRgb((h+hsv.hue+360)%360,Math.max(0,Math.min(1,s+hsv.saturation/100)),Math.max(0,Math.min(1,v+hsv.value/100)));
    return '#'+rgb.map(n=>n.toString(16).padStart(2,'0')).join('');
  });
}
function normalize(spec){
  record(spec,['width','height','model','hsv','checker'],['width','height','model']);
  const width=number(spec.width,1,1600,'width',true),height=number(spec.height,1,1100,'height',true);
  if(width*height>MAX_PIXELS)throw RangeError('pixel allocation budget');
  const m=record(spec.model,['columns','rows','palette','indices'],['columns','rows','palette','indices']);
  const columns=number(m.columns,1,256,'columns',true),rows=number(m.rows,1,256,'rows',true);
  if(width<columns||height<rows)throw RangeError('downsampling is not supported');
  const palette=array(m.palette,1,256).map(color),indices=array(m.indices,columns*rows).map(v=>number(v,-1,palette.length-1,'index',true));
  let hsv={hue:0,saturation:0,value:0};
  if(spec.hsv!==undefined){const q=record(spec.hsv,['hue','saturation','value'],['hue','saturation','value']);hsv={hue:number(q.hue,-180,180,'hue'),saturation:number(q.saturation,-100,100,'saturation'),value:number(q.value,-100,100,'value')};}
  if(spec.checker!==undefined&&typeof spec.checker!=='boolean')throw TypeError('checker must be boolean');
  return {width,height,columns,rows,palette:adjusted(palette,hsv),indices,hsv,checker:spec.checker===true};
}
function raster(plan){
  const {width,height,columns,rows,palette,indices,checker,hsv}=plan;
  const data=new Uint8ClampedArray(width*height*4),rgb=palette.map(hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)));
  for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
    const index=indices[row*columns+column],x0=Math.floor(column*width/columns),x1=Math.floor((column+1)*width/columns),y0=Math.floor(row*height/rows),y1=Math.floor((row+1)*height/rows);
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const offset=(y*width+x)*4;
      if(index>=0){const c=rgb[index];data[offset]=c[0];data[offset+1]=c[1];data[offset+2]=c[2];data[offset+3]=255;}
      else if(checker){const c=(Math.floor(x/8)+Math.floor(y/8))%2?0x55:0x77;data[offset]=data[offset+1]=data[offset+2]=c;data[offset+3]=255;}
    }
  }
  const layout=Object.freeze({kind:'indexed-pixel-layer',width,height,columns,rows,checker,hsv:Object.freeze({...hsv}),palette:Object.freeze(palette.slice()),cellBoundary:'floor(i * output / count)',transparentIndex:-1});
  return Object.freeze({width,height,data,layout});
}
function renderIndexedPixels(spec){return raster(normalize(spec));}
function createPixelLayer(spec,provider){
  const plan=normalize(spec);
  record(provider,['createCanvas'],['createCanvas']);
  const factory=Object.getOwnPropertyDescriptor(provider,'createCanvas').value;
  if(typeof factory!=='function')throw TypeError('trusted createCanvas function required');
  const pixels=raster(plan),canvas=factory(plan.width,plan.height);
  if(!canvas||typeof canvas!=='object'||canvas.width!==plan.width||canvas.height!==plan.height||typeof canvas.getContext!=='function')throw TypeError('factory returned wrong canvas');
  if(usedCanvases.has(canvas))throw TypeError('factory must return a fresh canvas');
  const ctx=canvas.getContext('2d');
  if(!ctx||typeof ctx.createImageData!=='function'||typeof ctx.putImageData!=='function')throw TypeError('Canvas 2D pixel methods required');
  const image=ctx.createImageData(plan.width,plan.height);
  if(!image||!(image.data instanceof Uint8ClampedArray)||image.data.length!==pixels.data.length)throw TypeError('wrong ImageData');
  image.data.set(pixels.data);usedCanvases.add(canvas);ctx.putImageData(image,0,0);
  return Object.freeze({canvas,width:plan.width,height:plan.height,layout:pixels.layout});
}
module.exports={renderIndexedPixels,createPixelLayer};
