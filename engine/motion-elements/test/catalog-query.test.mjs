import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {queryCatalog, parseCatalogArgs} from '../lib/catalog-query.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const cli = `${root}scripts/query-catalog.mjs`;
const catalog = JSON.parse(readFileSync(`${root}catalog.json`, 'utf8'));
const item = (id, extra = {}) => ({id, kind:'motion', status:'experimental', summary:'中英文 Café alpha .*', tags:['FADE','淡入'], example:{type:id}, applicability:['cards'], counterexamples:['not physics'], evidence:{tests:['private/no-read']}, knowledgeLinks:['private://do-not-open'], ...extra});
const fixture = {schemaVersion:1, elements:[item('motion.z'), item('motion.a')]};
const run = args => spawnSync(process.execPath, [cli, ...args], {encoding:'utf8', cwd:'/tmp'});

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
test('real 20 entries: tags, status, metadata and executable inputs preserved', () => {
  const before = JSON.stringify(catalog);
  const r = queryCatalog(catalog,{limit:100}); assert.equal(r.total,20); assert.equal(r.truncated,false);
  for (const e of catalog.elements) {
    assert.equal(e.status,'experimental'); assert.ok(e.tags.length>0);
    const hit = queryCatalog(catalog,{id:e.id}).results[0]; assert.deepEqual(hit.element,e);
    assert.ok(hit.element.example); assert.ok(hit.element.evidence); assert.ok(Array.isArray(hit.element.knowledgeLinks));
  }
  assert.equal(queryCatalog(catalog,{tag:'重组'}).total,2);
  assert.equal(queryCatalog(catalog,{kind:'recipe'}).total,3);
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
  assert.equal(r.status,0,r.stderr); assert.equal(JSON.parse(r.stdout).total,20);
});
