"""Synthetic metadata/CLI tests only; no video rendering or approval claims."""
import contextlib
from fractions import Fraction
import io
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import check_delivery as check


def movie(duration='8', identity='a' * 64):
    return {'duration_seconds_exact': duration, 'sha256': identity}


def probe(duration='8', **extra):
    return {'streams': [dict(codec_type='video', duration=duration, **extra)]}


def exception(sample, original):
    return {'kind': 'short-original-user-exception', 'sample_sha256': sample['sha256'],
            'original_sha256': original['sha256'], 'user_quote': 'SYNTHETIC user exception fixture',
            'approval_reference': 'SYNTHETIC fixture; not actual authorization'}


class DurationTests(unittest.TestCase):
    def test_user_sample_boundary_without_rounding(self):
        for duration, status in [('1', 'failed'), ('6.999999', 'failed'), ('209/30', 'failed'),
                                 ('7', 'passed'), ('7000001/1000000', 'passed'), ('8', 'passed')]:
            with self.subTest(duration=duration):
                self.assertEqual(check.evaluate('user-sample', movie(duration))['status'], status)

    def test_short_internal_and_final_are_not_rejected_by_sample_rule(self):
        for role in ('internal-test', 'final'):
            result = check.evaluate(role, movie('1/30'))
            self.assertEqual(result['status'], 'not_applicable')
            self.assertEqual(result['owner_artistic_approval'], 'not_checked')

    def test_ticks_take_precedence_over_rounded_duration(self):
        self.assertEqual(check.video_duration(probe('7', duration_ts=209, time_base='1/30')), Fraction(209, 30))
        self.assertEqual(check.video_duration(probe('6.9', duration_ts='210', time_base='1/30')), 7)

    def test_format_duration_cannot_pad_video(self):
        data = probe('6')
        data['format'] = {'duration': '12'}
        self.assertEqual(check.video_duration(data), 6)
        data['streams'][0].pop('duration')
        with self.assertRaises(ValueError):
            check.video_duration(data)

    def test_unknown_invalid_or_ambiguous_timing_rejected(self):
        for data in ([], {}, {'streams': []}, {'streams': [probe()['streams'][0]] * 2},
                     {'streams': [{'codec_type': 'audio', 'duration': '8'}]},
                     *[probe(d) for d in ('N/A', 'NaN', 'Infinity', '-1', '0')],
                     probe('8', duration_ts=True, time_base='1/30'),
                     probe('8', duration_ts=210.5, time_base='1/30'),
                     probe('8', duration_ts=-210, time_base='-1/30'),
                     probe('8', duration_ts=210, time_base='1/0')):
            with self.subTest(data=data), self.assertRaises((ValueError, ZeroDivisionError)):
                check.video_duration(data)

    def test_short_original_needs_bound_explicit_exception(self):
        sample, original = movie('5'), movie('5', 'b' * 64)
        self.assertEqual(check.evaluate('user-sample', sample)['status'], 'failed')
        result = check.evaluate('user-sample', sample, original, exception(sample, original))
        self.assertEqual(result['status'], 'exception_recorded')
        self.assertEqual(result['authorization'], 'declared_not_verified')
        self.assertEqual(result['owner_artistic_approval'], 'not_checked')

    def test_exception_cannot_apply_to_long_original_wrong_role_or_identity(self):
        sample, original = movie('5'), movie('5', 'b' * 64)
        for role, candidate, source in [('final', sample, original), ('internal-test', sample, original),
                                         ('user-sample', movie('7'), original),
                                         ('user-sample', sample, movie('7', 'b' * 64)),
                                         ('user-sample', movie('5', 'c' * 64), original)]:
            with self.subTest(role=role, candidate=candidate, source=source), self.assertRaises(ValueError):
                check.evaluate(role, candidate, source, exception(sample, original))

    def test_exception_requires_quote_reference_and_both_inputs(self):
        sample, original = movie('5'), movie('5', 'b' * 64)
        for field in ('user_quote', 'approval_reference', 'sample_sha256', 'original_sha256', 'kind'):
            data = exception(sample, original)
            data[field] = ''
            with self.subTest(field=field), self.assertRaises(ValueError):
                check.evaluate('user-sample', sample, original, data)
        for source, data in ((None, exception(sample, original)), (original, None)):
            with self.assertRaises(ValueError):
                check.evaluate('user-sample', sample, source, data)

    def test_probe_is_local_metadata_only_and_detects_mutation(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'synthetic.txt'
            path.write_text('SYNTHETIC not media')
            with patch.object(check.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0, json.dumps(probe()), '')) as run:
                result = check.inspect(path)
            self.assertEqual(result['duration_seconds_exact'], '8')
            self.assertIn('file,pipe', run.call_args.args[0])
            self.assertNotIn('-show_format', run.call_args.args[0])
            def mutate(*args, **kwargs):
                path.write_text('changed SYNTHETIC bytes')
                return subprocess.CompletedProcess([], 0, json.dumps(probe()), '')
            with patch.object(check.subprocess, 'run', side_effect=mutate), self.assertRaisesRegex(ValueError, 'changed'):
                check.inspect(path)

    def test_cli_exit_codes_without_rendering(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'synthetic.txt'
            path.write_text('SYNTHETIC not media')
            for role, duration, code in [('user-sample', '6.99', 1), ('user-sample', '7', 0),
                                         ('internal-test', '1', 0), ('final', '1', 0)]:
                with self.subTest(role=role, duration=duration), contextlib.redirect_stdout(io.StringIO()), \
                     patch.object(check.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0, json.dumps(probe(duration)), '')):
                    self.assertEqual(check.main([str(path), '--role', role]), code)
            for problem in (FileNotFoundError('missing ffprobe'), subprocess.TimeoutExpired('ffprobe', 30)):
                with contextlib.redirect_stderr(io.StringIO()), patch.object(check.subprocess, 'run', side_effect=problem):
                    self.assertEqual(check.main([str(path), '--role', 'user-sample']), 2)

    def test_cli_exception_binds_actual_bytes_but_does_not_certify_authority(self):
        with tempfile.TemporaryDirectory() as directory:
            sample, original, record = [Path(directory) / name for name in ('sample.txt', 'original.txt', 'exception.json')]
            sample.write_text('SYNTHETIC sample not media')
            original.write_text('SYNTHETIC original not media')
            record.write_text(json.dumps(exception(movie('5', check.digest(sample)), movie('5', check.digest(original)))))
            output = io.StringIO()
            with contextlib.redirect_stdout(output), patch.object(check.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0, json.dumps(probe('5')), '')):
                code = check.main([str(sample), '--role', 'user-sample', '--short-original', str(original), '--exception-record', str(record)])
            result = json.loads(output.getvalue())
            self.assertEqual(code, 0)
            self.assertEqual(result['status'], 'exception_recorded')
            self.assertEqual(result['authorization'], 'declared_not_verified')
            self.assertEqual(result['exception_record_sha256'], check.digest(record))

    def test_cli_requires_explicit_role_and_complete_exception_flags(self):
        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as raised:
                check.main(['synthetic.txt'])
            self.assertEqual(raised.exception.code, 2)
            with patch.object(check, 'inspect') as inspect:
                self.assertEqual(check.main(['synthetic.txt', '--role', 'user-sample', '--short-original', 'original.txt']), 2)
                self.assertEqual(check.main(['synthetic.txt', '--role', 'final', '--short-original', 'original.txt', '--exception-record', 'record.json']), 2)
                inspect.assert_not_called()

    def test_cli_rejects_exception_or_media_mutated_after_evaluation(self):
        with tempfile.TemporaryDirectory() as directory:
            sample, original, record = [Path(directory) / name for name in ('sample.txt', 'original.txt', 'exception.json')]
            evaluate = check.evaluate
            for target, message in ((record, 'Exception record changed'), (sample, 'Movie changed before result')):
                sample.write_text('SYNTHETIC sample not media')
                original.write_text('SYNTHETIC original not media')
                record.write_text(json.dumps(exception(movie('5', check.digest(sample)), movie('5', check.digest(original)))))
                def mutate(*args, **kwargs):
                    result = evaluate(*args, **kwargs)
                    target.write_text('changed SYNTHETIC bytes')
                    return result
                error = io.StringIO()
                with self.subTest(target=target.name), contextlib.redirect_stderr(error), \
                     patch.object(check, 'evaluate', side_effect=mutate), \
                     patch.object(check.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0, json.dumps(probe('5')), '')):
                    code = check.main([str(sample), '--role', 'user-sample', '--short-original', str(original), '--exception-record', str(record)])
                self.assertEqual(code, 2)
                self.assertIn(message, error.getvalue())


if __name__ == '__main__':
    unittest.main()
