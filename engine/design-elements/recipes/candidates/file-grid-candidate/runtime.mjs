// SPDX-License-Identifier: MIT
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
export const root=path.dirname(fileURLToPath(import.meta.url));
export const sha=b=>createHash('sha256').update(b).digest('hex');
function outside(p){if(typeof p!=='string'||!path.isAbsolute(p))throw TypeError('absolute external directory');const q=path.resolve(p);if(q===root||q.startsWith(root+path.sep))throw Error('resources/output must remain outside source package');return q;}
export function setup(fontDir=process.env.PORTAGE_FONT_DIR){
 const dir=outside(fontDir),st=fs.lstatSync(dir);
 if(st.isSymbolicLink()||!st.isDirectory())throw Error('regular font directory');
 outside(fs.realpathSync(dir));
 const lockBytes=fs.readFileSync(path.join(root,'font-lock.json'));
 const rows=JSON.parse(lockBytes).derived;
 // Every input is verified before the first process-global registration.
 for(const r of [...rows,{file:'font-lock.json',sha256:sha(lockBytes)}]){
  const p=path.join(dir,r.file),s=fs.lstatSync(p);
  if(s.isSymbolicLink()||!s.isFile()||sha(fs.readFileSync(p))!==r.sha256)throw Error('font identity');
 }
 const require=createRequire(import.meta.url),mod=process.env.CANVAS_MODULE||'@napi-rs/canvas';
 if(require(mod+'/package.json').version!=='0.1.100')throw Error('pinned Canvas required');
 const api=require(mod);
 for(const r of rows)if(!api.GlobalFonts.registerFromPath(path.join(dir,r.file),r.alias))throw Error('font registration failed');
 return api;
}
export function writeExact(dir,files){
 dir=outside(dir);
 const s=fs.lstatSync(dir,{throwIfNoEntry:false});
 if(s&&(s.isSymbolicLink()||!s.isDirectory()))throw Error('output directory');
 for(const[n,b]of Object.entries(files)){
  if(!/^[a-z0-9-]+\.(png|json)$/.test(n)||!Buffer.isBuffer(b))throw Error('output name/bytes');
  const p=path.join(dir,n),q=fs.lstatSync(p,{throwIfNoEntry:false});
  if(q&&(q.isSymbolicLink()||!q.isFile()||!fs.readFileSync(p).equals(b)))throw Error('changed output');
 }
 fs.mkdirSync(dir,{recursive:true});
 for(const[n,b]of Object.entries(files)){const p=path.join(dir,n);if(!fs.existsSync(p))fs.writeFileSync(p,b,{flag:'wx'});}
}
