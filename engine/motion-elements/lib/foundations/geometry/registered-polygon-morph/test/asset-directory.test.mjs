import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import * as direct from '../index.mjs';
import * as api from '../../../../index.mjs';
const root=new URL('../../../../../',import.meta.url),asset=new URL('../',import.meta.url);
test('geometry.registered-polygon-morph: unique implementation, discoverable assets and live links',()=>{
 const item=JSON.parse(readFileSync(new URL('catalog.json',root))).elements.find(e=>e.id==='geometry.registered-polygon-morph');
 assert.equal(item.evidence.guidance,'lib/foundations/geometry/registered-polygon-morph/README.md');
 assert(item.evidence.tests.includes('lib/foundations/geometry/registered-polygon-morph/test/registered-polygon-morph.test.mjs'));
 for(const p of ['lib/registered-polygon-morph.mjs','test/registered-polygon-morph.test.mjs']) assert.equal(existsSync(new URL(p,root)),false);
 for(const name of ['compileRegisteredPolygonMorph', 'sampleRegisteredPolygonMorph']) assert.equal(api[name],direct[name]);
 for(const p of ['README.md','design.md','index.mjs','examples/contract.mjs']) assert(existsSync(new URL(p,asset)));
 for(const name of ['README.md','design.md']) { const url=new URL(name,asset);for(const m of readFileSync(url,'utf8').matchAll(/\]\(([^)]+)\)/g)) {if(!/^https?:/.test(m[1])) assert(existsSync(new URL(m[1].split('#')[0],url)),m[1]);}}
});
test('geometry.registered-polygon-morph: executable public catalog contract',()=>{assert.match(execFileSync(process.execPath,[fileURLToPath(new URL('examples/contract.mjs',asset))],{encoding:'utf8'}),/contract PASS/);});
test('registered polygon scene: normal and reduced frames are stateless',async()=>{
 const {loadNativeCanvas}=await import('../../../../../../motion-render-core/lib/native.mjs');const {api:canvasApi}=loadNativeCanvas();
 const {createGalleryScene,config}=await import('../examples/registered-polygon-morph-scene.mjs');
 for(const reducedMotion of [false,true]){const canvas=canvasApi.createCanvas(config.width,config.height),ctx=canvas.getContext('2d');const scene=await createGalleryScene({ctx,canvasApi,config},{reducedMotion});scene.renderFrame(60);const before=Buffer.from(ctx.getImageData(0,0,config.width,config.height).data);scene.renderFrame(190);scene.renderFrame(60);assert.deepEqual(Buffer.from(ctx.getImageData(0,0,config.width,config.height).data),before);}
});
