// Public reconstruction route: renders the entire film from source. Production
// delivery instead preserves the accepted middle bitstream, so this entry is not
// falsely attributed as the source of those immutable accepted 480 frames.
import{createFullScene,dependencies as fullDeps}from'./full-scene-factory-v3.mjs';
import{createScene as createSample,dependencies as sampleDeps}from'./scene-v02.mjs';
export const config={width:1920,height:1080,fps:60,duration:33};
export const dependencies=[...new Set([...fullDeps,'./scene-v02.mjs',...sampleDeps])];
export async function createScene(api){const full=await createFullScene(api,0),sample=await createSample(api);return{async renderFrame(f){if(f>=600&&f<1080)await sample.renderFrame(f-600);else await full.renderFrame(f);},async close(){await full.close();await sample.close();}};}
