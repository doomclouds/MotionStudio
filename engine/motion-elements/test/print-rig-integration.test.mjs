import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../lib/index.mjs';
import * as screen from '../lib/foundations/geometry/halftone-screen.mjs';
import * as morphology from '../lib/foundations/raster/morphology-coverage.mjs';
import * as skin from '../lib/foundations/geometry/affine-skin.mjs';
import * as response from '../lib/foundations/motion/damped-response.mjs';
import {queryCatalog} from '../lib/catalog-query.mjs';
const catalog=JSON.parse(readFileSync(new URL('../catalog.json',import.meta.url)));
const ids=['geometry.halftone-screen','raster.coverage-morphology','geometry.affine-skin','motion.damped-response'];
const entries=ids.map(id=>catalog.elements.find(e=>e.id===id));
test('four canonical public modules share exact exports and plan brands through index',()=>{
 for(const mod of [screen,morphology,skin,response])for(const [name,fn] of Object.entries(mod))assert.equal(api[name],fn,name);
 const plan=api.compileAffineSkin(entries[2].example),pose={bones:entries[2].example.bones.map(b=>({id:b.id,world:b.rest}))};
 assert.deepEqual(skin.sampleAffineSkin(plan,pose).vertices,[{id:'v00',x:40,y:6}]);
 assert.throws(()=>skin.sampleAffineSkin({...plan},pose));
 const spring=response.compileDampedResponse(entries[3].example);assert.deepEqual(api.sampleDampedResponse(spring,.75),response.sampleDampedResponse(spring,.75));assert.throws(()=>api.sampleDampedResponse({...spring},.75));
});
test('all four JSON catalog examples execute with explicit morphology byte-view materialization',()=>{
 const before=JSON.stringify(entries);
 assert.equal(api.halftoneScreen(entries[0].example).cells.length,3);
 const e=entries[1];assert.equal(e.exampleSetup.dataEncoding,'Uint8Array.from(example.data)');
 assert.throws(()=>api.morphologyCoverage(e.example));
 const source=Uint8Array.from(e.example.data),result=api.morphologyCoverage({...e.example,data:source});assert.deepEqual([...result.data],Array(6).fill(255));assert.notEqual(source,result.data);assert.deepEqual([...source],e.example.data);
 assert.ok(api.compileAffineSkin(entries[2].example));assert.ok(api.compileDampedResponse(entries[3].example));assert.equal(JSON.stringify(entries),before);
});
test('exact known roster and separate film-quality gates remain honest',()=>{
 assert.equal(catalog.elements.length,50);assert.equal(catalog.elements.filter(e=>e.kind!=='recipe').length,43);assert.equal(catalog.elements.filter(e=>e.kind==='recipe').length,7);
 for(const e of entries){assert.ok(e);assert.equal(queryCatalog(catalog,{id:e.id}).total,1);assert.equal(e.status,'experimental');assert.equal(e.evidence.ownerArtisticAcceptance,'PENDING_USER');assert.equal(e.evidence.artisticReview,'PENDING_USER');assert.equal(e.evidence.normalSpeedViewing,'NOT_DONE');assert.equal(e.evidence.audioListening,'NOT_LISTENED');assert.equal(e.evidence.visualDemo,null);assert.equal(e.evidence.originalProductionTransfer,'NOT_RUN');}
 assert.match(entries[0].evidence.sourceVersionRelation,/516.*36/);assert.match(entries[2].evidence.sourceVersionRelation,/Nine fresh-process/);
});

test('explicit reviewed50-ID-kind-API roster prevents replacement-by-count',()=>{
 const expected=JSON.parse(readFileSync(new URL('./fixtures/expected-catalog.json',import.meta.url)));
 const actual=catalog.elements.map(({id,kind,api})=>({id,kind,api})).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
 assert.deepEqual(actual,expected.entries);
});
