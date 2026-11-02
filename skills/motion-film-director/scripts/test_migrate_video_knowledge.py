"""Synthetic migration safety tests; never a migration of private records."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import migrate_video_knowledge as m


class MigrationTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.source = self.root / 'old'
        self.source.mkdir()
        self.dest = self.root / 'new'
        self.index = {'schema_version': 1, 'scope': 'Synthetic migration fixture only.',
                      'cases': [], 'techniques': [], 'legacy': []}
        self.save()

    def tearDown(self):
        self.tmp.cleanup()

    def save(self):
        (self.source / 'index.json').write_text(json.dumps(self.index))

    def video(self):
        path = Path(__file__).resolve().parents[1] / 'references/knowledge-decision-example/cases/plan.json'
        card = json.loads(path.read_text())
        card['schema_version'] = 1
        card.pop('evidence_type', None)
        card['decision']['schema_version'] = 1
        card['decision'].pop('record_state', None)
        (self.source / 'cases').mkdir()
        (self.source / 'cases/plan.json').write_text(json.dumps(card))
        self.index['cases'] = [{'id': card['id'], 'path': 'cases/plan.json', 'tags': card['tags']}]
        self.save()
        return card

    def write_card(self, card):
        (self.source / 'cases/plan.json').write_text(json.dumps(card))

    def test_empty_dry_run_creates_no_output(self):
        before = m.snapshot(self.source)
        result = m.migrate(self.source, self.dest)
        self.assertEqual(result['status'], 'dry-run')
        self.assertEqual(m.snapshot(self.source), before)
        self.assertFalse(self.dest.exists())
        self.assertFalse(self.dest.with_name('new.migration-history').exists())

    def test_video_conversion_preserves_original_bytes_and_identity(self):
        card = self.video()
        (self.source / 'NOTES.md').write_text('Synthetic note, preserved not inferred.\n')
        before = m.snapshot(self.source)
        result = m.migrate(self.source, self.dest, True)
        self.assertEqual(result['status'], 'converted-not-accepted')
        self.assertEqual(m.snapshot(self.source), before)
        history = self.dest.with_name('new.migration-history')
        self.assertEqual(m.snapshot(history / 'original'), before)
        converted = json.loads((self.dest / 'cases/plan.json').read_text())
        self.assertEqual(converted['id'], card['id'])
        self.assertEqual(converted['evidence_type'], 'video')
        self.assertEqual(converted['schema_version'], 3)
        self.assertEqual(converted['decision']['schema_version'], 3)
        self.assertEqual(result['preserved_history_only'], ['NOTES.md'])
        self.assertEqual(m.current.validate(self.dest)[0], [])
        with self.assertRaisesRegex(ValueError, 'already exists'):
            m.migrate(self.source, self.dest, True)

    def test_static_conversion_preserves_separate_capability(self):
        from test_static_knowledge import fixture
        temp = self.root / 'static'
        card = fixture(temp, self.root / 'assets')
        card['schema_version'] = 2
        card.pop('evidence_type', None)
        card['decision']['schema_version'] = 2
        card['decision'].pop('record_state', None)
        (temp / 'cases/static.json').write_text(json.dumps(card))
        index = json.loads((temp / 'index.json').read_text())
        index['schema_version'] = 2
        index['capabilities'] = ['synthetic-static-probe-v1']
        (temp / 'index.json').write_text(json.dumps(index))
        m.migrate(temp, self.dest, True)
        output = json.loads((self.dest / 'cases/static.json').read_text())
        self.assertEqual(output['evidence_type'], 'static-probe')
        self.assertEqual(output['run'], card['run'])
        self.assertEqual(m.current.validate(self.dest)[0], [])

    def test_missing_static_decision_preserves_run_without_inferred_choice(self):
        from test_static_knowledge import fixture
        temp = self.root / 'static'
        card = fixture(temp, self.root / 'assets')
        card['schema_version'] = 2
        card.pop('evidence_type', None)
        card.pop('decision')
        (temp / 'cases/static.json').write_text(json.dumps(card))
        index = json.loads((temp / 'index.json').read_text())
        index['schema_version'] = 2
        index['capabilities'] = ['synthetic-static-probe-v1']
        (temp / 'index.json').write_text(json.dumps(index))
        m.migrate(temp, self.dest, True)
        output = json.loads((self.dest / 'cases/static.json').read_text())
        self.assertEqual(output['decision']['record_state'], 'not-recorded')
        self.assertEqual(output['run'], card['run'])
        self.assertEqual(output['observations'], card['observations'])
        self.assertEqual(m.current.decide({output['id']: output})['status'], 'no-match')

    def test_nonempty_legacy_never_follows_target(self):
        self.index['legacy'] = [{'id': 'old', 'path': '../../do-not-read'}]
        self.save()
        with self.assertRaisesRegex(ValueError, 'nonempty legacy'):
            m.migrate(self.source, self.dest, True)
        self.assertFalse(self.dest.exists())

    def test_missing_video_decision_preserves_observations_without_fabrication(self):
        card = self.video()
        card.pop('decision')
        self.write_card(card)
        before = m.snapshot(self.source)
        m.migrate(self.source, self.dest, True)
        new = json.loads((self.dest / 'cases/plan.json').read_text())
        self.assertEqual(set(new['decision']), {'schema_version', 'record_state', 'reason'})
        self.assertEqual(new['decision']['record_state'], 'not-recorded')
        self.assertEqual(new['observations'], card['observations'])
        self.assertEqual(m.snapshot(self.source), before)
        self.assertEqual(m.current.decide({new['id']: new})['status'], 'no-match')

    def test_old_decision_record_state_is_unknown_and_never_overwritten(self):
        card = self.video()
        card['decision']['record_state'] = 'recorded'
        self.write_card(card)
        with self.assertRaisesRegex(ValueError, 'unknown old decision field'):
            m.migrate(self.source, self.dest, True)
        self.assertFalse(self.dest.exists())

    def test_unknown_nested_fields_stop_without_loss(self):
        card = self.video()
        for section in ('source', 'inspection', 'decision'):
            changed = copy.deepcopy(card)
            changed[section]['unknown_historical_value'] = 'must not silently discard'
            self.write_card(changed)
            before = m.snapshot(self.source)
            with self.subTest(section=section), self.assertRaises(ValueError):
                m.migrate(self.source, self.dest, True)
            self.assertEqual(m.snapshot(self.source), before)
            self.assertFalse(self.dest.exists())

    def test_old_type_field_is_not_silently_overwritten(self):
        card = self.video()
        for value in ('video', 'static-probe', 'unknown-type'):
            card['evidence_type'] = value
            self.write_card(card)
            before = m.snapshot(self.source)
            with self.subTest(value=value), self.assertRaisesRegex(ValueError, 'unknown old card field'):
                m.migrate(self.source, self.dest, True)
            self.assertEqual(m.snapshot(self.source), before)
            self.assertFalse(self.dest.exists())

    def test_unsafe_and_duplicate_paths_rejected(self):
        self.video()
        for path in ('../escape.json', '/tmp/escape.json', 'cases/../escape.json'):
            self.index['cases'][0]['path'] = path
            self.save()
            with self.subTest(path=path), self.assertRaises(ValueError):
                m.migrate(self.source, self.dest)
        self.index['cases'][0]['path'] = 'cases/plan.json'
        self.index['cases'] *= 2
        self.save()
        with self.assertRaisesRegex(ValueError, 'duplicate'):
            m.migrate(self.source, self.dest)

    def test_links_unknown_json_and_missing_scope_rejected(self):
        (self.source / 'link.md').symlink_to(self.source / 'index.json')
        with self.assertRaisesRegex(ValueError, 'symlink'):
            m.migrate(self.source, self.dest)
        (self.source / 'link.md').unlink()
        (self.source / 'unindexed.json').write_text('{}')
        with self.assertRaisesRegex(ValueError, 'unindexed JSON'):
            m.migrate(self.source, self.dest)
        (self.source / 'unindexed.json').unlink()
        self.index.pop('scope')
        self.save()
        with self.assertRaisesRegex(ValueError, 'required'):
            m.migrate(self.source, self.dest)

    def test_changed_source_blocks_publication(self):
        original = m.snapshot
        calls = 0
        def mutate(source):
            nonlocal calls
            calls += 1
            if calls == 2:
                (source / 'NOTE.md').write_text('changed')
            return original(source)
        with patch.object(m, 'snapshot', side_effect=mutate), self.assertRaisesRegex(ValueError, 'changed'):
            m.migrate(self.source, self.dest, True)
        self.assertFalse(self.dest.exists())

    def test_failed_publication_keeps_history_not_partial_library(self):
        original = m.write_files
        def fail(root, files, index_last=False):
            if root == self.dest:
                (root / 'partial.md').write_text('partial')
                raise OSError('synthetic write failure')
            return original(root, files, index_last)
        before = m.snapshot(self.source)
        with patch.object(m, 'write_files', side_effect=fail), self.assertRaises(OSError):
            m.migrate(self.source, self.dest, True)
        self.assertFalse(self.dest.exists())
        history = self.dest.with_name('new.migration-history')
        self.assertEqual(m.snapshot(history / 'original'), before)
        self.assertEqual(json.loads((history / 'migration.json').read_text())['status'], 'incomplete')

    def test_overlapping_non_normalized_and_existing_destinations_rejected(self):
        for destination in (self.source, self.source / 'new', self.source / '..' / 'new'):
            with self.subTest(destination=destination), self.assertRaises(ValueError):
                m.migrate(self.source, destination, True)
        history = self.dest.with_name('new.migration-history')
        history.mkdir()
        with self.assertRaisesRegex(ValueError, 'already exists'):
            m.migrate(self.source, self.dest, True)
        self.assertFalse(self.dest.exists())

    def test_duplicate_json_keys_and_repeat_v3_refused(self):
        (self.source / 'index.json').write_text('{"schema_version":1,"schema_version":2}')
        with self.assertRaisesRegex(ValueError, 'duplicate JSON'):
            m.migrate(self.source, self.dest)
        self.index['schema_version'] = 3
        self.save()
        with self.assertRaisesRegex(ValueError, 'no repeat'):
            m.migrate(self.source, self.dest)


if __name__ == '__main__':
    unittest.main()
