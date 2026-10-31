import {spawnSync}from'node:child_process';import{fileURLToPath}from'node:url';
for(const id of['data-chart','light-leak','bold-signal'])for(const variant of['reference','transfer']){const p=spawnSync(process.execPath,[fileURLToPath(new URL('./test-native-case.mjs',import.meta.url)),id,variant],{env:process.env,stdio:'inherit'});if(p.status!==0)process.exit(p.status||1)}
console.log(JSON.stringify({nativeScenes:6,status:'PASS',separateProcesses:true,newPublicFamilies:0,ownerBatchRetention:'AUTHORIZED',newCompositionsOwnerReview:'NOT_RECORDED'}));
