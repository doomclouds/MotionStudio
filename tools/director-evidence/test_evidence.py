"""Synthetic tool tests, not director or production-quality acceptance."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

TOOL = Path(__file__).with_name('evidence.py')


class EvidenceTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.store = self.root / 'receipts'

    def tearDown(self):
        self.tmp.cleanup()

    def invoke(self, *args):
        return subprocess.run([sys.executable, str(TOOL), '--store', str(self.store), *map(str, args)], capture_output=True, text=True)

    def records(self):
        return [json.loads(p.read_text()) for p in self.store.glob('*.json') if not p.name.endswith('.v8.json')]

    def test_read_exact_range_and_stale(self):
        source = self.root / 'guide.md'
        source.write_text('one\ntwo\nthree\n')
        result = self.invoke('read', source, '--start', '2', '--end', '2')
        self.assertEqual(result.stdout, 'two\n')
        self.assertEqual(self.records()[0]['lines'], [2, 2])
        self.assertEqual(self.invoke('check').returncode, 0)
        source.write_text('changed')
        self.assertEqual(self.invoke('check').returncode, 1)

    def test_bad_range_does_not_record(self):
        source = self.root / 'guide.md'
        source.write_text('one\n')
        self.assertEqual(self.invoke('read', source, '--end', '2').returncode, 2)
        self.assertEqual(self.records(), [])

    def test_calls_distinguish_import_and_execution(self):
        lib = self.root / 'lib.mjs'
        lib.write_text('export function used(x) {return x*2;}\nexport function unused() {return 9;}\n')
        entry = self.root / 'entry.mjs'
        entry.write_text("import {used} from './lib.mjs'; console.log(used(3));")
        result = self.invoke('run-node', '--watch', lib, entry)
        self.assertEqual(result.returncode, 0, result.stderr)
        functions = next(c['functions'] for c in self.records()[0]['coverage'] if c['path'] == str(lib))
        counts = {f['functionName']: f['ranges'][0]['count'] for f in functions}
        self.assertEqual(counts['used'], 1)
        self.assertEqual(counts['unused'], 0)
        self.assertEqual(self.invoke('check').returncode, 0)

    def test_failure_and_missing_output_not_pass(self):
        entry = self.root / 'fail.mjs'
        entry.write_text("throw new Error('synthetic failure')")
        self.assertNotEqual(self.invoke('run-node', '--output', self.root / 'absent.svg', entry).returncode, 0)
        self.assertEqual(self.invoke('check').returncode, 1)

    def test_modified_source_and_stale_output(self):
        entry = self.root / 'mutator.mjs'
        output = self.root / 'old.txt'
        output.write_text('old')
        entry.write_text("import fs from 'node:fs'; fs.appendFileSync(import.meta.filename, '\\n//changed');")
        self.assertEqual(self.invoke('run-node', '--output', output, entry).returncode, 0)
        record = self.records()[0]
        self.assertFalse(record['sources_unchanged'])
        self.assertFalse(record['outputs'][0]['changed_from_before'])
        self.assertEqual(self.invoke('check').returncode, 1)

    def test_child_process_cannot_satisfy_entry_watch(self):
        child = self.root / 'child.mjs'
        child.write_text('export function childOnly(){return 7;} console.log(childOnly());')
        entry = self.root / 'parent.mjs'
        entry.write_text("import {spawnSync} from 'node:child_process'; "
                         "spawnSync(process.execPath,[new URL('./child.mjs',import.meta.url).pathname]);")
        self.assertEqual(self.invoke('run-node', '--watch', child, entry).returncode, 0)
        record = self.records()[0]
        self.assertFalse(any(c['path'] == str(child) for c in record['coverage']))
        self.assertTrue(any(not r['included'] for r in record['raw_coverage']))
        self.assertEqual(self.invoke('check').returncode, 1)

    def test_worker_thread_cannot_satisfy_entry_watch(self):
        worker = self.root / 'worker.mjs'
        worker.write_text('export function workerOnly(){return 8;} console.log(workerOnly());')
        entry = self.root / 'parent.mjs'
        entry.write_text("import {Worker} from 'node:worker_threads'; "
                         "new Worker(new URL('./worker.mjs',import.meta.url));")
        self.assertEqual(self.invoke('run-node', '--watch', worker, entry).returncode, 0)
        record = self.records()[0]
        self.assertFalse(any(c['path'] == str(worker) for c in record['coverage']))
        self.assertTrue(any(r['thread_id'] != 0 for r in record['raw_coverage']))
        self.assertEqual(self.invoke('check').returncode, 1)

    def test_legacy_unscoped_execution_needs_rerun(self):
        entry = self.root / 'entry.mjs'
        entry.write_text("console.log('entry')")
        self.assertEqual(self.invoke('run-node', entry).returncode, 0)
        receipt = next(p for p in self.store.glob('*.json') if not p.name.endswith('.v8.json'))
        record = json.loads(receipt.read_text())
        record['schema'] = 'director-evidence/1'
        del record['execution_scope']
        del record['entry_pid']
        receipt.write_text(json.dumps(record))
        result = self.invoke('check')
        self.assertEqual(result.returncode, 1)
        self.assertIn('legacy/unscoped', result.stdout)

    def test_requested_but_unloaded_source_is_not_observed(self):
        entry = self.root / 'entry.mjs'
        entry.write_text("console.log('entry only')")
        unused = self.root / 'never-loaded.mjs'
        unused.write_text('export const unused = 1;')
        self.assertEqual(self.invoke('run-node', '--watch', unused, entry).returncode, 0)
        result = self.invoke('check')
        self.assertEqual(result.returncode, 1)
        self.assertIn('requested source not observed by V8', result.stdout)

    def test_raw_coverage_tamper_is_stale(self):
        entry = self.root / 'entry.mjs'
        entry.write_text("console.log('synthetic')")
        self.assertEqual(self.invoke('run-node', entry).returncode, 0)
        raw = Path(self.records()[0]['raw_coverage'][0]['path'])
        raw.write_text('{}')
        self.assertEqual(self.invoke('check').returncode, 1)

    def test_repository_store_is_refused(self):
        result = subprocess.run([sys.executable, str(TOOL), '--store',
                                 str(TOOL.parent / 'private-records'), 'check'], capture_output=True)
        self.assertEqual(result.returncode, 2)
        self.assertFalse((TOOL.parent / 'private-records').exists())

    def test_no_receipts_is_not_pass(self):
        self.assertEqual(self.invoke('check').returncode, 1)


if __name__ == '__main__':
    unittest.main()
