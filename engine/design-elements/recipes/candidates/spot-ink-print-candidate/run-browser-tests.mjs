import {createFixtureServer} from './browser-file-server.mjs';
import {createExternalOutput} from './output-directory.mjs';
import http from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';
const root=path.dirname(fileURLToPath(import.meta.url));const require=createRequire(import.meta.url);
const args=process.argv.slice(2),flags={};
for(let i=0;i<args.length;i+=2){if(!['--out','--upstream'].includes(args[i])||!args[i+1]||flags[args[i]])throw Error('Required: --out /absolute/new-directory --upstream /absolute/riso.js');flags[args[i]]=args[i+1];}
if(!flags['--upstream']){console.error(JSON.stringify({status:'NOT_RUN',error:'Required external --upstream /absolute/riso.js'}));process.exit(2);}
const out=await createExternalOutput(['--out',flags['--out']]);
let verifiedServer;
try{verifiedServer=await createFixtureServer(flags['--upstream']);}catch(error){const missing=error.code==='ENOENT';const result={status:missing?'NOT_RUN':'FAIL',error:String(error)};await fs.writeFile(path.join(out,'browser.json'),JSON.stringify(result));console.error(result);process.exit(missing?2:1);}

let chromium;
try {({chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'));} catch(e) {const result={status:'NOT_RUN',error:'Set PLAYWRIGHT_MODULE to an existing Playwright installation'};await fs.writeFile(path.join(out,'browser.json'),JSON.stringify(result));console.error(result);process.exit(2);}
let browser,server;
try {
 server=verifiedServer;
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 browser=await chromium.launch({...(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{}),headless:true});
 const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}/browser-tests.html`);await page.waitForFunction(()=>window.testResult,{timeout:30000});
 const result=await page.evaluate(()=>window.testResult);await fs.writeFile(path.join(out,'browser.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(result.status!=='PASS')process.exitCode=1;
 await page.screenshot({path:path.join(out,'synthetic-comparison.png'),fullPage:true});
}catch(e){const result={status:'BLOCKED',error:String(e)};await fs.writeFile(path.join(out,'browser.json'),JSON.stringify(result,null,2));console.error(result);process.exitCode=2;}finally{if(browser)await browser.close();if(server)server.close();}
