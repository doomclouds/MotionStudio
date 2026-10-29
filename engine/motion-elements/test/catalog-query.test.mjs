import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {queryCatalog, parseCatalogArgs, KINDS} from '../lib/catalog-query.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const cli = `${root}scripts/query-catalog.mjs`;
const catalog = JSON.parse(readFileSync(`${root}catalog.json`, 'utf8'));
const item = (id, extra = {}) => ({id, kind:'motion', status:'experimental', summary:'中英文 Café alpha .*', tags:['FADE','淡入'], example:{type:id}, applicability:['cards'], counterexamples:['not physics'], evidence:{tests:['private/no-read']}, knowledgeLinks:['private://do-not-open'], ...extra});
const fixture = {schemaVersion:1, elements:[item('motion.z'), item('motion.a')]};
const run = args => spawnSync(process.execPath, [cli, ...args], {encoding:'utf8', cwd:'/tmp'});

test('plane parallax preserves calibrated-film coverage and separate viewing gates',()=>{
 const e=queryCatalog(catalog,{id:'composition.plane-parallax'}).results[0].element;
 assert.equal(e.api,'planeParallaxLayout');assert.equal(e.status,'experimental');
 assert.equal(e.evidence.videoValidation,'VERIFIED_PRIVATE_CANDIDATE_CALL_TRACE');
 assert.equal(e.evidence.artisticReview,'POSITIVE_FEEDBACK_SCENE_SPECIFIC');assert.equal(e.evidence.ownerArtisticAcceptance,'POSITIVE_FEEDBACK_SCENE_SPECIFIC');
 assert.equal(e.evidence.normalSpeedViewing,'NOT_DONE');assert.equal(e.evidence.audioListening,'NOT_LISTENED');
 assert.equal(e.evidence.originalProductionTransfer,'NOT_RUN');assert.equal(e.evidence.guidance,'docs/plane-parallax.md');
 assert.match(e.evidence.validationCoverage,/840 projections/);assert.match(e.evidence.validationCoverage,/Four encoded static frames/);
 assert.match(e.evidence.callEvidenceScope,/not independent/);assert.match(e.evidence.sourceVersionRelation,/not film-consumed/);
});

test('stable ID ordering, total, bounded limit and detached complete metadata', () => {
  const before = JSON.stringify(fixture);
  const r = queryCatalog(fixture, {limit:1});
  assert.equal(r.total,2); assert.equal(r.truncated,true); assert.equal(r.results[0].element.id,'motion.a');
  for (const key of ['example','applicability','counterexamples','evidence','knowledgeLinks']) assert.deepEqual(r.results[0].element[key], fixture.elements[1][key]);
  r.results[0].element.example.type='changed';
  assert.equal(JSON.stringify(fixture),before);
  assert.deepEqual(queryCatalog({...fixture,elements:[...fixture.elements].reverse()}),queryCatalog(fixture));
});
test('hundred-entry scale remains bounded and deterministic without ranking', () => {
  const many={schemaVersion:1,elements:Array.from({length:105},(_,i)=>item(`motion.item-${String(i).padStart(3,'0')}`)).reverse()};
  const r=queryCatalog(many,{limit:100});
  assert.equal(r.total,105); assert.equal(r.results.length,100); assert.equal(r.truncated,true);
  assert.equal(r.results[0].element.id,'motion.item-000'); assert.equal(r.results.at(-1).element.id,'motion.item-099');
  assert.equal(queryCatalog(many).results.length,20);
});
test('English/Chinese NFC literal substring, exact normalized tags, AND filters and reasons', () => {
  for (const text of ['中英',' CAFE\u0301 ','.*']) {
    const r = queryCatalog(fixture,{text}); assert.equal(r.total,2);
    assert.deepEqual(r.results[0].reasons[0].fields,['summary']);
  }
  assert.equal(queryCatalog(fixture,{tag:' fade ',kind:'motion',status:'experimental',text:'alpha'}).total,2);
  assert.equal(queryCatalog(fixture,{tag:'fad'}).total,0);
  assert.equal(queryCatalog(fixture,{text:'^alpha$'}).total,0);
  assert.equal(queryCatalog(fixture,{text:'alpha',kind:'recipe'}).total,0);
  const r = queryCatalog(fixture,{text:'physics'});
  assert.deepEqual(r.results[0].reasons[0].fields,['counterexamples']);
  assert.match(r.semantics,/Not an AI/);
  assert.equal(queryCatalog(fixture,{text:'private'}).total,0,'links/evidence are not search text');
});
test('no fuzzy ID guessing, honest no-match, no fallback', () => {
  assert.equal(queryCatalog(fixture,{id:'motion.missing'}).total,0);
  assert.deepEqual(queryCatalog(fixture,{text:'不存在'}).results,[]);
  for (const id of ['Motion.a',' motion.a','motion.a ','motion','../motion.a']) assert.throws(()=>queryCatalog(fixture,{id}));
});
test('strict query types, keys, enums, lengths, controls and limits', () => {
  const invalid = [null,[],new Date(),{unknown:1},{[Symbol('x')]:1},{text:''},{text:' '},{text:null},{text:'x'.repeat(257)},{text:'a\nb'},{tag:'x'.repeat(65)},{tag:3},{kind:'Motion'},{status:'stable'},{id:'a.'.repeat(65)},...[-1,0,101,1.1,NaN,Infinity,'1',null,undefined].map(limit=>({limit}))];
  for (const q of invalid) assert.throws(()=>queryCatalog(fixture,q),String(q));
  for (const q of [{text:'x'.repeat(256)},{tag:'x'.repeat(64)},{limit:1},{limit:100}]) assert.doesNotThrow(()=>queryCatalog(fixture,q));
  assert.throws(()=>queryCatalog({schemaVersion:2,elements:[]}));
  assert.throws(()=>queryCatalog({schemaVersion:1,elements:[item('motion.a'),item('motion.a')]}));
});
test('strict CLI unknown/repeated/missing/extra options and command constraints', () => {
  const invalid = [[],['wrong'],['--help','extra'],['list','--out','file'],['list','--limit'],['list','--tag','a','--tag','b'],['list','--id','motion.a'],['show'],['show','--id','motion.a','--text','a'],['find'],['list','--kind','invalid'],['list','--status','stable'],['list','--'+'x'.repeat(257),'a'],['list','--bad\nflag','a'],['find','--text',''],...['01','1e1','1.0','+1','0','101'].map(v=>['list','--limit',v]),['list',...Array(14).fill('x')]];
  for (const args of invalid) assert.throws(()=>parseCatalogArgs(args),JSON.stringify(args));
  assert.deepEqual(parseCatalogArgs(['--help']),{help:true});
  assert.equal(parseCatalogArgs(['find','--tag',' 淡入 ']).query.tag,'淡入');
});
test('real 46 entries: tags, status, metadata and executable inputs preserved', () => {
  const before = JSON.stringify(catalog);
  const r = queryCatalog(catalog,{limit:100}); assert.equal(r.total,46); assert.equal(r.truncated,false);
  for (const e of catalog.elements) {
    assert.equal(e.status,'experimental'); assert.ok(e.tags.length>0);
    const hit = queryCatalog(catalog,{id:e.id}).results[0]; assert.deepEqual(hit.element,e);
    assert.ok(hit.element.example); assert.ok(hit.element.evidence); assert.ok(Array.isArray(hit.element.knowledgeLinks));
  }
  assert.equal(queryCatalog(catalog,{tag:'重组'}).total,2);
  assert.equal(queryCatalog(catalog,{kind:'recipe'}).total,7);
  assert.equal(JSON.stringify(catalog),before);
});
test('CLI from unrelated cwd: JSON success/no-match, errors stderr only; never writes output', () => {
  for (const args of [['list'],['show','--id','fragment.fixed-tiles'],['find','--text','不存在']]) {
    const r=run(args); assert.equal(r.status,0,r.stderr); assert.equal(r.stderr,''); assert.ok(Array.isArray(JSON.parse(r.stdout).results));
  }
  const r=run(['list','--out','/tmp/do-not-write']); assert.equal(r.status,2); assert.equal(r.stdout,''); assert.match(r.stderr,/unknown option/);
  const absent=JSON.parse(run(['show','--id','motion.missing']).stdout); assert.equal(absent.total,0);
});
test('runtime permission isolation: only three static files readable, no entry/private/network access needed', () => {
  const r = spawnSync(process.execPath, [
    '--permission', `--allow-fs-read=${cli}`, `--allow-fs-read=${root}lib/catalog-query.mjs`, `--allow-fs-read=${root}catalog.json`,
    cli,'list','--limit','100',
  ], {encoding:'utf8',cwd:'/tmp'});
  assert.equal(r.status,0,r.stderr); assert.equal(JSON.parse(r.stdout).total,46);
});

// Metadata guards prevent a technical fixture from becoming a style endorsement.
test('experimental band and light recipe preserve independent quality gates in query output', () => {
  for (const id of ['geometry.sampled-band', 'recipe.light-echo-field']) {
    const e = queryCatalog(catalog, {id}).results[0].element;
    assert.equal(e.status, 'experimental');
    assert.equal(e.evidence.artisticReview, 'NOT_RUN');
    assert.equal(e.evidence.originalProductionTransfer, 'NOT_RUN');
    assert.ok(e.evidence.technicalTests.length > 0);
    assert.ok(e.counterexamples.some(value => value.includes('不得默认推荐') && value.includes('风格锚点')));
  }
});


test('data-flow accounting and film coverage preserve independent quality gates', () => {
  assert.equal(catalog.elements.filter(e => e.kind !== 'recipe').length,39);
  assert.equal(catalog.elements.filter(e => e.kind === 'recipe').length,7);
  for (const id of ['composition.layered-dag','composition.weighted-flow','recipe.flow-handoff']) {
    const e=queryCatalog(catalog,{id}).results[0].element;
    assert.equal(e.evidence.videoValidation,'VERIFIED_PRIVATE_CANDIDATE_CALL_TRACE');
    assert.equal(e.evidence.artisticReview,'LIMITED_ACCEPTANCE_NOT_STYLE_ENDORSEMENT');
    assert.equal(e.evidence.ownerArtisticAcceptance,'LIMITED_ACCEPTANCE_NOT_STYLE_ENDORSEMENT');
    assert.match(e.evidence.ownerFeedbackScope,/not endorsed as a style reference/);
    assert.equal(e.status,'experimental');
    assert.equal(e.evidence.audioListening,'NOT_LISTENED');
    assert.equal(e.evidence.normalSpeedViewing,'NOT_DONE');
    assert.equal(e.evidence.originalProductionTransfer,'NOT_RUN');
    assert.match(e.evidence.validationCoverage,/frames/);
    assert.equal(e.evidence.guidance,'docs/data-flow.md');
  }
});

test('raster category preserves two legacy feedback records while exposing four distinct mechanisms', () => {
  const r=queryCatalog(catalog,{kind:'raster'});
  assert.deepEqual(r.results.map(x=>x.element.id),['raster.displacement-map','raster.matte','raster.neighborhood-convolution','raster.projective-quad']);
  for(const {element:e} of r.results.filter(x=>['raster.displacement-map','raster.matte'].includes(x.element.id))){
    assert.equal(e.status,'experimental');assert.match(e.evidence.ownerFeedbackScope,/not endorsed as a style reference/);assert.equal(e.evidence.artisticReview,'LIMITED_ACCEPTANCE_NOT_STYLE_ENDORSEMENT');
    assert.equal(e.evidence.ownerArtisticAcceptance,'LIMITED_ACCEPTANCE_NOT_STYLE_ENDORSEMENT');assert.equal(e.evidence.audioListening,'NOT_LISTENED');
    assert.equal(e.evidence.normalSpeedViewing,'NOT_DONE');assert.equal(e.evidence.originalProductionTransfer,'NOT_RUN');
    assert.equal(e.evidence.videoValidation,'VERIFIED_PRIVATE_CANDIDATE_CALL_TRACE');
    assert.match(e.evidence.validationCoverage,/actual samples/);assert.equal(e.evidence.guidance,'docs/raster-effects.md');
    assert.match(e.evidence.sourceVersionRelation,/Catalog\/query classification/);
  }
  const cliResult=run(['list','--kind','raster']);assert.equal(cliResult.status,0,cliResult.stderr);
  assert.equal(JSON.parse(cliResult.stdout).total,4);
});

test('two-link IK records actual reachable branch coverage without promoting authored contact to physics',()=>{
 const e=queryCatalog(catalog,{id:'geometry.two-link-ik'}).results[0].element;
 assert.equal(e.kind,'geometry');assert.equal(e.status,'experimental');
 assert.equal(e.evidence.videoValidation,'VERIFIED_PRIVATE_CANDIDATE_CALL_TRACE');
 assert.equal(e.evidence.artisticReview,'REJECTED_NOT_STYLE_REFERENCE');assert.equal(e.evidence.ownerArtisticAcceptance,'REJECTED_NOT_STYLE_REFERENCE');
 assert.equal(e.evidence.audioListening,'NOT_LISTENED');assert.equal(e.evidence.normalSpeedViewing,'NOT_DONE');
 assert.equal(e.evidence.originalProductionTransfer,'NOT_RUN');assert.equal(e.evidence.guidance,'docs/two-link-ik.md');
 assert.match(e.evidence.validationCoverage,/1680.*0–839/);assert.match(e.evidence.validationCoverage,/No projected, fallback/);
 assert.match(e.evidence.sourceVersionRelation,/same solver body/);assert.match(e.evidence.sourceVersionRelation,/not a byte-identical-film claim/);assert.match(e.evidence.sourceVersionRelation,/9 fresh Node/);
 assert.equal(queryCatalog(catalog,{kind:'recipe'}).total,7);
});

test('sticky interval distinguishes actual draws from visible released geometry',()=>{
 const e=queryCatalog(catalog,{id:'composition.sticky-interval'}).results[0].element;
 assert.equal(e.api,'stickyIntervalLayout');assert.equal(e.status,'experimental');
 assert.equal(e.evidence.videoValidation,'VERIFIED_PRIVATE_CANDIDATE_CALL_TRACE');
 assert.equal(e.evidence.artisticReview,'LIMITED_ACCEPTANCE_NOT_STYLE_ENDORSEMENT');assert.equal(e.evidence.ownerArtisticAcceptance,'LIMITED_ACCEPTANCE_NOT_STYLE_ENDORSEMENT');
 assert.equal(e.evidence.normalSpeedViewing,'NOT_DONE');assert.equal(e.evidence.audioListening,'NOT_LISTENED');
 assert.equal(e.evidence.originalProductionTransfer,'NOT_RUN');assert.equal(e.evidence.guidance,'docs/sticky-interval.md');
 assert.match(e.evidence.validationCoverage,/990 successful calls/);assert.match(e.evidence.validationCoverage,/visible only276–323/);
 assert.match(e.evidence.callEvidenceScope,/input\/result snapshots/);assert.match(e.evidence.sourceVersionRelation,/not film-consumed/);
});

test('three-work owner feedback distinguishes rejection from scoped and limited acceptance without changing technical gates',()=>{
 const expected={'geometry.two-link-ik':'REJECTED_NOT_STYLE_REFERENCE','composition.plane-parallax':'POSITIVE_FEEDBACK_SCENE_SPECIFIC','composition.sticky-interval':'LIMITED_ACCEPTANCE_NOT_STYLE_ENDORSEMENT'};
 assert.equal(catalog.elements.length,46);assert.equal(catalog.elements.filter(e=>e.kind==='recipe').length,7);
 for(const [id,status]of Object.entries(expected)){const e=queryCatalog(catalog,{id}).results[0].element;
  assert.equal(e.status,'experimental');assert.equal(e.evidence.artisticReview,status);assert.equal(e.evidence.ownerArtisticAcceptance,status);
  assert.equal(e.evidence.videoValidation,'VERIFIED_PRIVATE_CANDIDATE_CALL_TRACE');assert.equal(e.evidence.audioListening,'NOT_LISTENED');
  assert.equal(e.evidence.normalSpeedViewing,'NOT_DONE');assert.equal(e.evidence.originalProductionTransfer,'NOT_RUN');assert.ok(e.evidence.technicalTests.length);
  assert.ok(e.evidence.ownerFeedbackScope.length);
 }
 assert.match(queryCatalog(catalog,{id:'geometry.two-link-ik'}).results[0].element.evidence.ownerFeedbackScope,/does not invalidate/);
 assert.match(queryCatalog(catalog,{id:'composition.plane-parallax'}).results[0].element.evidence.ownerFeedbackScope,/limited to the delivered/);
 assert.match(queryCatalog(catalog,{id:'composition.sticky-interval'}).results[0].element.evidence.ownerFeedbackScope,/not rejection/);
});


test('every catalog kind is a supported metadata filter with exact matching results', () => {
  const kinds = [...new Set(catalog.elements.map(e => e.kind))];
  assert.equal(new Set(KINDS).size, KINDS.length);
  assert.ok(Object.isFrozen(KINDS));
  for (const kind of kinds) {
    assert.ok(KINDS.includes(kind), `catalog kind ${kind} must be queryable`);
    const expected = catalog.elements.filter(e => e.kind === kind).map(e => e.id).sort();
    const parsed = parseCatalogArgs(['list', '--kind', kind, '--limit', '100']);
    assert.equal(parsed.query.kind, kind);
    assert.deepEqual(queryCatalog(catalog, parsed.query).results.map(r => r.element.id), expected);
  }
});

test('field metadata filtering preserves detached evidence without executing entries', () => {
  const before = JSON.stringify(catalog);
  const parsed = parseCatalogArgs(['find', '--kind', 'field', '--text', 'attractor']);
  const result = queryCatalog(catalog, parsed.query);
  assert.equal(result.total, 1);
  const entry = result.results[0].element;
  assert.equal(entry.id, 'field.attractor-orientation');
  assert.equal(entry.api, 'compileAttractorField');
  assert.equal(entry.status, 'experimental');
  assert.deepEqual(entry, catalog.elements.find(e => e.id === entry.id));
  entry.example.columns = -1;
  entry.evidence = {changed: true};
  assert.equal(JSON.stringify(catalog), before);
  for (const kind of ['fields', 'Field', ' field ', 'unknown']) {
    assert.throws(() => queryCatalog(catalog, {kind}), /invalid kind/);
    assert.throws(() => parseCatalogArgs(['list', '--kind', kind]), /invalid kind/);
  }
});

test('field CLI list/find succeeds from unrelated cwd under static-file-only permissions', () => {
  for (const args of [['list', '--kind', 'field'], ['find', '--kind', 'field', '--text', 'attractor']]) {
    const ordinary = run(args);
    assert.equal(ordinary.status, 0, ordinary.stderr);
    assert.equal(ordinary.stderr, '');
    assert.deepEqual(JSON.parse(ordinary.stdout).results.map(r => r.element.id), ['field.attractor-orientation']);
    const restricted = spawnSync(process.execPath, [
      '--permission', `--allow-fs-read=${cli}`, `--allow-fs-read=${root}lib/catalog-query.mjs`, `--allow-fs-read=${root}catalog.json`,
      cli, ...args,
    ], {encoding: 'utf8', cwd: '/tmp'});
    assert.equal(restricted.status, 0, restricted.stderr);
    assert.equal(restricted.stderr, '');
    assert.equal(restricted.stdout, ordinary.stdout);
  }
  const invalid = run(['list', '--kind', 'fields']);
  assert.equal(invalid.status, 2);
  assert.equal(invalid.stdout, '');
  assert.match(invalid.stderr, /invalid kind/);
});
