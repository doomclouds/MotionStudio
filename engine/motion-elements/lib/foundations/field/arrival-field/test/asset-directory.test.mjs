import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import * as direct from '../index.mjs';
import * as api from '../../../../node.mjs';
const root=new URL('../../../../../',import.meta.url),asset=new URL('../',import.meta.url);
test('field.arrival-field: unique implementation, discoverable assets and live links',()=>{
 const item=JSON.parse(readFileSync(new URL('catalog.json',root))).elements.find(e=>e.id==='field.arrival-field');
 assert.equal(item.evidence.guidance,'lib/foundations/field/arrival-field/README.md');
 assert(item.evidence.technicalTests.includes('lib/foundations/field/arrival-field/test/arrival-field.test.mjs'));
 for(const p of ['lib/foundations/field/arrival-field.mjs','docs/foundations/field.arrival-field.md','test/arrival-field.test.mjs']) assert.equal(existsSync(new URL(p,root)),false);
 for(const [name,fn] of Object.entries(direct)) assert.equal(api[name],fn);
 for(const p of ['README.md','design.md','index.mjs','examples/contract.mjs']) assert(existsSync(new URL(p,asset)));
 for(const name of ['README.md','design.md']) { const url=new URL(name,asset);for(const m of readFileSync(url,'utf8').matchAll(/\]\(([^)]+)\)/g)) {if(!/^https?:/.test(m[1])) assert(existsSync(new URL(m[1].split('#')[0],url)),m[1]);}}
});
test('field.arrival-field: executable public catalog contract',()=>{assert.match(execFileSync(process.execPath,[fileURLToPath(new URL('examples/contract.mjs',asset))],{encoding:'utf8'}),/contract PASS/);});
