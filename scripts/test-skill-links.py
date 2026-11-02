"""Offline path-link regression for authored director guidance, in repo and package.
Runtime snapshots retain their own repository documentation and are not in scope.
Remote links are not fetched; pinned MotionStudio source targets are checked locally.
"""
import argparse
from pathlib import Path
import re
import tempfile
import unittest
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
PIN = 'https://github.com/doomclouds/MotionStudio/blob/ebda9d2661be84e1314cee14baf4acd241b6069e/'

def local_target(root, page, target, repository=None):
    target = unquote(target.split('#')[0])
    if not target:
        return True
    if target.startswith(PIN):
        return True if repository is None else (repository / target[len(PIN):]).is_file()
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
    for page in sorted(root.rglob('*.md')):
        if 'runtime' in page.relative_to(root).parts:
            continue
        for target in re.findall(r'\]\(([^)]+)\)', page.read_text()):
            count += 1
            if not local_target(root, page, target, repository):
                errors.append(f'{page.relative_to(root)} -> {target}')
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
