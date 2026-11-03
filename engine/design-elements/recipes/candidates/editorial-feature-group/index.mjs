// Original bounded static composition. Caller owns Canvas and registered font resources.
const finite=(v,k,min,max)=>{if(!Number.isFinite(v)||v<min||v>max)throw new RangeError(k);return v};
const string=(s,k)=>{if(typeof s!=='string'||!s.trim()||s.length>1000||/[\n\r\t]/.test(s))throw new TypeError(k);return s};
const freeze=o=>{Object.values(o).forEach(v=>{if(v&&typeof v==='object')freeze(v)});return Object.freeze(o)};
const issued=new WeakSet();
export function geometry({width,topHeight=560,bottomHeight=210,gap=20,inset=32,split=.54}={}){
 finite(width,'width',800,1800);finite(topHeight,'topHeight',440,900);finite(bottomHeight,'bottomHeight',170,400);finite(gap,'gap',8,40);finite(inset,'inset',20,60);finite(split,'split',.4,.6);
 const half=(width-gap)/2,third=(width-2*gap)/3,upper=(topHeight-gap)*split;
 const cells=[{id:'anchor',x:0,y:0,width:half,height:topHeight},{id:'stat',x:half+gap,y:0,width:half,height:upper},{id:'aside',x:half+gap,y:upper+gap,width:half,height:topHeight-upper-gap},...[0,1,2].map(i=>({id:`support-${i+1}`,x:i*(third+gap),y:topHeight+gap,width:third,height:bottomHeight}))].map(b=>({...b,content:{x:b.x+inset,y:b.y+inset,width:b.width-inset*2,height:b.height-inset*2}}));
 if(cells.some(c=>c.content.width<100||c.content.height<70))throw new RangeError('content slot exhausted');
 return {width,height:topHeight+gap+bottomHeight,cells};
}
const TEXT_STATE=Object.freeze({textBaseline:'alphabetic',textAlign:'left',direction:'ltr',letterSpacing:'0px',wordSpacing:'0px',fontKerning:'none',fontStretch:'normal',fontVariantCaps:'normal',fontVariationSettings:'normal',textRendering:'auto',lang:'en'});
function textState(c,font){c.font=font;for(const [k,v] of Object.entries(TEXT_STATE))if(k in c)c[k]=v;}
function captureTextState(c){return Object.fromEntries(['font',...Object.keys(TEXT_STATE)].filter(k=>k in c).map(k=>[k,c[k]]));}
function restoreTextState(c,state){for(const [k,v]of Object.entries(state))c[k]=v;}
function measureRole(c,texts,slot,style,name){
 if(!Array.isArray(texts)||!texts.length||texts.length>24)throw new TypeError(name+' lines');
 for(const [k,v] of Object.entries(slot))finite(v,name+' '+k,k==='x'||k==='y'?0:.01,5000);
 texts.forEach(t=>string(t,name));textState(c,style.font);
 if(texts.length*style.lineHeight>slot.height)throw new RangeError(name+' height');
 const metrics=texts.map(s=>{const m=c.measureText(s);for(const v of [m.width,m.actualBoundingBoxLeft,m.actualBoundingBoxRight,m.actualBoundingBoxAscent,m.actualBoundingBoxDescent])if(!Number.isFinite(v))throw new RangeError('finite glyph metrics required');return m});
 const ascent=Math.max(...metrics.map(m=>Math.max(0,m.actualBoundingBoxAscent))),descent=Math.max(...metrics.map(m=>Math.max(0,m.actualBoundingBoxDescent)));
 if(ascent+descent>style.lineHeight)throw new RangeError(name+' glyph height');
 const text=texts.map((s,i)=>{const m=metrics[i],left=Math.min(0,-m.actualBoundingBoxLeft),right=Math.max(m.width,m.actualBoundingBoxRight),asc=Math.max(0,m.actualBoundingBoxAscent),desc=Math.max(0,m.actualBoundingBoxDescent);
  if(right-left>slot.width)throw new RangeError(name+' glyph width');
  return {text:s,x:slot.x-left,y:slot.y+i*style.lineHeight+ascent,ink:{x:slot.x,y:slot.y+i*style.lineHeight+ascent-asc,width:right-left,height:asc+desc}};

 });return {name,slot,style,text};
}
export function planGroup(context,model,{fontFamily}={}){
 if(!context||typeof context.measureText!=='function')throw new TypeError('Canvas measurement context required');
 string(fontFamily,'registered font family');if(!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(fontFamily))throw new TypeError('simple explicit family required');
 if(!model||!Array.isArray(model.items)||model.items.length!==6)throw new TypeError('exactly six authored items');
 const g=geometry(model),styles={label:{font:`12px ${fontFamily}`,lineHeight:18},title:{font:`bold 23px ${fontFamily}`,lineHeight:29},body:{font:`16px ${fontFamily}`,lineHeight:22},excerpt:{font:`14px ${fontFamily}`,lineHeight:19},stat:{font:`bold 42px ${fontFamily}`,lineHeight:50}};
 const originalText=captureTextState(context);context.save();try{
  const cells=g.cells.map((b,i)=>{const p=b.content,item=model.items[i];if(!item||typeof item!=='object')throw new TypeError('item');
   const roles=[],bottom=p.y+p.height;let bodyBottom=bottom,accessory=null;
   if(i===0){accessory={x:p.x,y:bottom-132,width:p.width,height:132};bodyBottom=accessory.y-18;if(!Array.isArray(model.excerpt))throw new TypeError('anchor excerpt');}
   if(i===1){accessory={x:p.x,y:bottom-50,width:p.width,height:50};bodyBottom=accessory.y-18;string(model.stat,'stat');}
   const add=(name,text,box)=>roles.push(measureRole(context,text,box,styles[name],name));
   add('label',[item.label],{x:p.x,y:p.y,width:p.width,height:18});add('title',[item.title],{x:p.x,y:p.y+28,width:p.width,height:29});
   add('body',item.body,{x:p.x,y:p.y+70,width:p.width,height:bodyBottom-p.y-70});
   if(i===0)add('excerpt',model.excerpt,{x:accessory.x+16,y:accessory.y+16,width:accessory.width-32,height:accessory.height-32});
   if(i===1)add('stat',[model.stat],accessory);
   return {...b,roles,accessory};
  });const plan=freeze({...g,cells,semantics:'authored editorial importance, not proportional data'});issued.add(plan);return plan;
 }finally{context.restore();restoreTextState(context,originalText)}
}
export function drawGroup(context,plan,{canvasApi,x=0,y=0,colors={}}={}){
 if(!issued.has(plan))throw new TypeError('use an unmodified planGroup result');finite(x,'x',0,10000);finite(y,'y',0,10000);
 if(!canvasApi||typeof canvasApi.createCanvas!=='function')throw new TypeError('canvasApi');
 const palette={surface:'#faf8f2',ink:'#242b35',muted:'#596372',accent:'#e4ecf2',edge:'#c9d0d8',...colors};
 if(Object.values(palette).some(v=>typeof v!=='string'||!/^#[0-9a-f]{6}$/i.test(v)))throw new TypeError('opaque RGB colors');
 const layer=canvasApi.createCanvas(Math.ceil(plan.width),Math.ceil(plan.height)),c=layer.getContext('2d');
 for(const b of plan.cells){c.fillStyle=palette.surface;c.strokeStyle=palette.edge;c.lineWidth=1;c.beginPath();c.roundRect(b.x+.5,b.y+.5,b.width-1,b.height-1,14);c.fill();c.stroke();if(b.id==='anchor'){const a=b.accessory;c.fillStyle=palette.accent;c.fillRect(a.x,a.y,a.width,a.height)}
  for(const r of b.roles){textState(c,r.style.font);c.fillStyle=r.name==='body'||r.name==='label'?palette.muted:palette.ink;for(const t of r.text)c.fillText(t.text,t.x,t.y)}
 }
 context.save();try{context.drawImage(layer,x,y)}finally{context.restore()}
 return {width:plan.width,height:plan.height,cells:plan.cells.length,roleCount:plan.cells.reduce((n,c)=>n+c.roles.length,0)};
}
