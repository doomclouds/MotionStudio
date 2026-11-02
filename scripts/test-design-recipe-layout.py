#!/usr/bin/env python3
"""Scoped role-layout checks, not a build, render or final acceptance suite."""
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'engine/design-elements/recipes'
spec = importlib.util.spec_from_file_location('navigation', ROOT / 'scripts/design-navigation.py')
nav = importlib.util.module_from_spec(spec)
spec.loader.exec_module(nav)

class RoleLayoutTests(unittest.TestCase):
    def test_direct_layout_no_old_aliases(self):
        self.assertEqual({p.name for p in BASE.iterdir() if p.is_dir()}, set(nav.ROLES))
        self.assertFalse(any(p.is_symlink() for p in BASE.rglob('*')))
        self.assertTrue((BASE / 'candidates/xhs08/recipe-manifest.json').is_file())
        self.assertEqual(json.loads((BASE / 'candidates/xhs08/recipe-manifest.json').read_text())['status'],
                         'technical-reviewed-static-recipe-candidate')

    def test_current_layout_projection(self):
        # The production CLI intentionally reads commits, so use an isolated synthetic
        # Git snapshot of these source files; do not commit the working repository.
        with tempfile.TemporaryDirectory(prefix='design-role-projection-') as directory:
            target = Path(directory)
            shutil.copytree(ROOT / nav.BASE, target / nav.BASE,
                            ignore=shutil.ignore_patterns('node_modules', '__pycache__'))
            subprocess.run(['git', 'init', '-q', str(target)], check=True)
            subprocess.run(['git', '-C', str(target), 'add', '.'], check=True)
            subprocess.run(['git', '-C', str(target), '-c', 'user.name=Layout test',
                            '-c', 'user.email=layout@example.invalid', 'commit', '-qm', 'source fixture'], check=True)
            data = nav.projection(target)
            self.assertEqual(data['catalogEntryErrors'], [])
            self.assertEqual(data['brokenDesignDocLinks'], [])
            expected = {p.relative_to(ROOT).as_posix() for role in nav.ROLES
                        for p in (BASE / role).iterdir() if p.is_dir()}
            self.assertEqual({p['directory'] for p in data['packages']}, expected)
            for package in data['packages']:
                if package['role'] == 'batches':
                    self.assertEqual(package['category'], 'index-only')
                if package['role'] == 'reviewed':
                    self.assertTrue(package['recipeClaims'])
                    self.assertTrue(all(r['explicitReviewedRecipe'] for r in package['recipeClaims']))
                self.assertTrue(package['reachableFromDesignRoots'], package['directory'])

    def test_pinned_external_example_helpers_use_new_local_path(self):
        package = BASE / 'candidates/complementary-seam-candidate'
        script = (package / 'examples/prepare-inputs.py').read_text()
        self.assertIn("repo/'engine/design-elements/recipes/candidates/sampled-window-dialogue-candidate/lib'", script)
        for record in json.loads((package / 'examples/input-lock.json').read_text()):
            if record['path'] == 'InstrumentSans.ttf':
                continue  # The external font and its identity are not changed or supplied.
            path = BASE / 'candidates/sampled-window-dialogue-candidate/lib' / Path(record['path']).name
            data = path.read_bytes()
            self.assertEqual(len(data), record['bytes'])
            self.assertEqual(hashlib.sha256(data).hexdigest(), record['sha256'])

    def test_repository_boundary_after_extra_role_level(self):
        code = "import {repoRoot} from './engine/design-elements/recipes/candidates/deterministic-particle-field/runtime.mjs'; console.log(repoRoot)"
        result = subprocess.run(['node', '--input-type=module', '-e', code], cwd=ROOT,
                                check=True, capture_output=True, text=True)
        self.assertEqual(Path(result.stdout.strip()), ROOT)
        compose = BASE / 'candidates/open-design-three/examples/compose.mjs'
        self.assertIn("repo=path.resolve(root,'../../../../..')", compose.read_text())

if __name__ == '__main__':
    unittest.main()
