"""Offline only: synthetic WAV and mock provider. No network and no real key."""
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import wave

spec = importlib.util.spec_from_file_location('audio_review', Path(__file__).with_name('audio_review.py'))
a = importlib.util.module_from_spec(spec)
spec.loader.exec_module(a)

class AudioReviewTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.audio = self.root / 'clip.wav'
        with wave.open(str(self.audio), 'wb') as f:
            f.setnchannels(1); f.setsampwidth(2); f.setframerate(16000)
            f.writeframes(b'\0\0' * 16000)
        self.out = self.root / 'output'
        self.env = patch.dict(os.environ, {'DASHSCOPE_API_KEY': 'synthetic-test-secret'}, clear=True)
        self.env.start()
    def tearDown(self):
        self.env.stop(); self.temp.cleanup()
    def review(self):
        return {'summary': 'No distinct event', 'uncertainties': ['Synthetic silence; no aesthetic claim'], 'observations': []}
    def success(self, *args):
        return self.review(), {'prompt_tokens': 100, 'completion_tokens': 100}
    def run_live(self, **kwargs):
        args = dict(clips=[self.audio], budget=.10, output=self.out, live=True, consent=True,
                    price_confirmed=a.datetime.now(a.timezone.utc).date().isoformat(), transport=self.success)
        args.update(kwargs)
        return a.execute(**args)
    def test_dry_run_never_calls_provider_or_needs_key(self):
        with patch.dict(os.environ, {}, clear=True):
            r = a.execute([self.audio], .10, self.out, transport=lambda *x: self.fail('Network'))
        self.assertEqual(r['native_audio_review'], 'unverified')
        self.assertFalse(self.out.exists())
    def test_success_is_reviewed_not_passed(self):
        r = self.run_live()
        self.assertEqual(r['native_audio_review'], 'reviewed')
        for key in ('owner_preference', 'audiovisual_sync', 'stereo_imaging'):
            self.assertEqual(r[key], 'unverified')
        self.assertEqual(r['technical']['status'], 'unverified')
    def test_no_consent(self):
        with self.assertRaises(a.ReviewError): self.run_live(consent=False)
        self.assertFalse(self.out.exists())
    def test_no_key(self):
        with patch.dict(os.environ, {}, clear=True), self.assertRaises(a.ReviewError): self.run_live()
    def test_endpoint_refuses_untrusted_and_redirect_style(self):
        for url in ['http://dashscope.aliyuncs.com/compatible-mode/v1', a.BASE_URL + '?x=1', a.BASE_URL + '.evil', 'https://evil.cn-beijing.maas.aliyuncs.com.evil/compatible-mode/v1', 'https://user@dashscope.aliyuncs.com/compatible-mode/v1']:
            with self.subTest(url=url), self.assertRaises(a.ReviewError): a.endpoint(url)
    def test_official_endpoint(self):
        self.assertEqual(a.endpoint(a.BASE_URL), a.BASE_URL)
        a.endpoint('https://workspace-123.cn-beijing.maas.aliyuncs.com/compatible-mode/v1')
    def test_budget_bounds(self):
        for value in (0, .00001, 1, float('nan'), float('inf')):
            with self.subTest(value=value), self.assertRaises(a.ReviewError): self.run_live(budget=value)
    def test_price_ack_required(self):
        with self.assertRaises(a.ReviewError): self.run_live(price_confirmed=None)
    def test_timestamps(self):
        r = self.review()
        r['observations'] = [dict(start_s=0, end_s=2, category='pulse', evidence='pulse', severity='info', suggestion='verify')]
        with self.assertRaises(a.ReviewError): a.validate_review(r, 1)
    def test_empty_schema_invalid(self):
        with self.assertRaises(a.ReviewError): a.validate_review({}, 1)
    def test_uncertain_does_not_retry_or_leak(self):
        count = []
        def fail(*args):
            count.append(1)
            raise RuntimeError('Authorization synthetic-test-secret data:;base64,AAAA')
        r = self.run_live(transport=fail)
        self.assertEqual(len(count), 1)
        self.assertEqual(r['native_audio_review'], 'unverified')
        self.assertEqual(r['clips'][0]['status'], 'uncertain')
        for f in self.out.iterdir():
            self.assertNotIn('synthetic-test-secret', f.read_text())
            self.assertNotIn('base64,', f.read_text())
        with self.assertRaises(a.ReviewError): self.run_live()
    def test_completed_ledger_refuses_reuse(self):
        self.run_live()
        with self.assertRaises(a.ReviewError): self.run_live()
    def test_invalid_model_json_unverified(self):
        r = self.run_live(transport=lambda *args: ({'pass': True}, {'prompt_tokens': 1, 'completion_tokens': 1}))
        self.assertEqual(r['native_audio_review'], 'unverified')
    def test_invalid_usage_unverified(self):
        r = self.run_live(transport=lambda *args: (self.review(), {}))
        self.assertEqual(r['native_audio_review'], 'unverified')
    def test_duplicate_inputs(self):
        with self.assertRaises(a.ReviewError): self.run_live(clips=[self.audio, self.audio])
    def test_missing_and_not_wav(self):
        with self.assertRaises(a.ReviewError): a.clip(self.root / 'missing')
        self.audio.write_text('not a wav')
        with self.assertRaises(a.ReviewError): a.clip(self.audio)
    def test_output_must_be_ignored(self):
        with self.assertRaises(a.ReviewError): self.run_live(output=self.root / 'source')
    def test_transport_parses_sse_and_uses_native_audio(self):
        review = self.review()
        chunks = [
            {'choices': [{'index': 0, 'delta': {'content': json.dumps(review)}, 'finish_reason': None}]},
            {'choices': [{'index': 0, 'delta': {}, 'finish_reason': 'stop'}]},
            {'choices': [], 'usage': {'prompt_tokens': 100, 'completion_tokens': 100}}]
        wire = b''.join(b'data: ' + json.dumps(c).encode() + b'\n\n' for c in chunks) + b'data: [DONE]\n'
        class MockOpener:
            def open(inner, req, timeout):
                payload = json.loads(req.data)
                self.assertEqual(payload['model'], 'qwen3.8-omni-flash')
                self.assertEqual(payload['reasoning_effort'], 'none')
                self.assertNotIn('enable_thinking', payload)
                self.assertNotIn('thinking_budget', payload)
                self.assertEqual(payload['modalities'], ['text'])
                self.assertTrue(payload['stream'])
                self.assertEqual(payload['stream_options'], {'include_usage': True})
                self.assertEqual(payload['max_tokens'], a.MAX_OUTPUT)
                self.assertEqual(payload['messages'][0]['content'][1]['type'], 'input_audio')
                self.assertEqual(req.full_url, a.BASE_URL + '/chat/completions')
                return io.BytesIO(wire)
        with patch.object(a.urllib.request, 'build_opener', return_value=MockOpener()):
            result, usage = a.request_review(b'fakeaudio', a.BASE_URL, 'test-only-key')
        self.assertEqual(result, review)
        self.assertEqual(usage['prompt_tokens'], 100)
    def test_transport_rejects_truncated_stream(self):
        with patch.object(a.urllib.request, 'build_opener') as opener:
            opener.return_value.open.return_value = io.BytesIO(b'data: [DONE]\n')
            with self.assertRaises(a.ReviewError): a.request_review(b'fakeaudio', a.BASE_URL, 'test-only-key')
    def test_sse_rejects_invalid_terminal_and_choices_with_uncertain_ledger(self):
        def choice(reason=None, index=0, content=''):
            return {'index': index, 'delta': {'content': content}, 'finish_reason': reason}
        valid_text = {'choices': [choice(content=json.dumps(self.review()))]}
        stop = {'choices': [choice('stop')]}
        cases = [
            [valid_text, stop, {'choices': [choice('length')]}],
            [{'choices': [choice('length', content=json.dumps(self.review())), choice('stop', 1)]}],
            [valid_text, stop, {'choices': [choice(content='extra')]}],
            [valid_text, stop, stop],
            [valid_text, {'choices': [choice('stop', 1)]}],
            [valid_text, {'choices': [choice('length')]}],
            [valid_text, {'choices': [{'delta': {}, 'finish_reason': 'stop'}]}],
        ]
        for n, chunks in enumerate(cases):
            with self.subTest(case=n):
                wire = b''.join(b'data: ' + json.dumps(c).encode() + b'\n\n' for c in chunks)
                wire += b'data: {"choices": [], "usage": {"prompt_tokens": 100, "completion_tokens": 100}}\n\ndata: [DONE]\n'
                out = self.out / str(n)
                with patch.object(a.urllib.request, 'build_opener') as opener:
                    opener.return_value.open.return_value = io.BytesIO(wire)
                    r = self.run_live(transport=a.request_review, output=out)
                    self.assertEqual(opener.return_value.open.call_count, 1)
                self.assertEqual(r['native_audio_review'], 'unverified')
                self.assertFalse(r['readiness']['live_verified'])
                self.assertEqual(r['clips'][0]['status'], 'uncertain')
                ledger = [json.loads(x) for x in (out / 'audio-review-ledger.jsonl').read_text().splitlines()]
                self.assertEqual(ledger[0]['state'], 'reserved')
                self.assertGreater(ledger[0]['reservation_cny'], 0)
                self.assertIn('uncertain', [x['state'] for x in ledger])
                with self.assertRaises(a.ReviewError): self.run_live(output=out)
    def test_pilot_duration_cap_twenty_seconds(self):
        with wave.open(str(self.audio), 'wb') as f:
            f.setnchannels(1); f.setsampwidth(2); f.setframerate(16000)
            f.writeframes(b'\0\0' * 16000 * 21)
        with self.assertRaises(a.ReviewError): self.run_live()
    def test_provider_echo_secret_is_suppressed(self):
        value = self.review(); value['summary'] = 'synthetic-test-secret'
        r = self.run_live(transport=lambda *args: (value, {'prompt_tokens': 100, 'completion_tokens': 100}))
        self.assertEqual(r['native_audio_review'], 'unverified')
        self.assertNotIn('synthetic-test-secret', json.dumps(r))
    def test_transport_preserves_platform_proxy_without_changing_https_or_redirect_guard(self):
        with patch.object(a.urllib.request, 'ProxyHandler') as proxy_handler, patch.object(a.urllib.request, 'build_opener') as opener:
            opener.return_value.open.return_value = io.BytesIO(b'data: [DONE]\n')
            with self.assertRaises(a.ReviewError):
                a.request_review(b'fakeaudio', a.BASE_URL, 'test-only-key')
            proxy_handler.assert_called_once_with()
            handlers = opener.call_args.args
            self.assertIs(handlers[0], proxy_handler.return_value)
            self.assertIsInstance(handlers[1], a.NoRedirect)
            request = opener.return_value.open.call_args.args[0]
            self.assertEqual(request.full_url, a.BASE_URL + '/chat/completions')
            self.assertTrue(request.full_url.startswith('https://'))
            # No custom SSL context/HTTPS handler weakens Python's default TLS checks.
            self.assertEqual(len(handlers), 2)
    def test_redirect_handler_refuses(self):
        with self.assertRaises(a.ReviewError):
            a.NoRedirect().redirect_request(None, None, 302, '', {}, 'https://evil.example')
    def test_usage_cost_counts_reasoning_within_completion_total_once(self):
        tokens, value = a.usage_cost({
            'prompt_tokens': 1_000_000, 'completion_tokens': 1_000_000,
            'completion_tokens_details': {'reasoning_tokens': 400_000}})
        self.assertEqual(tokens, {'prompt_tokens': 1_000_000, 'completion_tokens': 1_000_000})
        self.assertEqual(value, 3.5)
    def test_usage_cost_does_not_assume_cached_discount(self):
        _, value = a.usage_cost({'prompt_tokens': 1_000_000, 'completion_tokens': 1_000_000})
        self.assertEqual(value, 3.5)

if __name__ == '__main__': unittest.main()
