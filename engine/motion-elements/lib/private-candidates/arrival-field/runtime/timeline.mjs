import {createHash} from 'node:crypto';
const fail=m=>{throw new Error(m);};
const zero={n:'0',d:'1'};
// Only omitted/undefined optional values receive defaults; null is not omission.
const optional=(value,fallback)=>value===undefined?fallback:value;
const integer=x=>{if(typeof x==='number' && Number.isSafeInteger(x))return BigInt(x); if(typeof x==='bigint')return x;if(typeof x==='string'&&/^-?\d{1,30}$/.test(x))return BigInt(x);fail('Invalid bounded integer');};
const gcd=(a,b)=>b?gcd(b,a%b):a;
export function rational(n,d=1){n=integer(n);d=integer(d);if(d<=0n)fail('Denominator must be positive');const g=gcd(n<0n?-n:n,d);const result={n:String(n/g),d:String(d/g)};if(result.n.replace('-','').length>30||result.d.length>30)fail('Rational exceeds 30-digit bound');return result;}
function keys(o,allowed,required=allowed){if(!o||typeof o!=='object'||Array.isArray(o)||![Object.prototype,null].includes(Object.getPrototypeOf(o)))fail('Expected plain object');for(const k of Object.keys(o))if(!allowed.includes(k))fail(`Unknown field: ${k}`);for(const k of required)if(!Object.hasOwn(o,k))fail(`Missing field: ${k}`);}
const time=t=>{keys(t,['n','d']);if(typeof t.n!=='string'||typeof t.d!=='string')fail('Time integers must be strings');return rational(t.n,t.d);};
export const add=(a,b)=>rational(BigInt(a.n)*BigInt(b.d)+BigInt(b.n)*BigInt(a.d),BigInt(a.d)*BigInt(b.d));
export const sub=(a,b)=>rational(BigInt(a.n)*BigInt(b.d)-BigInt(b.n)*BigInt(a.d),BigInt(a.d)*BigInt(b.d));
export const compare=(a,b)=>{const x=BigInt(a.n)*BigInt(b.d)-BigInt(b.n)*BigInt(a.d);return x<0n?-1:x>0n?1:0;};
export const framesToTime=(frame,fps)=>rational(integer(frame)*integer(fps.d),integer(fps.n));
export const samplesToTime=(sample,rate)=>rational(sample,rate);
export function timeToSamples(t,rate){if(integer(rate)<=0n)fail('Sample rate must be positive');t=time(t);const n=BigInt(t.n)*integer(rate),d=BigInt(t.d),sign=n<0n?-1n:1n,a=n<0n?-n:n;return sign*((a+d/2n)/d);}
const id=x=>{if(typeof x!=='string'||!/^[-a-zA-Z0-9_]{1,64}$/.test(x))fail('Invalid ID');return x;};
const gain=x=>{if(typeof x!=='number'||!Number.isFinite(x)||x < -120||x>24)fail('gainDb must be finite -120..24');return x;};
const arr=(x,max=10000)=>{if(!Array.isArray(x)||x.length>max)fail('Invalid or excessive array');return x;};
function range(x){keys(x,['start','end']);const r={start:time(x.start),end:time(x.end)};if(compare(r.start,zero)<0||compare(r.end,r.start)<=0)fail('Invalid half-open range');return r;}
const length=r=>sub(r.end,r.start);
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
function fade(f){keys(f,['direction','duration','curve']);if(!['in','out'].includes(f.direction)||!['linear','equalPower'].includes(f.curve))fail('Unsupported fade');const duration=time(f.duration);if(compare(duration,zero)<=0)fail('Invalid fade duration');return {...f,duration};}
function localPath(p){if(typeof p!=='string'||!p||p.length>4096||/[\x00-\x1f\x7f]/.test(p)||/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(p)||p.startsWith('//')||p.includes('\\')||p.split('/').includes('..'))fail('Source path must be a local POSIX path without traversal or URI');return p;}
export function validateTimeline(input){
 keys(input,['schemaVersion','project','sources','clips','stems','buses','master','views']);if(input.schemaVersion!==1)fail('Unsupported schemaVersion');
 keys(input.project,['sampleRate','frameRate','channelLayout','duration']);const p=input.project;
 if(!Number.isInteger(p.sampleRate)||p.sampleRate<8000||p.sampleRate>192000)fail('Unsupported sampleRate');keys(p.frameRate,['n','d']);
 if(!Number.isSafeInteger(p.frameRate.n)||!Number.isSafeInteger(p.frameRate.d)||p.frameRate.n<=0||p.frameRate.d<=0||p.frameRate.n/p.frameRate.d>240)fail('Invalid frameRate');
 if(!['mono','stereo'].includes(p.channelLayout))fail('Unsupported channelLayout');const duration=time(p.duration);if(compare(duration,zero)<=0||compare(duration,rational(86400))>0)fail('Duration must be >0 and <=24h');
 const fps=rational(p.frameRate.n,p.frameRate.d);const project={...p,frameRate:{n:Number(fps.n),d:Number(fps.d)},duration};const used=new Set(['master']);const unique=x=>{id(x);if(used.has(x))fail(`Duplicate/reserved ID: ${x}`);used.add(x);return x;};
 const sources=arr(input.sources,1024).map(s=>{keys(s,['id','path','streamIndex','expectedSha256'],['id','path']);const out={id:unique(s.id),path:localPath(s.path)};if(s.streamIndex!==undefined){if(!Number.isSafeInteger(s.streamIndex)||s.streamIndex<0)fail('Invalid streamIndex');out.streamIndex=s.streamIndex;}if(s.expectedSha256!==undefined){if(typeof s.expectedSha256!=='string'||! /^[a-f0-9]{64}$/.test(s.expectedSha256))fail('Invalid expectedSha256');out.expectedSha256=s.expectedSha256;}return out;});const sourceIds=new Set(sources.map(s=>s.id));
 const node=n=>{keys(n,['id','outputId','gainDb'],['id','outputId']);return {id:unique(n.id),outputId:id(n.outputId),gainDb:gain(optional(n.gainDb,0))};};
 const stems=arr(input.stems,128).map(node),buses=arr(input.buses,128).map(node);const routes=new Map([...stems,...buses].map(n=>[n.id,n.outputId]));
 const busIds=new Set(buses.map(n=>n.id));for(const n of [...stems,...buses])if(n.outputId!=='master'&&!busIds.has(n.outputId))fail('Nodes must route to known bus or master');
 for(const n of routes.keys()){const seen=new Set();let cur=n;while(cur!=='master'){if(seen.has(cur))fail('Routing cycle');seen.add(cur);cur=routes.get(cur);if(!cur)fail('Unknown route');}}
 keys(input.master,['gainDb'],[]);const master={gainDb:gain(optional(input.master.gainDb,0))};
 const clips=arr(input.clips).map(c=>{keys(c,['id','sourceId','sourceRange','timelineRange','outputId','gainDb','fades','automation','envelopeOffset','envelopeDuration'],['id','sourceId','sourceRange','timelineRange','outputId']);
  const cid=unique(c.id);if(!sourceIds.has(c.sourceId))fail('Unknown sourceId');if(!stems.some(s=>s.id===c.outputId))fail('Clip output must be a known stem');
  const sourceRange=range(c.sourceRange),timelineRange=range(c.timelineRange),len=length(timelineRange);if(compare(len,length(sourceRange))!==0)fail('v1 requires rate=1 and equal ranges');if(compare(timelineRange.end,duration)>0)fail('Clip exceeds project');
  if(timeToSamples(timelineRange.end,p.sampleRate)<=timeToSamples(timelineRange.start,p.sampleRate))fail('Clip quantizes empty');
  const envelopeOffset=time(optional(c.envelopeOffset,zero)),envelopeDuration=time(optional(c.envelopeDuration,len));if(compare(envelopeOffset,zero)<0||compare(add(envelopeOffset,len),envelopeDuration)>0||compare(envelopeDuration,rational(86400))>0)fail('Invalid envelope range');
  const fades=arr(optional(c.fades,[]),2).map(fade);if(new Set(fades.map(f=>f.direction)).size!==fades.length)fail('Duplicate fade direction');for(const f of fades)if(compare(f.duration,envelopeDuration)>0||timeToSamples(f.duration,p.sampleRate)<1n)fail('Fade outside envelope');
  const automation=arr(optional(c.automation,[]),4096).map(a=>{keys(a,['at','gainDb']);const at=time(a.at);if(compare(at,zero)<0||compare(at,envelopeDuration)>0)fail('Automation outside envelope');return {at,gainDb:gain(a.gainDb)};});
  for(let i=1;i<automation.length;i++)if(timeToSamples(automation[i].at,p.sampleRate)<=timeToSamples(automation[i-1].at,p.sampleRate))fail('Automation points must have strictly increasing sample positions');
  return {id:cid,sourceId:c.sourceId,sourceRange,timelineRange,outputId:c.outputId,gainDb:gain(optional(c.gainDb,0)),fades,automation,envelopeOffset,envelopeDuration};
 });
 const views=arr(input.views,128).map(v=>{keys(v,['id','range','outputs','boundaryFade'],['id','range','outputs']);const vid=unique(v.id),r=range(v.range);if(compare(r.end,duration)>0||timeToSamples(r.end,p.sampleRate)<=timeToSamples(r.start,p.sampleRate))fail('Invalid view range');const outputs=arr(v.outputs,257).map(id);if(!outputs.length||new Set(outputs).size!==outputs.length||outputs.some(o=>o!=='master'&&!routes.has(o)))fail('Invalid view outputs');const out={id:vid,range:r,outputs};if(v.boundaryFade!==undefined){keys(v.boundaryFade,['duration','curve']);const f=fade({direction:'in',...v.boundaryFade});if(compare(f.duration,length(r))>0||timeToSamples(f.duration,p.sampleRate)<1n)fail('Boundary fade exceeds view or quantizes empty');out.boundaryFade={duration:f.duration,curve:f.curve};}return out;});
 return freeze({schemaVersion:1,project,sources,clips,stems,buses,master,views});
}
function stable(x){if(Array.isArray(x))return '['+x.map(stable).join(',')+']';if(x&&typeof x==='object')return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';return JSON.stringify(x);}
export function creativeIdentity(doc){const p=validateTimeline(doc);const creative={...p,sources:p.sources.map(({path,...identity})=>identity),views:undefined};delete creative.views;return createHash('sha256').update(stable(creative)).digest('hex');}
function edit(doc,clipId,fn){const p=structuredClone(validateTimeline(doc));const i=p.clips.findIndex(c=>c.id===clipId);if(i<0)fail('Unknown clipId');p.clips.splice(i,1,...fn(p.clips[i]));return validateTimeline(p);}
export function splitClip(doc,{clipId,at,rightId}){at=time(at);id(rightId);return edit(doc,clipId,c=>{if(compare(at,c.timelineRange.start)<=0||compare(at,c.timelineRange.end)>=0)fail('Split must be interior');const delta=sub(at,c.timelineRange.start),sourceAt=add(c.sourceRange.start,delta);return [{...c,sourceRange:{start:c.sourceRange.start,end:sourceAt},timelineRange:{start:c.timelineRange.start,end:at}},{...c,id:rightId,sourceRange:{start:sourceAt,end:c.sourceRange.end},timelineRange:{start:at,end:c.timelineRange.end},envelopeOffset:add(c.envelopeOffset,delta)}];});}
export function trimClip(doc,{clipId,start,end}){const r=range({start,end});return edit(doc,clipId,c=>{if(compare(r.start,c.timelineRange.start)<0||compare(r.end,c.timelineRange.end)>0)fail('Trim must be inside clip');const delta=sub(r.start,c.timelineRange.start),sourceStart=add(c.sourceRange.start,delta);return [{...c,timelineRange:r,sourceRange:{start:sourceStart,end:add(sourceStart,length(r))},envelopeOffset:add(c.envelopeOffset,delta)}];});}
export function moveClip(doc,{clipId,start}){start=time(start);return edit(doc,clipId,c=>[{...c,timelineRange:{start,end:add(start,length(c.timelineRange))}}]);}
export function compileSequence({sourceId,outputId,idPrefix,start=zero,sourceStart=zero,segments}){id(sourceId);id(outputId);id(idPrefix);let cursor=time(sourceStart),pos=time(start);if(compare(cursor,zero)<0||compare(pos,zero)<0)fail('Negative cursor');const clips=[];for(const [i,s] of arr(segments).entries()){keys(s,['kind','duration']);const d=time(s.duration);if(!['play','pause'].includes(s.kind)||compare(d,zero)<=0)fail('Invalid segment');const end=add(pos,d);if(s.kind==='play'){clips.push({id:id(`${idPrefix}-${i}`),sourceId,outputId,sourceRange:{start:cursor,end:add(cursor,d)},timelineRange:{start:pos,end}});cursor=add(cursor,d);}pos=end;}return freeze(clips);}

/** Shared endpoint quantization; never accumulates independently rounded durations. */
export function quantizeClip(clip,rate){
 const startSample=timeToSamples(clip.timelineRange.start,rate),endSample=timeToSamples(clip.timelineRange.end,rate);
 const sourceStartSample=timeToSamples(clip.sourceRange.start,rate),sourceEndSample=timeToSamples(clip.sourceRange.end,rate);
 const durationSamples=endSample-startSample;
 if(durationSamples<=0n||sourceEndSample-sourceStartSample!==durationSamples)fail('Sample phase mismatch: align source and timeline boundaries to project sample grid');
 const origin=sub(clip.sourceRange.start,optional(clip.envelopeOffset,zero)),originSample=timeToSamples(origin,rate);
 return freeze({startSample,endSample,sourceStartSample,sourceEndSample,durationSamples,envelopeOffsetSamples:sourceStartSample-originSample,envelopeDurationSamples:timeToSamples(add(origin,optional(clip.envelopeDuration,length(clip.timelineRange))),rate)-originSample});
}
