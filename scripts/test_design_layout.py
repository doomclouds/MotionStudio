"""Local direct-migration layout checks; no full build, runtime or final acceptance."""
import importlib.util
from pathlib import Path
import shutil
import re
import subprocess
import sys
import tempfile
import unittest
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('layout',ROOT/'scripts/skill-layout.py')
layout=importlib.util.module_from_spec(spec);spec.loader.exec_module(layout)
class DesignLayoutTests(unittest.TestCase):
    def test_single_current_source_and_entry(self):
        self.assertFalse((ROOT/'skills/motion-film-director/research/design-knowledge').exists())
        self.assertFalse((ROOT/'skills/motion-film-director/scripts/design_knowledge.py').exists())
        self.assertFalse((ROOT/'scripts/shared-design.py').exists())
        self.assertTrue((ROOT/'knowledge/design/index.json').is_file())
        self.assertTrue((ROOT/'scripts/design_knowledge.py').is_file())
    def test_native_package_knowledge_layout(self):
        with tempfile.TemporaryDirectory(prefix='design-layout-') as d:
            target=Path(d)/'skill';target.mkdir()
            sources=list((ROOT/'skills/motion-film-director').rglob('*'))+list((ROOT/'knowledge/design').rglob('*'))+list((ROOT/'knowledge/sound').rglob('*'))
            sources += [ROOT/'scripts/design_knowledge.py', ROOT/'scripts/test_design_knowledge.py']
            # Mirror build-skill.py's explicit engine module scope, but copy only
            # real targets directly referenced by the knowledge Markdown fixture.
            # Never add arbitrary repository files or bypass missing-link validation.
            packaged_cores = {'motion-render-core', 'motion-timeline-core',
                              'motion-audio-core', 'motion-elements', 'design-elements', 'sound-elements'}
            tracked = set(subprocess.check_output(
                ['git', '-C', str(ROOT), 'ls-files', '-z']).decode().split('\0'))
            linked_engine_sources = set()
            for guide in list((ROOT/'knowledge/design').rglob('*.md')) + list((ROOT/'knowledge/sound').rglob('*.md')):
                for link in re.findall(r'\[[^\]]*\]\(([^)]+)\)', guide.read_text()):
                    if re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:', link) or link.startswith('#'):
                        continue
                    source = (guide.parent/link.split('#', 1)[0]).resolve()
                    self.assertTrue(source.is_relative_to(ROOT), str(source))
                    rel = source.relative_to(ROOT).as_posix()
                    if not rel.startswith('engine/'):
                        continue  # Existing fixture/portfolio projection handles other scopes.
                    self.assertIn(rel.split('/')[1], packaged_cores, rel)
                    self.assertIn(rel, tracked, rel)
                    self.assertTrue(source.is_file() and not source.is_symlink(), rel)
                    linked_engine_sources.add(source)
            sources += sorted(linked_engine_sources)
            for source in sources:
                if not source.is_file() or '__pycache__' in source.parts:continue
                rel=source.relative_to(ROOT).as_posix();dest=target/layout.package_path(rel)
                dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(layout.source_bytes(ROOT,rel))
            self.assertFalse((target/'research/design-knowledge').exists())
            self.assertTrue((target/'knowledge/design/index.json').is_file())
            result=subprocess.run([sys.executable,str(target/'scripts/design_knowledge.py'),'validate'],cwd=d,capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stdout+result.stderr)
            static=(target/'knowledge/design/static-ui-reference-study.md').read_text()
            self.assertIn('../../LICENSES/baoyu-design-MIT.txt',static)
            self.assertTrue((target/'LICENSES/baoyu-design-MIT.txt').is_file())
    def test_protected_region_guide_survives_package_projection(self):
        rel = 'knowledge/design/studies/brand-and-carriers.md'
        projected = layout.source_bytes(ROOT, rel).decode()
        self.assertIn('../../../references/qa.md#保护区检查覆盖全部相关帧', projected)
        qa = layout.source_bytes(ROOT, 'skills/motion-film-director/references/qa.md').decode()
        self.assertIn('旧版作为会失败的负对照', qa)
        self.assertNotIn('/workspace/', projected)

    def test_runtime_readme_marks_repository_only_policy_context(self):
        source = 'engine/motion-elements/README.md'
        original = (ROOT/source).read_text()
        projected = layout.source_bytes(ROOT, source).decode()
        for name in ('SOURCE-SCOPE.md', 'THIRD_PARTY_NOTICES.md'):
            self.assertIn('](../../' + name + ')', original)
            self.assertNotIn('](../../' + name + ')', projected)
            self.assertIn('仅完整仓库：' + name, projected)
        self.assertIn('](LICENSE)', projected)
        self.assertEqual(layout.source_bytes(ROOT, 'engine/motion-elements/LICENSE'),
                         (ROOT/'engine/motion-elements/LICENSE').read_bytes())

    def test_fixed_historical_provenance_bytes_unchanged(self):
        self.assertEqual(layout.source_bytes(ROOT,'engine/design-elements/catalog.json'),(ROOT/'engine/design-elements/catalog.json').read_bytes())
        original=(ROOT/'knowledge/design/cases/ui-003-print-poster.md').read_text()
        packaged=layout.source_bytes(ROOT,'knowledge/design/cases/ui-003-print-poster.md').decode()
        import re
        links=lambda text:re.findall(r'https?://[^)\s]+',text)
        self.assertEqual(links(original),links(packaged))
    def test_xhs08_current_source_entry_hashes(self):
        import hashlib
        import json
        root = ROOT/'engine/design-elements/recipes/candidates/xhs08'
        entry = json.loads((root/'entry.json').read_text())
        self.assertEqual(sum(item['path'] == 'README.md' for item in entry['files']), 1)
        for item in entry['files']:
            with self.subTest(path=item['path']):
                source = root/item['path']
                self.assertEqual(hashlib.sha256(source.read_bytes()).hexdigest(), item['sha256'])
                rel = source.relative_to(ROOT).as_posix()
                self.assertEqual(hashlib.sha256(layout.source_bytes(ROOT, rel)).hexdigest(), item['sha256'])

    def test_package_byte_gate_uses_new_current_sources(self):
        spec=importlib.util.spec_from_file_location('package_check',ROOT/'scripts/test-skill-package.py')
        check=importlib.util.module_from_spec(spec);spec.loader.exec_module(check)
        for rel in ('knowledge/design/INDEX.md','scripts/design_knowledge.py','scripts/test_design_knowledge.py','SKILL.md'):
            source=rel if rel.startswith(('knowledge/','scripts/')) else 'skills/motion-film-director/'+rel
            self.assertEqual(check.expected_source_bytes(rel,layout),layout.source_bytes(ROOT,source))
if __name__=='__main__':unittest.main()
