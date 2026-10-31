'use strict';
// Bounded native feature-list candidate. No poster, reference pixels or external icons.
const { assertEnvironment } = require('./runtime.cjs');
const PALETTE = Object.freeze({title:'#ffffff', description:'#cbd6db', iconBackground:'#ffffff1f', icon:'#ffffff'});
const MARKS = Object.freeze(['check','layers','arrow','spark']);
function plain(value,name,keys) {
  if (!value || typeof value!=='object' || Object.getPrototypeOf(value)!==Object.prototype) throw new TypeError(`${name} must be a plain data object`);
  for (const key of Reflect.ownKeys(value)) {
    const d=Object.getOwnPropertyDescriptor(value,key);
    if (typeof key!=='string' || !keys.includes(key) || !Object.hasOwn(d,'value')) throw new TypeError(`${name}: unknown key or accessor`);
  }
  return value;
}
function number(v,name,min,max) { if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw new RangeError(`${name} out of range`);return v; }
function dense(items) {
  if(!Array.isArray(items)||items.length<1||items.length>8)throw new TypeError('items must be a dense 1..8 array');
  const expected=new Set(['length',...Array.from({length:items.length},(_,i)=>String(i))]);
  for(const k of Reflect.ownKeys(items)){const d=Object.getOwnPropertyDescriptor(items,k);if(!expected.delete(k)||!Object.hasOwn(d,'value'))throw new TypeError('items: extra key or accessor');}
  if(expected.size)throw new TypeError('items cannot be sparse');
}
function text(value,name,max){if(typeof value!=='string'||value.length>max||!value.trim()||/[^\x20-\x7e]/.test(value))throw new TypeError(`${name}: nonempty printable ASCII only, max ${max}`);return value.trim();}
function normalize(g) {
  g.globalAlpha=1;g.globalCompositeOperation='source-over';g.shadowColor='transparent';g.shadowBlur=0;g.shadowOffsetX=0;g.shadowOffsetY=0;g.filter='none';
  g.textAlign='left';g.textBaseline='alphabetic';g.direction='ltr';g.letterSpacing='0px';g.wordSpacing='0px';g.fontKerning='normal';g.imageSmoothingEnabled=true;
}
const font=(size,weight)=>`${size}px "FeatureStack${weight}"`;
function wrap(g,s,width,maxLines,ascent,descent) {
  const lines=[];let line='';
  for(const word of s.split(/ +/)){
    if(g.measureText(word).width>width)throw new RangeError('Unbroken word exceeds text width');
    const next=line?line+' '+word:word;
    if(line && g.measureText(next).width>width){lines.push(line);line=word;}else line=next;
  }
  if(line)lines.push(line);
  if(lines.length<1||lines.length>maxLines)throw new RangeError('Text exceeds supported line count');
  for(const line of lines){const m=g.measureText(line);if(m.width>width+1e-6||m.actualBoundingBoxRight>width+1e-6||m.actualBoundingBoxLeft>2||m.actualBoundingBoxAscent>ascent||m.actualBoundingBoxDescent>descent)throw new RangeError('Text ink exceeds supported cell');}
  return lines;
}
function layoutFeatureStack(props,env) {
  assertEnvironment(env);plain(props,'props',['x','y','width','columns','items','gap','palette']);
  const {x=0,y=0,width=940,columns=1,items,gap=18,palette={}}=props;
  number(x,'x',-10000,10000);number(y,'y',-10000,10000);number(width,'width',240,1600);number(gap,'gap',0,100);
  if(columns!==1&&columns!==2)throw new RangeError('columns must be 1 or 2');dense(items);plain(palette,'palette',Object.keys(PALETTE));
  for(const v of Object.values(palette))if(typeof v!=='string'||!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v))throw new TypeError('Palette values must be 6/8-digit hex');
  const colors={...PALETTE,...palette};const colWidth=(width-gap*(columns-1))/columns,textWidth=colWidth-60;
  if(textWidth<160)throw new RangeError('Columns too narrow');
  const g=env.canvasApi.createCanvas(1,1).getContext('2d');normalize(g);const cells=[];
  for(let i=0;i<items.length;i++){
    const it=plain(items[i],'item',['icon','title','description']);if(!MARKS.includes(it.icon))throw new TypeError('Unknown native icon');
    const title=text(it.title,'title',80),description=text(it.description,'description',180);
    g.font=font(22,600);const titleLines=wrap(g,title,textWidth,2,25.4,7.6);
    g.font=font(15,500);const descriptionLines=wrap(g,description,textWidth,3,18.3,4.95);
    cells.push({index:i,icon:it.icon,titleLines,descriptionLines,width:colWidth,height:Math.max(42,titleLines.length*33+4+descriptionLines.length*23.25)});
  }
  let top=0;
  for(let i=0;i<cells.length;i+=columns){const row=cells.slice(i,i+columns),rowHeight=Math.max(...row.map(c=>c.height));row.forEach((c,j)=>Object.assign(c,{x:j*(colWidth+gap),y:top,rowHeight}));top+=rowHeight+gap;}
  const height=top-gap;if(height>1600)throw new RangeError('Composition too tall');
  return {x,y,width,height,columns,gap,colors,cells};
}
function icon(g,name,x,y,color) {
  g.save();g.translate(x,y);g.strokeStyle=color;g.fillStyle=color;g.lineWidth=1.8;g.lineCap='round';g.lineJoin='round';g.beginPath();
  if(name==='check'){g.moveTo(3,11);g.lineTo(8.5,16);g.lineTo(19,5);g.stroke();}
  if(name==='arrow'){g.moveTo(3,11);g.lineTo(19,11);g.moveTo(12,4);g.lineTo(19,11);g.lineTo(12,18);g.stroke();}
  if(name==='layers'){for(const dy of [0,5]){g.moveTo(2,7+dy);g.lineTo(11,2+dy);g.lineTo(20,7+dy);g.lineTo(11,12+dy);g.closePath();g.stroke();g.beginPath();}}
  if(name==='spark'){g.moveTo(11,1);g.lineTo(14,8);g.lineTo(21,11);g.lineTo(14,14);g.lineTo(11,21);g.lineTo(8,14);g.lineTo(1,11);g.lineTo(8,8);g.closePath();g.stroke();}
  g.restore();
}
function drawFeatureStack(ctx,props,env) {
  const geom=layoutFeatureStack(props,env);
  if(!ctx||typeof ctx.drawImage!=='function'||typeof ctx.save!=='function'||typeof ctx.restore!=='function')throw new TypeError('Native 2D context required');
  const ratio=env.pixelRatio,stage=env.canvasApi.createCanvas(Math.ceil(geom.width*ratio),Math.ceil(geom.height*ratio)),g=stage.getContext('2d');g.scale(ratio,ratio);normalize(g);
  for(const c of geom.cells){
    g.fillStyle=geom.colors.iconBackground;g.beginPath();g.roundRect(c.x,c.y,42,42,12);g.fill();icon(g,c.icon,c.x+10,c.y+10,geom.colors.icon);
    g.font=font(22,600);g.fillStyle=geom.colors.title;c.titleLines.forEach((s,i)=>g.fillText(s,c.x+60,c.y+25.4+i*33));
    g.font=font(15,500);g.fillStyle=geom.colors.description;c.descriptionLines.forEach((s,i)=>g.fillText(s,c.x+60,c.y+c.titleLines.length*33+4+18.3+i*23.25));
  }
  // All model validation and native staging precede the sole caller composite.
  // No beginPath/clip/text operation touches the caller. Its drawing state is inherited.
  ctx.save();try{ctx.drawImage(stage,0,0,geom.width*ratio,geom.height*ratio,geom.x,geom.y,geom.width,geom.height);}finally{ctx.restore();}
  return geom;
}
module.exports={layoutFeatureStack,drawFeatureStack};
