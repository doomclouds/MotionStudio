/** Original bounded decorative 2D surface; no images, clocks, fonts or IO. */
const owned=new WeakSet();
const finite=(v,k,min,max)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw new RangeError(`${k}: ${min}..${max}`);return v;};
function record(input,keys){if(input===null||typeof input!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(input)))throw new TypeError('plain record required');const ds=Object.getOwnPropertyDescriptors(input),out=Object.create(null);for(const k of Reflect.ownKeys(ds)){if(typeof k!=='string'||!keys.includes(k)||!ds[k].enumerable||!('value'in ds[k]))throw new TypeError('unknown or non-data property');out[k]=ds[k].value;}return out;}
const color=(s)=>{if(typeof s!=='string'||!/^#[0-9a-f]{6}$/i.test(s))throw new TypeError('color must be #RRGGBB');return s.toLowerCase();};
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
export function compileResin(input){
 const p=record(input,['width','height','seed','count','radius','bend','dark','light']);
 const width=finite(p.width,'width',64,1024),height=finite(p.height,'height',64,1024);if(!Number.isInteger(width)||!Number.isInteger(height)||width*height>524288)throw new RangeError('integer dimensions; <=524288 pixels');
 const seed=finite(p.seed,'seed',0,4294967295);if(!Number.isInteger(seed))throw new RangeError('uint32 seed');
 const count=p.count===undefined?20:finite(p.count,'count',0,64);if(!Number.isInteger(count))throw new RangeError('integer count');
 const radius=p.radius===undefined?.065:finite(p.radius,'radius',.01,.15),bend=p.bend===undefined?.6:finite(p.bend,'bend',-.8,.8),dark=color(p.dark),light=color(p.light);
 let state=seed;const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const inclusions=Array.from({length:count},()=>{const r=radius*(.35+.65*rand())*Math.min(width,height);return {x:r+rand()*(width-2*r),y:r+rand()*(height-2*r),r};});
 const model=freeze({width,height,seed,count,radius,bend,dark,light,inclusions,band:{start:[width*.15,-height*.05],c1:[width*(.5+bend*.45),height*.2],c2:[width*(.5-bend*.45),height*.65],end:[width*.95,height*1.05]}});owned.add(model);return model;
}
export function drawResin(ctx,model,placement={}){
 if(!owned.has(model))throw new TypeError('compileResin model from this module required');
 const p=record(placement,['x','y']),x=p.x===undefined?0:finite(p.x,'x',-16384,16384),y=p.y===undefined?0:finite(p.y,'y',-16384,16384);
 for(const k of ['save','restore','translate','beginPath','rect','clip','fillRect','createLinearGradient','createRadialGradient','moveTo','bezierCurveTo','stroke'])if(typeof ctx?.[k]!=='function')throw new TypeError(`Canvas2D ${k} required`);
 const {width:w,height:h,dark,light,band}=model;const styles={fillStyle:ctx.fillStyle,strokeStyle:ctx.strokeStyle,lineWidth:ctx.lineWidth};ctx.save();try{
 ctx.translate(x,y);ctx.beginPath();ctx.rect(0,0,w,h);ctx.clip();
 let g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,light);g.addColorStop(1,dark);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 for(const {x:cx,y:cy,r} of model.inclusions){g=ctx.createRadialGradient(cx-r*.3,cy-r*.3,r*.02,cx,cy,r);g.addColorStop(0,'#fff1c966');g.addColorStop(.55,'#efb3490a');g.addColorStop(.9,'#41170c44');g.addColorStop(1,'#ffffff00');ctx.fillStyle=g;ctx.fillRect(cx-r,cy-r,2*r,2*r);}
 ctx.beginPath();ctx.moveTo(...band.start);ctx.bezierCurveTo(...band.c1,...band.c2,...band.end);ctx.strokeStyle='#fff7ca33';ctx.lineWidth=Math.min(w,h)*.16;ctx.stroke();ctx.strokeStyle='#fff9d999';ctx.lineWidth=Math.max(1,Math.min(w,h)*.0125);ctx.stroke();
 g=ctx.createLinearGradient(0,0,w,0);g.addColorStop(0,'#35180c55');g.addColorStop(.15,'#ffeaa62b');g.addColorStop(.7,'#ffffff00');g.addColorStop(1,'#25110988');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 }finally{ctx.restore();for(const k of Object.keys(styles))ctx[k]=styles[k];}
 return Object.freeze({x,y,width:w,height:h,count:model.count});
}
