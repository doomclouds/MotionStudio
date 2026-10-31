// SPDX-License-Identifier: MIT. Explicit external exact font/runtime adapter.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';
export const root=path.dirname(fileURLToPath(import.meta.url));
export const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const FONT_LOCK_SHA='35e6fc1d9370d699bc8ae63353397a07e13a596803bc44f78cec07b3ff478fef';
export function regular(p) {const s=fs.lstatSync(p);if(!s.isFile()||s.isSymbolicLink())throw Error('regular resource required');return fs.readFileSync(p);}
export function externalDirectory(p,{fresh=false}={}) {
  if(typeof p!=='string'||!path.isAbsolute(p))throw Error('absolute external directory required');const dir=path.resolve(p);
  if(dir===root||dir.startsWith(root+path.sep))throw Error('directory must be outside source package');
  let current=path.parse(dir).root;const parts=dir.slice(current.length).split(path.sep).filter(Boolean);
  for(let i=0;i<parts.length;i++){current=path.join(current,parts[i]);const s=fs.lstatSync(current,{throwIfNoEntry:false});if(!s){if(!fresh||i!==parts.length-1)throw Error('existing parent required');}else if(s.isSymbolicLink()||!s.isDirectory()||(fresh&&i===parts.length-1))throw Error('real directory or exclusive output required');}
  if(fresh&&dir===path.parse(dir).root)throw Error('exclusive output required');return dir;
}
export function loadEnvironment({fontDir=process.env.SC_FONT_DIR,runtimeDir=process.env.SC_RUNTIME_DIR}={}) {
  const fd=externalDirectory(fontDir),rd=externalDirectory(runtimeDir),lock=regular(path.join(root,'font-lock.json'));
  if(sha(lock)!==FONT_LOCK_SHA)throw Error('code-pinned font lock identity');const rows=JSON.parse(lock).fonts;
  if(rows.length!==1||rows[0].file!=='IBMPlexMono-Medium.ttf'||rows[0].alias!=='SpatialGridMono'||rows[0].weight!==500)throw Error('exact font scope');
  const r=rows[0],bytes=regular(path.join(fd,r.file));if(bytes.length!==r.bytes||sha(bytes)!==r.sha256)throw Error('font identity');
  if(sha(regular(path.join(root,r.license)))!==r.licenseSHA256)throw Error('font license identity');
  regular(path.join(rd,'package.json'));const require=createRequire(path.join(rd,'package.json'));
  const pkg=require.resolve('@napi-rs/canvas/package.json');if(!path.resolve(pkg).startsWith(rd+path.sep)||JSON.parse(regular(pkg)).version!=='0.1.100')throw Error('external pinned Canvas required');
  const api=require('@napi-rs/canvas');if(!api.GlobalFonts.registerFromPath(path.join(fd,r.file),r.alias))throw Error('font registration failed');return api;
}
export function writeOutputs(output,files) {
  const dir=externalDirectory(output,{fresh:true});const entries=Object.entries(files);
  for(const[n,b]of entries)if(!/^[a-z0-9-]+\.(png|json)$/.test(n)||!Buffer.isBuffer(b))throw Error('bounded output leaf');
  fs.mkdirSync(dir);for(const[n,b]of entries)fs.writeFileSync(path.join(dir,n),b,{flag:'wx'});
}
