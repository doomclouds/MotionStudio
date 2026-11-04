"""Single-work CLI inspection does not load unrelated works or grant new acceptance."""
import json
import hashlib
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

from source_identity import GitSource, Unavailable

ROOT = Path(__file__).resolve().parents[1]

class AdmissionCLI(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.portfolio = self.root / 'portfolio'
        shutil.copytree(ROOT / 'portfolio', self.portfolio, ignore=shutil.ignore_patterns('__pycache__'))
        # No Git and no current engine module. All work files retain exact bytes.
        self.env = {k: v for k, v in os.environ.items() if not k.startswith('GIT_')}

    def tearDown(self):
        self.temp.cleanup()

    def cli(self, command, *args):
        r = subprocess.run([sys.executable, str(self.portfolio / 'work.py'), command,
                            '--portfolio', str(self.portfolio), '--repo', str(self.root), *args],
                           env=self.env, capture_output=True, text=True)
        return r.returncode, json.loads(r.stdout)

    def require_history(self):
        try:
            GitSource(ROOT, '0947507961eb5624ddd5c1240758baefa3246fd8').read('catalog.json')
        except Unavailable as error:
            self.skipTest('BLOCKED: historical fixture unavailable: ' + str(error))

    def test_missing_history_preserves_recorded_retained_and_returns_blocked(self):
        manifest = self.portfolio / 'works/friendly-fintech-study/work.json'
        before = manifest.read_bytes()
        for command in ['inspect', 'admit-check']:
            code, output = self.cli(command, '--work-id', 'friendly-fintech-study')
            self.assertEqual(code, 2, output)
            self.assertEqual(len(output['results']), 1)
            row = output['results'][0]
            self.assertEqual(row['lifecycle'], 'retained')
            self.assertEqual(row['local_checks'], 'PASSED')
            self.assertEqual(row['sourceVerification'], 'BLOCKED')
            self.assertFalse(row['admissible'])
        self.assertEqual(manifest.read_bytes(), before)

    def test_single_work_does_not_read_unrelated_invalid_manifest(self):
        (self.portfolio / 'works/tessel/work.json').write_text('{invalid unrelated')
        code, output = self.cli('inspect', '--work-id', 'friendly-fintech-study')
        self.assertEqual(code, 2, output)
        self.assertEqual(output['results'][0]['sourceVerification'], 'BLOCKED')

    def test_explicit_source_succeeds_without_current_engine(self):
        self.require_history()
        code, output = self.cli('admit-check', '--work-id', 'friendly-fintech-study', '--source-repo', str(ROOT))
        self.assertEqual(code, 0, output)
        row = output['results'][0]
        self.assertTrue(row['admissible'])
        self.assertEqual(row['sourceVerification'], 'PASSED')
        self.assertEqual(row['recoveryAvailability'], 'NOT_CHECKED')

    def test_fake_hash_fails_instead_of_blocking_or_using_current_catalog(self):
        self.require_history()
        manifest = self.portfolio / 'works/friendly-fintech-study/work.json'
        data = json.loads(manifest.read_text())
        data['design']['assetUsage'][0]['moduleSha256'] = '0' * 64
        manifest.write_text(json.dumps(data))
        for command in ['inspect', 'admit-check']:
            code, output = self.cli(command, '--work-id', 'friendly-fintech-study', '--source-repo', str(ROOT))
            self.assertEqual(code, 3, output)
            self.assertEqual(output['results'][0]['sourceVerification'], 'FAILED')
            self.assertFalse(output['results'][0]['admissible'])

    def test_verified_candidate_is_not_promoted(self):
        try:
            GitSource(ROOT, '562c89384c931bf5ef3cbb931ac2a4866607011b').read('catalog.json')
        except Unavailable as error:
            self.skipTest('BLOCKED: historical fixture unavailable: ' + str(error))
        manifest = self.portfolio / 'works/pixel-hiking-study/work.json'
        before = manifest.read_bytes()
        for command, expected in [('inspect', 0), ('admit-check', 3)]:
            code, output = self.cli(command, '--work-id', 'pixel-hiking-study', '--source-repo', str(ROOT))
            self.assertEqual(code, expected, output)
            row = output['results'][0]
            self.assertEqual(row['lifecycle'], 'candidate')
            self.assertEqual(row['sourceVerification'], 'PASSED')
            self.assertFalse(row['admissible'])
        self.assertEqual(manifest.read_bytes(), before)

    def test_no_design_dependency_is_not_source_pass(self):
        code, output = self.cli('admit-check', '--work-id', 'tessel')
        self.assertEqual(code, 0, output)
        self.assertEqual(output['results'][0]['sourceVerification'], 'NOT_APPLICABLE')
        self.assertEqual(output['results'][0]['recoveryAvailability'], 'NOT_CHECKED')

    def test_single_work_rejects_parallel_legacy_metadata_even_if_inventoried(self):
        folder = self.portfolio / 'works/tessel'
        manifest = folder / 'work.json'
        original = manifest.read_bytes()
        for name in ['entry.json', 'retention.json']:
            content = b'{"synthetic":"legacy metadata must not be consumed"}'
            (folder / name).write_bytes(content)
            data = json.loads(original)
            data['files'].append({'path': name, 'kind': 'documentation', 'sha256': hashlib.sha256(content).hexdigest()})
            manifest.write_text(json.dumps(data))
            for command in ['inspect', 'admit-check']:
                code, output = self.cli(command, '--work-id', 'tessel')
                self.assertEqual(code, 2)
                self.assertEqual(output['reason'], 'PARALLEL_METADATA_FORBIDDEN')
            (folder / name).unlink()
            manifest.write_bytes(original)

    def test_selector_rejects_paths_and_filters(self):
        for command in ['inspect', 'admit-check']:
            code, output = self.cli(command, '--work-id', '../other')
            self.assertEqual(code, 2)
            self.assertEqual(output['reason'], 'EXACT_WORK_ID_REQUIRED')
            code, output = self.cli(command, '--work-id', 'tessel', '--kind', 'video')
            self.assertEqual(code, 2)
            self.assertEqual(output['reason'], 'FILTER_OPTIONS_REQUIRE_QUERY')

if __name__ == '__main__':
    unittest.main()
