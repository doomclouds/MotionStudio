import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync, readdirSync, symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(dirname(fileURLToPath(import.meta.url)));
const cli=join(root,'motionstudio.mjs');
const run=(args,env={})=>spawnSync(process.execPath,[cli,...args],{cwd:tmpdir(),encoding:'utf8',env:{...process.env,...env},timeout:30000});
test('help and version work without installed tools or credentials',()=>{
 for(const args of [[],['help'],['--help'],['demo','--help'],['doctor','--help']]){
  const r=run(args,{PATH:'',MOTIONSTUDIO_CANVAS_MODULE:'/missing',DASHSCOPE_API_KEY:''});assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/npm ci/);
 }
 const r=run(['version'],{PATH:''});assert.equal(r.status,0);assert.equal(r.stdout.trim(),'0.1.0');
});
test('invalid arguments fail succinctly without a JavaScript stack',()=>{
 for(const args of [['oops'],['doctor','--work','/tmp/x'],['demo','--work'],['doctor','--full','--full']]){
  const r=run(args);assert.equal(r.status,1);assert.match(r.stderr,/MotionStudio:/);assert.doesNotMatch(r.stderr,/at .*\.mjs/);
 }
});
test('doctor reports actionable missing dependencies without cloud fallback',()=>{
 const r=run(['doctor'],{PATH:'',MOTIONSTUDIO_CANVAS_MODULE:'/missing',DASHSCOPE_API_KEY:''});
 assert.equal(r.status,1);assert.match(r.stdout,/FAIL Canvas/);assert.match(r.stdout,/FAIL ffmpeg/);assert.match(r.stdout,/npm ci/);assert.doesNotMatch(r.stdout,/PASS Canvas/);
});
test('legacy render entrypoint has side-effect-free help',()=>{
 const r=spawnSync(process.execPath,[join(root,'skills/motion-film-director/scripts/render-shot.mjs'),'--help'],{encoding:'utf8',env:{...process.env,PATH:''}});
 assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/--audio-timeline/);assert.match(r.stdout,/--chunk-frames/);
});
test('installed-dependency demo and overwrite protections', {skip:process.env.MOTIONSTUDIO_TEST_DEMO!=='1'},()=>{
 const base=mkdtempSync(join(tmpdir(),'motion-launcher-test-'));const work=join(base,'demo');
 try{
  const r=run(['demo','--work',work],{MOTIONSTUDIO_CANVAS_MODULE:'',DASHSCOPE_API_KEY:''});assert.equal(r.status,0,r.stderr);
  const report=JSON.parse(readFileSync(join(work,'output/shot-report.json')));assert.equal(report.status,'passed');assert.equal(report.fullDecode,'passed');assert.equal(report.config.frameCount,30);
  const video=readFileSync(join(work,'output/shot.mp4'));const again=run(['demo','--work',work]);assert.equal(again.status,1);assert.match(again.stderr,/already exists/);assert.deepEqual(readFileSync(join(work,'output/shot.mp4')),video);
  const inside=join(root,'forbidden-demo-test');const denied=run(['demo','--work',inside]);assert.equal(denied.status,1);assert.match(denied.stderr,/outside the repository/);assert.equal(existsSync(inside),false);
  writeFileSync(join(base,'keep.txt'),'unchanged');assert.equal(readFileSync(join(base,'keep.txt'),'utf8'),'unchanged');
 }finally{rmSync(base,{recursive:true,force:true});}
});

test('default temp and explicit symlink parents cannot create files in repository', {skip:process.env.MOTIONSTUDIO_TEST_DEMO!=='1'},()=>{
 const base=mkdtempSync(join(tmpdir(),'motion-launcher-boundary-'));
 const link=join(base,'repo-link');
 try{
  symlinkSync(root,link,process.platform==='win32'?'junction':'dir');
  const before=readdirSync(root).sort();
  for(const dir of [root,link]){
   const r=run(['demo'],{TMPDIR:dir,TMP:dir,TEMP:dir,MOTIONSTUDIO_CANVAS_MODULE:'',DASHSCOPE_API_KEY:''});
   assert.equal(r.status,1,r.stdout+r.stderr);assert.match(r.stderr,/outside the repository/);
   assert.deepEqual(readdirSync(root).sort(),before,'rejected default must create no directory');
  }
  const explicit=run(['demo','--work',join(link,'forbidden-link-demo')]);
  assert.equal(explicit.status,1);assert.match(explicit.stderr,/outside the repository/);
  assert.deepEqual(readdirSync(root).sort(),before,'rejected symlink parent must create no directory');
 }finally{rmSync(base,{recursive:true,force:true});}
});

test('explicit fresh work renders when unrelated temporary directory is unavailable', {skip:process.env.MOTIONSTUDIO_TEST_DEMO!=='1'},()=>{
 const base=mkdtempSync(join(tmpdir(),'motion-launcher-explicit-'));
 try{
  const work=join(base,'fresh-work'),missingTemp=join(base,'missing-temp');
  const r=run(['demo','--work',work],{TMPDIR:missingTemp,TMP:missingTemp,TEMP:missingTemp,MOTIONSTUDIO_CANVAS_MODULE:'',DASHSCOPE_API_KEY:''});
  assert.equal(r.status,0,r.stdout+r.stderr);
  const report=JSON.parse(readFileSync(join(work,'output/shot-report.json')));
  assert.equal(report.status,'passed');assert.equal(report.fullDecode,'passed');assert.equal(report.config.frameCount,30);
  assert.equal(existsSync(missingTemp),false,'unrelated temporary directory must not be created');
 }finally{rmSync(base,{recursive:true,force:true});}
});
