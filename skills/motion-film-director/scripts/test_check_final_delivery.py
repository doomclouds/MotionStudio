"""Synthetic review-policy fixtures; no real film, human hearing or artistic approval."""
import base64
import contextlib
from fractions import Fraction
import hashlib
import io
import json
from pathlib import Path
import shutil
import subprocess
import struct
import tempfile
import unittest
from unittest.mock import patch

import check_final_delivery as gate

# A public-domain synthetic 1x1 PNG. It is NOT evidence of a real visual review.
PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jXioAAAAASUVORK5CYII=')


class FinalDeliveryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not shutil.which('openssl'):
            raise unittest.SkipTest('Existing openssl required; not installed automatically')
        cls.temp = tempfile.TemporaryDirectory(prefix='synthetic-delivery-tests-')
        cls.keys = Path(cls.temp.name)
        for name in ('trusted', 'other'):
            subprocess.run(['openssl', 'genpkey', '-algorithm', 'ED25519', '-out', str(cls.keys / (name + '.key'))], check=True, capture_output=True)
            subprocess.run(['openssl', 'pkey', '-in', str(cls.keys / (name + '.key')), '-pubout', '-out', str(cls.keys / (name + '.pem'))], check=True, capture_output=True)

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def setUp(self):
        self.temp_case = tempfile.TemporaryDirectory(prefix='synthetic-delivery-case-')
        self.root = Path(self.temp_case.name)
        self.video = self.root / 'synthetic.movie'
        self.video.write_bytes(b'SYNTHETIC: not real media; technical stage mocked')
        self.movie = {'path': str(self.video), 'sha256': gate.digest(self.video), 'duration_seconds_exact': '1'}
        self.visual = self.artifact('contact.png', PNG)
        self.source = self.artifact('source.txt', b'SYNTHETIC source; no actual hearing')
        self.packet = {'schema': 1, 'movie_sha256': self.movie['sha256'], 'target_duration_seconds': '1', 'reviews': {}, 'visual_artifacts': [self.visual]}
        self.records = {}
        for kind in gate.METHODS:
            self.records[kind] = {'schema': 1, 'kind': kind, 'movie_sha256': self.movie['sha256'],
                'status': 'passed', 'method': sorted(gate.METHODS[kind])[0],
                'reviewer': 'SYNTHETIC TEST ONLY', 'reviewed_at': '2026-01-01T00:00:00Z',
                'coverage': [[0, 1]], 'observations': [{'start_s': 0, 'end_s': 1, 'finding': 'SYNTHETIC finding, not actual perception'}],
                'limitations': ['Synthetic test only; not actual review'], 'issues': [], 'evidence': [self.source, self.visual]}
            self.save_review(kind)

    def tearDown(self):
        self.temp_case.cleanup()

    def artifact(self, name, raw):
        (self.root / name).write_bytes(raw)
        return {'path': name, 'sha256': hashlib.sha256(raw).hexdigest()}

    def save_review(self, kind, sign=True):
        spec = self.artifact(kind + '.json', json.dumps(self.records[kind]).encode())
        if sign:
            spec['signature'] = kind + '.sig'
            subprocess.run(['openssl', 'pkeyutl', '-sign', '-rawin', '-inkey', str(self.keys / 'trusted.key'), '-in', str(self.root / spec['path']), '-out', str(self.root / spec['signature'])], check=True, capture_output=True)
        self.packet['reviews'][kind] = spec

    def technical(self, video, ffprobe, ffmpeg, inputs):
        inputs.read(video)
        return self.movie, {'status': 'passed', 'full_av_decode': 'passed', 'decoded_frames': 10}

    def run_gate(self, key='trusted', mock_technical=True, report='report.html'):
        packet_path = self.root / 'packet.json'
        packet_path.write_text(json.dumps(self.packet))
        args = [str(self.video), '--packet', str(packet_path), '--report', str(self.root / report)]
        if key:
            args += ['--trusted-review-key', str(self.keys / (key + '.pem'))]
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            if mock_technical:
                with patch.object(gate, 'technical', side_effect=self.technical):
                    code = gate.main(args)
            else:
                code = gate.main(args)
        return code, json.loads(out.getvalue() or err.getvalue())

    def model_source(self):
        source = {'schema_version': 1, 'status': 'model_assisted_review_completed',
            'coverage_kind': 'full_audio_plus_sparse_frames', 'human_listening': False,
            'audiovisual_sync': 'unverified', 'model': 'synthetic-model',
            'input': {'movie': {'sha256': self.movie['sha256']},
                      'audio': {'coverage_s': [0, 1]}},
            'provider_receipt': {'request_id': 'synthetic-id', 'model': 'synthetic-model',
                                 'response_text': 'synthetic response'},
            'review': {'observations': [{'start_s': 0, 'end_s': 1,
                                        'evidence': 'Synthetic model observation'}]}}
        source['provider_receipt']['response_text'] = json.dumps(source['review'])
        return source

    def bind_source(self, kind, source):
        artifact = self.artifact('model-source.json', json.dumps(source).encode())
        self.records[kind]['evidence'] = [artifact, self.visual]
        self.save_review(kind)

    def test_passed_wrapper_cannot_upgrade_incomplete_source(self):
        for index, status in enumerate(('NOT_LISTENED', 'blocked', 'failed', 'pending', 'unverified', 'NOT_RUN', 'not_reviewed', 'not_checked', 'SKIPPED_NOT_CONFIGURED', 'optional_not_run')):
            self.bind_source('audio', {'status': status})
            code, result = self.run_gate(report=f'incomplete-source-{index}.html')
            self.assertEqual(code, 1, result)
            self.assertIn('Source evidence is not completed', ' '.join(result['blockers']))

    def test_sparse_model_source_cannot_become_continuous_visual_or_av_review(self):
        for index, kind in enumerate(('visual', 'av_sync')):
            self.bind_source(kind, self.model_source())
            code, result = self.run_gate(report=f'sparse-source-{index}.html')
            self.assertEqual(code, 1, result)
            self.assertIn('cannot establish normal-speed', ' '.join(result['blockers']))

    def test_model_receipt_cannot_claim_human_listening(self):
        self.records['audio']['method'] = 'perceptual_audio_human'
        self.bind_source('audio', self.model_source())
        code, result = self.run_gate()
        self.assertEqual(code, 1, result)
        self.assertIn('cannot establish human listening', ' '.join(result['blockers']))

    def test_model_method_requires_bound_complete_receipt(self):
        self.records['audio']['method'] = 'perceptual_audio_model'
        self.save_review('audio')
        code, result = self.run_gate()
        self.assertEqual(code, 1, result)
        for index, mutation in enumerate(('wrong_movie', 'partial_audio', 'no_receipt', 'no_observations', 'mismatched_response')):
            source = self.model_source()
            if mutation == 'wrong_movie': source['input']['movie']['sha256'] = 'f' * 64
            if mutation == 'partial_audio': source['input']['audio']['coverage_s'] = [0, 0.5]
            if mutation == 'no_receipt': source.pop('provider_receipt')
            if mutation == 'no_observations': source['review']['observations'] = []
            if mutation == 'mismatched_response': source['provider_receipt']['response_text'] = '{}'
            self.bind_source('audio', source)
            code, result = self.run_gate(report=f'bad-model-{index}.html')
            self.assertEqual(code, 1, result)
        self.bind_source('audio', self.model_source())
        code, result = self.run_gate(report='valid-model.html')
        self.assertEqual(code, 0, result)

    def test_source_review_media_hash_mismatch_is_not_hidden_by_wrapper(self):
        self.bind_source('audio', {'status': 'passed', 'movie_sha256': 'f' * 64})
        code, result = self.run_gate()
        self.assertEqual(code, 1, result)
        self.assertIn('Source evidence belongs to different media', ' '.join(result['blockers']))

    def test_explicit_source_modality_denial_blocks_wrapper(self):
        for kind, source in [('audio', {'human_listening': False}),
                             ('av_sync', {'audiovisual_sync': 'unverified'})]:
            blockers, _ = gate.source_evidence(json.dumps(source).encode(), kind,
                'perceptual_audio_human' if kind == 'audio' else 'normal_speed_av',
                self.movie, Fraction(1))
            self.assertTrue(blockers)

    def test_invalid_visual_raster_does_not_make_ready_report(self):
        self.visual = self.artifact('contact.png', b'\x89PNG\r\n\x1a\ninvalid')
        self.packet['visual_artifacts'] = [self.visual]
        self.records['visual']['evidence'] = [self.source, self.visual]
        self.save_review('visual')
        code, result = self.run_gate()
        self.assertEqual(code, 2, result)
        self.assertFalse((self.root / 'report.html').exists())

    def test_signed_attestations_are_not_owner_or_hearing_proof(self):
        code, result = self.run_gate()
        self.assertEqual(code, 0, result)
        self.assertEqual(result['status'], 'ready_for_owner_review')
        self.assertEqual(result['owner_approval'], 'not_checked')
        self.assertEqual(result['reviews']['audio']['authentication'], 'signed_attestation_not_proof_of_perception')
        self.assertEqual(result['report']['sha256'], gate.digest(self.root / 'report.html'))
        report = (self.root / 'report.html').read_text()
        self.assertIn(self.movie['sha256'], report)
        self.assertIn('data:image/png;base64,', report)

    def test_generated_report_matches_versioned_standard(self):
        code, result = self.run_gate()
        self.assertEqual(code, 0, result)
        self.assertEqual(gate.validate_report(result), [])
        self.assertEqual(result['report_standard_version'], 1)
        self.assertIn('9 · Known limits', (self.root / 'report.html').read_text())
        self.assertEqual(list(self.root.glob('.delivery-report-*')), [])

    def test_repair_requires_visual_before_after(self):
        self.packet['revision_kind'] = 'repair'
        code, result = self.run_gate()
        self.assertEqual(code, 1, result)
        self.assertTrue(any('before/after' in x for x in result['blockers']))

    def test_reference_task_marks_missing_old_pipeline_explicitly(self):
        self.packet.update(reference_based=True, reference_sha256='c'*64)
        code, result = self.run_gate()
        self.assertEqual(code, 1, result)
        self.assertEqual(result['comparison_diagnostics']['benchmark']['status'], 'NOT_RUN')
        self.assertIn('2A · Existing full comparison', (self.root / 'report.html').read_text())

    def test_default_user_reports_are_fixed_png_and_html_only(self):
        packet_path = self.root / 'packet.json'
        packet_path.write_text(json.dumps(self.packet))
        args = [str(self.video), '--packet', str(packet_path), '--project-root', str(self.root),
                '--trusted-review-key', str(self.keys / 'trusted.pem')]
        out, err = io.StringIO(), io.StringIO()
        source_renderer = Path(gate.__file__).resolve().parents[3] / 'tools/reference-benchmark/report.py'
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err), patch.object(gate, 'technical', side_effect=self.technical):
            code = gate.main(args)
        directory = self.root / 'output/review'
        if not source_renderer.exists():
            self.assertEqual(code, 2)
            self.assertIn('Fixed canonical renderer unavailable', err.getvalue())
            self.assertEqual(list(directory.iterdir()), [])
            return  # Portable package deliberately requires explicit repository renderer.
        self.assertEqual(code, 0, err.getvalue())
        result = json.loads(out.getvalue())
        self.assertEqual({p.name for p in directory.iterdir()}, {'report.html','overview.png'})
        self.assertEqual(result['user_report_formats'], ['png','html'])
        self.assertEqual(result['presentation_version'], 'motionstudio-review-v1')
        self.assertEqual(gate.digest(directory/'overview.png'), result['overview']['sha256'])
        self.assertEqual(gate.digest(directory/'report.html'), result['report']['sha256'])
        self.assertEqual(struct.unpack('>II',(directory/'overview.png').read_bytes()[16:24]), (1800,5400))
        self.assertNotEqual((directory/'overview.png').read_bytes(), PNG)
        self.assertEqual((directory/'report.html').read_text().count('id="delivery-assessment"'), 1)

    def test_explicit_renderer_and_missing_renderer_contract(self):
        explicit = self.root / 'trusted-fixture-renderer.py'
        explicit.write_text('def render_gate_report(*args, **kwargs): return b"PNG", b"HTML"\n')
        self.assertTrue(callable(gate.load_fixed_renderer(explicit).render_gate_report))
        with self.assertRaisesRegex(ValueError, 'Fixed canonical renderer unavailable'):
            gate.load_fixed_renderer(self.root / 'absent.py')

    def test_benchmark_snapshot_checks_hashes_and_both_media_identities(self):
        root = self.root / 'benchmark'; root.mkdir()
        reference = 'c'*64
        for name, data in [('reference.profile.json', {'input': {'sha256': reference}}),
                           ('candidate.profile.json', {'input': {'sha256': self.movie['sha256']}}),
                           ('comparison.json', {})]:
            (root/name).write_text(json.dumps(data))
        (root/'benchmark.html').write_text('SYNTHETIC')
        rows = [{'path':p.name,'sha256':gate.digest(p),'bytes':p.stat().st_size} for p in root.iterdir()]
        (root/'manifest.json').write_text(json.dumps({'schema_version':'motionstudio.reference-artifacts/1.0','files':rows}))
        result = {'movie': self.movie, 'comparison_diagnostics': {'benchmark': {
            'status':'COLLECTED_NOT_APPROVED','reference_sha256':reference,
            'artifacts':[{'role':'full_comparison_html','path':'benchmark/benchmark.html','sha256':gate.digest(root/'benchmark.html')}]}}}
        inputs = gate.Inputs(self.root)
        snapshot = self.root/'snapshot'; snapshot.mkdir()
        self.assertEqual(gate.snapshot_benchmark(result, inputs, snapshot), snapshot)
        self.assertEqual((snapshot/'comparison.json').read_bytes(), (root/'comparison.json').read_bytes())
        result['comparison_diagnostics']['benchmark']['reference_sha256'] = 'e'*64
        other = self.root/'other';other.mkdir()
        with self.assertRaisesRegex(ValueError, 'different reference/candidate'):
            gate.snapshot_benchmark(result, inputs, other)
        (root/'comparison.json').write_text('tampered')
        with self.assertRaisesRegex(ValueError, 'changed'):
            inputs.recheck()

    def test_canonical_motion_report_cannot_bind_other_candidate(self):
        artifact = self.artifact('motion.json', json.dumps({'source':{'sha256':'f'*64}}).encode())
        result = {'movie': self.movie, 'comparison_diagnostics': {'motion_check': {
            'status':'COLLECTED_NOT_APPROVED', 'artifacts':[dict(artifact, role='motion_report')]}}}
        with patch.object(gate, 'load_fixed_renderer', return_value=object()):
            with self.assertRaisesRegex(ValueError, 'different candidate'):
                gate.render_canonical_pair(result, [], [], gate.Inputs(self.root))

    def test_canonical_accepts_and_labels_dual_motion_reports(self):
        artifacts = []
        reference = 'c'*64
        for name, sha in [('ref',reference),('cand',self.movie['sha256'])]:
            (self.root/name).mkdir()
            report = self.artifact(name+'/report.json', json.dumps({'source':{'sha256':sha}}).encode())
            panel = self.artifact(name+'/heatmap.png', PNG)
            artifacts.extend([dict(report,role='motion_report'),dict(panel,role='motion_heatmap')])
        result = {'movie':self.movie,'comparison_diagnostics':{
            'benchmark':{'status':'NOT_RUN','reference_sha256':reference},
            'motion_check':{'status':'COLLECTED_NOT_APPROVED','artifacts':artifacts}}}
        class Renderer:
            def render_gate_report(self, *args, **kwargs):
                self.panels = kwargs['motion_panels']
                return PNG, b'<html>synthetic</html>'
        renderer = Renderer()
        with patch.object(gate, 'load_fixed_renderer', return_value=renderer):
            gate.render_canonical_pair(result, [], [], gate.Inputs(self.root))
        self.assertEqual([p[0] for p in renderer.panels['motion_heatmaps']], ['Reference','Candidate'])

    def test_not_listened_blocked_pending_and_boolean_cannot_pass(self):
        for index, status in enumerate(('NOT_LISTENED', 'BLOCKED', 'pending', False, True)):
            with self.subTest(status=status):
                self.records['audio']['status'] = status
                self.save_review('audio')
                code, result = self.run_gate(report=f'status-{index}.html')
                self.assertEqual(code, 2 if isinstance(status, bool) else 1)
                self.assertEqual(result['status'], 'error' if isinstance(status, bool) else 'review_candidate')

    def test_metrics_or_checkbox_method_cannot_pass(self):
        for index, method in enumerate(('lufs', 'metrics_only', 'transcript', True)):
            with self.subTest(method=method):
                self.records['audio']['method'] = method
                self.save_review('audio')
                code, result = self.run_gate(report=f'method-{index}.html')
                self.assertEqual(code, 2 if isinstance(method, bool) else 1)
                if not isinstance(method, bool):
                    self.assertTrue(any('perceptual' in x for x in result['blockers']))

    def test_missing_review_and_unsigned_booleans_are_candidates(self):
        del self.packet['reviews']['audio']
        code, result = self.run_gate()
        self.assertEqual(code, 1)
        self.assertIn('Missing audio review', ' '.join(result['blockers']))
        self.records['audio'] = {'listened': True, 'status': 'passed'}
        self.save_review('audio', sign=False)
        code, result = self.run_gate(report='checkbox.html')
        self.assertEqual(code, 1)
        self.assertEqual(result['reviews']['audio']['authentication'], 'declared_not_authenticated')

    def test_unresolved_or_undocumented_issues_cannot_pass(self):
        for index, issues in enumerate((None, [{'finding': 'SYNTHETIC masking', 'disposition': 'pending', 'rationale': 'not fixed'}], [{'finding': 'SYNTHETIC masking', 'disposition': 'resolved', 'rationale': ''}])):
            self.records['audio']['issues'] = issues
            self.save_review('audio')
            code, result = self.run_gate(report=f'issues-{index}.html')
            self.assertEqual(code, 1, result)
        for index, disposition in enumerate(('resolved', 'accepted')):
            self.records['audio']['issues'] = [{'finding': 'SYNTHETIC masking', 'disposition': disposition, 'rationale': 'Synthetic rationale; not actual acceptance'}]
            self.save_review('audio')
            code, result = self.run_gate(report=f'disposed-{index}.html')
            self.assertEqual(code, 0, result)

    def test_unsigned_complete_review_is_explicitly_unauthenticated(self):
        for kind in self.records:
            self.save_review(kind, sign=False)
        code, result = self.run_gate(key=None)
        self.assertEqual(code, 0, result)
        for kind in self.records:
            self.assertEqual(result['reviews'][kind]['authentication'], 'declared_not_authenticated')
            self.assertIsNone(result['reviews'][kind]['signer_key_sha256'])
        self.assertIn('declared, not authenticated', result['trust_boundary'])

    def test_report_picture_needs_matching_review_path_and_hash(self):
        alternate = self.artifact('unreviewed.png', PNG)
        self.packet['visual_artifacts'] = [alternate]
        code, result = self.run_gate()
        self.assertEqual(code, 1)
        self.assertTrue(any('not bound' in x for x in result['blockers']))

    def test_boolean_schema_is_never_version_one(self):
        self.records['audio']['schema'] = True
        self.save_review('audio')
        code, result = self.run_gate()
        self.assertEqual(code, 1)
        self.packet['schema'] = True
        code, result = self.run_gate(report='boolean-packet.html')
        self.assertEqual(code, 2)

    def test_report_removed_when_final_input_recheck_fails(self):
        recheck = gate.Inputs.recheck
        count = 0
        def mutate(inputs):
            nonlocal count
            count += 1
            if count == 2:
                self.video.write_bytes(b'changed after report write')
            return recheck(inputs)
        with patch.object(gate.Inputs, 'recheck', new=mutate):
            code, result = self.run_gate()
        self.assertEqual(code, 2)
        self.assertFalse((self.root / 'report.html').exists())

    def test_wrong_or_absent_trust_key_cannot_authenticate(self):
        for index, key in enumerate(('other', None)):
            code, result = self.run_gate(key=key, report=f'key-{index}.html')
            self.assertEqual(code, 1)
            self.assertIsNone(result['reviews']['audio']['signer_key_sha256'])

    def test_signature_does_not_survive_record_edit_even_updated_digest(self):
        raw = (self.root / 'audio.json').read_bytes().replace(b'SYNTHETIC finding', b'altered finding')
        spec = self.artifact('audio.json', raw)
        spec['signature'] = 'audio.sig'
        self.packet['reviews']['audio'] = spec
        code, result = self.run_gate()
        self.assertEqual(code, 1)
        self.assertEqual(result['reviews']['audio']['authentication'], 'unverified')

    def test_stale_record_or_evidence_hash_is_error(self):
        for index, name in enumerate(('audio.json', 'source.txt', 'contact.png')):
            original = (self.root / name).read_bytes()
            (self.root / name).write_bytes(original + b'tamper')
            code, result = self.run_gate(report=f'stale-{index}.html')
            self.assertEqual(code, 2)
            self.assertIn('hash mismatch', result['error'])
            (self.root / name).write_bytes(original)

    def test_media_identity_mismatch_cannot_pass(self):
        self.records['audio']['movie_sha256'] = 'a' * 64
        self.save_review('audio')
        code, result = self.run_gate()
        self.assertEqual(code, 1)
        self.assertIn('different media', ' '.join(result['blockers']))
        self.packet['movie_sha256'] = 'b' * 64
        code, result = self.run_gate(report='wrong-packet.html')
        self.assertEqual(code, 2)

    def test_coverage_gap_not_hidden_by_overlap(self):
        self.records['audio']['coverage'] = [[0, '1/4'], ['1/2', 1], ['3/4', 1]]
        self.save_review('audio')
        code, result = self.run_gate()
        self.assertEqual(code, 1)
        self.assertIn('full encoded movie', ' '.join(result['blockers']))
        self.records['audio']['coverage'] = [['1/2', 1], [0, '3/4']]
        self.save_review('audio')
        code, result = self.run_gate(report='covered.html')
        self.assertEqual(code, 0, result)

    def test_malformed_or_out_of_range_observations_error(self):
        for index, observation in enumerate(({}, {'start_s': -1, 'end_s': 1, 'finding': 'fixture'}, {'start_s': False, 'end_s': 1, 'finding': 'fixture'})):
            self.records['audio']['observations'] = [observation]
            self.save_review('audio')
            code, result = self.run_gate(report=f'bad-observation-{index}.html')
            self.assertEqual(code, 2, result)

    def test_missing_findings_source_and_visual_artifacts_block(self):
        self.records['audio']['observations'] = []
        self.records['audio']['evidence'] = []
        self.save_review('audio')
        self.packet['visual_artifacts'] = []
        code, result = self.run_gate()
        self.assertEqual(code, 1)
        self.assertTrue(any('visual report' in x for x in result['blockers']))

    def test_html_is_escaped_and_inert(self):
        self.records['visual']['observations'][0]['finding'] = '<script>alert("fixture")</script>'
        self.save_review('visual')
        code, result = self.run_gate()
        self.assertEqual(code, 0, result)
        report = (self.root / 'report.html').read_text()
        self.assertNotIn('<script>', report)
        self.assertIn('&lt;script&gt;', report)
        self.assertIn('Content-Security-Policy', report)

    def test_existing_report_or_input_never_overwritten(self):
        (self.root / 'report.html').write_bytes(b'prior-report')
        code, result = self.run_gate()
        self.assertEqual(code, 2)
        self.assertEqual((self.root / 'report.html').read_bytes(), b'prior-report')
        original = self.video.read_bytes()
        code, result = self.run_gate(report=self.video.name)
        self.assertEqual(code, 2)
        self.assertEqual(self.video.read_bytes(), original)

    def test_target_duration_mismatch_is_not_complete_film(self):
        self.packet['target_duration_seconds'] = '20'
        code, result = self.run_gate()
        self.assertEqual(code, 1)
        self.assertTrue(any('target' in x for x in result['blockers']))

    def test_local_evidence_cannot_escape_root(self):
        inputs = gate.Inputs(self.root)
        for path in ('../outside', str(self.keys / 'trusted.pem')):
            with self.assertRaises(ValueError):
                inputs.read(path, relative=True)
        (self.root / 'escape').symlink_to(self.keys / 'trusted.pem')
        with self.assertRaises(ValueError):
            inputs.read('escape', relative=True)

    def test_duplicate_json_and_changed_inputs_rejected(self):
        with self.assertRaises(ValueError):
            gate.load_json('{"status":"NOT_LISTENED","status":"passed"}')
        inputs = gate.Inputs(self.root)
        inputs.artifact(self.source)
        (self.root / 'source.txt').write_text('changed')
        with self.assertRaises(ValueError):
            inputs.recheck()

    @unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe'), 'Existing ffmpeg/ffprobe required')
    def test_real_synthetic_av_decode_and_frame_census(self):
        self.video = self.root / 'synthetic.mp4'
        subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=blue:s=32x32:r=10:d=1', '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=8000:duration=1', '-c:v', 'mpeg4', '-c:a', 'aac', '-shortest', str(self.video)], check=True, capture_output=True)
        self.movie['path'] = str(self.video)
        self.movie['sha256'] = gate.digest(self.video)
        self.packet['movie_sha256'] = self.movie['sha256']
        for kind in self.records:
            self.records[kind]['movie_sha256'] = self.movie['sha256']
            self.save_review(kind)
        code, result = self.run_gate(mock_technical=False)
        self.assertEqual(code, 0, result)
        self.assertEqual(result['technical']['decoded_frames'], 10)
        self.assertEqual(result['technical']['full_av_decode'], 'passed')


if __name__ == '__main__':
    unittest.main()
