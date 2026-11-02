import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {spawnSync} from 'node:child_process';import {createReviewTiles} from './index.mjs';
const locks=JSON.parse(fs.readFileSync(new URL('./asset-lock.json',import.meta.url),'utf8'));let checks=0;
for(let i=0;i<3;i++){
 const script=`import {createRequire} from 'node:module';import {createReviewTiles} from './index.mjs';const api=createRequire(import.meta.url)('@napi-rs/canvas');let n=0;api.GlobalFonts.registerFromPath=()=>n++!==${i};try{createReviewTiles({fontRoot:process.env.REVIEW_TILE_FONTS});process.exit(2)}catch(e){if(!/font registration/.test(e.message))throw e}`;
 const r=spawnSync(process.execPath,['--input-type=module','-e',script],{cwd:path.dirname(new URL(import.meta.url).pathname),env:process.env,encoding:'utf8'});assert.equal(r.status,0,r.stderr);checks++;
}
for(const f of locks){const d=fs.mkdtempSync(path.join(os.tmpdir(),'review-tiles-font-'));try{for(const q of locks)fs.copyFileSync(path.join(process.env.REVIEW_TILE_FONTS,q.file),path.join(d,q.file));const p=path.join(d,f.file),b=fs.readFileSync(p);b[20]^=1;fs.writeFileSync(p,b);assert.throws(()=>createReviewTiles({fontRoot:d}),/font identity/);checks++;}finally{fs.rmSync(d,{recursive:true,force:true})}}
console.log(JSON.stringify({runtimeChecks:checks,status:'PASS'}));
