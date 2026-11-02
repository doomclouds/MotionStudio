import fs from'node:fs';import path from'node:path';import os from'node:os';import assert from'node:assert/strict';import{externalPath,outputDirectory,writeVerifiedOutput}from'./src/external-io.mjs';const base=fs.mkdtempSync(path.join(os.tmpdir(),'od-candidate-io-')),repo=path.join(base,'repo'),outside=path.join(base,'outside');fs.mkdirSync(repo);fs.mkdirSync(outside);let checks=0;
try{fs.symlinkSync(repo,path.join(outside,'alias'));assert.throws(()=>outputDirectory(path.join(outside,'alias','never-created'),repo));assert.equal(fs.existsSync(path.join(repo,'never-created')),false);checks++;
assert.throws(()=>externalPath(repo,repo));assert.throws(()=>externalPath(path.join(repo,'fonts'),repo));checks++;
const target=path.join(outside,'never-written');fs.symlinkSync(target,path.join(outside,'tests.json'));assert.throws(()=>writeVerifiedOutput(path.join(outside,'tests.json'),'fail'));assert.equal(fs.existsSync(target),false);checks++;
const file=path.join(outside,'good.json');writeVerifiedOutput(file,'ok');writeVerifiedOutput(file,'ok');assert.throws(()=>writeVerifiedOutput(file,'changed'));assert.equal(fs.readFileSync(file,'utf8'),'ok');checks++;
assert.equal(outputDirectory(path.join(outside,'new'),repo),path.join(outside,'new'));checks++;
console.log(checks+' external IO checks PASS');}finally{fs.rmSync(base,{recursive:true,force:true})}
