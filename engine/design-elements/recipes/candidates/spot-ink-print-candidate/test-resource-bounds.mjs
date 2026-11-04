import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {once} from 'node:events';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createExternalOutput} from './output-directory.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
async function rejectsBeforeEOF(bytes){
 const child=spawn(process.execPath,[path.join(root,'export-render-plan.mjs'),'--jsonl'],{stdio:['pipe','pipe','pipe']});let stderr='';child.stderr.on('data',x=>stderr+=x);child.stdout.resume();child.stdin.on('error',()=>{});child.stdin.write(bytes);
 const timer=setTimeout(()=>child.kill(),3000);try{const [code,signal]=await once(child,'exit');assert.equal(signal,null);assert.notEqual(code,0);assert.match(stderr,/65536 UTF-8 bytes/);}finally{clearTimeout(timer);child.stdin.destroy();}
}
test('JSONL rejects overlimit unterminated ASCII before EOF',()=>rejectsBeforeEOF(Buffer.alloc(131072,32)));
test('JSONL counts UTF8 bytes, not JS characters',()=>rejectsBeforeEOF(Buffer.from('é'.repeat(40000))));
test('output requires new absolute external path, including symlink resolution',async()=>{const temp=await fs.mkdtemp(path.join(os.tmpdir(),'spot-output-test-'));try{
 await assert.rejects(()=>createExternalOutput([]));await assert.rejects(()=>createExternalOutput(['--out','relative']));await assert.rejects(()=>createExternalOutput(['--out',root]));await assert.rejects(()=>createExternalOutput(['--out',path.join(root,'must-not-create')]));
 await fs.symlink(root,path.join(temp,'alias'),'dir');await assert.rejects(()=>createExternalOutput(['--out',path.join(temp,'alias','must-not-create')]));
 const out=path.join(temp,'new');assert.equal(await createExternalOutput(['--out',out]),out);await assert.rejects(()=>createExternalOutput(['--out',out]));
 }finally{await fs.rm(temp,{recursive:true,force:true});}});
test('localhost server serves only exact fixture whitelist',async()=>{const {createFixtureServer}=await import('./browser-file-server.mjs');const server=await createFixtureServer();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});try{const url=`http://127.0.0.1:${server.address().port}`;assert.equal((await fetch(url+'/browser-tests.html')).status,200);assert.equal((await fetch(url+'/render-plan.mjs')).status,200);for(const route of ['/README.md','/evidence/unit.tap','/licenses/LemoLab-MIT.txt','/reference/upstream-riso.js','/../README.md','/%52EADME.md'])assert.equal((await fetch(url+route)).status,404);assert.equal((await fetch(url+'/render-plan.mjs',{method:'POST'})).status,404);}finally{await new Promise(resolve=>server.close(resolve));}});
