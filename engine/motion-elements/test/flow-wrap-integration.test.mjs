import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../lib/index.mjs';
import {flowWrapLayout} from '../lib/foundations/layout/flow-wrap.mjs';
import {queryCatalog} from '../lib/catalog-query.mjs';
const catalog=JSON.parse(readFileSync(new URL('../catalog.json',import.meta.url),'utf8'));
const entry=catalog.elements.find(e=>e.id==='composition.flow-wrap');
test('flow responsibility path and public export are one function and compose with old handoff',()=>{
 assert.equal(api.flowWrapLayout,flowWrapLayout);
 const narrow=api.flowWrapLayout(entry.example),wide=flowWrapLayout({...entry.example,width:320});
 assert.deepEqual(narrow,flowWrapLayout(entry.example));assert.equal(narrow.rows.length,2);assert.equal(wide.rows.length,1);
 const plan=api.compileLayoutHandoff({from:wide.items,to:narrow.items,range:{start:api.rational(0),end:api.rational(1)}});
 const end=api.sampleLayoutHandoff(plan,api.rational(1));
 assert.deepEqual(end.items.map(i=>i.matrix),narrow.items.map(i=>i.matrix));assert.ok(end.items.every(i=>i.role==='shared'));
});
test('flow catalog records actual initialization, cached consumption and independent quality limits',()=>{
 assert.equal(catalog.elements.length,42);assert.equal(catalog.elements.filter(e=>e.kind==='recipe').length,7);
 assert.equal(entry.api,'flowWrapLayout');assert.equal(entry.status,'experimental');assert.equal(entry.kind,'composition');
 assert.equal(entry.evidence.visualReview,'DECODED_FRAME_REVIEW_NO_BLOCKERS');assert.match(entry.evidence.validationCoverage,/Final-version32 decoded frames/);
 assert.equal(entry.evidence.artisticReview,'PENDING_USER');assert.equal(entry.evidence.ownerArtisticAcceptance,'PENDING_USER');
 assert.equal(entry.evidence.normalSpeedViewing,'NOT_DONE');assert.equal(entry.evidence.audioListening,'NOT_LISTENED');assert.equal(entry.evidence.originalProductionTransfer,'NOT_RUN');
 assert.match(entry.evidence.validationCoverage,/Two initialization flow calls/);assert.match(entry.evidence.validationCoverage,/not456 fresh flow calls/);
 assert.match(entry.evidence.compositionScope,/not a third flow output/);assert.match(entry.evidence.sourceVersionRelation,/later public index/);
 const copy=queryCatalog(catalog,{id:entry.id}).results[0].element;copy.example.items[0].width=1000;
 assert.equal(entry.example.items[0].width,96);
});
