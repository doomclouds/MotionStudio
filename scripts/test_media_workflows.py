"""Offline entrypoint and real local-consumer smoke; never perceptual approval.

Only synthetic media in temporary directories. No .env read, provider request,
installation, repository media, or automatic promotion of review gates.
"""
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import audio_review as audio
import audiovisual_review as av

ENTRIES = ('video-review', 'audio-review', 'soundtrack-production')


def run(*args, cwd=None):
    result = subprocess.run([str(x) for x in args], cwd=cwd or ROOT,
                            capture_output=True, text=True, timeout=90)
    if result.returncode:
        raise AssertionError(f'Local command failed ({result.returncode}): {result.stderr}')
    return result.stdout


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class EntrypointTests(unittest.TestCase):
    def test_named_thin_skills_are_reachable_and_have_no_parallel_runtime(self):
        navigation = (ROOT / 'AGENTS.md').read_text()
        for name in ENTRIES:
            directory = ROOT / 'skills' / name
            self.assertEqual({p.name for p in directory.iterdir()}, {'SKILL.md'})
            text = (directory / 'SKILL.md').read_text()
            header = text.split('---', 2)[1]
            self.assertIn(f'name: {name}', header)
            self.assertRegex(header, r'(?m)^description: .+')
            self.assertIn(f'skills/{name}/SKILL.md', navigation)

    def test_entrypoint_links_resolve_inside_checkout(self):
        for name in ENTRIES:
            page = ROOT / 'skills' / name / 'SKILL.md'
            for target in re.findall(r'\]\(([^)]+)\)', page.read_text()):
                if re.match(r'[a-zA-Z][a-zA-Z0-9+.-]*:', target):
                    continue
                path = (page.parent / target.split('#')[0]).resolve()
                self.assertTrue(path.is_relative_to(ROOT), target)
                self.assertTrue(path.is_file(), target)

    def test_fixed_config_resolves_from_adapter_not_media_cwd(self):
        # Path resolution only. Never open existing private configuration.
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            self.assertEqual(audio.project_root(base / 'checkout/scripts/audio_review.py'), base / 'checkout')
            self.assertEqual(audio.project_root(base / 'portable/runtime/review-tools/audio_review.py'), base / 'portable')
            with self.assertRaises(audio.ReviewError):
                audio.project_root(base / 'media/audio_review.py')
        policy_spec = importlib.util.spec_from_file_location('media_source_policy', ROOT / 'scripts/check-source-tree.py')
        policy = importlib.util.module_from_spec(policy_spec)
        policy_spec.loader.exec_module(policy)
        self.assertTrue(policy.forbidden('.env'))
        self.assertTrue(policy.forbidden('skills/audio-review/.env.local'))
        self.assertTrue(policy.safe_env_template((ROOT / '.env.example').read_bytes()))

    def test_existing_other_category_accepts_speech_observations_without_schema_fork(self):
        observation = {'summary': 'Synthetic contract fixture, not a listening result',
                       'uncertainties': ['No audio model invoked'],
                       'observations': [{'start_s': 0, 'end_s': 1, 'category': 'other',
                           'evidence': 'Synthetic speech observation', 'severity': 'concern',
                           'suggestion': 'Verify against the actual speech recording'}]}
        self.assertEqual(audio.validate_review(observation, 2), observation)


@unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe') and shutil.which('node'),
                     'Existing Node/FFmpeg/ffprobe required; nothing installed automatically')
class LocalWorkflowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='motion-media-skills-')
        cls.root = Path(cls.temp.name)
        cls.movie = cls.root / 'synthetic.mp4'
        run('ffmpeg', '-nostdin', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=s=160x90:r=10:d=2',
            '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=2', '-shortest',
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', cls.movie)
        cls.bed = cls.root / 'bed'
        cls.receipt = json.loads(run('python3', ROOT / 'engine/sound-elements/sound.py', 'render',
                                   '--id', 'quiet-pulse-bed', '--output', cls.bed, cwd=cls.root))

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def test_materialize_and_mix_from_unrelated_cwd_keeps_perceptual_gates_unrun(self):
        self.assertEqual(self.receipt['output_sha256'], sha(self.bed / 'source.wav'))
        self.assertEqual(self.receipt['technical']['frames'], 8 * 48000)
        self.assertEqual(self.receipt['listening'], 'NOT_LISTENED')
        self.assertEqual(self.receipt['av_sync'], 'NOT_RUN')
        core = ROOT / 'engine/motion-audio-core/scripts/audio.mjs'
        run('node', core, 'validate', '--timeline', self.bed / 'timeline.json', cwd=self.root)
        mixed = json.loads(run('node', core, 'render', '--timeline', self.bed / 'timeline.json',
                               '--source-root', self.bed, '--work', self.root / 'mix', '--aac', cwd=self.root))
        self.assertEqual(mixed['status'], 'PASS')
        master = mixed['outputs']['master']
        self.assertEqual(master['sha256'], sha(Path(master['path'])))
        self.assertEqual(master['frames'], 8 * 48000)
        self.assertEqual(master['fullDecode'], 'PASS')
        self.assertEqual(master['aac']['fullDecode'], 'PASS')
        self.assertEqual(mixed['review']['listening']['status'], 'NOT_RUN')
        self.assertEqual(mixed['review']['owner']['status'], 'NOT_RUN')
        self.assertEqual(mixed['review']['avSync']['status'], 'NOT_RUN')

    def test_audio_dry_run_cannot_read_config_or_call_provider(self):
        with patch.object(audio, 'load_project_key', side_effect=AssertionError('Private config read')), \
             patch.object(audio.urllib.request, 'urlopen', side_effect=AssertionError('Network')):
            result = audio.execute([self.bed / 'source.wav'], .10, self.root / 'unused',
                                   transport=lambda *args: self.fail('Provider called'))
        self.assertEqual(result['mode'], 'dry-run')
        self.assertIsNone(result['readiness']['credential_present'])
        self.assertEqual(result['native_audio_review'], 'unverified')
        self.assertEqual(result['audiovisual_sync'], 'unverified')
        self.assertFalse((self.root / 'unused').exists())

    def test_movie_preparation_binds_real_decode_and_rejects_wrong_identity(self):
        output = self.root / 'prepared'
        with patch.object(audio, 'load_project_key', side_effect=AssertionError('Private config read')), \
             patch.object(audio.urllib.request, 'urlopen', side_effect=AssertionError('Network')):
            av.prepare(self.movie, sha(self.movie), output)
            with self.assertRaises(audio.ReviewError):
                av.prepare(self.movie, '0' * 64, self.root / 'wrong-identity')
        manifest = json.loads((output / 'input-manifest.json').read_text())
        self.assertEqual(manifest['movie']['sha256'], sha(self.movie))
        self.assertTrue((output / 'audio.wav').is_file())
        self.assertFalse((self.root / 'wrong-identity').exists())
        self.assertFalse(any(output.glob('review-*.json')))

    @unittest.skipUnless(importlib.util.find_spec('numpy') and importlib.util.find_spec('PIL'),
                         'Existing NumPy/Pillow required; nothing installed automatically')
    def test_movie_technical_check_does_not_claim_viewing_or_listening(self):
        output = self.root / 'check'
        run('python3', ROOT / 'skills/motion-film-director/scripts/motion-check/motion_check.py',
            self.movie, '--out', output, cwd=self.root)
        report = json.loads((output / 'report.json').read_text())
        self.assertEqual(report['source']['sha256'], sha(self.movie))
        self.assertEqual(report['frame_census']['decoded_video_frames'], 20)
        self.assertTrue(report['full_decode']['ok'])
        self.assertIn('仍须人工复看/听审', report['status'])
        self.assertNotIn('normal_speed_visual', report)
        self.assertNotIn('normal_speed_av', report)


if __name__ == '__main__':
    unittest.main()
