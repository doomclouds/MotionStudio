"""Offline path-link regression for authored director guidance, in repo and package.
The five bundled engine snapshots are checked too; standalone review-tools retain
their own separately scoped documentation checks.
Remote links are not fetched; pinned MotionStudio source targets are checked locally.
"""
import argparse
import os
from pathlib import Path
import re
import subprocess
import tempfile
import unittest
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
PIN = re.compile(r'https://github\.com/doomclouds/MotionStudio/blob/([0-9a-f]{40})/(.+)\Z')

def local_target(root, page, target, repository=None):
    target = unquote(target.split('#')[0])
    if '\x00' in target:
        return False
    if not target:
        return True
    pinned = PIN.fullmatch(target)
    if pinned:
        if repository is None:
            return True  # Portable bundles have no Git history; this is not remote validation.
        commit, source_path = pinned.groups()
        result = subprocess.run(['git', '-C', str(repository), 'cat-file', '-t',
                                 f'{commit}:{source_path}'], capture_output=True, text=True,
                                env={**os.environ, 'GIT_NO_LAZY_FETCH': '1'})
        return result.returncode == 0 and result.stdout.strip() == 'blob'
    if re.match(r'[a-zA-Z][a-zA-Z0-9+.-]*:', target):
        return True  # Offline scope: no claim that remote targets or anchors are valid.
    resolved = (page.parent / target).resolve()
    boundary = repository.resolve() if repository is not None else root.resolve()
    if boundary not in resolved.parents and resolved != boundary:
        return False
    if repository is not None:
        if root.resolve() not in resolved.parents:
            return resolved.exists()  # Explicit repository source link; never allowed in portable mode.
        rel = resolved.relative_to(root.resolve()).as_posix()
        # Explicit portable links resolve to their canonical source in a checkout.
        if rel.startswith('runtime/review-tools/'):
            name = rel.rsplit('/', 1)[1]
            source = 'scripts' if name in {'audio_review.py', 'audiovisual_review.py', 'AUDIO-REVIEW.md'} else 'tools/reference-benchmark'
            return (repository / source / name).is_file()
        if rel.startswith('runtime/'):
            return (repository / 'engine' / rel.removeprefix('runtime/')).exists()
    return resolved.exists()

def inspect(root, repository=None):
    if not root.is_dir() or not (root / 'SKILL.md').is_file():
        return 0, ['Missing Skill root or SKILL.md; refusing an empty success']
    errors, count = [], 0
    pages = list(root.rglob('*.md'))
    if repository is not None:
        pages += [page for page in (repository / 'engine').rglob('*.md')
                  if 'node_modules' not in page.relative_to(repository / 'engine').parts]
    for page in sorted(pages):
        if page.is_relative_to(root):
            parts = page.relative_to(root).parts
            if parts[:2] == ('runtime', 'review-tools'):
                continue
        for target in re.findall(r'\]\(([^)]+)\)', page.read_text()):
            count += 1
            if not local_target(root, page, target, repository):
                errors.append(f'{page.relative_to(repository if repository is not None else root)} -> {target}')
    return count, errors

class PathLinkTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.page = self.root / 'references/doc.md'
        self.page.parent.mkdir()
    def test_missing_skill_root_is_not_an_empty_pass(self):
        self.assertTrue(inspect(self.root)[1])
    def test_existing_target_and_anchor(self):
        (self.root / 'contract.md').write_text('contract')
        self.assertTrue(local_target(self.root, self.page, '../contract.md#scope'))
    def test_missing_target(self):
        self.assertFalse(local_target(self.root, self.page, '../missing.md'))
    def test_repository_escape_is_not_portable(self):
        self.assertFalse(local_target(self.root, self.page, '../../../scripts/audio_review.py'))
    def test_remote_and_local_anchor_are_not_fetched(self):
        self.assertTrue(local_target(self.root, self.page, 'https://example.invalid/doc'))
        self.assertTrue(local_target(self.root, self.page, '#scope'))
    def test_runtime_engine_missing_link_is_checked(self):
        (self.root / 'SKILL.md').write_text('Skill')
        page = self.root / 'runtime/motion-elements/README.md'
        page.parent.mkdir(parents=True)
        page.write_text('[policy](../../SOURCE-SCOPE.md)')
        count, errors = inspect(self.root)
        self.assertEqual(count, 1)
        self.assertEqual(len(errors), 1)
        (self.root / 'SOURCE-SCOPE.md').write_text('Fixture policy')
        self.assertEqual(inspect(self.root)[1], [])
    def test_repository_engine_missing_link_is_checked(self):
        skill = self.root / 'skills/director'
        skill.mkdir(parents=True)
        (skill / 'SKILL.md').write_text('Skill')
        page = self.root / 'engine/example/README.md'
        page.parent.mkdir(parents=True)
        page.write_text('[missing](missing.md)')
        self.assertEqual(len(inspect(skill, self.root)[1]), 1)
        dependency = self.root / 'engine/example/node_modules/vendor/README.md'
        dependency.parent.mkdir(parents=True)
        dependency.write_text('[vendor-only](absent.md)')
        self.assertEqual(len(inspect(skill, self.root)[1]), 1)
    def test_pinned_source_uses_commit_not_current_tree(self):
        def git(*args):
            return subprocess.check_output(['git', '-C', str(self.root), *args], text=True).strip()
        git('init', '-q')
        (self.root / 'historical.md').write_text('historical source')
        git('add', 'historical.md')
        git('-c', 'user.name=Link Test', '-c', 'user.email=link-test@example.invalid',
            'commit', '-qm', 'Historical fixture')
        commit = git('rev-parse', 'HEAD')
        (self.root / 'historical.md').unlink()
        (self.root / 'new.md').write_text('current-only source')
        prefix = f'https://github.com/doomclouds/MotionStudio/blob/{commit}/'
        self.assertTrue(local_target(self.root, self.page, prefix + 'historical.md', self.root))
        self.assertFalse(local_target(self.root, self.page, prefix + 'new.md', self.root))
        self.assertFalse(local_target(self.root, self.page, prefix + 'missing.md', self.root))
        self.assertFalse(local_target(self.root, self.page,
            'https://github.com/doomclouds/MotionStudio/blob/' + '0' * 40 + '/historical.md', self.root))
        self.assertTrue(local_target(self.root, self.page, prefix + 'historical.md'))
        self.assertFalse(local_target(self.root, self.page, prefix + 'historical.md%00', self.root))
        self.assertFalse(local_target(self.root, self.page, '../bad%00.md', self.root))
        blob = git('rev-parse', f'{commit}:historical.md')
        (self.root / '.git/objects' / blob[:2] / blob[2:]).unlink()
        git('config', 'remote.origin.promisor', 'true')
        git('config', 'remote.origin.url', str(self.root / 'missing-remote'))
        self.assertFalse(local_target(self.root, self.page, prefix + 'historical.md', self.root))
        self.assertFalse((self.root / '.git/objects' / blob[:2] / blob[2:]).exists())

    def test_missing_portable_runtime_is_rejected(self):
        self.assertFalse(local_target(self.root, self.page, '../runtime/review-tools/missing.py'))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--package', type=Path)
    args = parser.parse_args()
    result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(PathLinkTests))
    root = args.package.resolve() if args.package else ROOT / 'skills/motion-film-director'
    count, errors = inspect(root, None if args.package else ROOT)
    for error in errors:
        print('BROKEN', error)
    print(f'{count} authored Markdown targets checked; {len(errors)} broken; external URLs/anchors not fetched')
    raise SystemExit(not result.wasSuccessful() or bool(errors))
