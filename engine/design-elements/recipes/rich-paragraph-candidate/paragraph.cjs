'use strict';
// Native extraction and changes, 2026: owned inputs, injected fonts, bounded ink-aware
// wrapping and isolated tile output. Apache-2.0; see NOTICES.md for the separately
// retained HTMLAnything Apache / OpenDesign MIT source attribution.
const GUARD = 2;
const has = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
function fail(message){ throw new TypeError(message); }
function record(value, required, optional=[]){
  if(!value || typeof value!=='object' || Array.isArray(value) ||
    ![Object.prototype,null].includes(Object.getPrototypeOf(value))) fail('Plain own-data record required');
  const descriptors=Object.getOwnPropertyDescriptors(value), out=Object.create(null);
  if(Reflect.ownKeys(descriptors).some(k=>typeof k!=='string'||![...required,...optional].includes(k))) fail('Unknown record field');
  for(const k of [...required,...optional]){
    const d=descriptors[k]; if(!d){if(required.includes(k))fail('Missing field: '+k);continue;}
    if(!has(d,'value'))fail('Accessors rejected'); out[k]=d.value;
  }
  return out;
}
function dense(value,min,max){
  if(!Array.isArray(value))fail('Dense array required');
  const ds=Object.getOwnPropertyDescriptors(value),n=ds.length.value;
  if(!Number.isSafeInteger(n)||n<min||n>max)fail('Array length outside contract');
  if(Reflect.ownKeys(ds).length!==n+1)fail('Sparse or augmented array rejected');
  const out=[];for(let i=0;i<n;i++){const d=ds[i];if(!d||!has(d,'value'))fail('Own data index required');out.push(d.value);}return out;
}
function number(v,min,max,integer=false){if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max||(integer&&!Number.isInteger(v)))fail('Number outside contract');return v;}
function color(v){if(typeof v!=='string'||!/^#[0-9a-fA-F]{6}$/.test(v))fail('Primitive six-digit hex color required');return v;}
function freeze(v){if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
function text(v,max,allowBlank=false){if(typeof v!=='string'||!v.length||v.length>max||/[^\x20-\x7e]/.test(v)||(!allowBlank&&!v.trim()))fail('Bounded printable ASCII required');return v;}
function fontFace(raw){
  const v=record(raw,['family','weight'],['italic','variations']);
  if(typeof v.family!=='string'||!/^[A-Za-z][A-Za-z0-9 _-]{0,63}$/.test(v.family))fail('Safe explicit font family required');
  number(v.weight,100,900,true);if(v.italic!==undefined&&typeof v.italic!=='boolean')fail('Italic boolean required');
  if(v.variations!==undefined&&(typeof v.variations!=='string'||v.variations.length>160||!/^"[A-Za-z0-9]{4}" -?\d+(?:\.\d+)?(?:, "[A-Za-z0-9]{4}" -?\d+(?:\.\d+)?)*$/.test(v.variations)))fail('Explicit variation settings required');
  return {family:v.family,weight:v.weight,italic:v.italic??false,variations:v.variations??'normal'};
}
function cleanModel(raw){
  const p=record(raw,['width','height','runs'],['fontSize','lineHeight','padding','maxLines','colors']);
  const width=number(p.width,96,1600,true),height=number(p.height,48,1200,true);
  const fontSize=p.fontSize===undefined?20:number(p.fontSize,8,72);
  const lineHeight=p.lineHeight===undefined?fontSize*1.6:number(p.lineHeight,fontSize,160);
  const padding=p.padding===undefined?16:number(p.padding,4,64,true);
  const maxLines=p.maxLines===undefined?32:number(p.maxLines,1,64,true);
  if(width-2*padding<32||height-2*padding<12)fail('Inner slot too small');
  const defaults={text:'#242424',em:'#a63e20',code:'#343434',chip:'#f3eee8',chipBorder:'#d3c7bc'};
  const cs=p.colors===undefined?{}:record(p.colors,[],Object.keys(defaults));
  const colors={};for(const k of Object.keys(defaults))colors[k]=cs[k]===undefined?defaults[k]:color(cs[k]);
  let count=0;
  const runs=dense(p.runs,1,64).map(rawRun=>{const r=record(rawRun,['kind','text']);if(!['text','em','code'].includes(r.kind))fail('Unknown run kind');text(r.text,r.kind==='code'?128:2000,r.kind!=='code');count+=r.text.length;return {kind:r.kind,text:r.text};});
  if(count>8192||!runs.some(r=>r.text.trim()))fail('Total text outside contract');
  return {width,height,fontSize,lineHeight,padding,maxLines,colors,runs};
}
function setup(g,face,size,colorValue){
  g.resetTransform();g.globalAlpha=1;g.globalCompositeOperation='source-over';
  g.shadowColor='transparent';g.shadowBlur=0;g.shadowOffsetX=0;g.shadowOffsetY=0;g.filter='none';
  g.direction='ltr';g.wordSpacing='0px';g.letterSpacing='0px';g.textAlign='left';g.textBaseline='alphabetic';
  g.font=`${face.italic?'italic ':''}${face.weight} ${size}px "${face.family}"`;
  g.fontVariationSettings=face.variations;g.fillStyle=colorValue;
}
function measure(g,part,model,faces){
  const size=model.fontSize*(part.kind==='code'?.9:1),face=faces[part.kind];
  setup(g,face,size,model.colors[part.kind]);const m=g.measureText(part.text);
  const a=[m.width,m.actualBoundingBoxLeft,m.actualBoundingBoxRight,m.actualBoundingBoxAscent,m.actualBoundingBoxDescent];
  if(!a.every(Number.isFinite)||m.width<=0||m.width>1e6)fail('Font metrics invalid');
  let left=-m.actualBoundingBoxLeft,right=m.actualBoundingBoxRight,top=-m.actualBoundingBoxAscent,bottom=m.actualBoundingBoxDescent;
  if(right<left||bottom<top||Math.max(...a.map(Math.abs))>1e6)fail('Font ink bounds invalid');
  const padX=part.kind==='code'?6:0,padY=part.kind==='code'?4:0;
  if(part.kind==='code'){
    // Keep both side bearings inside the chip; the complete chip is atomic.
    const start=padX-Math.min(0,left),advance=Math.max(m.width,right)-Math.min(0,left)+2*padX;
    const chipTop=Math.min(top,-size*.8)-padY,chipBottom=Math.max(bottom,size*.2)+padY;
    return {...part,size,face,advance,left:0,right:advance,top:chipTop,bottom:chipBottom,textOffset:start,chip:true};
  }
  return {...part,size,face,advance:m.width,left,right,top,bottom,textOffset:0,chip:false};
}
function extent(parts){
  let advance=0,left=0,right=0,top=Infinity,bottom=-Infinity;
  for(const p of parts){if(!p.space){left=Math.min(left,advance+p.left);right=Math.max(right,advance+p.right);top=Math.min(top,p.top);bottom=Math.max(bottom,p.bottom);}advance+=p.advance;}
  return {advance,left,right:Math.max(right,advance),top,bottom,width:Math.max(right,advance)-left+2*GUARD};
}
function createRichParagraphEngine(config){
  const c=record(config,['createCanvas','faces']);if(typeof c.createCanvas!=='function')fail('Trusted fresh-canvas factory required');
  const rawFaces=record(c.faces,['text','em','code']),faces=freeze({text:fontFace(rawFaces.text),em:fontFace(rawFaces.em),code:fontFace(rawFaces.code)});
  const createCanvas=c.createCanvas;
  function layout(raw){
    const model=cleanModel(raw); // All input syntax is validated before even measurement allocation.
    const g=createCanvas(1,1).getContext('2d'),units=[];
    for(const run of model.runs){
      const pieces=run.kind==='code'?[run.text]:run.text.split(/( +)/).filter(Boolean);
      for(const original of pieces){
        const space=run.kind!=='code'&&/^ +$/.test(original);
        if(space){if(!units.length||units.at(-1).space)continue;units.push({space:true,parts:[{...measure(g,{kind:run.kind,text:' '},model,faces),space:true}]});}
        else {const part=measure(g,{kind:run.kind,text:original},model,faces);if(units.length&&!units.at(-1).space)units.at(-1).parts.push(part);else units.push({space:false,parts:[part]});}
      }
    }
    if(units.at(-1)?.space)units.pop();
    const innerWidth=model.width-2*model.padding,lines=[];let current=[],pendingSpace=[];
    for(const unit of units){
      if(unit.space){pendingSpace=unit.parts;continue;}
      const attempt=current.concat(current.length?pendingSpace:[],unit.parts);pendingSpace=[];
      if(extent(attempt).width<=innerWidth){current=attempt;continue;}
      if(!current.length||extent(unit.parts).width>innerWidth)fail('Unbreakable styled word/code exceeds inner width');
      lines.push(current);current=unit.parts;
      if(lines.length>=model.maxLines)fail('Line count exceeds maxLines');
    }
    if(current.length)lines.push(current);if(!lines.length||lines.length>model.maxLines)fail('Line count outside contract');
    const ops=[],lineLayouts=[];let baseline=0,previousBottom=-Infinity;
    for(let index=0;index<lines.length;index++){
      const parts=lines[index],e=extent(parts);
      if(index===0)baseline=model.padding-e.top+GUARD;else baseline+=model.lineHeight;
      const left=model.padding-e.left+GUARD,top=baseline+e.top,bottom=baseline+e.bottom;
      if(top<model.padding||bottom+GUARD>model.height-model.padding||top<previousBottom+GUARD)fail('Line ink/chips exceed vertical slot or collide');
      let x=left;const start=ops.length;
      for(const p of parts){if(!p.space)ops.push({kind:p.kind,text:p.text,size:p.size,face:p.face,x:x+p.textOffset,baseline,
        ink:{left:x+p.left,right:x+p.right,top:baseline+p.top,bottom:baseline+p.bottom},
        chip:p.chip?{x,y:baseline+p.top,width:p.advance,height:p.bottom-p.top}:null});x+=p.advance;}
      lineLayouts.push({index,baseline,ink:{left:left+e.left,right:left+e.right,top,bottom},advance:e.advance,operationStart:start,operationCount:ops.length-start});previousBottom=bottom;
    }
    return freeze({width:model.width,height:model.height,padding:model.padding,fontSize:model.fontSize,lineHeight:model.lineHeight,colors:model.colors,lineCount:lines.length,lines:lineLayouts,operations:ops});
  }
  function tile(raw){
    const plan=layout(raw),canvas=createCanvas(plan.width,plan.height),g=canvas.getContext('2d');
    for(const op of plan.operations){
      setup(g,op.face,op.size,plan.colors[op.kind]);
      if(op.chip){const b=op.chip;g.fillStyle=plan.colors.chip;g.beginPath();g.roundRect(b.x+.5,b.y+.5,b.width-1,b.height-1,3);g.fill();g.strokeStyle=plan.colors.chipBorder;g.lineWidth=1;g.stroke();g.fillStyle=plan.colors.code;}
      g.fillText(op.text,op.x,op.baseline);
    }
    return Object.freeze({canvas,layout:plan}); // Canvas is intentionally mutable; metadata is frozen.
  }
  function draw(ctx,raw,x=0,y=0){
    number(x,-1e6,1e6);number(y,-1e6,1e6);if(!ctx||typeof ctx.drawImage!=='function')fail('Native drawing context required');
    const result=tile(raw);ctx.drawImage(result.canvas,x,y);return result.layout;
  }
  return Object.freeze({layout,tile,draw});
}
module.exports={createRichParagraphEngine};
