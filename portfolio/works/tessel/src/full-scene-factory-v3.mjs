// Full Tessel reconstruction. Approved source frames600..1079 are assembled
// from the immutable accepted MP4; this factory renders only the missing acts.
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createOpening} from './full-opening-v2.mjs';
import {createFeatures} from './full-features.mjs';
import {createEnding} from './full-ending-v2.mjs';
import {drawFullApp} from './full-ui.mjs';
import {beginFrame,writeUsage} from './full-api-trace.mjs';
const here=dirname(fileURLToPath(import.meta.url));
export const ref=process.env.TESSEL_REFERENCE_ROOT;
export const fontDir=process.env.TESSEL_FONT_ROOT;
if(!ref||!fontDir)throw Error('TESSEL_REFERENCE_ROOT and TESSEL_FONT_ROOT must point to prepared external resources');
const weights=[400,450,460,480,500,540,560,580,600,620,650];
const fonts=weights.map(w=>resolve(fontDir,`TesselGeist-${w}.ttf`));
const glow=resolve(ref,'source/public/fx/glow-ink.png'),table=resolve(ref,'source/public/fx/table.png');
const elements=resolve(here,'../../../../engine/motion-elements');
export const dependencies=['./full-scene-factory-v3.mjs','./full-opening-v2.mjs','./full-opening-model.mjs','./full-features.mjs','./full-features-state.mjs','./full-ending-v2.mjs','./full-ending-state.mjs','./full-common.mjs','./full-projector.mjs','./full-ui.mjs','./full-base-ui.mjs','./full-api-trace.mjs','./math.mjs','./reference-data.mjs',...['lib/structured-layouts.mjs','lib/keyframe-track.mjs','lib/recipes/layout-handoff.mjs','lib/motions.mjs','lib/math.mjs','lib/matrix.mjs','lib/validate.mjs','lib/layouts.mjs','lib/time.mjs'].map(p=>resolve(elements,p)),resolve(elements,'../motion-timeline-core/lib/timeline.mjs'),glow,table,...fonts];
export async function createFullScene(api,offset){const{ctx,createCanvas,GlobalFonts,canvasApi}=api;
 for(let i=0;i<weights.length;i++)if(!GlobalFonts.registerFromPath(fonts[i],`TesselStudyGeist${weights[i]}`))throw Error('Exact derived Geist registration failed');
 const[glowImage,tableImage]=await Promise.all([canvasApi.loadImage(glow),canvasApi.loadImage(table)]);
 const opening=await createOpening({createCanvas,canvasApi,glowImage}),features=await createFeatures({createCanvas,canvasApi,tableImage}),ending=await createEnding({createCanvas,canvasApi,tableImage,drawFullApp});
 const sub=createCanvas(1920,1080),dc=sub.getContext('2d'),acc=new Uint16Array(1920*1080*4),out=ctx.createImageData(1920,1080),schedule=[];
 function act(f){if(f<360)return{draw:opening,local:f,lo:0,hi:359.999};if(f<600)return{draw:opening,local:f,lo:360,hi:599.999};if(f<1080)throw Error('Accepted600..1079 must be stream-preserved, not rerendered');if(f<1440)return{draw:features,local:f-1080,lo:1080,hi:1439.999};return{draw:ending,local:f-1440,lo:1440,hi:1979.999};}
 async function renderAt(f,c){c.reset();c.clearRect(0,0,1920,1080);const a=act(f);await a.draw.renderAt(a.local,c);}
 function anchors(f){const a=act(f);return a.draw.anchors(a.local);}
 return{async renderFrame(frame){const sourceFrame=frame+offset;beginFrame(sourceFrame);const a=act(sourceFrame),aa=anchors(Math.max(a.lo,sourceFrame-1/3)),bb=anchors(Math.min(a.hi,sourceFrame+1/3)),bm=new Map(bb.map((p,i)=>[p.id??i,p]));let max=0;
  for(let i=0;i<aa.length;i++){const p=aa[i],q=bm.get(p.id??i);if(!q)continue;const off=(p.x< -100&&q.x< -100)||(p.x>2020&&q.x>2020)||(p.y< -100&&q.y< -100)||(p.y>1180&&q.y>1180);if(off&&!/iris|flood|shutter/.test(p.id??''))continue;max=Math.max(max,Math.hypot(p.x-q.x,p.y-q.y));}
  const n=max<.5?1:Math.min(48,Math.max(2,Math.ceil(max)+1)),times=[];if(n===1){times.push(sourceFrame);await renderAt(sourceFrame,ctx);}else{acc.fill(0);for(let k=0;k<n;k++){const t=Math.max(a.lo,Math.min(a.hi,sourceFrame+((k+.5)/n-.5)*2/3));times.push(t);await renderAt(t,dc);const p=dc.getImageData(0,0,1920,1080).data;for(let i=0;i<p.length;i++)acc[i]+=p[i];}for(let i=0;i<acc.length;i++)out.data[i]=Math.round(acc[i]/n);ctx.reset();ctx.putImageData(out,0,0);}
  schedule.push({outputFrame:frame,sourceFrame,samples:n,times});
 },async close(){await writeUsage();if(process.env.TESSEL_USAGE_DIR){const{writeFile}=await import('node:fs/promises');const{join}=await import('node:path');await writeFile(join(process.env.TESSEL_USAGE_DIR,`sampling-${schedule[0]?.sourceFrame}-${schedule.at(-1)?.sourceFrame}-${process.pid}.json`),JSON.stringify({schemaVersion:1,sourceOffset:offset,frames:schedule})+'\n');}}};
}
