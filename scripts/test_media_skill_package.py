"""Build/extract the real optional multi-skill bundle without an installed repo.

Uses a disposable Git index and synthetic media. Never installs dependencies,
reads private .env files, invokes a provider, or claims host/quality acceptance.
"""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SKILLS = ('video-review', 'audio-review', 'soundtrack-production')


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class MediaBundleTests(unittest.TestCase):
    @classmethod
    def run_command(cls, *args, cwd=None, env=None, check=True):
        result = subprocess.run([str(x) for x in args], cwd=cwd or cls.motion,
                                env=env or cls.env, capture_output=True, text=True, timeout=120)
        if check and result.returncode:
            raise AssertionError(f'Offline command failed ({result.returncode}): {result.stderr}')
        return result

    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='motion-media-bundle-')
        cls.addClassCleanup(cls.temp.cleanup)
        cls.root = Path(cls.temp.name)
        cls.motion = ROOT
        index_name = subprocess.check_output(['git', '-C', str(ROOT), 'rev-parse', '--git-path', 'index'], text=True).strip()
        cls.index = Path(index_name)
        if not cls.index.is_absolute():
            cls.index = ROOT / cls.index
        cls.before = digest(cls.index)
        disposable = cls.root / 'index'
        shutil.copy2(cls.index, disposable)
        cls.env = dict(os.environ, GIT_INDEX_FILE=str(disposable))
        # Include authored new paths before commit, without staging anyone's real index.
        paths = ['scripts/build-skill.py', 'scripts/skill-layout.py', 'scripts/audio_review.py',
                 'scripts/AUDIO-REVIEW.md', 'skills/motion-film-director/SKILL.md', 'skills/MEDIA-SKILLS.md']
        paths += ['skills/' + name + '/SKILL.md' for name in SKILLS]
        cls.run_command('git', 'add', '--', *paths, cwd=ROOT)
        cls.archive = cls.root / 'media.zip'
        cls.run_command('python3', ROOT / 'scripts/build-skill.py', '--media-skills', '--output', cls.archive, cwd=ROOT)
        cls.fresh = cls.root / 'fresh'
        with zipfile.ZipFile(cls.archive) as archive:
            archive.extractall(cls.fresh)
        cls.motion = cls.fresh / 'motion-film-director'
        # Fail closed if any extracted Python command tries network/private config.
        guard = cls.root / 'guard'
        guard.mkdir()
        (guard / 'sitecustomize.py').write_text('''import builtins, io, os, socket
def deny_network(*args, **kwargs):
    raise AssertionError("Network forbidden in offline package smoke")
socket.socket.connect = deny_network
socket.socket.connect_ex = deny_network
socket.create_connection = deny_network
def protect(opener):
    def opened(file, *args, **kwargs):
        if isinstance(file, (str, bytes, os.PathLike)):
            name = os.path.basename(os.fsdecode(file))
            if name == ".env" or (name.startswith(".env.") and name != ".env.example"):
                raise AssertionError("Private config forbidden in offline package smoke")
        return opener(file, *args, **kwargs)
    return opened
builtins.open = protect(builtins.open)
io.open = protect(io.open)
''')
        cls.build_env = dict(cls.env, PYTHONPATH=str(guard), PYTHONDONTWRITEBYTECODE='1')
        cls.env = {key: value for key, value in cls.build_env.items() if key != 'GIT_INDEX_FILE'}

    @classmethod
    def tearDownClass(cls):
        if digest(cls.index) != cls.before:
            raise AssertionError('Canonical Git index changed during bundle test')

    def test_four_discoverable_entries_manifest_bytes_and_no_private_payload(self):
        manifest = json.loads((self.fresh / 'bundle-manifest.json').read_text())
        self.assertEqual(manifest['skills'], list(SKILLS))
        self.assertEqual(manifest['shared_dependency'], 'motion-film-director')
        files = {p.relative_to(self.fresh).as_posix(): p for p in self.fresh.rglob('*') if p.is_file()}
        self.assertEqual({row['path'] for row in manifest['files']}, set(files) - {'bundle-manifest.json'})
        for row in manifest['files']:
            self.assertEqual(row['bytes'], files[row['path']].stat().st_size)
            self.assertEqual(row['sha256'], digest(files[row['path']]))
        for name in (*SKILLS, 'motion-film-director'):
            self.assertIn(f'name: {name}', (self.fresh / name / 'SKILL.md').read_text().split('---', 2)[1])
        for name in files:
            self.assertFalse(name.endswith(('.mp4', '.wav', '.mp3', '.env')), name)
            self.assertNotIn('node_modules', Path(name).parts)
        self.assertEqual([p.parent.parent for p in self.fresh.glob('*/runtime/motion-audio-core')], [self.motion])

    def test_all_new_relative_links_stay_inside_bundle_and_resolve(self):
        pages = [self.fresh / name / 'SKILL.md' for name in SKILLS] + [self.fresh / 'MEDIA-SKILLS.md']
        for page in pages:
            for target in re.findall(r'\]\(([^)]+)\)', page.read_text()):
                if re.match(r'[a-zA-Z][a-zA-Z0-9+.-]*:', target):
                    continue
                resolved = (page.parent / target.split('#')[0]).resolve()
                self.assertTrue(resolved.is_relative_to(self.fresh), target)
                self.assertTrue(resolved.is_file(), target)
        self.run_command('python3', ROOT / 'scripts/test-skill-links.py', '--package', self.motion)

    def test_default_single_skill_archive_remains_unchanged_in_layout_and_bytes(self):
        single = self.root / 'single.zip'
        self.run_command('python3', ROOT / 'scripts/build-skill.py', '--output', single, cwd=ROOT, env=self.build_env)
        with zipfile.ZipFile(single) as plain, zipfile.ZipFile(self.archive) as bundle:
            self.assertTrue(all(name.startswith('motion-film-director/') for name in plain.namelist()))
            for name in plain.namelist():
                self.assertEqual(plain.read(name), bundle.read(name), name)

    @unittest.skipUnless(shutil.which('node') and shutil.which('ffmpeg') and shutil.which('ffprobe'),
                         'Existing Node/FFmpeg/ffprobe required, no install')
    def test_extracted_music_generation_mix_and_audio_dry_run(self):
        bed, mix = self.root / 'portable-bed', self.root / 'portable-mix'
        receipt = json.loads(self.run_command('python3', 'runtime/sound-elements/sound.py', 'render',
                                             '--id', 'quiet-pulse-bed', '--output', bed).stdout)
        self.assertEqual(receipt['listening'], 'NOT_LISTENED')
        mixed = json.loads(self.run_command('node', 'runtime/motion-audio-core/scripts/audio.mjs', 'render',
            '--timeline', bed / 'timeline.json', '--source-root', bed, '--work', mix, '--aac').stdout)
        self.assertEqual(mixed['outputs']['master']['aac']['fullDecode'], 'PASS')
        self.assertEqual(mixed['review']['listening']['status'], 'NOT_RUN')
        dry = json.loads(self.run_command('python3', 'runtime/review-tools/audio_review.py',
                                         '--audio', bed / 'source.wav').stdout)
        self.assertEqual(dry['mode'], 'dry-run')
        self.assertEqual(dry['native_audio_review'], 'unverified')
        self.assertIsNone(dry['readiness']['credential_present'])

    @unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe') and
                         importlib.util.find_spec('numpy') and importlib.util.find_spec('PIL'),
                         'Existing FFmpeg/ffprobe/NumPy/Pillow required, no install')
    def test_extracted_video_diagnostics_and_local_model_preparation(self):
        movie = self.root / 'synthetic.mp4'
        self.run_command('ffmpeg', '-nostdin', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=s=160x90:r=10:d=2',
            '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=2', '-shortest',
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', movie)
        output = self.root / 'portable-check'
        self.run_command('python3', 'scripts/motion-check/motion_check.py', movie, '--out', output)
        report = json.loads((output / 'report.json').read_text())
        self.assertEqual(report['source']['sha256'], digest(movie))
        self.assertEqual(report['frame_census']['decoded_video_frames'], 20)
        self.assertTrue(report['full_decode']['ok'])
        self.assertIn('仍须人工复看/听审', report['status'])
        prepared = self.root / 'portable-prepared'
        result = self.run_command('python3', 'runtime/review-tools/audiovisual_review.py', 'prepare', movie,
                                 '--expected-sha256', digest(movie), '--output', prepared)
        self.assertIn('PREPARED_NO_NETWORK', result.stdout)
        self.assertEqual(json.loads((prepared / 'input-manifest.json').read_text())['movie']['sha256'], digest(movie))


if __name__ == '__main__':
    unittest.main()
