'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),os=require('os');const io=require('./shared/external-io.cjs'),r=require('./shared/runtime.cjs'),resources=require('./resources.json');const root=io.repositoryRoot(),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'od-static-io-'));let count=0;function test(fn){fn();count++}
test(()=>assert.throws(()=>io.externalPath('relative'),/Absolute/));
test(()=>assert.throws(()=>io.externalPath(path.join(root,'forbidden')),/inside/));
fs.symlinkSync(root,path.join(tmp,'repo-link'),'dir');test(()=>assert.throws(()=>io.externalPath(path.join(tmp,'repo-link','new-file')),/inside/));
test(()=>assert.equal(io.externalPath(path.join(tmp,'new')),path.join(tmp,'new')));
const bytes=Buffer.from('sentinel');test(()=>{io.writeNewDirectory(path.join(tmp,'out'),{'value.txt':bytes});assert.deepEqual(fs.readFileSync(path.join(tmp,'out/value.txt')),bytes)});
test(()=>assert.throws(()=>io.writeNewDirectory(path.join(tmp,'out'),{'value.txt':Buffer.from('change')}),/new/));
fs.symlinkSync(path.join(tmp,'out'),path.join(tmp,'out-link'),'dir');test(()=>assert.throws(()=>io.writeNewDirectory(path.join(tmp,'out-link'),{'x':bytes}),/new/));
test(()=>assert.throws(()=>io.writeNewDirectory(path.join(tmp,'bad-names'),{'../x':bytes}),/flat/));
test(()=>assert.throws(()=>io.readRegular(path.join(tmp,'out/value.txt'),2),/budget/));
fs.symlinkSync(path.join(tmp,'out/value.txt'),path.join(tmp,'file-link'));test(()=>assert.throws(()=>io.readRegular(path.join(tmp,'file-link'),100),/non-symlink/));
test(()=>assert.throws(()=>r.caseInfo('../../x'),/Unknown/));
const old=process.env.OD_STATIC_FONT_ROOT;
test(()=>{delete process.env.OD_STATIC_FONT_ROOT;assert.throws(()=>r.loadFonts('bold-signal'),/Absolute/);process.env.OD_STATIC_FONT_ROOT=old});
// Corrupt only a copied external font set; all hashes must pass before any registration.
const fake=path.join(tmp,'fonts'),fd=path.join(fake,'bold-signal');fs.mkdirSync(fd,{recursive:true});resources['bold-signal'].outputs.forEach(f=>fs.copyFileSync(path.join(old,'bold-signal',f.file),path.join(fd,f.file)));const last=resources['bold-signal'].outputs.at(-1).file,b=fs.readFileSync(path.join(fd,last));b[100]^=1;fs.writeFileSync(path.join(fd,last),b);let registrations=0;
test(()=>{process.env.OD_STATIC_FONT_ROOT=fake;try{assert.throws(()=>r.loadFonts('bold-signal',{GlobalFonts:{registerFromPath(){registrations++;return true}}}),/SHA mismatch/);assert.equal(registrations,0)}finally{process.env.OD_STATIC_FONT_ROOT=old}});
test(()=>assert.deepEqual(fs.readFileSync(path.join(tmp,'out/value.txt')),bytes));
console.log(JSON.stringify({externalIOChecks:count,status:'PASS',scope:'Local boundaries only; no network/owner-approval claim'}));
