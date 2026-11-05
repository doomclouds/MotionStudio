#!/usr/bin/env python3
"""Offline contract tests. No real config, credentials, provider calls or media."""
from datetime import date
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import wave

import aliyun_audio_generation as g


def wav():
    stream = io.BytesIO()
    with wave.open(stream, 'wb') as w:
        w.setparams((1, 2, 24000, 0, 'NONE', 'not compressed'))
        w.writeframes(b'\0\0' * 2400)
    return stream.getvalue()


class GenerationTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.input = self.root / 'input.txt'
        self.input.write_text('Synthetic test.')
        self.output = self.root / 'private-session'
        self.calls = []
        self.fake_key = 'synthetic-test-secret'
        self.response = {'request_id': 'synthetic-request-id',
                         'output': {'finish_reason': 'stop', 'audio': {'url': 'http://' + g.RESULT_HOST + '/test.wav?signature=secret-url'},
                                    'extra_info': {'channels': 1, 'sample_rate': 24000}},
                         'usage': {'characters': 15, 'duration': .1}}
        # Fail closed globally if any test forgets to inject its dependencies.
        self.network_patch = patch('urllib.request.OpenerDirector.open', side_effect=AssertionError('Network forbidden'))
        self.config_patch = patch('pathlib.Path.read_text', side_effect=AssertionError('Config/text reads forbidden'))
        self.network_patch.start()
        self.config_patch.start()

    def tearDown(self):
        self.config_patch.stop()
        self.network_patch.stop()
        self.tmp.cleanup()

    def args(self, *extra, kind='tts'):
        return g.parser().parse_args([kind, '--input-file', str(self.input), '--output', str(self.output), *extra])

    def live_args(self, *extra, kind='tts'):
        flags = ['--live', '--consent-transmit', '--pricing-confirmed-on', '2026-11-05']
        if kind == 'tts':
            flags += ['--max-cost-cny', '1']
        else:
            flags += ['--workspace-id', 'test-workspace', '--operator-accept-unbounded-cost']
        return self.args(*flags, *extra, kind=kind)

    def transport(self, req, limit):
        self.calls.append((req, limit))
        self.assertTrue((self.output / 'reservation.json').exists())
        if req.method == 'POST':
            self.assertEqual(req.get_header('Authorization'), 'Bearer ' + self.fake_key)
            self.assertEqual(limit, 1_000_000)
            return json.dumps(self.response).encode()
        self.assertEqual(req.method, 'GET')
        self.assertIsNone(req.get_header('Authorization'))
        self.assertTrue(req.full_url.startswith('https://' + g.RESULT_HOST))
        self.assertEqual(limit, g.MAX_AUDIO_BYTES)
        return wav()

    def run_live(self, args=None, send=None):
        return g.generate(args or self.live_args(), send=send or self.transport,
                          key_loader=lambda: self.fake_key, today=date(2026, 11, 5))

    def test_default_plan_has_no_key_network_or_output(self):
        def forbidden(*args):
            raise AssertionError('No live operation allowed')
        result = g.generate(self.args(), send=forbidden, key_loader=forbidden)
        self.assertEqual(result['status'], 'DRY_RUN')
        self.assertEqual(result['region'], 'cn-beijing')
        self.assertEqual(result['endpoint'], g.endpoint('tts'))
        self.assertFalse(self.output.exists())
        self.assertNotIn('Synthetic test.', json.dumps(result))

    def test_exact_payloads(self):
        self.assertEqual(g.payload('tts', 'Hello'), {'model': 'qwen3-tts-flash', 'input': {'text': 'Hello', 'voice': 'Cherry', 'language_type': 'Chinese'}})
        self.assertEqual(g.payload('music', 'Soft music'), {'model': 'fun-music-v1', 'input': {'prompt': 'Soft music', 'is_instrumental': True, 'format': 'wav'}})
        for kind, size in [('tts', 600), ('music', 2000)]:
            g.payload(kind, 'a' * size)
            for text in ('', ' ', 'a' * (size + 1), '\ud800'):
                with self.assertRaises(g.GenerationError):
                    g.payload(kind, text)
        with self.assertRaises(g.GenerationError):
            g.payload('tts', 'Hello', 'cloned-voice')

    def test_endpoint_allowlist(self):
        self.assertEqual(g.endpoint('tts'), 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation')
        self.assertEqual(g.endpoint('music', 'abc-123'), 'https://abc-123.cn-beijing.maas.aliyuncs.com/api/v1/services/audio/music/generation')
        for workspace in ('a.b', 'a@evil', 'a:443', 'https://evil', '-x', '', 'a' * 64, 'x/path'):
            with self.assertRaises(g.GenerationError):
                g.endpoint('tts', workspace)
        with self.assertRaises(g.GenerationError):
            g.endpoint('music')

    def test_download_url_constraints(self):
        host = g.RESULT_HOST
        self.assertEqual(g.download_url('http://' + host + '/a?x=1'), 'https://' + host + '/a?x=1')
        for url in ('https://evil/a', 'https://' + host + '.evil/a', 'https://user@' + host + '/a',
                    'https://' + host + ':443/a', 'https://' + host + '/a#x', 'ftp://' + host + '/a',
                    'https://' + host + '/a\nb', 'https://' + host + '\\@evil/a'):
            with self.subTest(url=url), self.assertRaises(g.GenerationError):
                g.download_url(url)

    def test_pricing_freshness(self):
        for today in (date(2026, 11, 5), date(2026, 11, 12)):
            g.current_pricing(today.isoformat(), today)
        for today in (date(2026, 11, 4), date(2026, 11, 13)):
            with self.assertRaises(g.GenerationError):
                g.current_pricing(today.isoformat(), today)
        with self.assertRaises(g.GenerationError):
            g.current_pricing('2026-11-04', date(2026, 11, 5))

    def test_live_authorization_budget_fail_before_key(self):
        cases = [self.args('--live'), self.args('--live', '--consent-transmit'),
                 self.live_args('--max-cost-cny', '.0000001'), self.live_args('--max-cost-cny', 'NaN'),
                 self.live_args('--max-cost-cny', '-1'), self.live_args('--max-cost-cny', 'inf')]
        for args in cases:
            with self.subTest(args=args), self.assertRaises(g.GenerationError):
                g.generate(args, send=lambda *a: self.fail('Network'), key_loader=lambda: self.fail('Config'), today=date(2026, 11, 5))
        self.assertFalse(self.output.exists())

    def test_music_unknown_cost_and_hard_cap_block(self):
        p = g.plan('music', 'Synthetic brief', 'workspace')
        self.assertIsNone(p['cost_upper_bound_cny'])
        self.assertFalse(p['provider_enforced_spend_cap'])
        with self.assertRaisesRegex(g.GenerationError, 'Hard spend cap'):
            self.run_live(self.live_args('--max-cost-cny', '5', kind='music'))
        args = self.live_args(kind='music')
        args.operator_accept_unbounded_cost = False
        with self.assertRaisesRegex(g.GenerationError, 'manual operator'):
            self.run_live(args)
        self.assertFalse(self.calls)
        self.assertFalse(self.output.exists())

    def test_tts_success_private_receipt_and_no_retry(self):
        result = self.run_live()
        self.assertEqual(result['status'], 'GENERATED_UNREVIEWED')
        self.assertFalse(result['human_listening'])
        self.assertEqual(result['usage'], {'characters': 15})
        self.assertEqual(result['actual_cost_cny'], '0.00120')
        self.assertEqual(os.stat(self.output).st_mode & 0o777, 0o700)
        for name in ('reservation.json', 'receipt.json', 'output.wav'):
            self.assertEqual(os.stat(self.output / name).st_mode & 0o777, 0o600)
        receipt = (self.output / 'receipt.json').read_bytes()
        for private in (self.fake_key, 'signature', 'secret-url', 'Synthetic test.', g.RESULT_HOST):
            self.assertNotIn(private.encode(), receipt)
        with self.assertRaises(FileExistsError):
            self.run_live()
        self.assertEqual(len(self.calls), 2)

    def test_music_success_metadata(self):
        result = self.run_live(self.live_args(kind='music'))
        self.assertEqual(result['actual_cost_cny'], '0.0002')
        self.assertEqual(result['usage'], {'duration': .1})
        self.assertEqual(result['region'], 'cn-beijing')
        self.assertEqual(result['endpoint'], g.endpoint('music', 'test-workspace'))
        receipt = json.loads((self.output / 'receipt.json').read_bytes())
        self.assertEqual(receipt['endpoint'], result['endpoint'])
        self.assertEqual(receipt['region'], 'cn-beijing')
        body = json.loads(self.calls[0][0].data)
        self.assertEqual(body['input']['is_instrumental'], True)
        self.assertNotIn('duration', body['input'])

    def test_uncertain_post_never_retries_or_leaks(self):
        def fail(req, limit):
            self.assertTrue((self.output / 'reservation.json').exists())
            self.calls.append(req)
            raise TimeoutError('secret-url ' + self.fake_key)
        with self.assertRaises(g.GenerationError) as ctx:
            self.run_live(send=fail)
        self.assertNotIn(self.fake_key, str(ctx.exception))
        failure = json.loads((self.output / 'failure.json').read_bytes())
        self.assertEqual(failure['status'], 'FAILED_OR_UNCERTAIN_DO_NOT_RESUBMIT')
        with self.assertRaises(FileExistsError):
            self.run_live(send=fail)
        self.assertEqual(len(self.calls), 1)

    def test_redirect_refused(self):
        with self.assertRaises( g.ReviewError):
            g.NoRedirect().redirect_request(None, None, 302, '', {}, 'https://evil/')

    def test_malformed_response_stops_before_download(self):
        for case in ({}, {'code': 'error'}, {'request_id': 'bad\nrequest'}, {'error': 'secret'}):
            with self.subTest(case=case), self.assertRaises(g.GenerationError):
                g.response_fields(json.dumps(case).encode(), 'tts')
        self.response['usage']['characters'] = True
        with self.assertRaises(g.GenerationError):
            self.run_live()
        self.assertEqual(len(self.calls), 1)

    def test_wav_validation(self):
        good = wav()
        self.assertEqual(g.validate_wav(good)['duration_s'], .1)
        for raw in (b'', b'not audio' * 10, good[:-1], good + b'junk', b'X' * (g.MAX_AUDIO_BYTES + 1)):
            with self.assertRaises(g.GenerationError):
                g.validate_wav(raw)

    def test_missing_key_skips_without_output(self):
        result = g.generate(self.live_args(), key_loader=lambda: None, send=lambda *a: self.fail('network'), today=date(2026, 11, 5))
        self.assertEqual(result['status'], 'SKIPPED_NOT_CONFIGURED')
        self.assertFalse(self.output.exists())

    def test_bad_download_preserves_usage_and_blocks_success(self):
        def send(req, limit):
            if req.method == 'POST':
                return self.transport(req, limit)
            return b'bad WAV'
        with self.assertRaises(g.GenerationError):
            self.run_live(send=send)
        self.assertFalse((self.output / 'receipt.json').exists())
        failure = json.loads((self.output / 'failure.json').read_bytes())
        self.assertEqual(failure['usage'], {'characters': 15})

    def test_nonterminal_response_never_downloads(self):
        for kind in ('tts', 'music'):
            for index, reason in enumerate((None, 'null', 'length', 'error', 'missing')):
                with self.subTest(kind=kind, reason=reason):
                    self.output = self.root / f'nonterminal-{kind}-{index}'
                    self.calls.clear()
                    self.response['output']['finish_reason'] = reason
                    if reason == 'missing':
                        del self.response['output']['finish_reason']
                    with self.assertRaises(g.GenerationError):
                        self.run_live(self.live_args(kind=kind))
                    self.assertEqual(len(self.calls), 1)
                    self.assertFalse((self.output / 'output.wav').exists())
                    self.assertFalse((self.output / 'receipt.json').exists())
                    failure = json.loads((self.output / 'failure.json').read_bytes())
                    self.assertEqual(failure['status'], 'FAILED_OR_UNCERTAIN_DO_NOT_RESUBMIT')
                    self.assertEqual(failure['request_id'], 'synthetic-request-id')
                    self.assertIn('actual_cost_cny', failure)
                    self.assertIn('usage', failure)

    def test_nonterminal_credential_echo_never_retained(self):
        self.response['output']['finish_reason'] = None
        self.response['request_id'] = self.fake_key
        with self.assertRaises(g.GenerationError):
            self.run_live()
        failure = (self.output / 'failure.json').read_bytes()
        self.assertNotIn(self.fake_key.encode(), failure)
        self.assertNotIn(b'request_id', failure)

    def test_documented_tts_success_return_object(self):
        # Official qwen-tts-api return-object shape, with synthetic URL/ID.
        # https://help.aliyun.com/zh/model-studio/qwen-tts-api
        self.response = {
            'status_code': 200, 'request_id': '5c63c65c-cad8-4bf4-959d-xxxxxxxxxxxx',
            'code': '', 'message': '',
            'output': {'text': None, 'finish_reason': 'stop', 'choices': None,
                       'audio': {'data': '', 'url': 'http://' + g.RESULT_HOST + '/test.wav?signature=synthetic',
                                 'id': 'audio_synthetic', 'expires_at': 1766113409}},
            'usage': {'input_tokens': 0, 'output_tokens': 0, 'characters': 195}}
        result = self.run_live()
        self.assertEqual(result['status'], 'GENERATED_UNREVIEWED')
        self.assertEqual(result['usage'], {'characters': 195})

    def test_error_and_non200_wrappers_rejected(self):
        for fields in ({'status_code': 400}, {'status_code': 500, 'code': '', 'message': ''},
                       {'status_code': '200'}, {'status_code': True}, {'status_code': None},
                       {'status_code': 200, 'code': 'InvalidInput'}, {'code': None}, {'code': 0},
                       {'message': 'error text'}, {'message': None}, {'error': ''}):
            obj = {**self.response, **fields}
            with self.subTest(fields=fields), self.assertRaises(g.GenerationError):
                g.response_fields(json.dumps(obj).encode(), 'tts')

    def test_credential_echo_in_request_id_is_never_retained(self):
        self.response['request_id'] = 'prefix-' + self.fake_key + '-suffix'
        with self.assertRaises(g.GenerationError) as ctx:
            self.run_live()
        self.assertNotIn(self.fake_key, str(ctx.exception))
        self.assertEqual(len(self.calls), 1)
        for name in ('reservation.json', 'failure.json'):
            data = (self.output / name).read_bytes()
            self.assertNotIn(self.fake_key.encode(), data)
            self.assertNotIn(b'request_id', data)
        self.assertFalse((self.output / 'receipt.json').exists())

    def test_credential_echo_in_download_url_blocks_get(self):
        self.response['output']['audio']['url'] += '&echo=' + self.fake_key
        with self.assertRaises(g.GenerationError):
            self.run_live()
        self.assertEqual(len(self.calls), 1)
        self.assertNotIn(self.fake_key.encode(), (self.output / 'failure.json').read_bytes())

    def test_music_digit_string_sample_rate(self):
        self.response['output']['extra_info']['sample_rate'] = '24000'
        result = self.run_live(self.live_args(kind='music'))
        self.assertEqual(result['output']['sample_rate'], 24000)

    def test_invalid_music_sample_rates(self):
        for rate in (' 24000', '+24000', '24000.0', '２４０００', '24e3', '', '9999999',
                     24000.0, True, None, -24000, 0, '1'):
            self.response['output']['extra_info']['sample_rate'] = rate
            with self.subTest(rate=rate), self.assertRaises(g.GenerationError):
                g.response_fields(json.dumps(self.response).encode(), 'music')

    def test_live_output_inside_installation_blocks_before_key(self):
        root = g.project_root(g.__file__)
        for path in (root, root / 'never-create-generation-output'):
            args = self.live_args('--output', str(path))
            with self.assertRaisesRegex(g.GenerationError, 'outside'):
                g.generate(args, send=lambda *a: self.fail('Network'),
                           key_loader=lambda: self.fail('Config'), today=date(2026, 11, 5))
        self.assertFalse((root / 'never-create-generation-output').exists())

    def test_output_symlink_to_installation_blocks(self):
        alias = self.root / 'alias'
        alias.symlink_to(g.project_root(g.__file__), target_is_directory=True)
        args = self.live_args('--output', str(alias / 'never-create-generation-output'))
        with self.assertRaisesRegex(g.GenerationError, 'outside'):
            g.generate(args, send=lambda *a: self.fail('Network'),
                       key_loader=lambda: self.fail('Config'), today=date(2026, 11, 5))

    def test_portable_root_output_blocks(self):
        install = self.root / 'portable'
        install.mkdir()
        with patch.object(g, 'project_root', return_value=install):
            args = self.live_args('--output', str(install / 'new-output'))
            with self.assertRaisesRegex(g.GenerationError, 'outside'):
                self.run_live(args)
        self.assertFalse(self.calls)
        self.assertFalse((install / 'new-output').exists())

    def test_unicode_quote_is_conservative(self):
        result = g.plan('tts', '你好')
        self.assertEqual(result['input_characters'], 2)
        self.assertEqual(result['conservative_quote_cny'], '0.00048')

    def test_music_metadata_mismatch_fails(self):
        self.response['output']['extra_info']['channels'] = 2
        with self.assertRaises(g.GenerationError):
            self.run_live(self.live_args(kind='music'))
        self.assertFalse((self.output / 'receipt.json').exists())

    def test_interruption_is_reserved_and_sanitized(self):
        def interrupted(req, limit):
            raise KeyboardInterrupt()
        with self.assertRaises(g.GenerationError):
            self.run_live(send=interrupted)
        self.assertTrue((self.output / 'reservation.json').exists())
        self.assertTrue((self.output / 'failure.json').exists())

    def test_oversized_response_and_nonfinite_usage(self):
        with self.assertRaises(g.GenerationError):
            g.response_fields(b'x' * 1_000_001, 'tts')
        for amount in (float('nan'), float('inf'), -1, 0, True, '1'):
            self.response['usage']['duration'] = amount
            with self.assertRaises(g.GenerationError):
                g.response_fields(json.dumps(self.response).encode(), 'music')

    def test_decode_failure_is_not_success(self):
        with patch.object(g.shutil, 'which', return_value='/synthetic/ffmpeg'), \
             patch.object(g.subprocess, 'run', return_value=type('Result', (), {'returncode': 1})()):
            with self.assertRaises(g.GenerationError):
                self.run_live()
        self.assertFalse((self.output / 'receipt.json').exists())

    def test_no_decoder_is_explicit(self):
        with patch.object(g.shutil, 'which', return_value=None):
            result = self.run_live()
        self.assertEqual(result['full_decode'], 'not_run_ffmpeg_unavailable')


if __name__ == '__main__':
    unittest.main()
