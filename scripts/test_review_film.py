"""Offline contract tests: no network, no media modification, no paid calls."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('review_film', Path(__file__).with_name('review_film.py'))
r = importlib.util.module_from_spec(spec)
spec.loader.exec_module(r)


class ReviewTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.movie = self.root / 'movie.mp4'
        self.movie.write_bytes(b'unchanged-movie')

    def fixture(self):
        report = {'source': {'sha256': r.digest(self.movie)},
                  'versions': {'tool_sha256': r.digest(r.CHECK)}, 'findings': [],
                  'frame_census': {'returncode': 0, 'decoded_video_frames': 5, 'errors_present': False,
                                   'missing_timestamp_frames': 0, 'timestamp_regressions': 0,
                                   'observed_span_including_last_frame_s': 1, 'log': 'census.txt'},
                  'full_decode': {'ok': True, 'returncode': 0, 'log': 'decode.txt'},
                  'sampling': {'sample_count': 4, 'sampling_errors_present': False,
                               'contact_sheets': [{'file': 'contact.jpg'}]}, 'media': {'has_audio': False}}
        for name in ['versions.json', 'index.html', 'motion-energy.csv', 'motion-and-change-heatmap.png',
                     'spatial-mean-change.png', 'sampling-errors.txt', 'census.txt', 'decode.txt', 'contact.jpg']:
            (self.root / name).write_text('' if name in ('census.txt', 'decode.txt', 'sampling-errors.txt') else 'mock artifact, not real media validation')
        p = self.root / 'report.json'
        p.write_text(json.dumps(report))
        return p, report

    def test_selection(self):
        ids = {m['id'] for m in r.select_methods(reference=True, claims=True, audio='none')}
        self.assertIn('source-window', ids)
        self.assertIn('claims-proof', ids)
        self.assertNotIn('native-audio', ids)
        self.assertNotIn('encode-ssim-psnr', ids)

    def test_correspondence_explicit_not_approval(self):
        self.assertNotIn('event-correspondence', {m['id'] for m in r.select_methods(reference=True)})
        method = next(m for m in r.select_methods(requested=['event-correspondence']) if m['id'] == 'event-correspondence')
        self.assertEqual(method['implementation'], 'manual-local-sidecar')
        self.assertEqual(method['status'], 'not_run')

    def test_unknown_method(self):
        with self.assertRaises(ValueError): r.select_methods(requested=['fake'])

    def test_gap_is_not_pass(self):
        m = next(m for m in r.select_methods(requested=['optical-flow']) if m['id'] == 'optical-flow')
        self.assertEqual(m['status'], 'unsupported')

    def test_valid_fixture_readonly(self):
        p, _ = self.fixture()
        before = r.digest(self.movie)
        self.assertEqual(r.inspect_motion(p, before)[0], 'passed')
        self.assertEqual(r.digest(self.movie), before)

    def test_custom_report_bound(self):
        p, data = self.fixture()
        custom = self.root / 'custom.json'; custom.write_text(json.dumps(data))
        status, artifacts, _ = r.inspect_motion(custom, r.digest(self.movie))
        self.assertEqual(status, 'passed')
        self.assertEqual(artifacts[str(custom)], r.digest(custom))

    def test_stale_movie(self):
        p, _ = self.fixture()
        self.assertEqual(r.inspect_motion(p, 'other-hash')[0], 'stale')

    def test_stale_tool(self):
        p, data = self.fixture()
        data['versions']['tool_sha256'] = 'old'
        p.write_text(json.dumps(data))
        self.assertEqual(r.inspect_motion(p, r.digest(self.movie))[0], 'stale')

    def test_partial_never_pass(self):
        p, data = self.fixture()
        del data['full_decode']
        p.write_text(json.dumps(data))
        self.assertNotEqual(r.inspect_motion(p, r.digest(self.movie))[0], 'passed')

    def test_artifact_symlink_rejected(self):
        p, _ = self.fixture()
        (self.root / 'contact.jpg').unlink()
        (self.root / 'contact.jpg').symlink_to(self.movie)
        self.assertEqual(r.inspect_motion(p, r.digest(self.movie))[0], 'missing')

    def test_missing_artifact(self):
        p, _ = self.fixture()
        (self.root / 'contact.jpg').unlink()
        self.assertEqual(r.inspect_motion(p, r.digest(self.movie))[0], 'missing')

    def test_contradictory_decode_log(self):
        p, _ = self.fixture()
        (self.root / 'decode.txt').write_text('decoder error')
        self.assertEqual(r.inspect_motion(p, r.digest(self.movie))[0], 'failed')

    def test_missing_second_audio_track(self):
        p, data = self.fixture()
        data['media'] = {'has_audio': True, 'audio_streams': [{'index': 1}, {'index': 2}]}
        data['audio_measurements'] = [{'stream_index': 1, 'measured': True, 'returncode': 0,
                                      'integrated_loudness_lufs': -18, 'loudness_range_lu': 2,
                                      'true_peak_dbtp': -5, 'log': 'audio.txt'}]
        (self.root / 'audio.txt').write_text('fixture')
        p.write_text(json.dumps(data))
        self.assertEqual(r.inspect_motion(p, r.digest(self.movie))[0], 'failed')

    def test_silent_audio_minus_inf_is_measurement(self):
        p, data = self.fixture()
        data['media'] = {'has_audio': True, 'audio_streams': [{'index': 1}]}
        data['audio_measurements'] = [{'stream_index': 1, 'measured': True, 'returncode': 0,
                                      'integrated_loudness_lufs': -70, 'loudness_range_lu': 0,
                                      'true_peak_dbtp': '-inf', 'log': 'audio.txt'}]
        (self.root / 'audio.txt').write_text('fixture')
        p.write_text(json.dumps(data))
        self.assertEqual(r.inspect_motion(p, r.digest(self.movie))[0], 'passed')
        data['audio_measurements'][0]['true_peak_dbtp'] = None
        p.write_text(json.dumps(data))
        self.assertEqual(r.inspect_motion(p, r.digest(self.movie))[0], 'failed')

    def test_null_census_never_passes(self):
        p, data = self.fixture()
        data['frame_census']['decoded_video_frames'] = None
        p.write_text(json.dumps(data))
        self.assertEqual(r.inspect_motion(p, r.digest(self.movie))[0], 'failed')

    def test_sampling_error_log_not_ignored(self):
        p, _ = self.fixture()
        (self.root / 'sampling-errors.txt').write_text('error')
        self.assertEqual(r.inspect_motion(p, r.digest(self.movie))[0], 'failed')

    def test_audio_partial(self):
        p, data = self.fixture()
        data['media']['has_audio'] = True
        p.write_text(json.dumps(data))
        self.assertEqual(r.inspect_motion(p, r.digest(self.movie))[0], 'failed')

    def test_plan_no_subprocess_or_network_except_identity(self):
        from argparse import Namespace
        args = Namespace(video=str(self.movie), source_root=str(self.root), brief='read text', reference=False,
                         claims=False, audio='present', method=[])
        with patch.object(r, 'identity', return_value={'mock': True}), patch.object(r.subprocess, 'run') as run:
            result = r.plan(args)
        run.assert_not_called()
        self.assertEqual(result['gates']['native_audio'], 'not_reviewed')
        self.assertTrue(all(m['status'] == 'not_run' for m in result['methods']))

    def test_missing_tool_blocks(self):
        from argparse import Namespace
        args = Namespace(video=str(self.movie), source_root=str(self.root), brief='test', reference=False,
                         claims=False, audio='unknown', method=[], out=str(self.root), reuse_motion_report=None, timeout=1)
        with patch.object(r, 'identity', return_value={'mock': True}), patch.object(r, 'safe_output', return_value=self.root), patch.object(r.shutil, 'which', return_value=None):
            result = r.run_review(args)
        self.assertEqual(result['gates']['technical'], 'blocked')
        self.assertEqual(result['gates']['visual'], 'not_reviewed')

    def test_existing_output_refused(self):
        with self.assertRaises(ValueError): r.safe_output(r.ROOT / 'scripts')

    def test_report_artifact_tamper(self):
        old = {'movie': {'path': str(self.movie)}, 'source': {'root': str(self.root)},
               'review_tool_sha256': 'x', 'registry_sha256': 'y', 'motion_check_sha256': 'z'}
        receipt = {'identity': old, 'gates': {'technical': 'passed'},
                   'methods': [{'id': 'decode-census', 'status': 'passed'}], 'artifacts': {str(self.movie): 'wrong'}}
        p = self.root / 'receipt.json'; p.write_text(json.dumps(receipt))
        with patch.object(r, 'identity', return_value=old): result = r.report_receipt(p)
        self.assertEqual(result['gates']['technical'], 'stale')
        self.assertEqual(result['methods'][0]['status'], 'stale')

    def test_report_cannot_promote_manual_or_unsupported(self):
        old = {'movie': {'path': str(self.movie)}, 'source': {'root': str(self.root)},
               'review_tool_sha256': 'x', 'registry_sha256': 'y', 'motion_check_sha256': 'z'}
        p = self.root / 'receipt.json'
        p.write_text(json.dumps({'identity': old, 'gates': {'technical': 'passed',
            'visual': 'reviewed', 'native_audio': 'live_verified', 'owner_artistic_approval': 'approved'},
            'methods': [{'id': 'optical-flow', 'status': 'passed'}, {'id': 'native-audio', 'status': 'passed'}],
            'artifacts': {str(self.movie): r.digest(self.movie)}}))
        with patch.object(r, 'identity', return_value=old): result = r.report_receipt(p)
        self.assertEqual(result['gates']['native_audio'], 'not_reviewed')
        self.assertEqual(result['gates']['owner_artistic_approval'], 'not_requested')
        self.assertEqual(result['methods'][0]['status'], 'unsupported')
        self.assertEqual(result['methods'][1]['status'], 'not_run')

    def test_forged_technical_pass_without_motion_report(self):
        old = {'movie': {'path': str(self.movie)}, 'source': {'root': str(self.root)},
               'review_tool_sha256': 'x', 'registry_sha256': 'y', 'motion_check_sha256': 'z'}
        p = self.root / 'receipt.json'
        p.write_text(json.dumps({'identity': old, 'gates': {'technical': 'passed'},
            'methods': [{'id': 'decode-census', 'status': 'passed'}],
            'artifacts': {str(self.movie): r.digest(self.movie)}}))
        with patch.object(r, 'identity', return_value=old): result = r.report_receipt(p)
        self.assertEqual(result['gates']['technical'], 'missing')
        self.assertEqual(result['methods'][0]['status'], 'missing')

    def test_report_changed_motion_checker(self):
        old = {'movie': {'path': str(self.movie)}, 'source': {'root': str(self.root)},
               'review_tool_sha256': 'x', 'registry_sha256': 'y', 'motion_check_sha256': 'old'}
        fresh = dict(old, motion_check_sha256='new')
        p = self.root / 'receipt.json'
        p.write_text(json.dumps({'identity': old, 'gates': {'technical': 'passed'},
                                'methods': [{'id': 'decode-census', 'status': 'passed'}], 'artifacts': {str(self.movie): r.digest(self.movie)}}))
        with patch.object(r, 'identity', return_value=fresh): result = r.report_receipt(p)
        self.assertEqual(result['gates']['technical'], 'stale')

    def test_report_deleted_artifact_is_missing(self):
        old = {'movie': {'path': str(self.movie)}, 'source': {'root': str(self.root)},
               'review_tool_sha256': 'x', 'registry_sha256': 'y', 'motion_check_sha256': 'z'}
        p = self.root / 'receipt.json'
        p.write_text(json.dumps({'identity': old, 'gates': {'technical': 'passed'},
            'methods': [{'id': 'decode-census', 'status': 'passed'}],
            'artifacts': {str(self.root / 'deleted'): 'hash'}}))
        with patch.object(r, 'identity', return_value=old): result = r.report_receipt(p)
        self.assertEqual(result['gates']['technical'], 'missing')

    def test_report_missing_input(self):
        p = self.root / 'receipt.json'
        p.write_text(json.dumps({'identity': {'movie': {'path': 'gone'}, 'source': {'root': 'gone'}},
                                'gates': {'technical': 'passed'}, 'methods': [{'id': 'decode-census', 'status': 'passed'}]}))
        with patch.object(r, 'identity', side_effect=FileNotFoundError): result = r.report_receipt(p)
        self.assertEqual(result['gates']['technical'], 'missing')


if __name__ == '__main__': unittest.main()
