'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createPixelLayer}=require('./index.cjs'),{signal,weave}=require('./fixtures.cjs'),{loadNative}=require('./native.cjs'),{outputTarget,writeExclusive}=require('./output.cjs');
function compose(api,kind){
  if(kind!=='signal-quilt'&&kind!=='weave-folio')throw Error('known composition required');
  const provider={createCanvas:(w,h)=>api.createCanvas(w,h)},wide=kind==='signal-quilt',width=wide?1280:960,height=wide?800:1200,canvas=api.createCanvas(width,height),g=canvas.getContext('2d'),placed=[];
  const rect=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
  const tile=(model,x,y,w,h,hsv,checker=false)=>{const r=createPixelLayer({model,width:w,height:h,...(hsv?{hsv}:{}),checker},provider);g.drawImage(r.canvas,x,y);placed.push({x,y,...r.layout});};
  if(wide){
    rect(0,0,width,height,'#eee5d6');rect(48,48,1184,2,'#b8a897');rect(48,80,32,32,'#3b3b5b');rect(94,80,176,10,'#918397');rect(94,100,104,7,'#b29b8e');
    rect(48,168,688,544,'#ded3c2');tile(signal(),72,200,640,480);
    tile(signal(),868,88,288,216,{hue:0,saturation:-32,value:3});
    rect(836,352,352,288,'#45455c');tile(signal(),868,388,288,216,{hue:-25,saturation:8,value:2});
    signal().palette.forEach((c,i)=>rect(848+i*66,680,52,44,c));
    rect(48,752,688,2,'#b8a897');rect(848,752,340,2,'#b8a897');
  }else{
    rect(0,0,width,height,'#25273e');rect(48,48,864,2,'#67677f');rect(48,82,16,16,'#c88a91');rect(76,82,152,8,'#aab8c5');rect(76,98,88,5,'#6f83a0');
    rect(64,160,832,576,'#363a54');tile(weave(),96,192,768,512);
    rect(64,784,400,288,'#e9d9c5');tile(weave(),80,804,368,245,{hue:18,saturation:-20,value:5});
    tile(weave(),512,804,368,245,{hue:-20,saturation:5,value:0},true);
    weave().palette.forEach((c,i)=>rect(64+i*172,1128,152,24,c));
  }
  return {canvas,width,height,layout:{kind,static:true,synthetic:true,fonts:false,placed}};
}
function run(target){
  const directory=outputTarget(target),api=loadNative();
  // Build both first; output paths are validated before any filesystem mutation.
  const outputs=['signal-quilt','weave-folio'].map(kind=>{const result=compose(api,kind),png=result.canvas.toBuffer('image/png');return {kind,result,png};});
  fs.mkdirSync(directory,{recursive:true});const rows=[];
  for(const {kind,result,png}of outputs){writeExclusive(directory,kind+'.png',png);writeExclusive(directory,kind+'.json',JSON.stringify(result.layout,null,2)+'\n');rows.push({file:kind+'.png',width:result.width,height:result.height,sha256:crypto.createHash('sha256').update(png).digest('hex')});}
  writeExclusive(directory,'outputs.json',JSON.stringify({synthetic:true,files:rows},null,2)+'\n');return rows;
}
if(require.main===module)console.log(JSON.stringify(run(process.argv[2]),null,2));
module.exports={compose,run};
