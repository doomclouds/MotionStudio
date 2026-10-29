// Instrumentation of actual API invocations; counters never feed pixels or time.
import * as L from '../../../../engine/motion-elements/lib/structured-layouts.mjs';
import {sampleKeyframeTrack as keyframe} from '../../../../engine/motion-elements/lib/keyframe-track.mjs';
import {compileLayoutHandoff as compile,sampleLayoutHandoff as sample} from '../../../../engine/motion-elements/lib/recipes/layout-handoff.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
let frame=-1;const counts=new Map();
function record(name,kind,parameters){let v=counts.get(name);if(!v){v={name,kind,count:0,outputFrames:new Set(),definitions:new Map()};counts.set(name,v);}v.count++;if(parameters){const key=JSON.stringify(parameters);if(!v.definitions.has(key))v.definitions.set(key,parameters);}if(frame>=0)v.outputFrames.add(frame);}
export function beginFrame(value){frame=value;}
export function consumeLayout(name){record(name,'layout-consumption-in-draw');}
export function gridLayout(p){record('gridLayout','api-invocation',p);return L.gridLayout(p);}
export function constraintStackLayout(p){record('constraintStackLayout','api-invocation',p);return L.constraintStackLayout(p);}
export function sampleKeyframeTrack(...p){record('sampleKeyframeTrack','api-invocation',p[0]);return keyframe(...p);}
export function compileLayoutHandoff(...p){record('compileLayoutHandoff','api-invocation',p[0]);return compile(...p);}
export function sampleLayoutHandoff(...p){record('sampleLayoutHandoff','api-invocation');return sample(...p);}
export async function writeUsage(){const root=process.env.TESSEL_USAGE_DIR;if(!root)return;await mkdir(root,{recursive:true});const rows=[...counts.values()].map(v=>({...v,definitions:[...v.definitions.values()],outputFrames:[...v.outputFrames].sort((a,b)=>a-b)}));const all=rows.flatMap(r=>r.outputFrames);const first=Math.min(...all),last=Math.max(...all);await writeFile(join(root,`usage-${first}-${last}-${process.pid}.json`),JSON.stringify({schemaVersion:1,sourceStartFrame:0,fps:60,rows},null,2)+'\n');}
