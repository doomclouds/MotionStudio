// SPDX-License-Identifier: MIT
import{loadRuntime,freshOutput,writeOutputs}from'./runtime.mjs';import{compose}from'./examples.mjs';
const a=process.argv.slice(2);if(a.length!==2||a[0]!=='--output')throw Error('usage: node render.mjs --output ABS_NEW_EXTERNAL_DIR');freshOutput(a[1]);const env=loadRuntime(),files={};
for(const id of['guide','signal']){const r=compose(env,id);files[id+'.png']=r.canvas.toBuffer('image/png');files[id+'-layout.json']=Buffer.from(JSON.stringify(r.layout,null,2)+'\n');files[id+'-layer.png']=r.menu.canvas.toBuffer('image/png');}
writeOutputs(a[1],files);
