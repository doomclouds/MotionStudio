import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import * as direct from '../index.mjs';
import * as api from '../../../index.mjs';
const root=new URL('../../../../',import.meta.url),asset=new URL('../',import.meta.url);
test('recipe.light-echo-field: unique implementation, discoverable assets and live links',()=>{
 const item=JSON.parse(readFileSync(new URL('catalog.json',root))).elements.find(e=>e.id==='recipe.light-echo-field');
 assert.equal(item.evidence.guidance,'lib/recipes/light-echo-field/README.md');
 assert((item.evidence.technicalTests||item.evidence.tests).includes('lib/recipes/light-echo-field/test/light-echo-field.test.mjs'));
 for(const p of ['lib/recipes/light-echo-field.mjs','docs/guides/light-echo-field.md','test/light-echo-field.test.mjs']) assert.equal(existsSync(new URL(p,root)),false);
 for(const [name,fn] of Object.entries(direct)) if(name!=='assertLightEchoState') assert.equal(api[name],fn);
 for(const p of ['README.md','design.md','index.mjs','examples/contract.mjs']) assert(existsSync(new URL(p,asset)));
 for(const name of ['README.md','design.md']) { const url=new URL(name,asset);for(const m of readFileSync(url,'utf8').matchAll(/\]\(([^)]+)\)/g)) {if(!/^https?:/.test(m[1])) assert(existsSync(new URL(m[1].split('#')[0],url)),m[1]);}}
});
test('recipe.light-echo-field: executable public catalog contract',()=>{assert.match(execFileSync(process.execPath,[fileURLToPath(new URL('examples/contract.mjs',asset))],{encoding:'utf8'}),/contract PASS/);});

test('recipe.light-echo-field: original scene and dependency manifest remain callable',async()=>{
 const sceneURL=new URL('../examples/light-echo-field-scene.mjs',import.meta.url);const scene=await import(sceneURL.href);
 assert.equal(typeof (scene.createGalleryScene||scene.createScene),'function');
 for(const dependency of scene.dependencies) assert(existsSync(new URL(dependency,sceneURL)),dependency);
 assert.equal(existsSync(new URL('examples/light-echo-field-scene.mjs',root)),false);
});

test('dedicated Canvas adapter shares public identity without old wrapper',async()=>{const adapter=await import('../canvas.mjs');assert.equal(api.drawLightEchoField,adapter.drawLightEchoField);assert.equal(existsSync(new URL('adapters/light-echo-field.mjs',root)),false);});
