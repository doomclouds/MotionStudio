// Each individual registration is tested in a new process, with no prior family registry.
import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
const cases={'bold-poster':['BoldDisplay','BoldItalic','BoldSans500','BoldSans700'],'decision-tree':['DecisionStudy500','DecisionStudy600'],'creative-voltage':['VoltageDisplay','VoltageScript','VoltageMono400','VoltageMono700']};let checks=0;
for(const [name,families] of Object.entries(cases))for(const family of families){
 const code=`import {createRequire} from 'node:module';import path from 'node:path';import {renderFrame} from ${JSON.stringify(new URL('./runtime.mjs',import.meta.url).href)};
 const require=createRequire(import.meta.url),api=require(process.env.CANVAS_MODULE||'@napi-rs/canvas');let injected=false;
 const testApi={...api,GlobalFonts:{registerFromPath(p,f){if(f===${JSON.stringify(family)}){injected=true;return false}return api.GlobalFonts.registerFromPath(p,f)}}};
 try{await renderFrame(${JSON.stringify(name)},{canvasApi:testApi,assetDir:path.join(process.env.OD_SECOND_ASSETS,${JSON.stringify(name)})});process.exitCode=2}catch(e){if(!injected||!/font registration/.test(e.message)){console.error(e);process.exitCode=3}}`;
 const result=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8',env:process.env});assert.equal(result.status,0,`${name}/${family}: ${result.stderr}`);checks++;
}
console.log(JSON.stringify({freshProcessFontFailureChecks:checks,allIndividualRegistrationsReject:true}));
