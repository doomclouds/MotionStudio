'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const script=path.join(__dirname,'test.cjs');
function invoke(extra={},entry=script,expectedOutcome='BLOCKED'){
 const env={...process.env,...extra};delete env.OD_EFFECTS_FONT_DIR;
 if(!Object.hasOwn(extra,'OD_EFFECTS_OUTPUT_DIR'))delete env.OD_EFFECTS_OUTPUT_DIR;
 const result=cp.spawnSync(process.execPath,[entry],{encoding:'utf8',env,timeout:30000});
 assert.equal(result.error,undefined);assert.equal(result.status,1,result.stderr);
 let report;try{report=JSON.parse(result.stdout)}catch{assert.fail('Expected complete JSON stdout; use explicit verified external CANVAS_MODULE. stderr: '+result.stderr)}
 assert.equal(report.outcome,expectedOutcome);assert.equal(report.failed,expectedOutcome==='FAILED'?1:0);assert.ok(report.passed>0);assert.equal(report.blocked,report.tests.filter(row=>row.status==='blocked').length);
 assert.ok(report.tests.some(row=>row.name==='soft field clips into positive16:9 bounds'&&row.status==='passed'));
 assert.ok(report.tests.some(row=>row.name==='glitch repeated exact rendering'&&row.status==='blocked'));
 return{...result,report};
}
test('no fonts and no output retain JSON results and a nonzero status',()=>{
 const r=invoke();assert.match(r.stderr,/REPORT_NOT_WRITTEN: set OD_EFFECTS_OUTPUT_DIR/);assert.equal(r.report.tests.length,32);
});
test('blocked report can be saved without fabricating font checks',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'effects-report-'));
 try{const r=invoke({OD_EFFECTS_OUTPUT_DIR:dir});assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir,'candidate-tests.json'))),r.report);assert.equal(r.stderr,'');}
 finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('artifact refusal never hides results or overwrites existing files',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'effects-report-'));
 try{const target=path.join(dir,'candidate-tests.json');fs.writeFileSync(target,'keep unchanged');const r=invoke({OD_EFFECTS_OUTPUT_DIR:dir});assert.match(r.stderr,/REPORT_WRITE_FAILED/);assert.equal(fs.readFileSync(target,'utf8'),'keep unchanged');}
 finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('missing optional preparation interpreter is blocked, not passed',()=>{
 const r=invoke({OD_EFFECTS_FONT_PYTHON:path.join(os.tmpdir(),'absent-effects-python')});
 const prep=r.report.tests.filter(row=>row.name.startsWith('font preparation'));
 assert.equal(prep.length,2);assert.ok(prep.every(row=>row.status==='blocked'));
});

test('an actual failed assertion remains visible when artifact writing also fails',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'effects-injected-'));
 try{
  const repo=path.join(temp,'repo'),copy=path.join(repo,'engine/design-elements/recipes/candidates/static-effects-candidate');
  fs.mkdirSync(path.join(repo,'portfolio'),{recursive:true});fs.cpSync(__dirname,copy,{recursive:true});
  const entry=path.join(copy,'test.cjs'),needle="const fontPrerequisites=";
  const source=fs.readFileSync(entry,'utf8');assert.ok(source.includes(needle));
  fs.writeFileSync(entry,source.replace(needle,"test('synthetic injected assertion',()=>assert.equal(1,2,'synthetic assertion failure'));\n"+needle));
  const out=path.join(temp,'artifact');fs.mkdirSync(out);const target=path.join(out,'candidate-tests.json');fs.writeFileSync(target,'existing report');
  const r=invoke({OD_EFFECTS_OUTPUT_DIR:out},entry,'FAILED');
  assert.ok(r.report.tests.some(row=>row.name==='synthetic injected assertion'&&row.status==='failed'&&row.error.includes('synthetic assertion failure')));
  assert.match(r.stderr,/REPORT_WRITE_FAILED/);assert.equal(fs.readFileSync(target,'utf8'),'existing report');
 }finally{fs.rmSync(temp,{recursive:true,force:true})}
});
