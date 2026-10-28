"""Synthetic report contract tests; no film evaluation or listening claims."""
import copy
import contextlib
import io
import json
from pathlib import Path
import tempfile
import unittest
import validate_delivery_report as validator


def fixture():
    sha = 'a' * 64
    return {'schema': 1, 'report_standard': 'motionstudio.delivery-report', 'report_standard_version': 1,
        'generated_at': '2026-01-01T00:00:00Z', 'summary': 'SYNTHETIC report; not actual review',
        'status': 'ready_for_owner_review', 'owner_approval': 'not_checked',
        'movie': {'path': 'synthetic.mp4', 'sha256': sha, 'duration_seconds_exact': '8'},
        'target_duration_seconds': '8', 'technical': {'status': 'passed', 'decoded_frames': 240, 'full_av_decode': 'passed'},
        'reviews': {kind: {'status': 'passed', 'blockers': [], 'authentication': 'declared_not_authenticated',
            'record_sha256': 'e' * 64,
            'record': {'movie_sha256': sha, 'coverage': [[0, 8]],
                       'method': {'visual':'normal_speed_visual','audio':'perceptual_audio_human','av_sync':'normal_speed_av'}[kind],
                       'reviewer': 'SYNTHETIC', 'reviewed_at': '2026-01-01T00:00:00Z',
                       'evidence': [{'path':'source.txt','sha256':'f'*64}],
                       'observations': [{'start_s': 0, 'end_s': 8, 'finding': 'SYNTHETIC ONLY'}]}}
            for kind in ('visual', 'audio', 'av_sync')},
        'blockers': [], 'packet_sha256': 'b' * 64, 'visual_artifacts': [{'path': 'synthetic.png', 'sha256': 'c' * 64}],
        'trust_boundary': 'Declared evidence is not authenticated perception.', 'issues': [],
        'known_limits': ['Synthetic fixture; not real film evidence.'],
        'before_after': {'status': 'not_applicable', 'reason': 'Synthetic test has no repair comparison', 'pairs': []},
        'report': {'path': 'synthetic.html', 'sha256': 'd' * 64}}


class ReportTests(unittest.TestCase):
    def test_valid_fixture_and_optional_external_jsonschema_agree(self):
        data = fixture()
        self.assertEqual(validator.validate_report(data), [])
        try:
            import jsonschema
        except ImportError:
            return
        jsonschema.Draft202012Validator(json.loads(validator.SCHEMA_PATH.read_text())).validate(data)

    def test_required_sections_and_version(self):
        for key in fixture():
            data = fixture(); del data[key]
            with self.subTest(key=key): self.assertTrue(validator.validate_report(data))
        for key in ('schema', 'report_standard_version'):
            data = fixture(); data[key] = True
            self.assertTrue(validator.validate_report(data))

    def test_core_mode_only_omits_report_artifact(self):
        data = fixture(); del data['report']
        self.assertEqual(validator.validate_report(data, finalized=False), [])
        self.assertTrue(validator.validate_report(data))

    def test_candidate_may_preserve_missing_or_stale_review_evidence(self):
        data = fixture(); data['status'] = 'review_candidate'; data['blockers'] = ['audio missing', 'visual stale']
        data['technical'] = {'status': 'not_checked'}
        data['reviews']['audio'] = {'status': 'missing', 'blockers': ['missing']}
        data['reviews']['visual']['record']['movie_sha256'] = 'e' * 64
        self.assertEqual(validator.validate_report(data), [])
        data['status'] = 'ready_for_owner_review'
        self.assertTrue(validator.validate_report(data))

    def test_no_approved_status_or_fake_authentication(self):
        for status in ('approved_final', True, 'passed'):
            data = fixture(); data['status'] = status
            self.assertTrue(validator.validate_report(data))
        data = fixture(); data['reviews']['audio']['authentication'] = 'authenticated_hearing'
        self.assertTrue(validator.validate_report(data))

    def test_ready_requires_coverage_and_images(self):
        data = fixture(); data['reviews']['audio']['record']['coverage'] = [[0, 3], [4, 8]]
        self.assertTrue(validator.validate_report(data))
        data = fixture(); data['visual_artifacts'] = []
        self.assertTrue(validator.validate_report(data))

    def test_ready_cannot_use_metrics_or_omit_actual_source_identity(self):
        for key, value in [('method', 'audio_metrics'), ('evidence', []), ('reviewer', '')]:
            data = fixture(); data['reviews']['audio']['record'][key] = value
            self.assertTrue(validator.validate_report(data))
        data = fixture(); data['reviews']['audio']['record']['issues'] = [{'disposition':'pending'}]
        self.assertTrue(validator.validate_report(data))

    def test_timing_and_timezone_are_checked(self):
        for value in ('NaN', '0', '-1', '1/0'):
            data = fixture(); data['movie']['duration_seconds_exact'] = value
            self.assertTrue(validator.validate_report(data))
        data = fixture(); data['generated_at'] = '2026-01-01T00:00:00'
        self.assertTrue(validator.validate_report(data))
        data = fixture(); data['reviews']['visual']['record']['observations'][0]['end_s'] = 9
        self.assertTrue(validator.validate_report(data))

    def test_issue_identity_scope_and_closure(self):
        issue = {'id': 'VISUAL-001', 'kind': 'visual', 'scope': 'unspecified', 'start_s': None, 'end_s': None,
            'severity': 'unclassified', 'finding': 'Synthetic issue', 'disposition': 'resolved', 'rationale': 'Synthetic resolution'}
        data = fixture(); data['issues'] = [issue]
        self.assertEqual(validator.validate_report(data), [])
        data['issues'].append(copy.deepcopy(issue))
        self.assertTrue(validator.validate_report(data))
        data['issues'].pop(); issue['disposition'] = 'pending'
        self.assertTrue(validator.validate_report(data))
        issue['disposition'] = 'resolved'; issue['scope'] = 'window'; issue['start_s'] = 3; issue['end_s'] = 2
        self.assertTrue(validator.validate_report(data))

    def test_comparisons_bound_to_issue_version_and_time(self):
        data = fixture(); data['before_after']['status'] = 'included'
        self.assertTrue(validator.validate_report(data))
        data['before_after']['pairs'] = [{'issue_id': 'VISUAL-999', 'before': {'path':'before.png','sha256':'e'*64},
            'after': {'path':'after.png','sha256':'f'*64}, 'before_movie_sha256':'e'*64,
            'after_movie_sha256':'f'*64, 'start_s':0,'end_s':8}]
        self.assertTrue(validator.validate_report(data))
        data = fixture(); data['before_after']['status'] = 'pending'
        self.assertTrue(validator.validate_report(data))

    def test_cli_codes_and_duplicate_nonfinite_json(self):
        for raw in ('{"status":1,"status":2}', '{"value":NaN}'):
            with self.assertRaises(ValueError): validator.load_json(raw)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'report.json'
            for data, expected in ((fixture(), 0), ({}, 1)):
                path.write_text(json.dumps(data))
                with contextlib.redirect_stdout(io.StringIO()):
                    self.assertEqual(validator.main([str(path)]), expected)
            path.write_text('{')
            with contextlib.redirect_stderr(io.StringIO()):
                self.assertEqual(validator.main([str(path)]), 2)


if __name__ == '__main__': unittest.main()
