const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process'),{createHash}=require('node:crypto');
const root=__dirname,entry=JSON.parse(fs.readFileSync(path.join(root,'entry.json'))),lock=JSON.parse(fs.readFileSync(path.join(root,'font-lock.json'))),f=lock[0].file,repo=path.resolve(root,'../../..');let checks=0;
function child(env,expr){return spawnSync(process.execPath,['-e',expr],{cwd:root,env:{...process.env,...env},encoding:'utf8'})}
function denied(env,expr){assert.notEqual(child(env,expr).status,0);checks++}
denied({OD_FONT_DIR:''},`require('./resources.cjs').font('${f}')`);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'od-resources-'));try{
for(const row of lock)fs.copyFileSync(path.join(process.env.OD_FONT_DIR,row.file),path.join(temp,row.file));fs.appendFileSync(path.join(temp,f),'tamper');denied({OD_FONT_DIR:temp},`require('./resources.cjs').font('${f}')`);
denied({},`const r=require('./resources.cjs');r.font('${f}');process.env.OD_FONT_DIR=${JSON.stringify(temp)};r.font('${f}')`);
fs.unlinkSync(path.join(temp,f));fs.symlinkSync(path.join(process.env.OD_FONT_DIR,f),path.join(temp,f));denied({OD_FONT_DIR:temp},`require('./resources.cjs').font('${f}')`);
fs.symlinkSync(path.join(root,'README.md'),path.join(temp,'evil.png'));const before=fs.readFileSync(path.join(root,'README.md'));denied({OD_OUTPUT_DIR:temp},"require('./resources.cjs').write('evil.png','bad')");assert.deepEqual(fs.readFileSync(path.join(root,'README.md')),before);
fs.writeFileSync(path.join(temp,'exists.png'),'keep');denied({OD_OUTPUT_DIR:temp},"require('./resources.cjs').write('exists.png','bad')");assert.equal(fs.readFileSync(path.join(temp,'exists.png'),'utf8'),'keep');
}finally{fs.rmSync(temp,{recursive:true,force:true})}
denied({OD_OUTPUT_DIR:root},"require('./resources.cjs').output('x.png')");denied({OD_OUTPUT_DIR:path.join(repo,'portfolio')},"require('./resources.cjs').output('x.png')");denied({CANVAS_MODULE:root},"require('./resources.cjs').canvas()");
const frame=entry.id.includes('orbital')?'candidate.png':entry.id.includes('swiss')?'swiss-native-v01.png':'faithful.png';assert.equal(createHash('sha256').update(fs.readFileSync(require('./resources.cjs').output(frame))).digest('hex'),entry.cover.source_sha256);checks++;console.log(checks+' resource/exact-frame checks PASS');
