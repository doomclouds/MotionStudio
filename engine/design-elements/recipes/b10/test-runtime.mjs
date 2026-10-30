import fs from'node:fs';import os from'node:os';import path from'node:path';import assert from'node:assert/strict';import{packageRoot,externalPath,outputDirectory,loadFonts}from'./runtime.mjs';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'b10-gates-')),tests=[];const check=(name,f)=>{f();tests.push({name,status:'PASS'})};try{
check('reject source output',()=>assert.throws(()=>outputDirectory(packageRoot+'/evidence')));
check('reject relative path',()=>assert.throws(()=>externalPath('relative')));
check('real symlink to source rejected before mkdir',()=>{fs.symlinkSync(packageRoot,temp+'/source','dir');assert.throws(()=>outputDirectory(temp+'/source/future/deep'))});
check('existing evidence not overwritten',()=>{fs.mkdirSync(temp+'/evidence');fs.writeFileSync(temp+'/evidence/prior','keep');assert.throws(()=>outputDirectory(temp+'/evidence'));assert.equal(fs.readFileSync(temp+'/evidence/prior','utf8'),'keep')});
check('fresh external path accepted',()=>assert.equal(outputDirectory(temp+'/fresh'),temp+'/fresh'));
check('tampered display rejected before registration',()=>{fs.writeFileSync(temp+'/badfont','not a font');let registered=false;assert.throws(()=>loadFonts({GlobalFonts:{registerFromPath(){registered=true}}},{display:temp+'/badfont',body:process.env.B10_BODY_FONT}),/SHA/);assert.equal(registered,false)});
check('tampered body rejected before either registration',()=>{let registered=false;assert.throws(()=>loadFonts({GlobalFonts:{registerFromPath(){registered=true}}},{display:process.env.B10_DISPLAY_FONT,body:temp+'/badfont'}),/SHA/);assert.equal(registered,false)});
check('tampered code font rejected before any registration',()=>{let registered=false;assert.throws(()=>loadFonts({GlobalFonts:{registerFromPath(){registered=true}}},{display:process.env.B10_DISPLAY_FONT,body:process.env.B10_BODY_FONT,code:temp+'/badfont'}),/SHA/);assert.equal(registered,false)});
console.log(JSON.stringify({tests:tests.length,results:tests},null,2));}finally{fs.rmSync(temp,{recursive:true,force:true})}
