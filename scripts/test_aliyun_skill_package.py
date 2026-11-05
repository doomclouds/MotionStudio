"""Build and run the actual Aliyun skill bundle with network/config blocked."""
import hashlib
import json
from pathlib import Path
import unittest
import zipfile

import test_media_skill_package as base


class AliyunBundleTests(base.MediaBundleTests):
    skills = ('aliyun-video-review', 'aliyun-audio-review', 'aliyun-music', 'aliyun-speech')
    flag = '--aliyun-skills'
    document = 'ALIYUN-SKILLS.md'

    def test_extracted_generation_plans_are_real_offline_entrypoints(self):
        text = self.root / 'private-text.txt'
        text.write_text('A short original and quiet instrumental introduction.')
        for kind, model in [('tts', 'qwen3-tts-flash'), ('music', 'fun-music-v1')]:
            result = self.run_command('python3', 'runtime/review-tools/aliyun_audio_generation.py', kind,
                '--input-file', text, '--workspace-id', 'offline-fixture')
            plan = json.loads(result.stdout)
            self.assertEqual(plan['status'], 'DRY_RUN')
            self.assertEqual(plan['model'], model)
            self.assertFalse(plan['delivery_approved'])
            self.assertFalse(plan['human_listening'])
            self.assertNotIn(text.read_text(), result.stdout)
        self.assertFalse((self.motion / '.env').exists())

    def test_extracted_native_video_dry_run_and_all_adapter_mock_tests(self):
        movie = self.root / 'native-video.mp4'
        self.run_command('ffmpeg', '-nostdin', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=s=160x90:r=10:d=1',
            '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=1', '-shortest',
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', movie)
        report = json.loads(self.run_command('python3', 'runtime/review-tools/aliyun_video_review.py', movie,
            '--expected-sha256', base.digest(movie)).stdout)
        self.assertEqual(report['status'], 'DRY_RUN_NO_NETWORK')
        self.assertEqual(report['input_kind'], 'native_mp4_base64')
        self.assertTrue(report['input']['audio_present'])
        self.assertFalse(report['delivery_approved'])
        for test in ('test_aliyun_audio_generation.py', 'test_aliyun_video_review.py'):
            self.run_command('python3', 'runtime/review-tools/' + test)

    def test_combined_bundle_has_seven_skills_and_one_shared_runtime(self):
        combined = self.root / 'combined.zip'
        self.run_command('python3', base.ROOT / 'scripts/build-skill.py', '--aliyun-skills', '--media-skills',
                         '--output', combined, cwd=base.ROOT, env=self.build_env)
        with zipfile.ZipFile(combined) as z:
            manifest = json.loads(z.read('bundle-manifest.json'))
            self.assertEqual(manifest['skills'], list(base.SKILLS + self.skills))
            self.assertEqual(sum(n.endswith('/runtime/review-tools/aliyun_audio_generation.py') for n in z.namelist()), 1)
            for row in manifest['files']:
                raw = z.read(row['path'])
                self.assertEqual(hashlib.sha256(raw).hexdigest(), row['sha256'])
                self.assertEqual(len(raw), row['bytes'])


if __name__ == '__main__':
    unittest.main()
