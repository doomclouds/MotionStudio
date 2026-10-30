/** B08 composition recipe, not an additional design family. No fonts, images or runtime loaded here. */
export const recipeId='recipe.manifesto-stack.v1';
export const version=1;
export const guidance='../docs/manifesto-stack.md';
const finite=(v,key,min=-Infinity,max=Infinity)=>{if(!Number.isFinite(v)||v<min||v>max)throw new RangeError(`${key}: finite ${min}..${max} required`);return v};
const keys=['font','fillStyle','textAlign','textBaseline','letterSpacing','globalAlpha','globalCompositeOperation','shadowBlur','shadowColor','shadowOffsetX','shadowOffsetY','filter'];
function state(c,fn){const old=Object.fromEntries(keys.filter(k=>k in c).map(k=>[k,c[k]]));c.save();try{return fn()}finally{c.restore();for(const[k,v]of Object.entries(old))c[k]=v}}
export function validate(p){
 if(!p?.bounds||!p.font)throw new TypeError('bounds and structured font required');
 for(const k of ['x','y'])finite(p.bounds[k],'bounds.'+k);for(const k of ['width','height'])finite(p.bounds[k],'bounds.'+k,1,8192);
 for(const k of ['x','baseline'])finite(p[k],k);finite(p.step,'step',1,2048);finite(p.font.size,'font.size',8,600);
 if(!Number.isInteger(p.font.weight)||p.font.weight<100||p.font.weight>900||p.font.weight%100)throw new RangeError('font.weight: 100..900 in steps of 100');
 if(typeof p.font.family!=='string'||!p.font.family.trim()||p.font.family.length>120||/[;\r\n]/.test(p.font.family))throw new TypeError('font.family required');
 if(typeof p.ink!=='string'||!/^#[0-9a-f]{6}$/i.test(p.ink))throw new TypeError('ink: #RRGGBB');
 finite(p.tracking,'tracking',-p.font.size*.1,p.font.size*.5);finite(p.minLineGap??0,'minLineGap',0,200);finite(p.afterGap??24,'afterGap',0,400);finite(p.reserveAfter??0,'reserveAfter',0,p.bounds.height);
 if(!Array.isArray(p.lines)||p.lines.length<1||p.lines.length>4||p.lines.some(s=>typeof s!=='string'||!s.trim()||s.length>100||/[\r\n]/.test(s)))throw new TypeError('1..4 explicit nonempty single lines of <=100 characters');
 return p;
}
function applyFont(c,p){c.font=`${p.font.weight} ${p.font.size}px ${p.font.family}`;c.textAlign='left';c.textBaseline='alphabetic';if(!('letterSpacing'in c)&&p.tracking!==0)throw new TypeError('nonzero tracking requires Canvas letterSpacing support');if('letterSpacing'in c)c.letterSpacing=p.tracking+'px'}
export function measureManifestoStack(c,p){
 validate(p);if(!c||typeof c.measureText!=='function'||typeof c.save!=='function')throw new TypeError('caller Canvas 2D context required');
 return state(c,()=>{applyFont(c,p);let bottom=-Infinity;const b=p.bounds;
 const lines=p.lines.map((text,i)=>{const m=c.measureText(text),baseline=p.baseline+i*p.step;for(const k of ['width','actualBoundingBoxLeft','actualBoundingBoxRight','actualBoundingBoxAscent','actualBoundingBoxDescent'])finite(m[k],k);
  const measuredInk={x:p.x-m.actualBoundingBoxLeft,y:baseline-m.actualBoundingBoxAscent,width:m.actualBoundingBoxLeft+m.actualBoundingBoxRight,height:m.actualBoundingBoxAscent+m.actualBoundingBoxDescent};
  const guard=1+Math.abs(p.tracking),ink={x:measuredInk.x-guard,y:measuredInk.y-1,width:measuredInk.width+2*guard,height:measuredInk.height+2};
  if(measuredInk.width<=0||measuredInk.height<=0)throw new RangeError('visible glyph ink required');
  if(ink.x<b.x-.01||ink.y<b.y-.01||ink.x+ink.width>b.x+b.width+.01||ink.y+ink.height>b.y+b.height+.01||p.x+m.width>b.x+b.width+.01)throw new RangeError(`line ${i}: glyph/advance exceeds explicit bounds; edit authored breaks or geometry`);
  if(i&&ink.y<bottom+(p.minLineGap??0)-.01)throw new RangeError(`line ${i}: ink overlaps preceding line/minLineGap`);
  bottom=ink.y+ink.height;return{text,baseline,advance:m.width,measuredInk,ink,rasterGuard:{x:guard,y:1}};
 });
 const slotY=bottom+(p.afterGap??24),height=b.y+b.height-slotY;
 if(height<(p.reserveAfter??0)-.01)throw new RangeError('insufficient downstream slot; adjust authored stack');
 return{recipeId,version,lines,downstreamSlot:{x:b.x,y:slotY,width:b.width,height},automaticWrap:false,staticOnly:true,sourceSceneMigrated:false};
 });
}
export function drawManifestoStack(c,p){const geometry=measureManifestoStack(c,p);return state(c,()=>{applyFont(c,p);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.shadowBlur=0;c.shadowOffsetX=0;c.shadowOffsetY=0;c.shadowColor='rgba(0,0,0,0)';if('filter'in c)c.filter='none';c.fillStyle=p.ink;for(const line of geometry.lines)c.fillText(line.text,p.x,line.baseline);return geometry})}
