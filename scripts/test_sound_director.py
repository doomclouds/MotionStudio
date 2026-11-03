"""Offline director routing and portable guidance checks, not auditory acceptance."""
import importlib.util
from pathlib import Path
import re
import json
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('layout', ROOT / 'scripts/skill-layout.py')
layout = importlib.util.module_from_spec(spec)
spec.loader.exec_module(layout)
PAGES = ['skills/sound-director/SKILL.md', 'skills/sound-director/VALIDATION.md',
         'skills/motion-film-director/references/sound-direction.md',
         'skills/motion-film-director/references/voice-direction.md',
         'skills/motion-film-director/references/rebuild-handoff.md']

class SoundDirectorTests(unittest.TestCase):
    def test_repository_routes(self):
        for path in ['AGENTS.md', 'skills/motion-film-director/SKILL.md',
                     'skills/ui-design-director/SKILL.md', 'specs/production-and-knowledge.md']:
            self.assertIn('sound-director/SKILL.md', (ROOT / path).read_text())

    def test_guidance_links(self):
        for name in PAGES:
            page = ROOT / name
            for target in re.findall(r'\]\(([^)]+)\)', page.read_text()):
                if re.match(r'[a-zA-Z][a-zA-Z0-9+.-]*:', target):
                    continue
                path = target.split('#')[0]
                if path:
                    self.assertTrue((page.parent / path).is_file(), f'{name}: {target}')

    def test_portable_guidance_stays_in_payload(self):
        # Use the actual builder's path transformation and isolated files. No
        # complete-runtime or artistic pass is inferred from this document test.
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            sources = list((ROOT / 'skills/motion-film-director').rglob('*.md'))
            sources += list((ROOT / 'engine').rglob('README.md'))
            sources += list((ROOT / 'knowledge/design').rglob('*.md'))
            for path in sources:
                name = path.relative_to(ROOT).as_posix()
                dest = root / layout.package_path(name)
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(layout.source_bytes(ROOT, name))
            for name in PAGES[2:]:
                page = root / layout.package_path(name)
                for target in re.findall(r'\]\(([^)]+)\)', page.read_text()):
                    if re.match(r'[a-zA-Z][a-zA-Z0-9+.-]*:', target):
                        continue
                    resolved = (page.parent / target.split('#')[0]).resolve()
                    self.assertTrue(resolved.is_relative_to(root))
                    self.assertTrue(resolved.is_file(), target)

    def test_shared_reference_cycle_is_reachable(self):
        page = ROOT / PAGES[2]
        self.assertIn('../../../knowledge/design/reference-to-composition.md', page.read_text())
        self.assertIn('../../../knowledge/design/library/INDEX.md', page.read_text())
        self.assertIn('实际取用→甄别→归位→新上下文验证', page.read_text())

    def test_listening_checkpoint_and_experience_loop_are_explicit(self):
        text = (ROOT / PAGES[2]).read_text()
        for required in ['合成前停点', '不阻断技术草案', '参考分析完成',
                         '原始证据位置', '观察和解释分开', '对照缺口',
                         '同画面、同窗口', '未收到反馈保持待反馈', '实际分轨']:
            self.assertIn(required, text)
        shelf = (ROOT / 'knowledge/design/library/sound.md').read_text()
        self.assertIn('references/sound-direction.md', shelf)
        self.assertIn('合成前', (ROOT / PAGES[0]).read_text())

    def test_dependency_guidance_matches_core_lock(self):
        core = ROOT / 'engine/motion-render-core'
        package = json.loads((core / 'package.json').read_text())
        lock = json.loads((core / 'package-lock.json').read_text())
        self.assertEqual(package['dependencies'], lock['packages']['']['dependencies'])
        for page in [core / 'README.md', ROOT / 'skills/motion-film-director/references/engine-use.md']:
            text = page.read_text()
            self.assertIn('npm ci --ignore-scripts', text)
            self.assertIn('package-lock.json', text)
            self.assertNotIn('没有 lockfile', text)
            self.assertNotIn('npm install --ignore-scripts', text)

    def test_rebuild_handoff_has_all_director_consumers(self):
        for name in ['skills/motion-film-director/SKILL.md',
                     'skills/ui-design-director/references/handoff-contract.md',
                     'skills/motion-film-director/references/sound-direction.md',
                     'skills/sound-director/VALIDATION.md']:
            self.assertIn('rebuild-handoff.md', (ROOT / name).read_text())
        text = (ROOT / PAGES[4]).read_text()
        for required in ['完整命令', '起始 cwd', '版本/hash', '条件可重建',
                         'NOT_RUN', '新的授权项目根', '不支持 `..`']:
            self.assertIn(required, text)

    def test_no_duplicate_runtime_or_media(self):
        self.assertEqual({p.name for p in (ROOT / 'skills/sound-director').iterdir()},
                         {'SKILL.md', 'VALIDATION.md'})
        for name in PAGES:
            self.assertIn('听', (ROOT / name).read_text())
        self.assertIn('NOT_LISTENED', (ROOT / PAGES[2]).read_text())

if __name__ == '__main__':
    unittest.main()
