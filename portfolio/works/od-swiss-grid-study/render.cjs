/* Static Native adaptation of OpenDesign / Hyperframes Swiss Grid, Apache-2.0.
   No runtime/timeline, media, remote request, or reference-pixel input. See NOTICE. */
const fs=require('node:fs');
const path=require('node:path');
const resources=require('./resources.cjs');
const {createCanvas,GlobalFonts,Path2D}=resources.canvas();
const ROOT=__dirname;
for(const name of ['Regular','Bold']) {
  if(!GlobalFonts.registerFromPath(resources.font(`LiberationSans-${name}.ttf`),`Swiss${name}`)) throw Error('Pinned OFL font could not be registered');
}
for(const w of [200,300])if(!GlobalFonts.registerFromPath(resources.font(`SwissArchivo${w}.ttf`),`SwissArchivo${w}`))throw Error('Pinned Archivo instance could not be registered');
const defaultScene=()=>JSON.parse(fs.readFileSync(path.join(ROOT,'scene.json'),'utf8'));
const geometry=Object.freeze({line:[160,360,1200,12],title:[190,560],subtitle:[190,654.2],card:[249.074074,263.333333,626.666667,346.666667],cardOpacity:26/27});
function validate(scene){
  if(scene.schemaVersion!==1||scene.frame?.width!==1920||scene.frame?.height!==1080)throw Error('Fixed 1920×1080 schema version 1 required');
  for(const [name,t,max] of [['title',scene.title,12],['subtitle',scene.subtitle,23],['value',scene.stat?.value,5],['label',scene.stat?.label,27]]){
    if(typeof t!=='string'||!t.length||t.length>max||!/^[A-Z0-9 %.,+\-/]+$/.test(t))throw Error(`Unsupported copy: ${name}`);
  }
  if(!/^[0-9]{1,3}%?$/.test(scene.stat.value))throw Error('Statistic requires one to three digits with optional percent suffix');
  for(const name of ['background','navy','card','gold'])if(!/^#[0-9a-fA-F]{6}$/.test(scene.palette?.[name]??''))throw Error('Palette must contain six-digit hex colors');
  return true;
}
function textWidth(g,text,size,weight,tracking=0){g.font=`${size}px Swiss${weight}`;return g.measureText(text).width+Math.max(0,text.length-1)*tracking;}
function trackedText(g,text,x,y,{size,weight='Regular',tracking=0,color,scaleX=1,scaleY=1,ink=0}){
  // Literal strings, no markup parsing. Glyph metrics remain editable, not traced pixels.
  const target=g;
  target.save();target.translate(x,y);target.scale(scaleX,scaleY);target.font=`${size}px Swiss${weight}`;target.textBaseline='alphabetic';target.fillStyle=color;
  let advance=0;
  for(const ch of text){if(ink){target.strokeStyle=color;target.lineWidth=ink;target.strokeText(ch,advance,0);}target.fillText(ch,advance,0);advance+=target.measureText(ch).width+tracking;}
  target.restore();
  return (advance-tracking)*scaleX;
}
function drawSwissIntro(g,scene){
  g.fillStyle=scene.palette.background;g.fillRect(0,0,1920,1080);
  g.fillStyle=scene.palette.navy;g.fillRect(...geometry.line);
  const titleWidth=trackedText(g,scene.title,...geometry.title,{size:180,weight:'Bold',tracking:-7.2,color:scene.palette.navy,scaleY:1.05,ink:4});
  const subtitleWidth=trackedText(g,scene.subtitle,...geometry.subtitle,{size:64,weight:'Archivo200',tracking:2.6,color:scene.palette.navy,scaleY:1.05});
  return {titleWidth,subtitleWidth};
}
function drawStatisticValue(g,value,x,baseline,color){
  // Percentage rings are native circle/polygon primitives, not a copied glyph.
  // OFL Arial-compatible font has narrow oval percent counters unlike the reference.
  if(!value.endsWith('%'))return trackedText(g,value,x,baseline,{size:140,weight:'Bold',color,scaleX:.99,scaleY:1.05});
  const digits=value.slice(0,-1);const w=trackedText(g,digits,x,baseline,{size:140,weight:'Bold',color,scaleX:.99,scaleY:1.05});
  g.save();g.translate(x+w+4,baseline-101);g.fillStyle=color;
  for(const [cx,cy,r,inner] of [[25,25,25,11.7],[89,76,26,12]]){g.beginPath();g.arc(cx,cy,r,0,Math.PI*2);g.arc(cx,cy,inner,0,Math.PI*2,true);g.fill('evenodd');}
  g.beginPath();g.moveTo(78,0);g.lineTo(92,0);g.lineTo(29,102);g.lineTo(15,102);g.closePath();g.fill();g.restore();return w+119;
}
function drawStatisticOverlay(g,scene,{opacity=geometry.cardOpacity}={}){
  if(!Number.isFinite(opacity)||opacity<0||opacity>1)throw Error('Invalid card opacity');
  const layer=createCanvas(1920,1080),a=layer.getContext('2d');const [x,y,w,h]=geometry.card;
  // Shadow explicitly drawn once, avoiding renderer-specific shadow-alpha behavior.
  a.fillStyle='rgba(10,30,61,0.1)';a.fillRect(x+20,y+20,w,h);
  a.fillStyle=scene.palette.card;a.fillRect(x,y,w,h);a.fillStyle=scene.palette.gold;a.fillRect(x,y,10,h);
  const valueWidth=drawStatisticValue(a,scene.stat.value,x+50,408,scene.palette.gold);
  const labelWidth=trackedText(a,scene.stat.label,x+50,451.5,{size:24,weight:'Archivo300',tracking:2,color:scene.palette.navy});
  g.save();g.globalAlpha=opacity;g.drawImage(layer,0,0);g.restore();
  return {valueWidth,labelWidth,opacity,box:geometry.card};
}
function compose(g,scene=defaultScene(),{x=0,y=0,scale=1}={}){
  validate(scene);if(![x,y,scale].every(Number.isFinite)||scale<=0)throw Error('Finite offset and positive scale required');
  const probe=createCanvas(1,1).getContext('2d');
  const widths={title:textWidth(probe,scene.title,180,'Bold',-7.2),subtitle:textWidth(probe,scene.subtitle,64,'Archivo200',2.6),value:textWidth(probe,scene.stat.value,140,'Bold')*.99,label:textWidth(probe,scene.stat.label,24,'Archivo300',2)};
  for(const [key,max] of Object.entries({title:1540,subtitle:1500,value:520,label:526.666667}))if(widths[key]>max)throw Error(`${key} exceeds measured copy budget`);
  // Modified 2026-10-31: build into a fresh procedural surface, so caller text
  // settings and current path cannot change this fixed recipe's measurement/drawing.
  // Existing host transform and clip remain intentional; local effects are isolated.
  const layer=createCanvas(1920,1080), local=layer.getContext('2d');
  const intro=drawSwissIntro(local,scene),card=drawStatisticOverlay(local,scene);
  g.save();try{
    g.globalAlpha=1;g.globalCompositeOperation='source-over';g.shadowColor='rgba(0,0,0,0)';g.shadowBlur=0;g.shadowOffsetX=0;g.shadowOffsetY=0;
    if('filter' in g)g.filter='none';
    g.translate(x,y);g.scale(scale,scale);
    const clip=new Path2D();clip.rect(0,0,1920,1080);g.clip(clip);g.drawImage(layer,0,0);
  }finally{g.restore();}
  return {frame:[1920,1080],intro,card,copyWidths:widths};
}
function render(scene=defaultScene()){
  const canvas=createCanvas(1920,1080);const metrics=compose(canvas.getContext('2d'),scene);return {canvas,metrics};
}
module.exports={compose,render,defaultScene,validate,geometry,trackedText,drawSwissIntro,drawStatisticOverlay,drawStatisticValue};
if(require.main===module){const r=render();resources.write('faithful.png',r.canvas.toBuffer('image/png'));console.log('Complete fixed static frame written externally');}
