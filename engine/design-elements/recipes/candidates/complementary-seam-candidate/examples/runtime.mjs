import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
export const sourceRoot=fileURLToPath(new URL('../',import.meta.url)).replace(/\/$/,'');
export function checkedPath(raw,{fresh=false,file=false}={}){if(typeof raw!=='string'||!path.isAbsolute(raw)||raw!==path.normalize(raw)||raw.split('/').some(x=>x==='.'||x==='..'))throw new Error('absolute normalized path');let p=raw;while(true){const s=fs.lstatSync(p,{throwIfNoEntry:false});if(s?.isSymbolicLink())throw new Error('symbolic component');const next=path.dirname(p);if(next===p)break;p=next;}const s=fs.lstatSync(raw,{throwIfNoEntry:false});if(fresh){if(s||!fs.statSync(path.dirname(raw)).isDirectory()||raw===sourceRoot||raw.startsWith(sourceRoot+'/'))throw new Error('absent external output');}else if(!s||(file?!s.isFile():!s.isDirectory()))throw new Error('regular input');return raw;}
export function loadNative({fonts=true}={}){if(process.env.DISABLE_SYSTEM_FONTS_LOAD!=='1')throw new Error('disable system fonts');const runtime=checkedPath(process.env.SEAM_RUNTIME);let font;
 if(fonts){const f=checkedPath(process.env.SEAM_FONT,{file:true});font=fs.readFileSync(f);if(font.length!==194336||createHash('sha256').update(font).digest('hex')!=='b24f1812584816958afcf22e22d08e44318c5e51651e25d2438efdde389b33b1')throw new Error('exact public Instrument Sans master');}
 const require=createRequire(import.meta.url),n=require(runtime),p=require(path.join(runtime,'package.json'));if(p.version!=='0.1.100')throw new Error('Native version');if(font&&!n.GlobalFonts.register(font,'SeamBody'))throw new Error('font register false');return n;}

export async function loadSampler(){
 const lockPath=new URL('./input-lock.json',import.meta.url),bytes=fs.readFileSync(checkedPath(fileURLToPath(lockPath),{file:true}));
 if(createHash('sha256').update(bytes).digest('hex')!=='d3664a8c9ca957b12228f63367381df4c7e7feee6ee1203518dc7e1105bea729')throw Error('fixed complete input lock');
 const dir=checkedPath(process.env.SEAM_INPUTS),entries=JSON.parse(bytes);
 for(const item of entries.filter(x=>x.path.startsWith('sampled-window/'))){const f=checkedPath(path.join(dir,item.path),{file:true}),b=fs.readFileSync(f);if(b.length!==item.bytes||createHash('sha256').update(b).digest('hex')!==item.sha256)throw Error('exact existing sampled-window dependency');}
 return import(pathToFileURL(path.join(dir,'sampled-window/sampled-window.mjs')).href);
}
