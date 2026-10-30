import json
from pathlib import Path
import shutil
import tempfile
import unittest
import design_knowledge as dk


class DesignKnowledgeTests(unittest.TestCase):
    def test_real_catalog_and_portable_links(self):
        self.assertEqual(dk.validate(), [])

    def test_literal_search_and_no_match(self):
        data = dk.catalog()
        self.assertEqual(dk.find(data, '功能色')[0]['id'], 'ui-002-instrument')
        self.assertEqual(dk.find(data, 'Dashboard')[0]['id'], 'ui-001-dashboard')
        self.assertEqual(dk.find(data, 'dashboard', 'instrument-interfaces'), [])
        self.assertEqual(dk.find(data, 'no-such-design-zzzz'), [])
        self.assertEqual(dk.find(data, '受众')[0]['id'], 'content-decisions')

    def test_guides_do_not_enter_evidence_catalog(self):
        legacy = json.loads((dk.ROOT.parent / 'video-knowledge/index.json').read_text())
        self.assertTrue(all(legacy[k] == [] for k in ('cases', 'techniques', 'legacy')))
        self.assertTrue(all(e['type'] == 'public-method-summary' for e in dk.catalog()['entries']))

    def test_invalid_duplicate_path_private_locator_and_orphan(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / 'skill/research/design-knowledge'
            shutil.copytree(dk.ROOT, root)
            data = dk.catalog(root)
            data['entries'].append(dict(data['entries'][0]))
            (root / 'index.json').write_text(json.dumps(data))
            (root / 'cases/orphan.md').write_text('[broken](missing.md)\nfile://private')
            issues = dk.validate(root)
            self.assertTrue(any('duplicate' in i for i in issues))
            self.assertIn('case files/index differ', issues)
            self.assertTrue(any('private locator' in i for i in issues))
            self.assertTrue(any('broken/nonportable' in i for i in issues))

    def test_motion_ids_exist_without_counting_recipes_as_foundations(self):
        skill = dk.ROOT.parents[1]
        portable = skill / 'runtime/motion-elements/catalog.json'
        source = skill.parents[1] / 'engine/motion-elements/catalog.json'
        catalog = json.loads((portable if portable.exists() else source).read_text())
        ids = {e['id'] for e in catalog['elements']}
        import re
        doc = (dk.ROOT / 'MOTIONSTUDIO.md').read_text()
        referenced = set(re.findall(r'`((?:motion|composition|recipe|geometry|transition|reveal)\.[a-z-]+)`', doc))
        self.assertTrue(referenced)
        self.assertEqual(referenced - ids, set())


if __name__ == '__main__':
    unittest.main()
