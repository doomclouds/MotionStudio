import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),root=path.dirname(fileURLToPath(import.meta.url));
export {drawTiltedType} from './bold-poster/design/tilted-type.mjs';
export const candidates=Object.freeze(['bold-poster','decision-tree','creative-voltage']);
export function verifyAssets(name,assetDir){
 if(!candidates.includes(name)||typeof assetDir!=='string'||!path.isAbsolute(assetDir))throw Error('known candidate and absolute external assetDir required');
 const records=JSON.parse(fs.readFileSync(path.join(root,name,'asset-lock.json')));
 for(const r of records){const p=path.join(assetDir,r.file);if(!fs.lstatSync(p).isFile()||createHash('sha256').update(fs.readFileSync(p)).digest('hex')!==r.sha256)throw Error('external asset SHA mismatch: '+r.file)}
 return records.length;
}
export async function renderFrame(name,{canvasApi,assetDir,alternate=false,nodeCopy}={}){
 if(!canvasApi||typeof canvasApi.createCanvas!=='function'||!canvasApi.GlobalFonts||typeof alternate!=='boolean'||(name!=='bold-poster'&&alternate))throw Error('canvasApi and supported variant required');
 if(nodeCopy!==undefined){
  if(name!=='decision-tree'||!Array.isArray(nodeCopy)||nodeCopy.length!==7)throw Error('nodeCopy requires exactly seven Decision Tree texts');
  nodeCopy=Array.from(nodeCopy);
  if(nodeCopy.some(s=>typeof s!=='string'||!s.length||s.length>80||/[\x00-\x1f\x7f-\x9f]/.test(s)||[...s].some(c=>c.codePointAt(0)>255)))throw Error('nonempty single-line Latin nodeCopy required');
 }
 verifyAssets(name,assetDir);
 const canvas=canvasApi.createCanvas(1920,1080);
 if(name==='bold-poster'){
  const native=await import('./bold-poster/design/scene.mjs');native.registerFonts(canvasApi.GlobalFonts,assetDir);native.render(canvas.getContext('2d'),{canvasApi,alternate});
 }else{
  const native=require('./'+name+'/render.cjs')(canvasApi,assetDir);
  const scene=JSON.parse(fs.readFileSync(path.join(root,name,'scene.json')));
  if(nodeCopy){
   const measure=canvas.getContext('2d');measure.font='18px DecisionStudy500';
   scene.nodes.forEach((node,i)=>{if(measure.measureText(nodeCopy[i]).width>node.maxTextWidth)throw Error('nodeCopy exceeds fixed node width');node.text=nodeCopy[i]});
   scene.title=nodeCopy[0];scene.labels[0].text=nodeCopy[1];scene.labels[1].text=nodeCopy[2];
   measure.font='14px DecisionStudy600';
   if(scene.labels.some(label=>measure.measureText(label.text).width>label.maxTextWidth))throw Error('nodeCopy exceeds branch label width');
  }
  await native.compose(canvas.getContext('2d'),scene);
 }
 return canvas;
}
export function drawFrame(frame,ctx,{x=0,y=0,scale=1}={}){
 if(!frame||frame.width!==1920||frame.height!==1080||!ctx||typeof ctx.drawImage!=='function'||![x,y,scale].every(Number.isFinite)||Math.abs(x)>8192||Math.abs(y)>8192||scale<0.125||scale>2)throw Error('bounded complete frame placement required');
 ctx.drawImage(frame,x,y,1920*scale,1080*scale);
}
