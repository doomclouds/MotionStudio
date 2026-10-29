import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import * as api from '../lib/index.mjs';import * as canonical from '../lib/foundations/geometry/iso-contour.mjs';import {queryCatalog} from '../lib/catalog-query.mjs';
const catalog=JSON.parse(readFileSync(new URL('../catalog.json',import.meta.url)));
test('contour index re-exports same functions and shares canonical brand',()=>{
 assert.equal(api.compileContourGrid,canonical.compileContourGrid);assert.equal(api.extractIsoContours,canonical.extractIsoContours);
 const entry=catalog.elements.find(e=>e.id==='geometry.iso-contour'),plan=api.compileContourGrid(entry.example),spec={values:[0,0,0,0,2,0,0,0,0],level:1};
 assert.deepEqual(api.extractIsoContours(plan,spec),canonical.extractIsoContours(plan,spec));assert.equal(api.extractIsoContours(plan,spec).closedLoopCount,1);
 assert.throws(()=>api.extractIsoContours({...plan},spec));
});
test('contour state composes with existing affine coordinates without mutating extraction',()=>{
 const p=api.compileContourGrid({columns:3,rows:3,x:0,y:0,width:8,height:8}),state=api.extractIsoContours(p,{values:[0,0,0,0,2,0,0,0,0],level:1}),saved=JSON.stringify(state),matrix=api.composeTransform({x:30,y:20,scaleX:2,scaleY:2});
 const mapped=state.contours[0].points.map(p=>api.transformPoint(matrix,p));for(let i=0;i<mapped.length;i++){assert.equal(mapped[i].x,30+2*state.contours[0].points[i].x);assert.equal(mapped[i].y,20+2*state.contours[0].points[i].y);}assert.equal(JSON.stringify(state),saved);
});
test('one contour foundation keeps version bridge and unreviewed quality gates explicit',()=>{
 assert.equal(catalog.elements.length,42);assert.equal(catalog.elements.filter(e=>e.kind!=='recipe').length,35);assert.equal(catalog.elements.filter(e=>e.kind==='recipe').length,7);
 const found=queryCatalog(catalog,{id:'geometry.iso-contour'});assert.equal(found.total,1);const entry=found.results[0].element;assert.equal(entry.kind,'geometry');assert.equal(entry.status,'experimental');
 for(const key of ['artisticReview','ownerArtisticAcceptance'])assert.equal(entry.evidence[key],'PENDING_USER');assert.equal(entry.evidence.normalSpeedViewing,'NOT_DONE');assert.equal(entry.evidence.audioListening,'NOT_LISTENED');assert.equal(entry.evidence.originalProductionTransfer,'NOT_RUN');assert.equal(entry.evidence.visualDemo,null);
 assert.match(entry.evidence.sourceVersionRelation,/not a new full encoded movie/i);assert.match(entry.evidence.callEvidenceScope,/actual/i);assert.match(entry.counterexamples.join(' '),/65536/);
 entry.example.width=999;assert.notEqual(catalog.elements.find(e=>e.id===entry.id).example.width,999);
});
