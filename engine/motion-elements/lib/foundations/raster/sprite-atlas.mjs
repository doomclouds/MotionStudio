/** Original bounded absolute-tick atlas addressing. No textures, ticker or drawing. */
const internals=new WeakMap();
const MAX_TICK=Number.MAX_SAFE_INTEGER,MAX_DURATION=1_000_000_000,MAX_TOTAL=2_000_000_000_000;
function record(value,keys){
 if(value===null||typeof value!=='object'||Object.getPrototypeOf(value)!==Object.prototype)throw Error('Expected ordinary record');
 const ds=Object.getOwnPropertyDescriptors(value),actual=Reflect.ownKeys(ds);if(actual.length!==keys.length||actual.some(k=>typeof k!=='string'||!keys.includes(k)))throw Error('Unknown or missing field');
 const out={};for(const key of keys){const d=ds[key];if(!d||!Object.hasOwn(d,'value'))throw Error('Accessors unsupported');out[key]=d.value;}return out;
}
function dense(value,min,max){
 if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype)throw Error('Expected ordinary dense array');
 const ds=Object.getOwnPropertyDescriptors(value),n=ds.length?.value;if(!Number.isInteger(n)||n<min||n>max||Reflect.ownKeys(ds).length!==n+1)throw Error('Invalid array length or fields');
 const out=[];for(let i=0;i<n;i++){const d=ds[String(i)];if(!d||!Object.hasOwn(d,'value'))throw Error('Sparse or accessor array');out.push(d.value);}return out;
}
function integer(value,min,max){if(typeof value!=='number'||!Number.isSafeInteger(value)||value<min||value>max)throw Error('Integer outside bounds');return value;}
function frozenFrame(raw,atlas,ids){
 const f=record(raw,['id','rect','durationTicks']);if(typeof f.id!=='string'||!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(f.id)||ids.has(f.id))throw Error('Expected unique bounded frame ID');ids.add(f.id);
 const r=record(f.rect,['x','y','width','height']),x=integer(r.x,0,atlas.width-1),y=integer(r.y,0,atlas.height-1),width=integer(r.width,1,atlas.width),height=integer(r.height,1,atlas.height);if(x+width>atlas.width||y+height>atlas.height)throw Error('Frame outside atlas');
 return Object.freeze({id:f.id,rect:Object.freeze({x,y,width,height}),durationTicks:integer(f.durationTicks,1,MAX_DURATION)});
}
export function compileSpriteAtlas(raw){
 const i=record(raw,['atlas','frames','mode','startTick']),a=record(i.atlas,['width','height']);const atlas=Object.freeze({width:integer(a.width,1,8192),height:integer(a.height,1,8192)});if(atlas.width*atlas.height>16_777_216)throw Error('Atlas pixel area exceeds limit');
 if(!['once','loop','pingpong'].includes(i.mode))throw Error('Unknown playback mode');const startTick=integer(i.startTick,0,MAX_TICK),ids=new Set(),frames=Object.freeze(dense(i.frames,1,1024).map(f=>frozenFrame(f,atlas,ids)));
 const sequence=frames.map((_,index)=>index);if(i.mode==='pingpong'&&frames.length>2)for(let n=frames.length-2;n>=1;n--)sequence.push(n);
 let totalTicks=0;const ends=[];for(const frameIndex of sequence){totalTicks+=frames[frameIndex].durationTicks;if(!Number.isSafeInteger(totalTicks)||totalTicks>MAX_TOTAL)throw Error('Sequence duration exceeds limit');ends.push(totalTicks);}
 const plan=Object.freeze({atlas,frames,mode:i.mode,startTick,totalTicks});internals.set(plan,{sequence:Object.freeze(sequence),ends:Object.freeze(ends)});return plan;
}
export function sampleSpriteAtlas(plan,absoluteTick){
 const data=internals.get(plan);if(!data)throw Error('Expected compiled atlas from this module instance');integer(absoluteTick,0,MAX_TICK);
 const elapsedTick=absoluteTick-plan.startTick;let phase='active',cycleIndex=0,cycleTick=0,sequenceIndex=0;
 if(elapsedTick<0)phase='before';else if(plan.mode==='once'&&elapsedTick>=plan.totalTicks){phase='after';cycleTick=plan.totalTicks;sequenceIndex=data.sequence.length-1;}else{
  cycleIndex=plan.mode==='once'?0:Math.floor(elapsedTick/plan.totalTicks);cycleTick=elapsedTick%plan.totalTicks;
  let lo=0,hi=data.ends.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(cycleTick>=data.ends[mid])lo=mid+1;else hi=mid;}sequenceIndex=lo;
 }
 const frameIndex=data.sequence[sequenceIndex],frame=plan.frames[frameIndex],start=sequenceIndex?data.ends[sequenceIndex-1]:0,frameTick=phase==='before'?0:cycleTick-start;
 return Object.freeze({absoluteTick,elapsedTick,phase,cycleIndex,cycleTick,sequenceIndex,frameIndex,frameId:frame.id,rect:frame.rect,frameTick,durationTicks:frame.durationTicks});
}
