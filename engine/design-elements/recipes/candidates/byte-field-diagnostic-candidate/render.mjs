import crypto from'node:crypto';import{loadNative,loadEnvironment}from'./runtime.mjs';import{renderExamples}from'./examples.mjs';import{outputDirectory,writeNew}from'./io.mjs';
if(process.env.DISABLE_SYSTEM_FONTS_LOAD!=='1')throw Error('set DISABLE_SYSTEM_FONTS_LOAD=1 before loading Native');
const api=loadNative(),env=loadEnvironment(api,{fontPath:process.env.DIAGNOSTIC_FONT});
const products=renderExamples(api,env); // Validate all scene data before filesystem output.
const out=outputDirectory(process.argv[2]),records=[];for(const p of products){for(const[ext,b]of[['png',p.canvas.toBuffer('image/png')],['json',Buffer.from(JSON.stringify(p.layout,null,2)+'\n')]]){const file=p.id+'.'+ext;writeNew(out,file,b);records.push({file,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')});}}
writeNew(out,'outputs.json',Buffer.from(JSON.stringify(records,null,2)+'\n'));console.log(JSON.stringify({output:out,files:records},null,2));
