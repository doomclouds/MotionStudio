import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,access,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const cli=fileURLToPath(new URL('../scripts/render-gallery.mjs',import.meta.url));
async function runFake(body,check){
 const dir=await mkdtemp(join(tmpdir(),'gallery-failure-')),out=join(dir,'out');
 try{
  if(body!==null)await writeFile(join(dir,'ffmpeg'),`#!${process.execPath}\nimport {writeFileSync} from 'node:fs';\nconst args=process.argv.slice(2);\nwriteFileSync(${JSON.stringify(join(dir,'args.json'))},JSON.stringify(args));\nwriteFileSync(args.at(-1),'partial');\n${body}\n`,{mode:0o755});
  const r=spawnSync(process.execPath,[cli,'--out',out],{env:{...process.env,PATH:dir},encoding:'utf8',timeout:15000});
  assert.equal(r.error,undefined);assert.equal(r.status,1);check(r.stderr);
  for(const name of ['gallery.partial.mp4','motion-elements-gallery.mp4','render.json'])await assert.rejects(access(join(out,name)));
  if(body!==null){const args=JSON.parse(await readFile(join(dir,'args.json'),'utf8'));for(const [key,value] of [['-threads:v','1'],['-c:v','libx264'],['-preset','medium'],['-crf','19']])assert.equal(args[args.indexOf(key)+1],value);}
 }finally{await rm(dir,{recursive:true,force:true});}
}
test('gallery retains encoder stderr and nonzero exit with failed write',()=>runFake("process.stderr.write('synthetic encoder rejection',()=>process.exit(23));",s=>{assert.match(s,/FFmpeg exit=23/);assert.match(s,/synthetic encoder rejection/);}));
test('gallery reports signaled encoder without inventing OOM',()=>runFake("process.kill(process.pid,'SIGKILL');",s=>{assert.match(s,/signal=SIGKILL/);assert.doesNotMatch(s,/out.of.memory|OOM/);}));
test('gallery missing encoder preserves ENOENT and terminates',()=>runFake(null,s=>assert.match(s,/ENOENT/)));
test('gallery retains final bounded stderr tail',()=>runFake("process.stderr.write('x'.repeat(70000)+'FINAL_ENCODER_DETAIL',()=>process.exit(24));",s=>{assert.match(s,/FFmpeg exit=24/);assert.match(s,/FINAL_ENCODER_DETAIL/);assert.ok(!s.includes('x'.repeat(65536)),'stderr prefix must be truncated');}));
