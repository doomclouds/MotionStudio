"""Run isolated temporary Git fixtures against the real source-only policy."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
GUARD = ROOT / 'scripts/check-source-tree.py'
PNG = b'\x89PNG\r\n\x1a\n' + b'fixture-only-not-a-valid-image'
MP4 = b'\x00\x00\x00\x18ftypisom' + b'\0' * 20
JPEG = 'projects/favorite52-engine-rebuild/assets/dario-techcrunch-2023.jpg'

class SourceTreeFixtures(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='motion-source-policy-')
        self.repo = Path(self.temp.name)
        self.guard = GUARD
        self.git('init', '-q')
        self.git('config', 'user.name', 'Source Policy Test')
        self.git('config', 'user.email', 'fixture@localhost')
    def tearDown(self): self.temp.cleanup()
    def git(self, *args):
        return subprocess.check_output(['git', '-C', str(self.repo), *args], stderr=subprocess.STDOUT)
    def add(self, name, data):
        p = self.repo / name
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(data)
        self.git('add', '--', name)
    def audit(self, good, contains=None):
        result = subprocess.run([sys.executable, str(self.guard), '--repo', str(self.repo)], capture_output=True, text=True)
        self.assertEqual(result.returncode == 0, good, result.stdout + result.stderr)
        if contains: self.assertIn(contains, result.stdout)
    def test_env_file_forbidden(self):
        self.add('.env', b'DASHSCOPE_API_KEY=fixture-value')
        self.audit(False, 'forbidden-path')
    def test_env_example_placeholder_allowed(self):
        self.add('.env.example', b'DASHSCOPE_API_KEY=\n')
        self.audit(True)
    def test_env_example_value_rejected(self):
        self.add('.env.example', b'DASHSCOPE_API_KEY=fixture-value\n')
        self.audit(False, 'non-placeholder-env-template')
    def test_env_example_spaced_assignment_rejected(self):
        self.add('.env.example', b'DASHSCOPE_API_KEY = fixture-value\n')
        self.audit(False, 'non-placeholder-env-template')
    def test_env_example_unrecognized_variable_rejected(self):
        self.add('.env.example', b'OTHER_KEY=fixture-value\nDASHSCOPE_API_KEY=\n')
        self.audit(False, 'non-placeholder-env-template')
    def test_api_secret_in_arbitrary_file_rejected_without_echo(self):
        self.add('innocent.txt', b'sk-' + b'z'*32)
        self.audit(False, 'possible-api-secret')
    def test_external_large_font_is_forbidden(self):
        self.add('projects/favorite52-engine-rebuild/assets/fonts/Carousel-NotoSansCJKsc-Bold.otf', b'font fixture')
        self.audit(False, 'forbidden-path')
    def test_private_brand_svg_is_forbidden(self):
        self.add('projects/favorite52-engine-rebuild/assets/claude-duet-official.svg', b'<svg/>')
        self.audit(False, 'forbidden-path')
    def test_private_study_is_forbidden(self):
        self.add('projects/kinetic-type-recreation/scene.mjs', b'export {};')
        self.audit(False, 'forbidden-path')
    def test_normal_source_and_typescript(self):
        self.add('src/main.ts', b'export const answer = 42;\n')
        self.git('commit', '-qm', 'source')
        self.audit(True)
    def test_audio_timeline_source_only(self):
        self.add('engine/motion-timeline-core/lib/timeline.mjs', b'export const version = 1;\n')
        self.add('engine/motion-audio-core/lib/audio.mjs', b'export {};\n')
        self.audit(True)
    def test_motion_elements_synthetic_source_allowed(self):
        self.add('engine/motion-elements/lib/index.mjs', b'export {};\n')
        self.add('engine/motion-elements/catalog/elements.json', b'{"schemaVersion":1,"elements":[]}')
        self.add('engine/motion-elements/examples/gallery.html', b'<html><body>Synthetic gallery source</body></html>')
        self.audit(True)
    def test_motion_elements_generated_preview_rejected(self):
        self.add('engine/motion-elements/output/gallery.mp4', MP4)
        self.audit(False, 'forbidden-path')
    def test_motion_elements_media_outside_output_rejected(self):
        self.add('engine/motion-elements/examples/preview.png', PNG)
        self.audit(False, 'unapproved-media:PNG')
    def test_motion_elements_private_case_rejected(self):
        self.add('engine/motion-elements/catalog/case.json', b'{"path":"/workspace/private/example.mp4"}')
        self.audit(False, 'private-production-metadata')
    def test_audio_core_media_still_rejected(self):
        self.add('engine/motion-audio-core/test/sample.wav', b'RIFF' + b'\0' * 4 + b'WAVE')
        self.audit(False, 'unapproved-media')
    def test_audio_core_private_metadata_still_rejected(self):
        self.add('engine/motion-audio-core/private.json', b'{"path":"/workspace/private/project.wav"}')
        self.audit(False, 'private-production-metadata')
    def test_misnamed_video(self):
        self.add('foo.mp4.bin', MP4)
        self.audit(False, 'ISO/QuickTime-media')
    def test_extension_rejects_unrecognized_video(self):
        self.add('foo.MOV', b'no recognized header')
        self.audit(False, 'unapproved-media:extension')
    def test_arbitrary_png_location(self):
        self.add('innocent/nested/value.bin', PNG)
        self.audit(False, 'unapproved-media:PNG')
    def test_old_bad_blob_removed_from_head(self):
        self.add('root.bin', PNG)
        self.git('commit', '-qm', 'bad historical blob')
        self.git('rm', '-q', 'root.bin')
        self.add('source.py', b'print(42)\n')
        self.git('commit', '-qm', 'remove bad current file')
        self.audit(False, 'unapproved-media:PNG')
    def test_other_reachable_branch(self):
        self.add('source.py', b'print(42)\n')
        self.git('commit', '-qm', 'base')
        self.git('checkout', '-qb', 'bad-history')
        self.add('hidden.bin', MP4)
        self.git('commit', '-qm', 'bad branch')
        self.git('checkout', '-q', '-')
        self.audit(False, 'ISO/QuickTime-media')
    def test_index_bytes_not_worktree(self):
        self.add('apparently-safe.txt', PNG)
        (self.repo / 'apparently-safe.txt').write_text('safe worktree replacement')
        self.audit(False, 'unapproved-media:PNG')
    def test_public_policy_has_no_media_assets(self):
        allow = json.loads((ROOT / 'scripts/source-assets-allowlist.json').read_text())['assets']
        self.assertEqual(allow, {})
    def test_approved_asset_tampered(self):
        name='assets/fixture.jpg'; data=b'\xff\xd8\xffsynthetic fixture'
        self.reviewed_policy({name: hashlib.sha256(data).hexdigest()})
        self.add(name, data+b'changed')
        self.audit(False, 'approved-source-asset-hash-mismatch')
    def test_approved_asset_wrong_path(self):
        self.add('assets/renamed.jpg', b'\xff\xd8\xffsynthetic fixture')
        self.audit(False, 'unapproved-media:JPEG')
    def test_private_project_metadata_is_forbidden(self):
        self.add('projects/private-study/assets/source-index.json', b'{}')
        self.audit(False, 'forbidden-path')
    def test_private_research_is_forbidden(self):
        self.add('skills/motion-film-director/research/records/private.json', b'{}')
        self.audit(False, 'forbidden-path')
    def test_private_index_outside_project_is_forbidden(self):
        self.add('elsewhere/source-index.json', b'{}')
        self.audit(False, 'forbidden-path')
    def test_renamed_private_metadata_is_rejected(self):
        self.add('innocent/data.json', json.dumps({'rights': 'private-review-only', 'local': '/workspace/'+'shared/private/movie.mp4'}).encode())
        self.audit(False, 'private-production-metadata')
    def test_acquisition_record_is_rejected(self):
        self.add('innocent/data.json', json.dumps({'download_url': 'https://example.invalid/private/movie.mp4'}).encode())
        self.audit(False, 'private-production-metadata')
    def test_general_rights_warning_is_preserved(self):
        self.add('RIGHTS.md', b'Media rights and publication permissions must be checked independently. Private reviews are not publication permission.')
        self.audit(True)
    def reviewed_policy(self, assets):
        # Isolated policy beside a copied guard, never change the production allowlist.
        policy = self.repo / 'fixture-policy/scripts'
        policy.mkdir(parents=True, exist_ok=True)
        self.guard = policy / 'check-source-tree.py'
        self.guard.write_bytes(GUARD.read_bytes())
        (policy / 'source-assets-allowlist.json').write_text(json.dumps({'assets': assets}))
    def test_two_reviewed_versions_in_history(self):
        name = 'assets/reviewed-font.otf'
        first, second = b'OTTOreviewed version one', b'OTTOreviewed version two'
        self.reviewed_policy({name: [hashlib.sha256(first).hexdigest(), hashlib.sha256(second).hexdigest()]})
        self.add(name, first); self.git('commit', '-qm', 'first approved version')
        self.add(name, second); self.git('commit', '-qm', 'second approved version')
        self.audit(True)
    def test_third_unreviewed_version_rejected(self):
        name = 'assets/reviewed-font.otf'
        first, second = b'OTTOreviewed version one', b'OTTOreviewed version two'
        self.reviewed_policy({name: [hashlib.sha256(first).hexdigest(), hashlib.sha256(second).hexdigest()]})
        self.add(name, first); self.git('commit', '-qm', 'approved')
        self.add(name, b'OTTOunknown third version')
        self.audit(False, 'approved-source-asset-hash-mismatch')
    def test_empty_or_malformed_reviewed_digests_rejected(self):
        for value in [[], '', 'a'*63, 'g'*64, ['a'*64, 'bad'], [None], 42]:
            with self.subTest(value=value):
                self.reviewed_policy({'assets/reviewed-font.otf': value})
                result = subprocess.run([sys.executable, str(self.guard), '--repo', str(self.repo)], capture_output=True, text=True)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn('Invalid source asset allowlist SHA256', result.stderr)

    def test_all_index_merge_stages(self):
        self.add('merge.txt', b'safe\n')
        bad = subprocess.check_output(['git', '-C', str(self.repo), 'hash-object', '-w', '--stdin'], input=PNG).strip().decode()
        normal = subprocess.check_output(['git', '-C', str(self.repo), 'hash-object', '-w', '--stdin'], input=b'safe\n').strip().decode()
        self.git('update-index', '--force-remove', 'merge.txt')
        entries = f'100644 {bad} 2\tmerge.txt\n100644 {normal} 3\tmerge.txt\n'
        subprocess.run(['git', '-C', str(self.repo), 'update-index', '--index-info'], input=entries.encode(), check=True)
        self.audit(False, 'index-stage-2')

if __name__ == '__main__': unittest.main(verbosity=2)
