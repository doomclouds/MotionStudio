import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import{spawnSync}from'node:child_process';import{fileURLToPath}from'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'xhs08-gates-'));let checks=0;
function reject(env){const p=spawnSync(process.execPath,['render.mjs'],{cwd:root,env:{...process.env,...env},encoding:'utf8'});assert.notEqual(p.status,0);checks++;}
reject({XHS08_FONT_FILE:'',XHS08_OUTPUT_DIR:path.join(tmp,'missing')});assert(!fs.existsSync(path.join(tmp,'missing')));
reject({XHS08_FONT_FILE:process.env.XHS08_FONT_FILE,XHS08_OUTPUT_DIR:path.join(root,'forbidden')});assert(!fs.existsSync(path.join(root,'forbidden')));
fs.writeFileSync(path.join(tmp,'bad.ttf'),'bad');reject({XHS08_FONT_FILE:path.join(tmp,'bad.ttf'),XHS08_OUTPUT_DIR:path.join(tmp,'wrongfont')});assert(!fs.existsSync(path.join(tmp,'wrongfont')));
fs.symlinkSync(path.join(root,'no-create'),path.join(tmp,'dangling'));reject({XHS08_OUTPUT_DIR:path.join(tmp,'dangling')});assert(!fs.existsSync(path.join(root,'no-create')));
fs.symlinkSync(root,path.join(tmp,'linked-root'));reject({XHS08_OUTPUT_DIR:path.join(tmp,'linked-root','no-create')});assert(!fs.existsSync(path.join(root,'no-create')));
fs.mkdirSync(path.join(tmp,'occupied'));fs.writeFileSync(path.join(tmp,'occupied','keep'),'original');reject({XHS08_OUTPUT_DIR:path.join(tmp,'occupied')});assert.equal(fs.readFileSync(path.join(tmp,'occupied','keep'),'utf8'),'original');
console.log(JSON.stringify({runtimeRejectionChecks:checks,noOutputMutation:true}));
