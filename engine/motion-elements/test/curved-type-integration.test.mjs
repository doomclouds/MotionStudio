import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import * as publicAPI from '../lib/index.mjs';
import {compileCubicPath,sampleCubicPath} from '../lib/foundations/geometry/cubic-path.mjs';
import {layoutGlyphRunOnPath} from '../lib/foundations/typography/glyph-run-path.mjs';
import {queryCatalog} from '../lib/catalog-query.mjs';
const catalog=JSON.parse(readFileSync(new URL('../catalog.json',import.meta.url),'utf8'));
const entry=id=>catalog.elements.find(e=>e.id===id);
const curve=entry('geometry.cubic-path'),glyph=entry('composition.glyph-run-path');
test('responsibility modules and public exports share exact functions and plan brand',()=>{
 for(const [key,fn] of Object.entries({compileCubicPath,sampleCubicPath,layoutGlyphRunOnPath}))assert.equal(publicAPI[key],fn);
 const direct=compileCubicPath(curve.example),throughIndex=publicAPI.compileCubicPath(curve.example);
 assert.deepEqual(publicAPI.sampleCubicPath(direct,.5),sampleCubicPath(throughIndex,.5));
 assert.deepEqual(publicAPI.layoutGlyphRunOnPath(direct,glyph.example),layoutGlyphRunOnPath(throughIndex,glyph.example));
});
test('catalog glyph example is an explicit two-step setup, not a JSON-branded plan or evaluator',()=>{
 const plan=compileCubicPath(glyph.exampleSetup.path),result=layoutGlyphRunOnPath(plan,glyph.example);
 assert.equal(result.glyphs.length,2);assert.equal(result.span,64);
 assert.throws(()=>layoutGlyphRunOnPath(JSON.parse(JSON.stringify(plan)),glyph.example));
 assert.throws(()=>compileCubicPath({...glyph.exampleSetup.path,tolerance:0}));
 assert.throws(()=>layoutGlyphRunOnPath(plan,{...glyph.example,startDistance:plan.totalLength}));
 const before=JSON.stringify(catalog),selected=queryCatalog(catalog,{id:glyph.id}).results[0].element;
 selected.exampleSetup.path.segments[0].p0.x=900;selected.example.glyphs[0].advance=900;
 assert.equal(JSON.stringify(catalog),before);
});
test('curved type metadata preserves count, actual consumption limits and separate review gates',()=>{
 assert.equal(catalog.elements.length,67);assert.equal(catalog.elements.filter(e=>e.kind==='recipe').length,7);
 assert.equal(curve.kind,'geometry');assert.equal(glyph.kind,'composition');
 for(const e of [curve,glyph]){
  assert.equal(e.status,'experimental');assert.equal(e.evidence.videoValidation,'VERIFIED_PRIVATE_CANDIDATE_CALL_TRACE');
  assert.equal(e.evidence.artisticReview,'PENDING_USER');assert.equal(e.evidence.ownerArtisticAcceptance,'PENDING_USER');
  assert.equal(e.evidence.audioListening,'NOT_LISTENED');assert.equal(e.evidence.normalSpeedViewing,'NOT_DONE');
  assert.equal(e.evidence.originalProductionTransfer,'NOT_RUN');assert.match(e.evidence.sourceVersionRelation,/later public index/);
  assert.match(e.evidence.callEvidenceScope,/not visible-pixel counts/);
 }
 assert.match(curve.evidence.validationCoverage,/Three initialization compiles/);assert.match(curve.evidence.validationCoverage,/approximate, not an exact seam/);
 assert.match(glyph.evidence.validationCoverage,/not570 wholly visible words/);assert.match(glyph.evidence.validationCoverage,/intentional tool occlusion/);
});
test('glyph setup stays inert with only static query files readable in an unrelated directory',()=>{
 const root=fileURLToPath(new URL('../',import.meta.url)),cli=root+'scripts/query-catalog.mjs';
 const p=spawnSync(process.execPath,['--permission',`--allow-fs-read=${cli}`,`--allow-fs-read=${root}lib/catalog-query.mjs`,`--allow-fs-read=${root}catalog.json`,cli,'show','--id',glyph.id],{cwd:'/tmp',encoding:'utf8'});
 assert.equal(p.status,0,p.stderr);const actual=JSON.parse(p.stdout);assert.deepEqual(actual.results[0].element.exampleSetup,glyph.exampleSetup);
});
