/** Read a reviewed original font into an owned Buffer; no install, writes or network. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const root=new URL('./',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',root),'utf8'));
function exact(name,bytes,sha){
 if(typeof name!=='string'||!name||/[\\/]/.test(name)||name==='.'||name==='..')throw Error('Local declared basename required');
 const url=new URL(name,root);if(fs.lstatSync(url).isSymbolicLink())throw Error('Symlink font input rejected');
 const data=fs.readFileSync(url);check(data,bytes,sha,name);return data;
}
function check(data,bytes,sha,name){
 if(!Number.isSafeInteger(bytes)||bytes<1||bytes>32*1024*1024||data.length!==bytes)throw Error('Font byte size mismatch: '+name);
 if(createHash('sha256').update(data).digest('hex')!==sha)throw Error('Font SHA mismatch: '+name);
}
export function readReviewedFont(id=manifest.defaultFontId){
 const f=manifest.fonts.find(f=>f.id===id);if(!f)throw Error('Unknown reviewed font id: '+id);
 const lic=fs.readFileSync(new URL(f.licenseFile,root));
 if(createHash('sha256').update(lic).digest('hex')!==f.licenseSha256)throw Error('Font license SHA mismatch');
 let bytes;
 if(f.storage){
  if(f.storage.encoding!=='gzip')throw Error('Unsupported reviewed storage encoding');
  bytes=gunzipSync(exact(f.storage.file,f.storage.bytes,f.storage.sha256),{maxOutputLength:f.bytes});
  check(bytes,f.bytes,f.sha256,f.file);
 }else bytes=exact(f.file,f.bytes,f.sha256);
 return {bytes,record:structuredClone(f)};
}
