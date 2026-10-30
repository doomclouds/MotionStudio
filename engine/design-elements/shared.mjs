// Original static composition contract. Not a rendering engine or animation clock.
export function number(v,name,min=-Infinity,max=Infinity){if(!Number.isFinite(v)||v<min||v>max)throw new RangeError(`${name} must be finite in [${min},${max}]`);return v}
export function bounds(b){if(!b||typeof b!=='object')throw new TypeError('bounds required');number(b.x,'x');number(b.y,'y');number(b.width,'width',40,4096);number(b.height,'height',40,4096);return b}
export function text(v,name,max=160){if(typeof v!=='string'||!v.trim()||v.length>max)throw new TypeError(`${name}: nonempty text <=${max}`);return v}
export function color(v,name){if(typeof v!=='string'||!/^#[0-9a-fA-F]{6}$/.test(v))throw new TypeError(`${name}: #rrggbb required`);return v}
export function theme(t){if(!t)throw new TypeError('theme required');['surface','ink','muted','accent'].forEach(k=>color(t[k],k));text(t.fontFamily,'fontFamily',100);return t}
export function array(a,name,min=1,max=20){if(!Array.isArray(a)||a.length<min||a.length>max)throw new RangeError(`${name}: ${min}..${max} items`);return a}
export function font(c,size,family,weight=400){c.font=`${weight} ${size}px ${family}`;c.textBaseline='alphabetic';c.textAlign='left';if('letterSpacing'in c)c.letterSpacing='0px'}
export function fit(c,s,width,label){if(c.measureText(s).width>width+.01)throw new RangeError(`${label} overflows explicit width; edit content or parameters`)}
const styleKeys=['fillStyle','strokeStyle','font','textAlign','textBaseline','lineWidth','lineCap','globalAlpha','letterSpacing'];
export function state(c,fn){const before=Object.fromEntries(styleKeys.filter(k=>k in c).map(k=>[k,c[k]]));c.save();try{return fn()}finally{c.restore();for(const[k,v]of Object.entries(before))c[k]=v}}
export function local(c,b,fn){return state(c,()=>{c.translate(b.x,b.y);return fn()})}
export function clip(c,w,h){c.beginPath();c.rect(0,0,w,h);c.clip()}
