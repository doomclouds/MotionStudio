import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readReviewedFont} from './read-font.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
test('default restores the exact original WenKai bytes from its lossless wrapper',()=>{
 const {bytes,record}=readReviewedFont();
 assert.equal(record.id,'lxgw-wenkai-gb-lite');assert.equal(record.family,'LXGW WenKai GB Lite');
 assert.equal(bytes.length,14191220);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'8a07213b51a7c5a61d7ce192728f21483cdbbcb9c74cedf461c57ab35a762d45');
 assert.equal(createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`),bytes])).digest('hex'),'f0fc5e3b8c73074f9a6c89bebd8cc71f7352f7b2');
 assert.equal(record.strokeOrderIncluded,false);
 bytes[0]=255;record.family='changed';const again=readReviewedFont();
 assert.equal(again.bytes[0],0);assert.equal(again.record.family,'LXGW WenKai GB Lite');
});
test('unlisted font ids fail instead of selecting a system fallback',()=>{
 assert.throws(()=>readReviewedFont('not-present'),/Unknown reviewed font/);
});
test('missing, corrupt stored bytes, wrong restored identity and changed license fail closed',async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'reviewed-font-negative-'));
 try{
  const root=new URL('./',import.meta.url),original=readReviewedFont().record;
  const stored=fs.readFileSync(new URL(original.storage.file,root)),license=fs.readFileSync(new URL(original.licenseFile,root));
  fs.copyFileSync(new URL('read-font.mjs',root),path.join(temp,'read-font.mjs'));
  for(const kind of ['missing','stored','restored','license']){
   const f=structuredClone(original),file=path.join(temp,f.storage.file);
   if(kind==='missing'){if(fs.existsSync(file))fs.unlinkSync(file);}
   else fs.writeFileSync(file,kind==='stored'?Buffer.concat([stored,Buffer.from('bad')]):stored);
   fs.writeFileSync(path.join(temp,f.licenseFile),kind==='license'?Buffer.concat([license,Buffer.from('bad')]):license);
   if(kind==='restored')f.sha256='0'.repeat(64);
   fs.writeFileSync(path.join(temp,'manifest.json'),JSON.stringify({defaultFontId:f.id,fonts:[f]}));
   const {readReviewedFont:read}=await import(pathToFileURL(path.join(temp,'read-font.mjs')).href+'?'+kind);
   assert.throws(()=>read(),kind==='missing'?/ENOENT/:kind==='stored'?/byte size mismatch/:kind==='license'?/license SHA mismatch/:/Font SHA mismatch/);
  }
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
