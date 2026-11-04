const get=(o,k,d)=>Object.hasOwn(o,k)?o[k]:d;
export function record(x, allowed, label) {
  if (!x || Object.getPrototypeOf(x) !== Object.prototype) throw new TypeError(label + ': plain record required');
  for (const key of Reflect.ownKeys(x)) {
    if (typeof key !== 'string' || !allowed.includes(key) || !('value' in Object.getOwnPropertyDescriptor(x,key))) throw new TypeError(label + ': unknown/accessor field');
  }
}
function number(v, min, max, label) {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw new RangeError(label + ': finite value out of range');
  return v;
}
function vector(v, length, min, max, label) {
  if (!Array.isArray(v) || Object.getPrototypeOf(v)!==Array.prototype || v.length!==length || Reflect.ownKeys(v).length!==length+1) throw new TypeError(label+': dense array required');
  return Array.from({length}, (_,i)=> {
    const d=Object.getOwnPropertyDescriptor(v,String(i));
    if (!d || !('value' in d)) throw new TypeError(label+': data items required');
    return number(d.value,min,max,label);
  });
}
function matrix(v, rows, cols, min,max,label) {
  if (!Array.isArray(v) || Object.getPrototypeOf(v)!==Array.prototype || v.length!==rows || Reflect.ownKeys(v).length!==rows+1) throw new TypeError(label+': dense matrix required');
  return Array.from({length:rows},(_,i)=>{
    const d=Object.getOwnPropertyDescriptor(v,String(i));
    if (!d || !('value' in d)) throw new TypeError(label+': data rows required');
    return vector(d.value,cols,min,max,label);
  });
}
export function canvas(c,label) {
  if (!(typeof HTMLCanvasElement!=='undefined' && c instanceof HTMLCanvasElement) && !(typeof OffscreenCanvas!=='undefined' && c instanceof OffscreenCanvas)) throw new TypeError(label+': canvas required');
  dimensions(c.width,c.height,label);
}
export function dimensions(w,h,label='dimensions') {
  if (!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w>4096||h>4096||w*h>8388608) throw new RangeError(label+': dimensions exceed bounds');
}
const fields=['inks','paper','off','rot','ang','seed','sheet','boil','period','gate','sweep','grain'];
export function options(o,W) {
  record(o,fields,'options');
  return {
    inks:matrix(o.inks,3,3,0,255,'inks'),paper:vector(o.paper,3,0,255,'paper'),
    off:matrix(get(o,'off',[[0,0],[0,0],[0,0]]),3,2,-8192,8192,'off'),
    rot:vector(get(o,'rot',[0,0,0]),3,-Math.PI*2,Math.PI*2,'rot'),
    ang:vector(get(o,'ang',[0.2618,0,1.309]),3,-Math.PI*2,Math.PI*2,'ang'),
    seed:number(get(o,'seed',0),-1e6,1e6,'seed'),sheet:number(get(o,'sheet',0),-1e6,1e6,'sheet'),
    boil:number(get(o,'boil',0),0,1,'boil'),period:number(get(o,'period',7),.25,4096,'period'),
    gate:vector(get(o,'gate',[1,1,1]),3,0,1,'gate'),
    sweep:vector(get(o,'sweep',[W+200,W+200,W+200]),3,-1e5,1e5,'sweep'),
    grain:number(get(o,'grain',1),0,4,'grain')
  };
}
