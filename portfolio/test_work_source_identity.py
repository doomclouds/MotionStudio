"""Frozen source checks: real Git trees and selected-work negative cases, no render."""
import copy
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import source_identity as si

ROOT = Path(__file__).resolve().parents[1]
WORKS = ROOT / 'portfolio/works'

class GitFixture(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.git('init', '-q')
        (self.root / 'engine/design-elements/families/demo').mkdir(parents=True)
        self.put('families/demo/index.mjs', "import {x} from '../../shared.mjs';export const y=x;")
        self.put('shared.mjs', "import './families/demo/index.mjs';export const x=1;")
        self.commit = self.commit_tree()
    def tearDown(self):
        self.tmp.cleanup()
    def git(self, *args):
        env = {k:v for k,v in os.environ.items() if not k.startswith('GIT_')}
        return subprocess.check_output(['git','-C',str(self.root),'-c','user.name=Source test','-c','user.email=source-test@example.invalid',*args], env=env, stderr=subprocess.PIPE)
    def put(self, name, text):
        p = self.root / si.BASE / name
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text)
    def commit_tree(self):
        self.git('add','-A');self.git('commit','-qm','Synthetic source-identity fixture')
        return self.git('rev-parse','HEAD').decode().strip()
    def test_all_js_comment_terminators_preserve_reexport_closure(self):
        self.put('leaf.mjs','export const x=1;')
        for separator in ('\n','\r','\u2028','\u2029'):
            with self.subTest(separator=repr(separator)):
                self.put('line.mjs', "// harmless comment"+separator+"export {x} from './leaf.mjs';")
                self.assertEqual(si.closure(si.GitSource(self.root,self.commit_tree()),'line.mjs'),{'line.mjs','leaf.mjs'})
    def test_historical_catalog_duplicate_keys_rejected(self):
        self.put('catalog.json', '{"assets":[],"assets":[]}')
        with self.assertRaises(si.ManifestError):si.historical_catalog(si.GitSource(self.root,self.commit_tree()))
    def test_historical_catalog_duplicate_family_ids_rejected(self):
        self.put('catalog.json', '{"assets":[{"id":"duplicate","entry":"a.mjs"},{"id":"duplicate","entry":"b.mjs"}]}')
        with self.assertRaises(si.Invalid):si.historical_catalog(si.GitSource(self.root,self.commit_tree()))
    def test_historical_catalog_malformed_rows_rejected(self):
        for data in ([], {'assets': None}, {'assets': [123]}, {'assets': [{'id': 'demo', 'entry': 123}]}):
            with self.subTest(data=data):
                self.put('catalog.json', json.dumps(data))
                with self.assertRaises(si.Invalid):
                    si.historical_catalog(si.GitSource(self.root,self.commit_tree()))
    def test_parent_relative_import_cycle_has_exact_closure(self):
        self.assertEqual(si.closure(si.GitSource(self.root,self.commit),'families/demo/index.mjs'), {'families/demo/index.mjs','shared.mjs'})
    def test_real_git_symlink_leaf_rejected(self):
        (self.root/si.BASE/'alias.mjs').symlink_to('shared.mjs')
        src=si.GitSource(self.root,self.commit_tree())
        with self.assertRaisesRegex(si.Invalid,'NONREGULAR'):src.read('alias.mjs')
    def test_real_git_symlink_ancestor_rejected(self):
        (self.root/si.BASE/'alias').symlink_to('families/demo',target_is_directory=True)
        src=si.GitSource(self.root,self.commit_tree())
        with self.assertRaisesRegex(si.Invalid,'SYMLINK'):src.read('alias/index.mjs')
    def test_missing_commit_is_blocked_not_invalid(self):
        with self.assertRaises(si.Unavailable):si.GitSource(self.root,'0'*40)
    def test_blob_is_not_a_commit(self):
        oid=self.git('rev-parse',self.commit+':engine/design-elements/shared.mjs').decode().strip()
        with self.assertRaisesRegex(si.Invalid,'NOT_COMMIT'):si.GitSource(self.root,oid)
    def test_missing_path_is_failed(self):
        with self.assertRaisesRegex(si.Invalid,'PATH_MISSING'):si.GitSource(self.root,self.commit).read('missing.mjs')
    def test_root_escape_rejected(self):
        self.put('escape.mjs',"import '../outside.mjs';")
        with self.assertRaises(si.Invalid):si.closure(si.GitSource(self.root,self.commit_tree()),'escape.mjs')
    def test_git_environment_cannot_redirect_requested_repo(self):
        with patch.dict(os.environ,{'GIT_DIR':'/not/a/repository','GIT_WORK_TREE':'/not/a/worktree','GIT_OBJECT_DIRECTORY':'/none','GIT_ALTERNATE_OBJECT_DIRECTORIES':'/none'}):
            self.assertIn('shared.mjs',si.closure(si.GitSource(self.root,self.commit),'families/demo/index.mjs'))
    def test_child_without_git_must_not_discover_parent(self):
        child=self.root/'child';child.mkdir()
        with self.assertRaisesRegex(si.Unavailable,'ROOT_MISMATCH'):si.GitSource(child,self.commit)
    def test_partial_clone_is_blocked_without_lazy_fetch(self):
        self.git('config','remote.origin.promisor','true')
        with self.assertRaisesRegex(si.Unavailable,'PARTIAL_CLONE'):si.GitSource(self.root,self.commit)
    def test_replace_refs_are_ignored(self):
        self.put('shared.mjs','export const changed=2;')
        later=self.commit_tree();self.git('replace',self.commit,later)
        self.assertIn(b'export const x=1;',si.GitSource(self.root,self.commit).read('shared.mjs'))
    def test_gitlink_not_a_source_directory(self):
        self.git('update-index','--add','--cacheinfo','160000,'+self.commit+',engine/design-elements/submodule')
        self.git('commit','-qm','Synthetic gitlink fixture')
        latest=self.git('rev-parse','HEAD').decode().strip()
        with self.assertRaises(si.Invalid):si.GitSource(self.root,latest).read('submodule/index.mjs')

class StaticSyntax(unittest.TestCase):
    def test_hashbang_cannot_hide_following_declarations(self):
        for tail in ('import(name);', 'export {x} from "./hidden.mjs";'):
            source = "#! arbitrary ' \n" + tail + " // '"
            with self.subTest(tail=tail), self.assertRaisesRegex(si.Invalid, 'UNSUPPORTED_HASHBANG'):
                si.specifiers(source.encode())
    def test_all_js_comment_terminators_expose_dynamic_import(self):
        for separator in ('\n','\r','\u2028','\u2029'):
            with self.subTest(separator=repr(separator)),self.assertRaises(si.Invalid):
                si.specifiers(("// harmless comment"+separator+"import('./hidden.mjs');").encode())
    def test_literal_evaluator_access_rejected_without_sandbox_claim(self):
        with self.assertRaises(si.Invalid):si.specifiers(b"globalThis['eval']('import(\"./hidden.mjs\")');")
    def test_literals_comments_regex_do_not_create_dependencies(self):
        raw=b'''// harmless comment\nconst text="ordinary text"; const regex=/ordinary[(]/; /* harmless */ export const x=1;'''
        self.assertEqual(si.specifiers(raw),[])
    def test_division_after_property_or_string_cannot_hide_import(self):
        for source in (b"obj.return / import(name) /2;", b"obj?.return / import('node:fs') /2;",
                       b"'return' / import(name) /2;", b"'=' / import(name) /2;"):
            with self.subTest(source=source), self.assertRaises(si.Invalid):
                si.specifiers(source)
    def test_ambiguous_statement_regex_cannot_hide_import(self):
        for tail in ('import(name);', 'export {x} from "./hidden.mjs";'):
            source = "if (ok) /'/.test(x); " + tail + " // '"
            with self.subTest(tail=tail), self.assertRaises(si.Invalid):
                si.specifiers(source.encode())
    def test_return_regex_supported_but_dependency_words_rejected(self):
        self.assertEqual(si.specifiers(b"function f(){return /ordinary[a-z]/;}"), [])
        for word in ('import', 'export', 'require', 'eval', 'Function'):
            with self.subTest(word=word), self.assertRaises(si.Invalid):
                si.specifiers(('const r=/' + word + '[(]/;').encode())
    def test_template_interpolation_cannot_hide_following_declarations(self):
        for tail in ('import(name);', 'export {x} from "./hidden.mjs";'):
            source = 'const t = `${"`"}`; ' + tail + ' // "'
            with self.subTest(tail=tail), self.assertRaises(si.Invalid):
                si.specifiers(source.encode())
    def test_simple_template_interpolation_then_reexport(self):
        source = "const t=`rgba(${rgb(h).join(',')},${a})`;export {x} from './visible.mjs';"
        self.assertEqual(si.specifiers(source.encode()), ['./visible.mjs'])
    def test_hidden_raw_module_keyword_offsets_rejected(self):
        for source in (b'// import text\nexport const x=1;', b'/* export text */ const x=1;',
                       b'const x="import text";', b"const x='export text';",
                       b'const x=`import text`;', b'const x=/export/;',
                       "const αimport = 1; const x='import';".encode()):
            with self.subTest(source=source), self.assertRaises(si.Invalid):
                si.specifiers(source)
    def test_reexport_and_literal_imports(self):
        self.assertEqual(si.specifiers(b"import './side.mjs';export {x as y} from './helper.mjs';"),['./side.mjs','./helper.mjs'])
    def test_unknown_dependency_forms_fail_closed(self):
        sources=[b"import('./x.mjs');", b"import /* gap */ ('./x.mjs');", b"import(`./${name}.mjs`);", b"export {x} from target;", b"import x from './x.mjs' with {type:'json'};", b"import x from './x\\u002emjs';", b"const x=`${import('./x.mjs')}`;", b"const r=require('./x.cjs');", b"import.meta.resolve('./x');", b"import {x};"]
        for source in sources:
            with self.subTest(source=source), self.assertRaises(si.Invalid):si.specifiers(source)
    def test_path_normalization_and_escape(self):
        self.assertEqual(si.target('families/a/index.mjs','../../shared.mjs'),'shared.mjs')
        for spec in ('../../../out.mjs','/outside','https://example.com/x','./%2e%2e/x','./a?x','./a#x'):
            with self.subTest(spec=spec),self.assertRaises(si.Invalid):si.target('families/a/index.mjs',spec)

class SelectedWorks(unittest.TestCase):
    def require_history(self, *, pixel=False):
        commits=['0947507961eb5624ddd5c1240758baefa3246fd8']
        if pixel:commits.append('562c89384c931bf5ef3cbb931ac2a4866607011b')
        for commit in commits:
            try:
                si.GitSource(ROOT,commit).read('catalog.json')
            except si.Unavailable as error:
                self.skipTest('BLOCKED: historical fixture unavailable: '+str(error))
    def copy_work(self, temp, name):
        p=Path(temp)/name;shutil.copytree(WORKS/name,p);return p
    def save(self,p,d):
        (p/'work.json').write_text(json.dumps(d))
    def rehash(self,p,d,name):
        next(x for x in d['files'] if x['path']==name)['sha256']=si.sha((p/name).read_bytes())
    def test_all_seventeen_historical_identities_and_no_state_changes(self):
        self.require_history(pixel=True)
        manifests=list(WORKS.glob('*/work.json'));before={p:p.read_bytes() for p in manifests};found=[]
        for p in manifests:
            d=json.loads(p.read_text())
            if any(u['familyId'] in {'design.color-sections.v1','design.material-surfaces.v1'} for u in d.get('design',{}).get('assetUsage',[])):
                r=si.verify_source(p,ROOT);self.assertEqual(r['status'],'PASSED',r);self.assertEqual(r['recoveryAvailability'],'NOT_CHECKED');found.append(d['id'])
        self.assertEqual(len(found),17);self.assertEqual(len(manifests),66)
        self.assertTrue(all(p.read_bytes()==raw for p,raw in before.items()))
    def test_duplicate_declared_family_is_failed_before_source_access(self):
        with tempfile.TemporaryDirectory() as t:
            p=self.copy_work(t,'friendly-fintech-study');d=json.loads((p/'work.json').read_text())
            d['design']['assetUsage'].append(copy.deepcopy(d['design']['assetUsage'][0]));self.save(p,d)
            r=si.verify_source(p,Path('/missing'))
            self.assertEqual(r['status'],'FAILED');self.assertIn('DUPLICATE_FAMILY_USAGE',r['errors'])
    def test_missing_source_blocks_selected_work(self):
        with tempfile.TemporaryDirectory() as t:
            r=si.verify_source(WORKS/'friendly-fintech-study',t)
            self.assertEqual(r['status'],'BLOCKED');self.assertEqual(r['recoveryAvailability'],'BLOCKED_FOR_RESTORE')
    def test_wrong_hash_fails(self):
        self.require_history()
        with tempfile.TemporaryDirectory() as t:
            p=self.copy_work(t,'friendly-fintech-study');d=json.loads((p/'work.json').read_text());d['design']['assetUsage'][0]['moduleSha256']='0'*64;self.save(p,d)
            r=si.verify_source(p,ROOT);self.assertEqual(r['status'],'FAILED');self.assertIn('MODULE_HASH_MISMATCH',r['errors'])
    def test_fabricated_commit_blocks_not_passes(self):
        with tempfile.TemporaryDirectory() as t:
            p=self.copy_work(t,'friendly-fintech-study');d=json.loads((p/'work.json').read_text());d['design']['assetUsage'][0]['sourceCommit']='0'*40;self.save(p,d)
            self.assertEqual(si.verify_source(p,ROOT)['status'],'BLOCKED')
    def test_wrong_historical_path_fails(self):
        self.require_history()
        with tempfile.TemporaryDirectory() as t:
            p=self.copy_work(t,'friendly-fintech-study');d=json.loads((p/'work.json').read_text());d['design']['assetUsage'][0]['modulePath']='engine/design-elements/families/material-surfaces/index.mjs';self.save(p,d)
            self.assertIn('HISTORICAL_FAMILY_PATH_MISMATCH',si.verify_source(p,ROOT)['errors'])
    def test_missing_locked_shared_dependency_fails_after_inventory_rehash(self):
        self.require_history()
        with tempfile.TemporaryDirectory() as t:
            p=self.copy_work(t,'xie-symbol-study');d=json.loads((p/'work.json').read_text());l=json.loads((p/'ui-dependencies.json').read_text());l['files']=[x for x in l['files'] if x['path']!='shared.mjs'];(p/'ui-dependencies.json').write_text(json.dumps(l));self.rehash(p,d,'ui-dependencies.json');self.save(p,d)
            self.assertIn('DEPENDENCY_CLOSURE_INCOMPLETE',si.verify_source(p,ROOT)['errors'])
    def test_snapshot_tampering_fails_even_if_inventory_is_rehashed(self):
        self.require_history()
        with tempfile.TemporaryDirectory() as t:
            p=self.copy_work(t,'irreverent-pop-study');d=json.loads((p/'work.json').read_text());name=d['design']['assetUsage'][0]['snapshotPath'];(p/name).write_bytes((p/name).read_bytes()+b'\n// tampered');self.rehash(p,d,name);self.save(p,d)
            self.assertIn('SNAPSHOT_HASH_MISMATCH',si.verify_source(p,ROOT)['errors'])
    def test_malformed_lock_rows_are_failed(self):
        self.require_history()
        for rows in (None, [123], [{'path': 123, 'sha256': '0'*64}], [{'path':'shared.mjs','sha256':123}]):
            with self.subTest(rows=rows), tempfile.TemporaryDirectory() as t:
                p=self.copy_work(t,'xie-symbol-study');d=json.loads((p/'work.json').read_text())
                lock=json.loads((p/'ui-dependencies.json').read_text());lock['files']=rows
                (p/'ui-dependencies.json').write_text(json.dumps(lock));self.rehash(p,d,'ui-dependencies.json');self.save(p,d)
                self.assertEqual(si.verify_source(p,ROOT)['status'],'FAILED')
    def test_snapshot_malformed_source_url_is_failed(self):
        self.require_history()
        with tempfile.TemporaryDirectory() as t:
            p=self.copy_work(t,'irreverent-pop-study');d=json.loads((p/'work.json').read_text())
            snapshots=json.loads((p/'module-snapshots.json').read_text());snapshots['files'][0]['source_url']=123
            (p/'module-snapshots.json').write_text(json.dumps(snapshots));self.rehash(p,d,'module-snapshots.json');self.save(p,d)
            r=si.verify_source(p,ROOT)
            self.assertEqual(r['status'],'FAILED');self.assertIn('SNAPSHOT_ROW_FIELDS',r['errors'])
    def test_snapshot_relocated_dependency_is_failed_after_rehash(self):
        self.require_history()
        with tempfile.TemporaryDirectory() as t:
            p=self.copy_work(t,'irreverent-pop-study');d=json.loads((p/'work.json').read_text())
            snapshots=json.loads((p/'module-snapshots.json').read_text())
            row=next(r for r in snapshots['files'] if r['path']=='design/shared.mjs')
            old=row['path'];row['path']='wrong/shared.mjs';(p/'wrong').mkdir();(p/old).rename(p/row['path'])
            next(r for r in d['files'] if r['path']==old)['path']=row['path']
            (p/'module-snapshots.json').write_text(json.dumps(snapshots));self.rehash(p,d,'module-snapshots.json');self.save(p,d)
            r=si.verify_source(p,ROOT)
            self.assertEqual(r['status'],'FAILED');self.assertIn('SNAPSHOT_DEPENDENCY_LAYOUT_MISMATCH',r['errors'])
    def test_not_applicable_is_not_source_pass(self):
        p=next(p for p in WORKS.iterdir() if not json.loads((p/'work.json').read_text()).get('design',{}).get('assetUsage'))
        r=si.verify_source(p,Path('/missing'));self.assertEqual(r['status'],'NOT_APPLICABLE');self.assertEqual(r['recoveryAvailability'],'NOT_CHECKED')

if __name__ == '__main__':
    unittest.main()
