/** Executable local registration examples. No canvas, film, or browser claim.
 * Run: node engine/motion-elements/examples/registered-foundations.mjs
 * Plans are compiled and sampled through the same canonical module instance.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const catalog=JSON.parse(readFileSync(new URL('catalog.json',root)));
const manifest=JSON.parse(readFileSync(new URL('registration-manifest.json',import.meta.url)));
export async function runRegisteredExamples(){
 const results=[];
 for(const id of manifest.ids){
  const e=catalog.elements.find(x=>x.id===id);
  assert(e,`Missing registration ${id}`);
  const m=await import(new URL(e.entry,root));
  const plan=e.api==='compileGridTransport'?m[e.api](m.compileVelocityGrid(e.exampleSetup.velocityGrid),e.example):m[e.api](e.example,...(e.exampleArgs??[]));
  let output=plan;
  switch(id){
   case 'motion.finite-particles':output=m.sampleFiniteParticles(plan,.5);break;
   case 'raster.temporal-exposure':output=m.sampleTemporalExposure(plan,1,{width:1,height:1,readFrame:f=>new Uint8ClampedArray([f?255:0,0,f?0:255,255])});assert.deepEqual([...output.data],[64,0,191,255]);break;
   case 'motion.fixed-string-wave':output=m.sampleFixedStringWave(plan,{time:0,samples:3});assert.equal(output.points[1].y,1);break;
   case 'field.grid-transport':output=m.sampleGridTransport(plan,{time:3});assert(Math.abs(output.points[0].x-.5)<1e-10);break;
   case 'field.arrival-field':output=m.sampleArrivalField(plan,{points:[{id:'p',position:{x:3,y:4}}]});assert.deepEqual(output.points[0].arrival,{n:'5',d:'1'});break;
   case 'motion.hard-disc-isolated-events':output=m.sampleHardDiscs(plan,{time:3});assert(Math.abs(output.discs[1].x-440)<1e-10);break;
   case 'geometry.ray-chain':output=m.traceOpticalRay(plan,{origin:{x:100,y:500},direction:{x:1,y:0},maxInteractions:16});assert.deepEqual(output.segments.map(s=>s.ending),['transmit','transmit','viewport']);break;
   case 'geometry.radial-landmark-warp':output=plan.sample([{x:0,y:0}]);assert.deepEqual(output,[{x:1,y:2}]);break;
   case 'composition.minimum-cost-assignment':assert.deepEqual(output,{columns:[1,0],totalCost:3});break;
   case 'raster.euclidean-distance-transform':assert.deepEqual([...output.squaredDistances],[0,1,0]);break;
  }
  assert.notEqual(output,undefined);
  results.push({id,entry:e.entry,api:e.api,status:'PASS'});
 }
 assert.equal(results.length,17);return results;
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(await runRegisteredExamples(),null,2));
