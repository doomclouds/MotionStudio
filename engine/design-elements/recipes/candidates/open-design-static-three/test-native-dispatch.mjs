import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const worker=fileURLToPath(new URL('./native-case-worker.mjs',import.meta.url));
const invoke=args=>spawnSync(process.execPath,[worker,...args],{encoding:'utf8',env:{PATH:'',HOME:''},timeout:10000});
test('worker has a non-discovery name and integration invokes it',()=>{
 assert.equal(existsSync(new URL('./test-native-case.mjs',import.meta.url)),false);
 const driver=readFileSync(new URL('./test-integration.mjs',import.meta.url),'utf8');
 assert.match(driver,/native-case-worker\.mjs/);
 for(const id of ['data-chart','light-leak','bold-signal'])assert.ok(driver.includes("'"+id+"'"));
 for(const variant of ['reference','transfer'])assert.ok(driver.includes("'"+variant+"'"));
 assert.match(driver,/,id,variant\]/);
});
test('worker reports usage before any native or font work',()=>{
 for(const args of [[],['data-chart'],['unknown','reference'],['data-chart','bad'],['data-chart','reference','extra']]){
  const r=invoke(args);assert.equal(r.status,2,r.stderr);assert.match(r.stderr,/Usage: node native-case-worker/);assert.doesNotMatch(r.stderr,/Unknown static study case|Cannot find|font SHA|at .*\.mjs/);
 }
 const help=invoke(['--help']);assert.equal(help.status,0,help.stderr);assert.match(help.stdout,/reference\|transfer/);
});

test('worker retains all six source-lock identities and native identity guards',()=>{
 const locks=JSON.parse(readFileSync(new URL('./source-lock.json',import.meta.url),'utf8'));
 const source=readFileSync(worker,'utf8');
 assert.deepEqual(Object.keys(locks.expectedStaticPngSHA256).sort(),['bold-signal','data-chart','light-leak']);
 for(const row of Object.values(locks.expectedStaticPngSHA256)){
  assert.deepEqual(Object.keys(row).sort(),['reference','transfer']);
  for(const sha of Object.values(row))assert.match(sha,/^[a-f0-9]{64}$/);
 }
 assert.match(source,/assert\.equal\(digest,locks\.expectedStaticPngSHA256\[id\]\[variant\]\)/);
 assert.match(source,/renderer\.verifyIdentity\(\)/);
 assert.match(source,/assert\.rejects\(\(\)=>renderer\.renderFrame\(1\),\/outside\/i\)/);
});
