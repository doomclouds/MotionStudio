"""Recorded discovery stays usable without historical Git; no scenes or network execute."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import work
from validate_work import Blocked, read

ROOT = Path(__file__).resolve().parents[1]


class OfflineDiscovery(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        base = Path(cls.temp.name)
        cls.archive = base / 'archive'
        shutil.copytree(ROOT / 'portfolio', cls.archive / 'portfolio',
                        ignore=shutil.ignore_patterns('__pycache__'))
        catalog = cls.archive / 'engine/design-elements'
        catalog.mkdir(parents=True)
        shutil.copy2(ROOT / 'engine/design-elements/catalog.json', catalog / 'catalog.json')
        # Genuine depth-one clone of a two-commit synthetic source snapshot.
        # Neither snapshot contains the historical commits named by the works.
        cls.origin = base / 'origin'
        shutil.copytree(cls.archive, cls.origin)
        cls.env = dict(os.environ)
        for key in list(cls.env):
            if key.startswith('GIT_'):
                del cls.env[key]
        cls.git(cls.origin, 'init', '-q')
        cls.git(cls.origin, 'add', '.')
        cls.git(cls.origin, '-c', 'user.name=Test Fixture', '-c',
                'user.email=fixture@example.invalid', 'commit', '-qm', 'Synthetic snapshot')
        cls.git(cls.origin, '-c', 'user.name=Test Fixture', '-c',
                'user.email=fixture@example.invalid', 'commit', '--allow-empty', '-qm', 'Synthetic tip')
        cls.shallow = base / 'shallow'
        subprocess.run(['git', 'clone', '-q', '--depth=1', cls.origin.as_uri(), str(cls.shallow)],
                       check=True, capture_output=True, env=cls.env)

    @classmethod
    def git(cls, root, *args):
        return subprocess.check_output(['git', '-C', str(root), *args], env=cls.env).decode().strip()

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def cli(self, root, *args):
        result = subprocess.run([sys.executable, str(root / 'portfolio/work.py'), *args,
                                 '--repo', str(root), '--portfolio', str(root / 'portfolio')],
                                capture_output=True, text=True, env=self.env)
        return result.returncode, json.loads(result.stdout)

    def test_real_archive_and_shallow_discovery(self):
        self.assertFalse((self.archive / '.git').exists())
        self.assertEqual(self.git(self.shallow, 'rev-parse', '--is-shallow-repository'), 'true')
        self.assertEqual(self.git(self.shallow, 'rev-list', '--count', 'HEAD'), '1')
        for root in [self.archive, self.shallow]:
            with self.subTest(environment=root.name), patch.object(work, 'inspect', side_effect=AssertionError('Discovery must not admit')):
                portfolio = root / 'portfolio'
                data = work.index(portfolio, root)
                self.assertEqual(data['counts'], {'works': 66, 'static': 64, 'video': 2, 'candidates': 3})
                self.assertEqual(sum(r['lifecycle'] == 'retained' for r in data['works']), 63)
                self.assertTrue(all(r['statusScope'] == 'RECORDED' and r['sourceVerification'] == 'NOT_RUN'
                                    and r['recoveryAvailability'] == 'NOT_CHECKED' for r in data['works']))
                self.assertEqual(len(work.query(portfolio, root, kind='video')), 2)
                self.assertEqual(len(work.query(portfolio, root, family='design.color-sections.v1')), 3)
                self.assertEqual(len(work.query(portfolio, root, family='design.material-surfaces.v1')), 14)
                self.assertIn('friendly-fintech-study', {r['id'] for r in work.query(portfolio, root, text='friendly-fintech')})
                self.assertEqual(work.query(portfolio, root, text='[literal-not-regex.*]'), [])
                work.index_write(portfolio, data, root)
                self.assertEqual(read(portfolio / 'index.json'), data)
                self.assertEqual(self.cli(root, 'index', '--check')[0], 0)

    def test_missing_history_blocks_only_selected_source_check(self):
        for root in [self.archive, self.shallow]:
            with self.subTest(environment=root.name):
                before = work.query(root / 'portfolio', root)
                code, result = self.cli(root, 'verify-source', '--work-id', 'friendly-fintech-study')
                self.assertEqual(code, 2, result)
                self.assertEqual(result['sourceVerification'], 'BLOCKED')
                self.assertEqual(work.query(root / 'portfolio', root), before)
                self.assertEqual(len(work.index(root / 'portfolio', root)['works']), 66)
                # Query is a separate process too, without a hidden Git provider.
                code, rows = self.cli(root, 'query', '--family', 'design.material-surfaces.v1')
                self.assertEqual(code, 0)
                self.assertEqual(len(rows), 14)

    def test_discovery_still_rejects_tampered_local_inventory(self):
        with tempfile.TemporaryDirectory() as t:
            root = Path(t)
            shutil.copytree(self.archive / 'portfolio', root / 'portfolio')
            shutil.copytree(self.archive / 'engine', root / 'engine')
            (root / 'portfolio/works/friendly-fintech-study/scene.mjs').write_text('// tampered')
            with self.assertRaises(Blocked):
                work.query(root / 'portfolio', root)

    def test_selected_source_check_does_not_load_other_works(self):
        unrelated = self.archive / 'portfolio/works/tessel/work.json'
        original = unrelated.read_bytes()
        try:
            unrelated.write_text('{invalid unrelated manifest')
            code, result = self.cli(self.archive, 'verify-source', '--work-id', 'friendly-fintech-study')
            self.assertEqual(code, 2, result)
            self.assertEqual(result['sourceVerification'], 'BLOCKED')
        finally:
            unrelated.write_bytes(original)

    def test_query_filters_cannot_be_silently_ignored_by_verification(self):
        for option, value in [('--kind', 'video'), ('--text', 'other'), ('--family', 'design.material-surfaces.v1')]:
            code, result = self.cli(self.archive, 'verify-source', '--work-id', 'friendly-fintech-study', option, value)
            self.assertEqual(code, 2)
            self.assertEqual(result['reason'], 'FILTER_OPTIONS_REQUIRE_QUERY')

    def test_discovery_does_not_require_git_executable(self):
        env = {**self.env, 'PATH': '/nonexistent-for-discovery-test'}
        for command in ['query', 'index']:
            result = subprocess.run([sys.executable, str(self.archive / 'portfolio/work.py'), command,
                                     '--repo', str(self.archive), '--portfolio', str(self.archive / 'portfolio')],
                                    capture_output=True, text=True, env=env)
            self.assertEqual(result.returncode, 0, result.stdout)
            data = json.loads(result.stdout)
            self.assertEqual(len(data if command == 'query' else data['works']), 66)

    def test_source_selector_requires_exact_one_work(self):
        for arguments in [[], ['--work-id', '../friendly-fintech-study'], ['--work-id', '*']]:
            code, result = self.cli(self.archive, 'verify-source', *arguments)
            self.assertEqual(code, 2)
            self.assertEqual(result['reason'], 'EXACT_WORK_ID_REQUIRED')


if __name__ == '__main__':
    unittest.main()
