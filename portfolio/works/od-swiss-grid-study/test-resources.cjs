const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process'),{createHash}=require('node:crypto');
const root=__dirname,lock=JSON.parse(fs.readFileSync(path.join(root,'font-lock.json'))),file=lock[0].file,repo=(path.basename(path.dirname(root))==='works'&&path.basename(path.dirname(path.dirname(root)))==='portfolio'?path.resolve(root,'../../..'):root);let n=0;
function run(env,code){return spawnSync(process.execPath,['-e',code],{cwd:root,env:{...process.env,...env},encoding:'utf8'})}
function deny(env,code){let r=run(env,code);assert.notEqual(r.status,0,r.stdout);n++}
const t=fs.mkdtempSync(path.join(os.tmpdir(),'od-resource-negative-'));try{
 deny({OD_FONT_DIR:''},`require('./resources.cjs').font('${file}')`);
 deny({OD_FONT_DIR:'relative'},`require('./resources.cjs').font('${file}')`);
 deny({OD_FONT_DIR:root},`require('./resources.cjs').font('${file}')`);
 deny({OD_FONT_DIR:repo},`require('./resources.cjs').font('${file}')`);
 deny({OD_FONT_DIR:t},`require('./resources.cjs').font('${file}')`);
 for(const row of lock)fs.copyFileSync(path.join(process.env.OD_FONT_DIR,row.file),path.join(t,row.file));
 fs.appendFileSync(path.join(t,file),'tamper');deny({OD_FONT_DIR:t},`require('./resources.cjs').font('${file}')`);
 deny({},`const r=require('./resources.cjs');r.font('${file}');process.env.OD_FONT_DIR=${JSON.stringify(t)};r.font('${file}')`);
 fs.unlinkSync(path.join(t,file));fs.symlinkSync(path.join(process.env.OD_FONT_DIR,file),path.join(t,file));deny({OD_FONT_DIR:t},`require('./resources.cjs').font('${file}')`);
 deny({},`require('./resources.cjs').font('../x')`);
 for(const val of ['',root,(fs.existsSync(path.join(repo,'portfolio'))?path.join(repo,'portfolio'):repo)])deny({OD_OUTPUT_DIR:val},"require('./resources.cjs').write('x.png','x')");
 for(const name of ['..','.','../escape','nested/file'])deny({OD_OUTPUT_DIR:t},`require('./resources.cjs').write(${JSON.stringify(name)},'x')`);
 fs.writeFileSync(path.join(t,'exists.png'),'keep');deny({OD_OUTPUT_DIR:t},"require('./resources.cjs').write('exists.png','x')");assert.equal(fs.readFileSync(path.join(t,'exists.png'),'utf8'),'keep');
 fs.symlinkSync(path.join(root,'README.md'),path.join(t,'link.png'));const before=fs.readFileSync(path.join(root,'README.md'));deny({OD_OUTPUT_DIR:t},"require('./resources.cjs').write('link.png','x')");assert.deepEqual(fs.readFileSync(path.join(root,'README.md')),before);
 fs.symlinkSync(path.join(t,'nonexistent'),path.join(t,'dangling.png'));deny({OD_OUTPUT_DIR:t},"require('./resources.cjs').write('dangling.png','x')");
 for(const val of ['',root,(fs.existsSync(path.join(repo,'portfolio'))?path.join(repo,'portfolio'):repo)])deny({CANVAS_MODULE:val},"require('./resources.cjs').canvas()");
 const fake=path.join(t,'runtime');fs.mkdirSync(fake);fs.writeFileSync(path.join(fake,'package.json'),JSON.stringify({version:'0.0.0'}));deny({CANVAS_MODULE:fake},"require('./resources.cjs').canvas()");
 const good=run({OD_OUTPUT_DIR:t},"require('./resources.cjs').write('good.txt','good')");assert.equal(good.status,0,good.stderr);assert.equal(fs.readFileSync(path.join(t,'good.txt'),'utf8'),'good');n++;
 const entry=JSON.parse(fs.readFileSync(path.join(root,'entry.json')));assert.equal(createHash('sha256').update(fs.readFileSync(require('./resources.cjs').output('faithful.png'))).digest('hex'),entry.cover.source_sha256);n++;
}finally{fs.rmSync(t,{recursive:true,force:true})}
console.log(n+' resource/exact-frame assertions PASS');
