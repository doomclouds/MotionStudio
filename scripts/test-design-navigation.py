#!/usr/bin/env python3
"""Generator invariants, not MotionStudio rendering/engineering acceptance."""
import importlib.util
import json
import pathlib
import subprocess
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('nav', pathlib.Path(__file__).with_name('design-navigation.py'))
nav = importlib.util.module_from_spec(spec)
spec.loader.exec_module(nav)

class ProjectionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = pathlib.Path(self.tmp.name)
        subprocess.run(['git', 'init', '-q', str(self.root)], check=True)
        self.write('catalog.json', {'assets': [{'id': 'design.test.v1', 'entry': 'test.mjs', 'status': 'published'}]})
        self.write('test.mjs', 'export const test = 1;')
        self.write('Index.md', '[formal](recipes/reviewed/formal/README.md)\n[batch](recipes/batches/batch/Index.md)')
        self.write('README.md', '# root')
        self.write('recipes/reviewed/formal/README.md', '# formal')
        self.write('recipes/reviewed/formal/recipe-manifest.json', {'status': 'technical-reviewed-static-recipe', 'recipes': [{'id': 'recipe.test.v1'}]})
        self.write('recipes/batches/batch/Index.md', '[candidate](../../candidates/plain-name/README.md)\nHistorical snapshot; not current publication state.')
        self.write('recipes/candidates/plain-name/README.md', '# A candidate')
        self.write('recipes/candidates/plain-name/candidate-manifest.json', {'status': 'isolated-candidate', 'published': False, 'evidence': {'privateRecord': 'DO_NOT_PROJECT'}})
        self.write('recipes/candidates/orphan/README.md', '# Restricted candidate')
        self.write('recipes/candidates/orphan/recipe-manifest.json', {'status': 'technical-reviewed-static-recipe-candidate', 'publication': 'source-published', 'recipes': [{'id': 'recipe.not-formal.v1'}]})
        self.commit()
    def tearDown(self):
        self.tmp.cleanup()
    def write(self, path, data):
        p = self.root / nav.BASE / path
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(data) if isinstance(data, dict) else data)
    def commit(self):
        subprocess.run(['git', '-C', str(self.root), 'add', '.'], check=True)
        subprocess.run(['git', '-C', str(self.root), '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture'], check=True)
    def test_determinism_and_worktree_independence(self):
        a = nav.projection(self.root)
        self.write('catalog.json', {'assets': []})
        self.write('recipes/candidates/untracked/README.md', '# candidate')
        self.assertEqual(a, nav.projection(self.root))
        self.assertEqual(nav.markdown(a), nav.markdown(nav.projection(self.root)))
    def test_counts_status_not_prefix_and_no_private_evidence(self):
        a = nav.projection(self.root)
        self.assertEqual(a['summary']['explicitReviewedRecipeClaims'], 1)
        self.assertEqual(a['summary']['recipeDirectories'], 4)
        self.assertEqual(a['summary']['catalogFamilyEntries'], 1)
        self.assertNotIn('DO_NOT_PROJECT', json.dumps(a))
        orphan = next(p for p in a['packages'] if p['directory'].endswith('/orphan'))
        self.assertFalse(orphan['reachableFromDesignRoots'])
        self.assertFalse(orphan['recipeClaims'][0]['explicitReviewedRecipe'])
    def test_provenance_status_changes_follow_new_commit_only(self):
        old = nav.projection(self.root)
        self.write('recipes/reviewed/formal/recipe-manifest.json', {'status': 'withdrawn', 'recipes': [{'id': 'recipe.test.v1'}]})
        self.commit()
        new = nav.projection(self.root)
        self.assertEqual(new['summary']['explicitReviewedRecipeClaims'], 0)
        self.assertEqual(old, nav.projection(self.root, old['sourceCommit']))
        self.assertNotEqual(old['sources'], new['sources'])
    def test_broken_link_report_and_no_name_based_admission(self):
        self.write('recipes/reviewed/formal/README.md', '[missing](missing.md)')
        self.commit()
        a = nav.projection(self.root)
        self.assertEqual(len(a['brokenDesignDocLinks']), 1)
        self.assertIn('Missing local target:', nav.markdown(a, details=True))
        self.assertIn('recipes/reviewed/formal/missing.md', nav.markdown(a, details=True))
        plain = next(p for p in a['packages'] if p['directory'].endswith('/plain-name'))
        self.assertEqual(plain['category'], 'source-package')
        self.assertTrue(plain['reachableFromDesignRoots'])
    def test_unknown_is_not_promoted(self):
        self.write('recipes/candidates/new-name/README.md', '# No lifecycle declared')
        self.commit()
        a = nav.projection(self.root)
        unknown = next(p for p in a['packages'] if p['directory'].endswith('/new-name'))
        self.assertEqual(unknown['category'], 'source-package')
        self.assertEqual(unknown['statusClaims'], [])

    def test_structure_not_prose_or_single_reviewed_item(self):
        self.write('recipes/reviewed/formal/README.md', '# mentions candidate and historical snapshot')
        self.write('recipes/reviewed/formal/recipe-manifest.json', {'recipes': [
            {'id': 'recipe.one', 'status': 'technical-reviewed-static-recipe'},
            {'id': 'recipe.two', 'status': 'pending'}]})
        self.commit()
        package = next(p for p in nav.projection(self.root)['packages'] if p['directory'].endswith('/formal'))
        self.assertEqual(package['category'], 'source-package')
        self.assertEqual([r['status'] for r in package['recipeClaims']], ['technical-reviewed-static-recipe', 'pending'])
    def test_catalog_entry_and_valid_directory_links(self):
        self.write('Index.md', '[directory](recipes/candidates/plain-name/)')
        self.write('catalog.json', {'assets': [{'id': 'design.bad', 'entry': '../outside.mjs'}]})
        self.commit()
        data = nav.projection(self.root)
        self.assertEqual(data['brokenDesignDocLinks'], [])
        self.assertEqual(len(data['catalogEntryErrors']), 1)
        self.assertIn('INVALID entry', nav.markdown(data, details=True))
        self.assertNotIn('](../outside.mjs)', nav.markdown(data, details=True))
        self.assertTrue(next(p for p in data['packages'] if p['directory'].endswith('/plain-name'))['reachableFromDesignRoots'])

    def test_missing_catalog_and_invalid_manifest(self):
        self.write('recipes/reviewed/formal/recipe-manifest.json', '{broken')
        self.commit()
        with self.assertRaisesRegex(ValueError, 'Invalid manifest JSON'):
            nav.projection(self.root)
        (self.root / nav.BASE / 'catalog.json').unlink()
        self.commit()
        with self.assertRaisesRegex(ValueError, 'Required catalog missing'):
            nav.projection(self.root)

if __name__ == '__main__':
    unittest.main()
