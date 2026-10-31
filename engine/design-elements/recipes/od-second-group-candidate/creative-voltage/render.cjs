module.exports=function createNative(canvasApi,assetDir){
/* Creative Voltage — Native static study, 2026-10-31.
   Source: nexu-io/open-design (Apache-2.0), frontend-slides preset (MIT).
   Fonts: OFL-1.1. See NOTICE. Source screenshot is NOT a rendering dependency. */
const fs=require('node:fs');
const path=require('node:path');
const {createCanvas,GlobalFonts}=canvasApi;
const ROOT=__dirname;
for(const family of ['VoltageDisplay','VoltageScript','VoltageMono400','VoltageMono700'])
  if(!GlobalFonts.registerFromPath(path.join(assetDir,`${family}.ttf`),family))throw Error('font registration failed');
const defaultScene=()=>JSON.parse(fs.readFileSync(path.join(ROOT,'scene.json'),'utf8'));
function validate(scene){
  if(scene.schemaVersion!=='1.0.0'||scene.frame.width!==1920||scene.frame.height!==1080)throw Error('Fixed 1920×1080 schema 1.0.0 required');
  const c=scene.copy;
  if(!Array.isArray(c.headline)||c.headline.length!==3)throw Error('Exactly three headline lines required');
  for(const s of [...c.headline,c.meta,c.script,c.caption])
    if(typeof s!=='string'||!s.length||s.length>90||/[\r\n]/.test(s)||[...s].some(ch=>ch.codePointAt(0)>255))throw Error('Single-line Latin copy required; no silent fallback');
  for(const key of ['blue','dark','white','outline'])if(!/^#[0-9a-f]{6}$/i.test(scene.tokens[key]))throw Error('Six-digit color token required');
  if(scene.tokens.split!==.47)throw Error('This frame contract preserves 47/53 split');
}
function trackedWidth(g,text,tracking){return g.measureText(text).width+tracking*[...text].length;}
function trackedText(g,text,x,baseline,{family,size,tracking=0,color='#fff',align='left',stroke=null,lineWidth=2}={}){
  g.save();g.font=`${size}px ${family}`;g.textAlign='left';g.textBaseline='alphabetic';g.letterSpacing='0px';
  const width=trackedWidth(g,text,tracking);const left=align==='right'?x-width:x;
  g.fillStyle=color;g.strokeStyle=stroke||color;g.lineWidth=lineWidth;g.lineJoin='round';
  if(tracking===0){
    // Preserve Caveat's contextual substitutions and connected handwriting.
    g.fillText(text,left,baseline);if(stroke)g.strokeText(text,left,baseline);
    g.restore();return {text,width,left,right:left+width,baseline};
  }
  let offset=0;
  const chars=[...text];
  for(let i=0;i<chars.length;i++){
    const prefix=chars.slice(0,i+1).join('');
    offset=g.measureText(prefix).width-g.measureText(chars[i]).width+i*tracking;
    // CSS text-stroke paints over the filled glyph, retaining the interior fill.
    g.fillText(chars[i],left+offset,baseline);
    if(stroke)g.strokeText(chars[i],left+offset,baseline);
  }
  g.restore();return {text,width,left,right:left+width,baseline};
}
function drawSplitPanels(g,tokens){
  const w=1920*tokens.split;
  g.fillStyle=tokens.dark;g.fillRect(0,0,1920,1080);
  g.fillStyle=tokens.blue;g.fillRect(0,0,w,1080);
  const cx=w*.3,cy=1080*.4;
  const radius=Math.hypot(w-cx,1080-cy)*.55;
  const gradient=g.createRadialGradient(cx,cy,0,cx,cy,radius);
  gradient.addColorStop(0,'rgba(255,255,255,0.16)');gradient.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=gradient;g.fillRect(0,0,w,1080);
}
function drawDisplay(g,scene){
  const t=scene.tokens;
  const line=t.headlineSize*t.headlineLineHeight;
  // CSS line box: half-leading + Syne's 0.925em ascent.
  const baseline=t.headlineTop+(line-t.headlineSize*1.2)/2+t.headlineSize*.925;
  return scene.copy.headline.map((text,i)=>{
    const metric=trackedText(g,text,1920-t.headlineRight,baseline+line*i,{family:'VoltageDisplay',size:t.headlineSize,tracking:t.headlineTracking,color:i===1?t.blue:t.white,align:'right',stroke:i===1?t.outline:null,lineWidth:2});
    if(metric.width>t.headlineWidth)throw Error(`Headline line ${i+1} exceeds ${t.headlineWidth}px; shorten copy, do not auto-shrink`);
    return metric;
  });
}
function drawScriptMark(g,scene){
  const t=scene.tokens;g.save();g.font=`${t.scriptSize}px VoltageScript`;
  const width=g.measureText(scene.copy.script).width,lineHeight=t.scriptSize*1.26;
  if(width>650)throw Error('Handwritten accent exceeds 650px copy budget');
  const cx=t.scriptLeft+width/2,cy=t.scriptTop+lineHeight/2;
  g.translate(cx,cy);g.rotate(t.scriptRotation*Math.PI/180);g.translate(-cx,-cy);
  trackedText(g,scene.copy.script,t.scriptLeft,t.scriptTop+t.scriptSize*.96,{family:'VoltageScript',size:t.scriptSize,color:t.white});
  g.restore();
  // Exact original SVG cubic path, translated from (90,560); not newly invented art.
  g.save();g.translate(90,560);g.strokeStyle=t.white;g.lineWidth=5;g.lineCap='round';g.beginPath();g.moveTo(8,40);g.bezierCurveTo(140,12,360,12,512,34);g.stroke();g.restore();
  return {text:scene.copy.script,width,rotation:t.scriptRotation,box:[t.scriptLeft,t.scriptTop,width,lineHeight]};
}
function drawMonoAnchors(g,scene){
  const t=scene.tokens;const size=t.monoSize;
  const meta=trackedText(g,scene.copy.meta,90,96+size*1.12,{family:'VoltageMono700',size,tracking:t.metaTracking,color:'rgba(255,255,255,.85)'});
  const caption=trackedText(g,scene.copy.caption,1810,1080-96-size*.361,{family:'VoltageMono400',size,tracking:t.captionTracking,color:'rgba(255,255,255,.55)',align:'right'});
  if(meta.width>650||caption.width>760)throw Error('Monospace copy exceeds fixed-frame budget');
  return {meta,caption};
}
function compose(g,scene=defaultScene(),{x=0,y=0,scale=1}={}){
  validate(scene);if(![x,y,scale].every(Number.isFinite)||scale<=0)throw Error('Finite placement and positive scale required');
  g.save();try{
    g.translate(x,y);g.scale(scale,scale);g.beginPath();g.rect(0,0,1920,1080);g.clip();
    drawSplitPanels(g,scene.tokens);
    const headline=drawDisplay(g,scene),script=drawScriptMark(g,scene),anchors=drawMonoAnchors(g,scene);
    return {frame:scene.frame,headline,script,...anchors};
  }finally{g.restore();}
}
function render(output=path.join(ROOT,'evidence/implementation-v2.png'),scene=defaultScene()){
  const canvas=createCanvas(1920,1080);const metrics=compose(canvas.getContext('2d'),scene);
  fs.writeFileSync(output,canvas.toBuffer('image/png'));
  fs.writeFileSync(path.join(ROOT,'evidence/layout-metrics.json'),JSON.stringify(metrics,null,2));
  return output;
}
return {compose,render,defaultScene,drawSplitPanels,drawDisplay,drawScriptMark,drawMonoAnchors,trackedText,validate,width:1920,height:1080};

};
