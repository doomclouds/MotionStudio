// Bounded UTF-8 JSON input; --jsonl streams one validated response per line.
import {once} from 'node:events';
import {createSpotInkRenderPlan} from './render-plan.mjs';
import {spotInkShaderSources} from './shader-sources.mjs';
const LIMIT=65536,decoder=new TextDecoder('utf-8',{fatal:true});
const emit=async buffer=>{
 const plan=createSpotInkRenderPlan(JSON.parse(decoder.decode(buffer)));
 if(!process.stdout.write(JSON.stringify({plan,shaderSources:spotInkShaderSources})+'\n'))await once(process.stdout,'drain');
};
const jsonl=process.argv.length===3&&process.argv[2]==='--jsonl';
if(!jsonl&&process.argv.length!==2)throw Error('only --jsonl is supported');
let parts=[],size=0;
const append=part=>{if(size+part.length>LIMIT)throw Error('plan input exceeds 65536 UTF-8 bytes');if(part.length){parts.push(part);size+=part.length;}};
const flush=async()=>{const data=Buffer.concat(parts,size);parts=[];size=0;await emit(data);};
for await(const chunk of process.stdin){
 if(!jsonl){append(chunk);continue;}
 let start=0,at;
 while((at=chunk.indexOf(10,start))!==-1){append(chunk.subarray(start,at));await flush();start=at+1;}
 append(chunk.subarray(start));
}
if(!jsonl||size)await flush();
