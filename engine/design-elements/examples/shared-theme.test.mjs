// SPDX-License-Identifier: MIT
// Reuses the existing examples' external Native/font setup, not a new runtime.
import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import {createRequire}from'node:module';import {createHash}from'node:crypto';import {fileURLToPath}from'node:url';
import {palettes,states,renderSharedTheme}from'./shared-theme.mjs';
const engine=process.env.MOTION_ENGINE_ROOT,fonts=process.env.UI_TEST_FONT_DIR;
if(!engine||!fonts||process.env.DISABLE_SYSTEM_FONTS_LOAD!=='1')throw Error('MOTION_ENGINE_ROOT, UI_TEST_FONT_DIR and DISABLE_SYSTEM_FONTS_LOAD=1 required; no silent render skip');
const req=createRequire(path.resolve(engine,'package.json')),api=req('@napi-rs/canvas');
if(req('@napi-rs/canvas/package.json').version!=='0.1.100')throw Error('tested Native version is 0.1.100');
const files=['DejaVuSans.ttf','DejaVuSans-Bold.ttf'];const fontEvidence=files.map(file=>{const bytes=fs.readFileSync(path.join(fonts,file));if(!api.GlobalFonts.register(bytes,'SharedThemeExample'))throw Error('font registration');return {file,sha256:createHash('sha256').update(bytes).digest('hex')};});
const images=new Map();for(const theme of Object.keys(palettes))for(const state of states)images.set(`${theme}-${state}`,renderSharedTheme(api,theme,state,'SharedThemeExample'));
const semantic=plan=>({state:plan.state,contentId:plan.contentId,status:plan.status,calls:plan.calls.map(({region,id,props,result})=>({region,id,bounds:props.bounds,data:props.data,result})),labels:plan.labels.filter(x=>!x.text.startsWith('Palette:')).map(({color,...rest})=>rest)});
const rgba=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).concat(255);
for(const state of states)test(`same ${state} state, different palette across every region`,()=>{
 const a=images.get(`linen-${state}`),b=images.get(`night-${state}`);assert.deepEqual(semantic(a.plan),semantic(b.plan));
 for(const theme of Object.keys(palettes)){
  const {canvas,plan}=images.get(`${theme}-${state}`),p=palettes[theme];
  assert.equal(plan.calls.length,6);
  for(const q of plan.calls){for(const role of ['ink','muted','accent','edge','track'])assert.equal(q.props.theme[role],p[role]);}
  // Sample actual painted surfaces, not just nominal tokens.
  for(const[x,y,role]of[[20,20,'background'],[55,800,'inset'],[1380,800,'surface'],[1330,766,'inset'],[1340,550,'inset'],[840,550,'inset'],[70,746,'accent']])assert.deepEqual([...canvas.getContext('2d').getImageData(x,y,1,1).data],rgba(p[role]));
  assert.equal(plan.calls.find(q=>q.region==='parameter').props.data.disabled,state==='paused');
  assert(plan.labels.filter(x=>x.text===plan.status).length===2);
 }
 assert.notDeepEqual(a.canvas.toBuffer('image/png'),b.canvas.toBuffer('image/png'));
});
test('state stays independent of palette, with reproducible renders and rejected unknowns',()=>{
 for(const theme of Object.keys(palettes)){const paused=images.get(`${theme}-paused`),active=images.get(`${theme}-active`);assert.equal(paused.plan.contentId,active.plan.contentId);assert.deepEqual(paused.plan.calls.map(q=>q.props.bounds),active.plan.calls.map(q=>q.props.bounds));assert.deepEqual(active.canvas.toBuffer('image/png'),renderSharedTheme(api,theme,'active','SharedThemeExample').canvas.toBuffer('image/png'));assert.notDeepEqual(paused.canvas.toBuffer('image/png'),active.canvas.toBuffer('image/png'));}
 assert.throws(()=>renderSharedTheme(api,'missing','paused','SharedThemeExample'));assert.throws(()=>renderSharedTheme(api,'linen','missing','SharedThemeExample'));
});
// Optional external evidence, never output into this source checkout or overwrite.
if(process.env.UI_THEME_OUTPUT){
 const out=process.env.UI_THEME_OUTPUT,repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
 if(!path.isAbsolute(out)||path.normalize(out)!==out||out===repo||out.startsWith(repo+path.sep)||fs.existsSync(out))throw Error('new absolute output outside checkout required');
 for(let p=out;;p=path.dirname(p)){if(fs.lstatSync(p,{throwIfNoEntry:false})?.isSymbolicLink())throw Error('no symlink output');if(p===path.dirname(p))break;}
 fs.mkdirSync(out);for(const[name,{canvas,plan}]of images){fs.writeFileSync(path.join(out,name+'.png'),canvas.toBuffer('image/png'),{flag:'wx'});fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(plan,null,2),{flag:'wx'});}
 fs.writeFileSync(path.join(out,'runtime.json'),JSON.stringify({node:process.version,canvas:'0.1.100',fonts:fontEvidence},null,2),{flag:'wx'});
}
