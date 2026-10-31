'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');const io=require('./external-io.cjs');const root=path.resolve(__dirname,'..'),resources=require('../resources.json');
const CASES={'data-chart':{module:'paint.cjs',roles:null},'light-leak':{module:'film-frame.cjs',roles:{CinemaTitle:'title',CinemaSubtitle:'subtitle',CinemaMono:'mono'}},'bold-signal':{module:'signal-frame.cjs',roles:{SignalBlack:'black',SignalSans500:'sans500',SignalSans700:'sans700'}}};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function caseInfo(id){if(!Object.hasOwn(CASES,id))throw Error('Unknown static study case');return CASES[id]}
function canvasApi(){const target=process.env.MOTIONSTUDIO_CANVAS_MODULE||'@napi-rs/canvas';const entry=require.resolve(target);const pkg=require(path.join(path.dirname(entry),'package.json'));if(pkg.version!=='0.1.100')throw Error('Canvas 0.1.100 is required');return require(entry)}
function fontPaths(id){caseInfo(id);const base=io.inputDirectory(process.env.OD_STATIC_FONT_ROOT);const dir=io.inputDirectory(path.join(base,id));return resources[id].outputs.map(f=>path.join(dir,f.file))}
function loadFonts(id,api=canvasApi()){
 const cfg=caseInfo(id),paths=fontPaths(id),glyphs=cfg.roles?{}:new Set();const registered=[];
 // Validate the entire font set before global registration; unknown bytes fail closed.
 resources[id].outputs.forEach((f,i)=>{if(sha(io.readRegular(paths[i],40*1024*1024))!==f.sha256)throw Error('Font SHA mismatch: '+f.file)});
 resources[id].outputs.forEach((f,i)=>{if(!api.GlobalFonts.registerFromPath(paths[i],f.alias))throw Error('Font registration failed: '+f.alias);if(cfg.roles)glyphs[cfg.roles[f.alias]]=new Set(f.glyphs);else for(const cp of f.glyphs)glyphs.add(cp)});
 return{glyphs,canvasApi:api};
}
function render(id,props,env,api=canvasApi()){const cfg=caseInfo(id),c=api.createCanvas(1920,1080),geometry=require(path.join(root,id,cfg.module)).draw(c.getContext('2d'),props,env);return{png:c.toBuffer('image/png'),geometry}}
function fixtures(id){caseInfo(id);return require(path.join(root,id,'fixtures.cjs'))}
function dependencies(id){const cfg=caseInfo(id);return [path.join(root,id,cfg.module),path.join(root,id,'fixtures.cjs'),path.join(root,id,'font-lock.json'),path.join(root,'resources.json'),__filename,path.join(__dirname,'external-io.cjs'),...fontPaths(id)]}
function createScene(id,variant,{ctx,canvasApi:api}){const cfg=caseInfo(id);if(!['reference','transfer'].includes(variant))throw Error('Unknown static variant');const env=loadFonts(id,api),props=fixtures(id)[variant],draw=require(path.join(root,id,cfg.module)).draw;return{render(){draw(ctx,props,env)}}}
module.exports={CASES,caseInfo,canvasApi,loadFonts,render,fixtures,dependencies,createScene,sha};
