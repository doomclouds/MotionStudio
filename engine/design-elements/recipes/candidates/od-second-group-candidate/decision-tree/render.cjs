module.exports=function createNative(canvasApi,assetDir){
/* Static native renderer. Source-native diagram shapes are data, not screenshot pixels.
   Derived from the Apache-2.0 OpenDesign composition; see NOTICE. */
const fs=require('node:fs');
const path=require('node:path');
const {createCanvas,loadImage,GlobalFonts}=canvasApi;
const ROOT=__dirname;
const palette={yellow:'#e8d44d',green:'#c2e8a0',peach:'#f5c5a3',lavender:'#d4c5f9',blue:'#a8d8f0',pink:'#f8b4c8'};
for(const weight of [500,600]) if(!GlobalFonts.registerFromPath(path.join(assetDir,`DecisionStudy${weight}.ttf`),`DecisionStudy${weight}`))throw Error('font registration failed');
function roundRect(g,x,y,w,h,r,fill,stroke=null,line=1){
  g.beginPath();g.roundRect(x,y,w,h,r);
  if(fill){g.fillStyle=fill;g.fill();}
  if(stroke){g.strokeStyle=stroke;g.lineWidth=line;g.stroke();}
}
function text(g,value,x,y,size=18,weight=500,color='#333',align='center',ink=0){
  g.font=`${size}px DecisionStudy${weight}`;g.fillStyle=color;g.textAlign=align;g.textBaseline='alphabetic';
  // Native rasterizer optical correction, no change to the source advance widths.
  if(ink){g.save();g.strokeStyle=color;g.lineWidth=ink;g.lineJoin='round';g.strokeText(value,x,y);g.restore();}
  g.fillText(value,x,y);
}
async function compose(g,scene,{x=0,y=0,scale=1}={}){
  if(scene.frame.width!==1920||scene.frame.height!==1080||scene.frame.scale!==1.2||JSON.stringify(scene.frame.origin)!=='[960,300]')throw Error('Fixed 1920×1080 transform contract required');
  if(![x,y,scale].every(Number.isFinite)||scale<=0)throw Error('Finite x/y and positive scale required');
  if(scene.nodes.length!==7||scene.edges.length!==6)throw Error('Fixed seven-node / six-connector contract required');
  if(scene.reaction.asset!=='thumb-up-noto.png')throw Error('Pinned reaction asset required');
  for(const n of scene.nodes)if(!palette[n.tone]||typeof n.text!=='string'||!Number.isFinite(n.x)||!Number.isFinite(n.y)||[...n.text].some(c=>c.codePointAt(0)>255))throw Error('Invalid node data or unsupported non-Latin copy');
  const expected=[['root',960,100],['yes',600,300],['not-sure',1320,300],['python',400,500],['nocode',800,500],['website',1120,500],['course',1520,500]];
  if(JSON.stringify(scene.nodes.map(n=>[n.id,n.x,n.y]))!==JSON.stringify(expected))throw Error('Pinned connector geometry requires unchanged node positions');
  if(JSON.stringify(scene.edges)!=='[["root","yes"],["root","not-sure"],["yes","python"],["yes","nocode"],["not-sure","website"],["not-sure","course"]]')throw Error('Fixed edge topology required');
  g.save();g.translate(x,y);g.scale(scale,scale);g.beginPath();g.rect(0,0,1920,1080);g.clip();
  g.fillStyle='#fff';g.fillRect(0,0,1920,1080);
  g.fillStyle='#e5e5e5';for(let yy=10;yy<1080;yy+=20)for(let xx=10;xx<1920;xx+=20){g.beginPath();g.arc(xx,yy,1,0,Math.PI*2);g.fill();}
  g.translate(960,300);g.scale(1.2,1.2);g.translate(-960,-300);
  g.drawImage(await loadImage(path.join(assetDir,'connectors.svg')),0,0,1920,1080);
  const metrics=[];
  for(const label of scene.labels){
    g.font='14px DecisionStudy600';const width=g.measureText(label.text).width;
    roundRect(g,label.x-width/2-6,label.y-10.5,width+12,21,4,'#fff');
    text(g,label.text,label.x,label.y+5.8,14,600);
  }
  for(const node of scene.nodes){
    g.font='18px DecisionStudy500';const m=g.measureText(node.text),w=m.width+48,h=53;
    const nx=node.x-w/2,ny=node.y-h/2;
    // @napi-rs/canvas 0.1.100 empirically squares shadow alpha; compensate to
    // approximate the source CSS rgba(...,0.1), not a design-token change.
    g.save();g.shadowColor=`rgba(0,0,0,${Math.sqrt(.1)})`;g.shadowBlur=12;g.shadowOffsetY=4.8;
    roundRect(g,nx,ny,w,h,12,palette[node.tone]);g.restore();
    text(g,node.text,node.x,node.y+7.333333,18,500,'#333','center',.5);
    if(node.selected)roundRect(g,nx-3,ny-3,w+6,h+6,15,null,'#0b84f3',2);
    metrics.push({id:node.id,text:node.text,textWidth:m.width,maxTextWidth:node.maxTextWidth,withinCopyBudget:m.width<=node.maxTextWidth,sourceBox:[nx,ny,w,h],frameBox:[960+(nx-960)*1.2,300+(ny-300)*1.2,w*1.2,h*1.2]});
  }
  const cursor=scene.cursor;
  g.drawImage(await loadImage(path.join(assetDir,'cursor.svg')),cursor.x,cursor.y,24,24);
  g.font='12px DecisionStudy600';const tagW=g.measureText(cursor.tag).width+16;
  roundRect(g,cursor.x+28,cursor.y+12,tagW,19,4,'#9747ff');
  text(g,cursor.tag,cursor.x+36,cursor.y+26,12,600,'#fff','left');
  const reaction=scene.reaction;
  g.drawImage(await loadImage(path.join(assetDir,reaction.asset)),reaction.x-19,reaction.y-19,38,38);
  g.restore();return metrics;
}
async function render(output=path.join(ROOT,'evidence/implementation-v4.png'),scene=JSON.parse(fs.readFileSync(path.join(ROOT,'scene.json')))){
  const canvas=createCanvas(1920,1080);const metrics=await compose(canvas.getContext('2d'),scene);
  fs.writeFileSync(output,canvas.toBuffer('image/png'));
  fs.writeFileSync(path.join(ROOT,'evidence/layout-metrics.json'),JSON.stringify({width:1920,height:1080,renderer:'@napi-rs/canvas; native artifact render, not browser screenshot',nodes:metrics},null,2));
  return output;
}
return {compose,render,width:1920,height:1080};

};
