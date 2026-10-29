import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../lib/index.mjs';
import * as hinge from '../lib/foundations/geometry/hinged-panel.mjs';
import {queryCatalog} from '../lib/catalog-query.mjs';
const catalog=JSON.parse(readFileSync(new URL('../catalog.json',import.meta.url),'utf8'));
const entry=catalog.elements.find(e=>e.id==='geometry.hinged-panel');
test('hinged panel exports share canonical function identities and branded states',()=>{
 for(const name of ['compileHingedPanel','sampleHingedPanel','transformHingedPoint'])assert.equal(api[name],hinge[name]);
 const p=api.compileHingedPanel(entry.example),s=hinge.sampleHingedPanel(p,{angle:-Math.PI/3});
 assert.deepEqual(api.transformHingedPoint(s,p.vertices[2]),s.vertices[2]);
 assert.deepEqual(api.sampleHingedPanel(p,{angle:0,parent:s}).vertices,s.vertices);
});
test('one candidate with actual version bridge and group feedback does not imply individual acceptance',()=>{
 assert.equal(catalog.elements.length,67);assert.equal(catalog.elements.filter(e=>e.kind==='recipe').length,7);
 assert.equal(entry.api,'compileHingedPanel');assert.equal(entry.kind,'geometry');assert.equal(entry.status,'experimental');
 assert.equal(entry.evidence.artisticReview,'PENDING_USER');assert.equal(entry.evidence.ownerArtisticAcceptance,'PENDING_USER');
 assert.equal(entry.evidence.audioListening,'NOT_LISTENED');assert.equal(entry.evidence.normalSpeedViewing,'NOT_DONE');assert.equal(entry.evidence.originalProductionTransfer,'NOT_RUN');
 assert.match(entry.evidence.ownerFeedbackScope,/group only/);assert.match(entry.evidence.sourceVersionRelation,/not identical source bytes/);
 assert.match(entry.evidence.validationCoverage,/5184/);assert.match(entry.evidence.validationCoverage,/136752/);
 const result=queryCatalog(catalog,{id:entry.id});assert.equal(result.total,1);result.results[0].element.example.vertices[0].x=9;assert.equal(entry.example.vertices[0].x,-40);
});
