"""Synthetic native-MP4 and mocked-provider tests; no credentials or network."""
import base64
from datetime import datetime
import hashlib
import io
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch

import aliyun_video_review as v


@unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe'), 'Existing FFmpeg required; no install')
class NativeVideoTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='aliyun-video-test-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.movie = self.root / 'synthetic.mp4'
        v.command(['ffmpeg', '-nostdin', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=s=160x90:r=10:d=1',
                   '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=1', '-shortest',
                   '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', str(self.movie)])
        self.sha = hashlib.sha256(self.movie.read_bytes()).hexdigest()
        self.output = self.root / 'output'
        owner = self
        class FixtureTime(datetime):
            @classmethod
            def now(cls, tz=None):
                return cls.combine(v.a.PRICE_DATE, cls.min.time(), tzinfo=v.a.timezone.utc)
        clock = patch.object(v.a, 'datetime', FixtureTime)
        clock.start()
        self.addCleanup(clock.stop)

    def response(self, raw, base, key, **kwargs):
        body = kwargs['payload_override']
        content = body['messages'][0]['content']
        self.assertEqual(content[1]['type'], 'video_url')
        self.assertEqual(base64.b64decode(content[1]['video_url']['url'].split(',', 1)[1]), self.movie.read_bytes())
        self.assertEqual(body['reasoning_effort'], 'none')
        self.assertNotIn('tools', body)
        self.assertEqual(base, 'https://synthetic-workspace.cn-beijing.maas.aliyuncs.com/compatible-mode/v1')
        return {'summary': 'Synthetic response, not a real review', 'uncertainties': ['Mock only'],
                'observations': [{'start_s': 0, 'end_s': .5, 'category': 'visual',
                    'evidence': 'Synthetic observation', 'severity': 'info', 'suggestion': 'Review actual content'}]}, \
               {'prompt_tokens': 100, 'completion_tokens': 50}, \
               {'request_id': 'mock-request', 'model': v.a.MODEL, 'response_text': 'synthetic'}

    def live(self, **overrides):
        args = dict(movie=self.movie, expected_sha256=self.sha, output=self.output,
                    workspace_id='synthetic-workspace', live=True, consent=True,
                    price_confirmed=v.a.PRICE_DATE.isoformat(), budget=.10,
                    transport=self.response, key_loader=lambda: 'synthetic-only')
        args.update(overrides)
        return v.execute(**args)

    def test_dry_run_freezes_real_mp4_without_config_network_or_output(self):
        with patch.object(v.a, 'load_project_key', side_effect=AssertionError('Config read')), \
             patch.object(v.a.urllib.request, 'urlopen', side_effect=AssertionError('Network')):
            result = v.execute(self.movie, self.sha, self.output,
                               transport=lambda *args, **kwargs: self.fail('Provider'))
        self.assertEqual(result['status'], 'DRY_RUN_NO_NETWORK')
        self.assertEqual(result['input']['sha256'], self.sha)
        self.assertTrue(result['input']['audio_present'])
        self.assertFalse(self.output.exists())

    def test_success_is_native_model_evidence_not_human_or_delivery_approval(self):
        result = self.live()
        self.assertEqual(result['status'], 'MODEL_REVIEW_COMPLETED_NOT_APPROVAL')
        self.assertFalse(result['human_watching'])
        self.assertFalse(result['human_listening'])
        self.assertFalse(result['delivery_approved'])
        self.assertEqual(result['audiovisual_sync'], 'unverified')
        self.assertEqual((self.output.stat().st_mode & 0o777), 0o700)
        self.assertEqual(((self.output / 'report.json').stat().st_mode & 0o777), 0o600)
        self.assertNotIn('synthetic-only', (self.output / 'report.json').read_text())

    def test_brief_is_bound_and_sent_but_not_copied_to_report(self):
        brief = self.root / 'brief.txt'
        brief.write_text('合成测试目标')
        def send(raw, base, key, **kwargs):
            self.assertIn('合成测试目标', kwargs['payload_override']['messages'][0]['content'][0]['text'])
            return self.response(raw, base, key, **kwargs)
        result = self.live(brief_file=brief, transport=send)
        self.assertEqual(result['brief_sha256'], hashlib.sha256(brief.read_bytes()).hexdigest())
        self.assertNotIn('合成测试目标', (self.output / 'report.json').read_text())

    def test_wrong_hash_and_symlink_rejected(self):
        with self.assertRaises(v.a.ReviewError):
            v.prepare(self.movie, '0' * 64)
        link = self.root / 'link.mp4'
        link.symlink_to(self.movie)
        with self.assertRaises(v.a.ReviewError):
            v.prepare(link, self.sha)

    def test_authority_budget_region_and_current_price_gate_before_key_read(self):
        cases = [dict(consent=False), dict(workspace_id='evil.test/path'), dict(workspace_id=None),
                 dict(budget=.001), dict(budget=float('nan')), dict(price_confirmed='2000-01-01')]
        for kwargs in cases:
            with self.subTest(kwargs=kwargs), self.assertRaises(v.a.ReviewError):
                self.live(key_loader=lambda: self.fail('Config read before gate'), **kwargs)
        self.assertFalse(self.output.exists())

    def test_missing_config_does_not_make_a_request(self):
        result = self.live(key_loader=lambda: None, transport=lambda *a, **k: self.fail('Provider'))
        self.assertEqual(result['status'], 'SKIPPED_NOT_CONFIGURED')
        self.assertFalse(self.output.exists())

    def test_timeout_is_recorded_without_echo_and_same_session_cannot_retry(self):
        def broken(*args, **kwargs):
            raise RuntimeError('secret synthetic-only and raw provider data')
        result = self.live(transport=broken)
        self.assertEqual(result['status'], 'CALL_UNCERTAIN_NO_RETRY')
        self.assertNotIn('synthetic-only', (self.output / 'report.json').read_text())
        with self.assertRaises(v.a.ReviewError):
            self.live(transport=lambda *a, **k: self.fail('Repeated charge'))

    def test_provider_echo_or_invalid_observation_cannot_become_success(self):
        def invalid(raw, base, key, **kwargs):
            review, usage, receipt = self.response(raw, base, key, **kwargs)
            review['summary'] = key
            return review, usage, receipt
        result = self.live(transport=invalid)
        self.assertEqual(result['status'], 'CALL_UNCERTAIN_NO_RETRY')
        self.assertNotIn('review', result)

    def test_category_and_range_validation(self):
        value = {'summary': 'synthetic', 'uncertainties': [], 'observations': []}
        self.assertEqual(v.validate_review(value, 1), value)
        for category, end in [('passed', .5), ('visual', 5)]:
            row = {'start_s': 0, 'end_s': end, 'category': category, 'evidence': 'fixture',
                   'severity': 'info', 'suggestion': 'fixture'}
            with self.assertRaises(v.a.ReviewError):
                v.validate_review(dict(value, observations=[row]), 1)

    def test_silent_video_has_no_fabricated_audio_presence(self):
        silent = self.root / 'silent.mp4'
        v.command(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(self.movie), '-c:v', 'copy', '-an', str(silent)])
        report, raw, brief = v.prepare(silent, hashlib.sha256(silent.read_bytes()).hexdigest())
        self.assertFalse(report['input']['audio_present'])
        self.assertFalse(report['human_listening'])

    def test_size_duration_resolution_and_stream_origins_block(self):
        with patch.object(v, 'MAX_BYTES', 10), self.assertRaises(v.a.ReviewError):
            v.prepare(self.movie, self.sha)
        valid = {'format': {'duration': '1'}, 'streams': [{'codec_type': 'video', 'index': 0,
                 'width': 160, 'height': 90, 'start_time': '0', 'duration': '1'}]}
        for change in ('duration', 'resolution', 'origin', 'extra'):
            info = json.loads(json.dumps(valid))
            if change == 'duration': info['format']['duration'] = '21'
            if change == 'resolution': info['streams'][0]['width'] = 100000
            if change == 'origin': info['streams'][0]['start_time'] = '1'
            if change == 'extra': info['streams'].append({'codec_type': 'subtitle'})
            with self.subTest(change=change), patch.object(v, 'command', return_value=json.dumps(info).encode()), self.assertRaises(v.a.ReviewError):
                v.prepare(self.movie, self.sha)

    def test_installation_output_and_excess_usage_cannot_be_success(self):
        with self.assertRaises(v.a.ReviewError):
            self.live(output=v.a.project_root(v.__file__) / 'forbidden-output', key_loader=lambda: self.fail('Config before path gate'))
        def costly(*args, **kwargs):
            review, usage, receipt = self.response(*args, **kwargs)
            usage['prompt_tokens'] = 1000000
            return review, usage, receipt
        result = self.live(transport=costly)
        self.assertEqual(result['status'], 'CALL_UNCERTAIN_NO_RETRY')
        self.assertGreater(result['estimated_actual_cost_cny'], v.RESERVATION)
        self.assertFalse(result['delivery_approved'])

    def test_cli_default_cannot_load_configuration(self):
        with patch.object(v.sys, 'argv', ['aliyun_video_review.py', str(self.movie), '--expected-sha256', self.sha]), \
             patch.object(v.a, 'load_project_key', side_effect=AssertionError('Config read')), \
             patch('sys.stdout', new=io.StringIO()):
            self.assertEqual(v.main(), 0)


class WorkspaceTests(unittest.TestCase):
    def test_explicit_workspace_endpoint_has_no_arbitrary_host_override(self):
        self.assertEqual(v.a.workspace_endpoint('example-1'),
                         'https://example-1.cn-beijing.maas.aliyuncs.com/compatible-mode/v1')
        for bad in ['x.y', '../x', '', 'https://host', 'x@host', '-bad']:
            with self.assertRaises(v.a.ReviewError):
                v.a.workspace_endpoint(bad)


if __name__ == '__main__':
    unittest.main()
