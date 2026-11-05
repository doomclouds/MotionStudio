// Original procedural paper and a nib-anchored marker. No fonts, source images or clock.
const papers=new WeakSet();
function record(v,allowed,required=[]){
 if(!v||![Object.prototype,null].includes(Object.getPrototypeOf(v)))throw TypeError('plain record required');
 for(const k of Reflect.ownKeys(v))if(!allowed.includes(k)||!Object.hasOwn(Object.getOwnPropertyDescriptor(v,k),'value'))throw TypeError('own data fields only');
 for(const k of required)if(!Object.hasOwn(v,k))throw TypeError('missing '+k);
}
function n(v,lo,hi){if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi)throw RangeError('finite bounded number required');return v===0?0:v;}
function integer(v,lo,hi){n(v,lo,hi);if(!Number.isSafeInteger(v))throw RangeError('integer required');return v;}
function color(v){if(typeof v!=='string'||!/^#[0-9a-f]{6}$/i.test(v))throw TypeError('#RRGGBB required');return v;}
function context(c){for(const k of ['save','restore','beginPath','moveTo','lineTo','stroke','fillRect','clip','translate','rotate','closePath','fill','rect','setLineDash'])if(typeof c?.[k]!=='function')throw TypeError('Canvas 2D context required');}
const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
// Stable integer hash, not a random stream or a security primitive.
function unit(seed,index,channel){let h=(seed^Math.imul(index+1,0x9e3779b1)^Math.imul(channel+1,0x85ebca6b))>>>0;h=Math.imul(h^(h>>>16),0x7feb352d);h=Math.imul(h^(h>>>15),0x846ca68b);return((h^(h>>>16))>>>0)/4294967296;}

export function compilePaperSurface(input){
 record(input,['width','height','seed','paper','fiber','fiberCount','grainCount','strength','dotSpacing'],['width','height','seed']);
 const width=integer(input.width,16,4096),height=integer(input.height,16,4096),seed=integer(input.seed,0,0xffffffff);
 const fiberCount=integer(input.fiberCount??Math.min(20000,Math.round(width*height/900)),0,20000),grainCount=integer(input.grainCount??Math.min(20000,Math.round(width*height/500)),0,20000);
 const strength=n(input.strength??.12,0,.35),dotSpacing=integer(input.dotSpacing??0,0,256);
 if(dotSpacing!==0&&dotSpacing<8)throw RangeError('dotSpacing is zero or 8..256');
 const fibers=Array.from({length:fiberCount},(_,i)=>{const x=unit(seed,i,0)*width,y=unit(seed,i,1)*height,a=unit(seed,i,2)*Math.PI,L=2+unit(seed,i,3)*9;return{x,y,x2:x+Math.cos(a)*L,y2:y+Math.sin(a)*L,width:.3+unit(seed,i,4)*.6,alpha:strength*(.25+.75*unit(seed,i,5))};});
 const grains=Array.from({length:grainCount},(_,i)=>({x:unit(seed,i,6)*width,y:unit(seed,i,7)*height,size:.4+unit(seed,i,8)*.8,alpha:strength*(.15+.55*unit(seed,i,9))}));
 const plan=freeze({width,height,seed,paper:color(input.paper??'#faf8ef'),fiber:color(input.fiber??'#796b58'),strength,dotSpacing,fibers,grains});papers.add(plan);return plan;
}

export function drawPaperSurface(ctx,plan){
 if(!papers.has(plan))throw TypeError('compilePaperSurface plan required');context(ctx);
 ctx.save();try{
  const alpha=ctx.globalAlpha;ctx.beginPath();ctx.rect(0,0,plan.width,plan.height);ctx.clip();
  ctx.fillStyle=plan.paper;ctx.fillRect(0,0,plan.width,plan.height);ctx.strokeStyle=plan.fiber;ctx.lineCap='round';ctx.setLineDash([]);
  for(const f of plan.fibers){ctx.globalAlpha=alpha*f.alpha;ctx.lineWidth=f.width;ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(f.x2,f.y2);ctx.stroke();}
  ctx.fillStyle=plan.fiber;
  for(const g of plan.grains){ctx.globalAlpha=alpha*g.alpha;ctx.fillRect(g.x,g.y,g.size,g.size);}
  if(plan.dotSpacing){ctx.globalAlpha=alpha*plan.strength;for(let y=plan.dotSpacing/2;y<plan.height;y+=plan.dotSpacing)for(let x=plan.dotSpacing/2;x<plan.width;x+=plan.dotSpacing)ctx.fillRect(x-.5,y-.5,1,1);}
 }finally{ctx.restore();}
 return {width:plan.width,height:plan.height,fibers:plan.fibers.length,grains:plan.grains.length,staticOnly:true};
}

export function drawMarker(ctx,input){
 record(input,['x','y','angle','length','width','ink','body','lift'],['x','y']);
 const x=n(input.x,-1e6,1e6),y=n(input.y,-1e6,1e6),angle=n(input.angle??-.7,-Math.PI*2,Math.PI*2),length=n(input.length??92,24,300),width=n(input.width??14,4,40),lift=n(input.lift??0,0,1),ink=color(input.ink??'#243a55'),body=color(input.body??'#fafafa');
 if(width>length/3)throw RangeError('marker width must not exceed one third of length');context(ctx);
 const shape=(shadow)=>{
  ctx.fillStyle=shadow?'#223344':body;ctx.fillRect(10,-width/2,length-10,width);
  if(!shadow){ctx.fillStyle=ink;ctx.fillRect(length-13,-width/2,13,width);ctx.fillRect(12,-width/2,5,width);}
  ctx.fillStyle=shadow?'#223344':ink;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(10,-width*.28);ctx.lineTo(10,width*.28);ctx.closePath();ctx.fill();
 };
 ctx.save();try{
  const alpha=ctx.globalAlpha;
  ctx.save();try{ctx.translate(x+3+8*lift,y+4+8*lift);ctx.rotate(angle);ctx.globalAlpha=alpha*.14;shape(true);}finally{ctx.restore();}
  ctx.translate(x,y-18*lift);ctx.rotate(angle);shape(false);
 }finally{ctx.restore();}
 return {contact:{x,y},visibleTip:{x,y:y-18*lift},lift,staticOnly:true};
}
