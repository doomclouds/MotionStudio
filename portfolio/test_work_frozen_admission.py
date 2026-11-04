"""Admission uses frozen source identities without restoring or changing works.

Synthetic Git fixtures exercise current-tree migrations independently of real
history availability. Their acceptance flags are test data, not actual reviews.
"""
import copy
import hashlib
import json
import os
from pathlib import Path
import shutil
import struct
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import admission
import source_identity as si
from validate_work import Blocked, read, sha

ROOT = Path(__file__).resolve().parents[1]
WORKS = ROOT / 'portfolio/works'


class FrozenAdmission(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.base = Path(self.tmp.name)
        self.repo = self.base / 'repo'
        self.repo.mkdir()
        self.git('init', '-q')
        self.put_source('catalog.json', json.dumps({'assets': [
            {'id': 'design.color-sections.v1', 'entry': 'color-sections.mjs'}]}))
        self.put_source('color-sections.mjs',
                        "import {helper} from './shared.mjs';export function sections(){return helper();}")
        self.put_source('shared.mjs', 'export function helper(){return 1;}')
        (self.repo / 'rules.md').write_text('Synthetic rule reference only.')
        self.commit = self.commit_tree()
        self.folder = self.base / 'synthetic'
        self.folder.mkdir()
        self.manifest = self.make_work()
        self.save()

    def git(self, *args):
        env = {k: v for k, v in os.environ.items() if not k.startswith('GIT_')}
        return subprocess.check_output(
            ['git', '-C', str(self.repo), '-c', 'user.name=Admission test',
             '-c', 'user.email=admission-test@example.invalid', *args],
            env=env, stderr=subprocess.PIPE).decode().strip()

    def put_source(self, name, text):
        path = self.repo / si.BASE / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text)

    def commit_tree(self):
        self.git('add', '-A')
        self.git('commit', '-qm', 'Synthetic frozen-admission fixture')
        return self.git('rev-parse', 'HEAD')

    def make_work(self):
        # Structural JPEG fixture, not rendered or accepted artwork.
        cover = (b'\xff\xd8\xff\xc0' + struct.pack('>H', 11) + b'\x08' +
                 struct.pack('>HH', 1, 1) + b'\x01\x01\x11\x00' +
                 b'\xff\xda\x00\x08\x01\x01\x00\x00\x3f\x00\x00\xff\xd9')
        dependency_rows = [{'path': name, 'sha256': sha(self.repo / si.BASE / name)}
                           for name in ('color-sections.mjs', 'shared.mjs')]
        lock = {'repository': 'MotionStudio', 'tested_commit': self.commit,
                'root': si.BASE[:-1], 'files': dependency_rows}
        contents = {
            'README.md': ('documentation', b'Synthetic unit fixture only.'),
            'CREDITS.md': ('documentation', b'Synthetic unit fixture only.'),
            'LICENSE': ('license', b'Synthetic fixture terms only.'),
            'design.md': ('documentation', b'Synthetic decision card only.'),
            'analysis.md': ('documentation', b'Synthetic source analysis only.'),
            'runtime-lock.json': ('lock', b'{"synthetic":true}'),
            'ui-dependencies.json': ('lock', json.dumps(lock).encode()),
            'scene.mjs': ('source', b"import {sections} from '../../engine/design-elements/color-sections.mjs';sections();"),
            'cover.jpg': ('cover', cover),
        }
        files = []
        for name, (kind, raw) in contents.items():
            (self.folder / name).write_bytes(raw)
            files.append({'path': name, 'kind': kind, 'sha256': hashlib.sha256(raw).hexdigest()})
        return {
            'schema': 'motionstudio.work/1', 'id': 'synthetic', 'version': '1.0.0',
            'title': 'Synthetic unit fixture', 'kind': 'static', 'lifecycle': 'retained',
            'publication': {'status': 'released'},
            'authorship': {'unofficial_recreation': False},
            'rights': {'status': 'reviewed', 'credits': 'CREDITS.md', 'notices': ['LICENSE'],
                       'evidence_urls': ['https://example.com/fixture-terms']},
            'files': files,
            'runtime': [{'name': 'synthetic-runtime', 'version': '1.0.0', 'lock': 'runtime-lock.json'}],
            'render': {'entrypoint': 'scene.mjs', 'width': 1, 'height': 1},
            'resources': [{'id': 'fixture-resource', 'kind': 'other',
                           'kind_basis': {'method': 'declared'}, 'mode': 'fetch',
                           'license': 'Synthetic fixture terms', 'notice': 'LICENSE',
                           'source_url': 'https://example.com/fixture-terms',
                           'sha256': '0' * 64, 'permission': 'explicit-license',
                           'fetch_url': 'https://example.com/fixture.txt', 'max_bytes': 1}],
            'cover': {'path': 'cover.jpg', 'kind': 'rendered-static',
                      'source_sha256': '0' * 64, 'frame': None,
                      'rights_status': 'reviewed', 'credit': 'CREDITS.md'},
            'acceptance': {'complete_work': True, 'owner_keep': True,
                           'clean_restore': True, 'technical': True,
                           'visual': {'status': 'NOT_REVIEWED', 'coverage': 'Synthetic declarations only.'}},
            'evidence': {'reviewArtifacts': {'status': 'NOT_INCLUDED'}},
            'design': {'decisionCard': 'design.md', 'sourceAnalysis': ['analysis.md'],
                       'ruleRefs': ['rules.md'], 'ruleStatus': 'Synthetic test rule only.',
                       'nonAssetNote': 'Synthetic fixture only.', 'assetUsage': [{
                           'familyId': 'design.color-sections.v1', 'mode': 'runtime-import',
                           'modulePath': si.BASE + 'color-sections.mjs',
                           'moduleSha256': dependency_rows[0]['sha256'],
                           'sourceCommit': self.commit, 'callsite': 'scene.mjs',
                           'importToken': 'color-sections.mjs', 'callToken': 'sections',
                           'visibleRole': 'Synthetic fixture only.', 'snapshotPath': None}]},
        }

    def save(self):
        (self.folder / 'work.json').write_text(json.dumps(self.manifest))

    def rehash(self, name):
        next(r for r in self.manifest['files'] if r['path'] == name)['sha256'] = sha(self.folder / name)

    def assert_status(self, result, status, source=None):
        self.assertEqual(result['status'], status, result)
        self.assertEqual(result['static_checks'], status)
        self.assertEqual(result['local_checks'], 'PASSED')
        self.assertEqual(result['sourceVerification'], source or status)
        self.assertEqual(result['lifecycle'], 'retained')
        self.assertEqual(result['admissible'], status == 'PASSED')

    def test_default_source_is_local_repo_and_only_git_reads_execute(self):
        before = {p: p.read_bytes() for p in self.folder.iterdir()}
        with patch.object(si.subprocess, 'run', wraps=subprocess.run) as calls:
            result = admission.inspect(self.folder, self.repo)
        self.assert_status(result, 'PASSED')
        self.assertEqual(result['recoveryAvailability'], 'NOT_CHECKED')
        self.assertEqual(result['reason'], 'RECORDED_GATES_PRESENT')
        self.assertEqual(result['checks'][0]['sourceCommit'], self.commit)
        self.assertEqual(result['checks'][0]['closure'], ['color-sections.mjs', 'shared.mjs'])
        self.assertEqual(result['errors'], [])
        self.assertIn('no restore', result['scope'])
        self.assertIn('new owner acceptance', result['scope'])
        self.assertTrue(calls.call_count)
        for call in calls.call_args_list:
            command = call.args[0]
            self.assertEqual(command[0], 'git')
            self.assertIn(command[6], {'rev-parse', 'config', 'cat-file', 'ls-tree'})
        self.assertEqual({p: p.read_bytes() for p in self.folder.iterdir()}, before)

    def test_archive_blocks_selected_work_without_changing_recorded_lifecycle(self):
        archive = self.base / 'archive'
        shutil.copytree(self.repo, archive, ignore=shutil.ignore_patterns('.git'))
        before = (self.folder / 'work.json').read_bytes()
        result = admission.inspect(self.folder, archive)
        self.assert_status(result, 'BLOCKED')
        self.assertEqual(result['reason'], 'SOURCE_VERIFICATION_BLOCKED')
        self.assertEqual(result['recoveryAvailability'], 'BLOCKED_FOR_RESTORE')
        self.assertEqual(result['errors'], ['SOURCE_GIT_ROOT_MISMATCH_OR_UNAVAILABLE'])
        self.assertEqual((self.folder / 'work.json').read_bytes(), before)
        self.assertEqual(read(self.folder / 'work.json')['design']['assetUsage'][0]['sourceCommit'], self.commit)

    def test_explicit_local_source_verifies_archive(self):
        archive = self.base / 'archive'
        shutil.copytree(self.repo, archive, ignore=shutil.ignore_patterns('.git'))
        result = admission.inspect(self.folder, archive, source_repo=self.repo)
        self.assert_status(result, 'PASSED')

    def test_missing_explicit_source_cannot_fallback_to_valid_default(self):
        result = admission.inspect(self.folder, self.repo, source_repo=self.base / 'missing')
        self.assert_status(result, 'BLOCKED')
        self.assertEqual(result['errors'], ['SOURCE_REPOSITORY_MISSING'])

    def test_missing_pinned_commit_cannot_fallback_to_matching_current_module(self):
        self.manifest['design']['assetUsage'][0]['sourceCommit'] = '0' * 40
        self.save()
        result = admission.inspect(self.folder, self.repo)
        self.assert_status(result, 'BLOCKED')
        self.assertEqual(result['errors'], ['PINNED_COMMIT_UNAVAILABLE'])

    def test_false_hash_is_failed_not_blocked(self):
        self.manifest['design']['assetUsage'][0]['moduleSha256'] = '0' * 64
        self.save()
        result = admission.inspect(self.folder, self.repo)
        self.assert_status(result, 'FAILED')
        self.assertEqual(result['reason'], 'SOURCE_VERIFICATION_FAILED')
        self.assertEqual(result['recoveryAvailability'], 'INVALID_SOURCE')
        self.assertEqual(result['errors'], ['MODULE_HASH_MISMATCH'])

    def migrate_current_catalog(self):
        (self.repo / si.BASE / 'color-sections.mjs').unlink()
        self.put_source('families/color-sections/index.mjs',
                        "import {helper} from '../../shared.mjs';export function sections(){return helper();}")
        self.put_source('catalog.json', json.dumps({'assets': [
            {'id': 'design.color-sections.v1', 'entry': 'families/color-sections/index.mjs'}]}))
        # Current closure is deliberately incompatible and cannot be consulted.
        self.put_source('shared.mjs', "import './current-only-missing.mjs';export const current=2;")
        self.commit_tree()

    def test_new_catalog_path_and_deleted_old_module_do_not_invalidate_frozen_work(self):
        before = {p: p.read_bytes() for p in self.folder.iterdir()}
        self.migrate_current_catalog()
        self.assertFalse((self.repo / si.BASE / 'color-sections.mjs').exists())
        self.assertNotEqual(self.git('rev-parse', 'HEAD'), self.commit)
        result = admission.inspect(self.folder, self.repo)
        self.assert_status(result, 'PASSED')
        self.assertEqual(result['checks'][0]['modulePath'], si.BASE + 'color-sections.mjs')
        self.assertEqual(result['checks'][0]['sourceCommit'], self.commit)
        self.assertEqual({p: p.read_bytes() for p in self.folder.iterdir()}, before)

    def test_current_catalog_cannot_validate_forged_historical_path(self):
        self.migrate_current_catalog()
        usage = self.manifest['design']['assetUsage'][0]
        usage['modulePath'] = si.BASE + 'families/color-sections/index.mjs'
        usage['moduleSha256'] = sha(self.repo / usage['modulePath'])
        self.save()
        result = admission.inspect(self.folder, self.repo)
        self.assert_status(result, 'FAILED')
        self.assertEqual(result['errors'], ['HISTORICAL_FAMILY_PATH_MISMATCH'])

    def test_historical_closure_and_lock_remain_strict_after_local_rehash(self):
        lock = read(self.folder / 'ui-dependencies.json')
        lock['files'] = [lock['files'][0]]
        (self.folder / 'ui-dependencies.json').write_text(json.dumps(lock))
        self.rehash('ui-dependencies.json')
        self.save()
        result = admission.inspect(self.folder, self.repo)
        self.assert_status(result, 'FAILED')
        self.assertEqual(result['errors'], ['DEPENDENCY_CLOSURE_INCOMPLETE'])

    def test_call_evidence_still_required(self):
        (self.folder / 'scene.mjs').write_text(
            "import {sections} from '../../engine/design-elements/color-sections.mjs';// sections();")
        self.rehash('scene.mjs')
        self.save()
        result = admission.inspect(self.folder, self.repo)
        self.assert_status(result, 'FAILED')
        self.assertEqual(result['errors'], ['CALL_EVIDENCE_MISSING'])

    def test_no_design_dependencies_are_not_source_pass(self):
        for design_present in (True, False):
            with self.subTest(design_present=design_present):
                if design_present:
                    self.manifest['design']['assetUsage'] = []
                else:
                    del self.manifest['design']
                self.save()
                with patch.object(si, 'GitSource', side_effect=AssertionError('No source is applicable')):
                    result = admission.inspect(self.folder, self.repo, source_repo=self.base / 'missing')
                self.assert_status(result, 'PASSED', source='NOT_APPLICABLE')
                self.assertEqual(result['recoveryAvailability'], 'NOT_CHECKED')
                self.assertEqual(result['checks'], [])

    def test_local_design_references_are_checked_before_source(self):
        original = copy.deepcopy(self.manifest)
        for field, value in [('decisionCard', 'missing.md'),
                             ('sourceAnalysis', ['missing-analysis.md']),
                             ('ruleRefs', ['missing-rule.md']),
                             ('ruleRefs', ['../outside.md'])]:
            with self.subTest(field=field, value=value):
                self.manifest = copy.deepcopy(original)
                self.manifest['design'][field] = value
                self.save()
                with patch.object(si, 'verify_source', side_effect=AssertionError('Local references first')):
                    with self.assertRaises(Blocked):
                        admission.inspect(self.folder, self.repo)

    def test_rule_references_use_local_repo_not_source_override(self):
        archive = self.base / 'archive'
        shutil.copytree(self.repo, archive, ignore=shutil.ignore_patterns('.git'))
        (archive / 'rules.md').unlink()
        with self.assertRaisesRegex(Blocked, 'REFERENCE_MISSING_OR_ESCAPE'):
            admission.inspect(self.folder, archive, source_repo=self.repo)

    def test_parallel_metadata_cannot_hide_in_valid_rehashed_inventory(self):
        original = copy.deepcopy(self.manifest)
        for name in ('entry.json', 'retention.json'):
            with self.subTest(name=name):
                self.manifest = copy.deepcopy(original)
                (self.folder / name).write_text('{"synthetic":true}')
                self.manifest['files'].append({'path': name, 'kind': 'config',
                                               'sha256': sha(self.folder / name)})
                self.save()
                with patch.object(si, 'verify_source', side_effect=AssertionError('Local metadata gate first')):
                    with self.assertRaisesRegex(Blocked, 'PARALLEL_METADATA_FORBIDDEN'):
                        admission.inspect(self.folder, self.repo)
                (self.folder / name).unlink()

    def test_local_safety_failures_still_raise_before_source(self):
        original = self.folder
        original_manifest = copy.deepcopy(self.manifest)
        scenarios = ['jpeg', 'floating-runtime', 'permission', 'resource-url',
                     'technical', 'rights', 'schema', 'inventory', 'source-text', 'symlink']
        for scenario in scenarios:
            with self.subTest(scenario=scenario):
                self.folder = self.base / scenario / 'synthetic'
                shutil.copytree(original, self.folder)
                self.manifest = copy.deepcopy(original_manifest)
                if scenario == 'jpeg':
                    (self.folder / 'cover.jpg').write_bytes(b'invalid JPEG')
                    self.rehash('cover.jpg')
                elif scenario == 'floating-runtime':
                    self.manifest['runtime'][0]['version'] = 'latest'
                elif scenario == 'permission':
                    self.manifest['resources'][0]['permission'] = 'user-supplied-not-distributed'
                elif scenario == 'resource-url':
                    self.manifest['resources'][0]['fetch_url'] = 'https://example.com/file?token=secret'
                elif scenario == 'technical':
                    self.manifest['acceptance']['technical'] = False
                elif scenario == 'rights':
                    self.manifest['rights']['status'] = 'reviewed-publication-scope'
                elif scenario == 'schema':
                    self.manifest['unexpected'] = True
                elif scenario == 'inventory':
                    (self.folder / 'unlisted.mjs').write_text('export const unlisted=1;')
                elif scenario == 'source-text':
                    (self.folder / 'scene.mjs').write_bytes(b'\x00')
                    self.rehash('scene.mjs')
                else:
                    (self.folder / 'analysis.md').unlink()
                    (self.folder / 'analysis.md').symlink_to(original / 'analysis.md')
                self.save()
                with patch.object(si, 'verify_source', side_effect=AssertionError('Local safety first')):
                    with self.assertRaises(Blocked):
                        admission.inspect(self.folder, self.repo)


class RecordedFrozenAdmission(unittest.TestCase):
    def test_all_66_real_works_keep_lifecycle_and_source_identity(self):
        manifests = sorted(WORKS.glob('*/work.json'))
        before = {p: p.read_bytes() for p in manifests}
        commits = {u['sourceCommit'] for p in manifests
                   for u in read(p).get('design', {}).get('assetUsage', [])}
        for commit in commits:
            try:
                si.GitSource(ROOT, commit).read('catalog.json')
            except si.Unavailable as error:
                self.skipTest('BLOCKED: historical fixture unavailable: ' + str(error))
        results = [admission.inspect(p.parent, ROOT) for p in manifests]
        self.assertEqual(len(results), 66)
        self.assertTrue(all(r['status'] == r['static_checks'] == r['local_checks'] == 'PASSED'
                            for r in results), results)
        self.assertEqual(sum(r['sourceVerification'] == 'PASSED' for r in results), 19)
        self.assertEqual(sum(r['sourceVerification'] == 'NOT_APPLICABLE' for r in results), 47)
        self.assertEqual(sum(r['lifecycle'] == 'retained' and r['admissible'] for r in results), 63)
        self.assertEqual({r['id'] for r in results if not r['admissible']},
                         {'pixel-hiking-study', 'film-festival-study', 'hk-street-signs-study'})
        self.assertTrue(all(r['reason'] == 'CURRENT_VERSION_NOT_RUN' for r in results
                            if r['lifecycle'] == 'candidate'))
        self.assertTrue(all(r['recoveryAvailability'] == 'NOT_CHECKED' for r in results))
        self.assertEqual({p: p.read_bytes() for p in manifests}, before)


if __name__ == '__main__':
    unittest.main()
