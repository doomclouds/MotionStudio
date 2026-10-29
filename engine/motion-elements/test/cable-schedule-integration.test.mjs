import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../lib/index.mjs';
import * as cable from '../lib/foundations/geometry/catenary.mjs';
import * as lanes from '../lib/foundations/layout/interval-lanes.mjs';
import * as staged from '../lib/recipes/staged-layout-handoff.mjs';
import {queryCatalog} from '../lib/catalog-query.mjs';
import {rational as T} from '../lib/time.mjs';
import {transformBounds} from '../lib/matrix.mjs';
const catalog=JSON.parse(readFileSync(new URL('../catalog.json',import.meta.url)));
test('cable and schedule exports preserve canonical identities and module brands',()=>{
 for(const mod of [cable,lanes,staged])for(const [name,value]of Object.entries(mod))assert.equal(api[name],value,name);
 const entry=catalog.elements.find(x=>x.id==='geometry.catenary');
 const plan=api.compileCatenary(entry.example);assert.deepEqual(api.sampleCatenary(plan,.3),cable.sampleCatenary(plan,.3));
 assert.equal(api.sampleCatenaryPolyline(plan,{segments:4}).length,5);
});
test('independent interval snapshots and explicit waypoint feed one staged recipe',()=>{
 const make=items=>api.intervalLaneLayout({items,domain:{start:0,end:8},width:800,laneHeight:30,laneGap:15});
 const before=make([{itemId:'a',start:0,end:3},{itemId:'b',start:1,end:4},{itemId:'c',start:2,end:5}]);
 const after=make([{itemId:'a',start:0,end:3},{itemId:'b',start:1,end:4},{itemId:'c',start:4,end:7}]);
 assert.equal(before.laneCount,3);assert.equal(after.laneCount,2);
 const waypoint=before.items.map(a=>{const b=after.items.find(x=>x.itemId===a.itemId),matrix=[1,0,0,1,b.matrix[4],a.matrix[5]];return{...a,matrix,geometryBounds:transformBounds(matrix,a.rect)};});
 const plan=api.compileStagedLayoutHandoff({snapshots:[before.items,waypoint,after.items],ranges:[{start:T(1),end:T(2)},{start:T(2),end:T(4)}]});
 const state=staged.sampleStagedLayoutHandoff(plan,T(2));assert.equal(state.stageIndex,1);assert.equal(state.stageProgress,0);assert.deepEqual(state.items.map(x=>x.matrix),waypoint.map(x=>x.matrix));
 const reduced=api.sampleStagedLayoutHandoff(plan,T(0),{reducedMotion:true});assert.equal(reduced.phase,'before');assert.deepEqual(reduced.items.map(x=>x.matrix),after.items.map(x=>x.matrix));
});
test('two foundations plus one recipe keep trace, revision and unreviewed quality gates separate',()=>{
 assert.equal(catalog.elements.length,41);assert.equal(catalog.elements.filter(x=>x.kind==='recipe').length,7);
 for(const id of ['geometry.catenary','composition.interval-lanes','recipe.staged-layout-handoff']){
  const result=queryCatalog(catalog,{id});assert.equal(result.total,1);const entry=result.results[0].element;assert.equal(entry.status,'experimental');
  assert.equal(entry.evidence.ownerArtisticAcceptance,'PENDING_USER');assert.equal(entry.evidence.artisticReview,'PENDING_USER');assert.equal(entry.evidence.normalSpeedViewing,'NOT_DONE');assert.equal(entry.evidence.audioListening,'NOT_LISTENED');assert.equal(entry.evidence.originalProductionTransfer,'NOT_RUN');
  assert.match(entry.evidence.callEvidenceScope,/actual/i);assert.equal(entry.evidence.visualDemo,null);
 }
 const original=catalog.elements.find(x=>x.id==='geometry.catenary');const detached=queryCatalog(catalog,{id:original.id}).results[0].element;detached.example.from.x=999;assert.notEqual(original.example.from.x,999);
});
