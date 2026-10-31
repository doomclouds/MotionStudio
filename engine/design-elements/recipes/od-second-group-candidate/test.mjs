import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
import {renderFrame,drawFrame,verifyAssets,candidates} from './runtime.mjs';
const require=createRequire(import.meta.url),api=require(process.env.CANVAS_MODULE||'@napi-rs/canvas'),assetRoot=process.env.OD_SECOND_ASSETS;
if(!assetRoot)throw Error('OD_SECOND_ASSETS must name external directory with three exact resource subdirectories');
let checks=0;const frames={};
for(const name of candidates){
 const assetDir=path.join(assetRoot,name);
 await assert.rejects(()=>renderFrame(name,{canvasApi:{...api,GlobalFonts:{registerFromPath(){return false}}},assetDir}),/font registration/);checks++;
 const frame=await renderFrame(name,{canvasApi:api,assetDir});const second=await renderFrame(name,{canvasApi:api,assetDir});assert.deepEqual(frame.toBuffer('image/png'),second.toBuffer('image/png'));checks++;
 const host=api.createCanvas(640,480),ctx=host.getContext('2d');ctx.fillStyle='#ff00ff';ctx.beginPath();ctx.rect(1,1,3,3);ctx.wordSpacing='-25px';
 drawFrame(frame,ctx,{x:10,y:10,scale:.25});ctx.fill();assert.deepEqual([...ctx.getImageData(2,2,1,1).data],[255,0,255,255]);assert.equal(ctx.wordSpacing,'-25px');checks+=2;
 for(const bad of [{x:1e20},{scale:0},{scale:Number.MIN_VALUE},{scale:2.01},{y:Infinity}]){const before=host.toBuffer('image/png');assert.throws(()=>drawFrame(frame,ctx,bad));assert.deepEqual(host.toBuffer('image/png'),before);checks+=2}
 await assert.rejects(()=>renderFrame(name,{canvasApi:api,assetDir:path.join(assetRoot,'missing')}));checks++;
 frames[name]={sha256:createHash('sha256').update(frame.toBuffer('image/png')).digest('hex'),resources:verifyAssets(name,assetDir)};
}
const copy=['Ready to publish?','Yes','Wait','Run test suite','Review scope','Check resource rights','Ask for feedback'];
const copyBefore=JSON.stringify(copy),copyFrame=await renderFrame('decision-tree',{canvasApi:api,assetDir:path.join(assetRoot,'decision-tree'),nodeCopy:copy});
assert.notEqual(createHash('sha256').update(copyFrame.toBuffer('image/png')).digest('hex'),frames['decision-tree'].sha256);assert.equal(JSON.stringify(copy),copyBefore);checks+=2;
for(const nodeCopy of [new Array(7),['x'],[null,...copy.slice(1)],['x'.repeat(80),...copy.slice(1)],['line\nbreak',...copy.slice(1)],['中文',...copy.slice(1)]]){await assert.rejects(()=>renderFrame('decision-tree',{canvasApi:api,assetDir:path.join(assetRoot,'decision-tree'),nodeCopy}));checks++}
await assert.rejects(()=>renderFrame('creative-voltage',{canvasApi:api,assetDir:path.join(assetRoot,'creative-voltage'),nodeCopy:copy}));checks++;
assert.throws(()=>verifyAssets('../unknown',assetRoot));checks++;
const tampered=fs.mkdtempSync(path.join(os.tmpdir(),'od-second-tamper-'));
try{
 for(const file of fs.readdirSync(path.join(assetRoot,'bold-poster')))fs.copyFileSync(path.join(assetRoot,'bold-poster',file),path.join(tampered,file));
 const special=path.join(tampered,'font path #');fs.mkdirSync(special);for(const file of fs.readdirSync(path.join(assetRoot,'bold-poster')))fs.copyFileSync(path.join(assetRoot,'bold-poster',file),path.join(special,file));
 const specialFrame=await renderFrame('bold-poster',{canvasApi:api,assetDir:special});assert.equal(createHash('sha256').update(specialFrame.toBuffer('image/png')).digest('hex'),frames['bold-poster'].sha256);checks++;
 fs.appendFileSync(path.join(tampered,'Display.ttf'),'tamper');let allocations=0;
 await assert.rejects(()=>renderFrame('bold-poster',{assetDir:tampered,canvasApi:{...api,createCanvas(){allocations++;throw Error('must not allocate')}}}),/SHA mismatch/);
 assert.equal(allocations,0);checks+=2;
}finally{fs.rmSync(tampered,{recursive:true,force:true})}

console.log(JSON.stringify({checks,frames,userAestheticAcceptance:'RECEIVED_FOR_THREE_STUDIES_NOT_PUBLIC_API_APPROVAL',publication:'AUTHORIZED_FOR_UNIFIED_INTEGRATION_NOT_PUBLISHED'}));
