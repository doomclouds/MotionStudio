import json
from pathlib import Path
import shutil
import tempfile
import unittest
import design_knowledge as dk


class DesignKnowledgeTests(unittest.TestCase):
    def test_bounded_brand_identity_navigation(self):
        for term in ('字内重建', '首字归位', '同线异材', '分片用途', '定锚换境'):
            matches = dk.find(dk.catalog(), term)
            self.assertEqual([e['id'] for e in matches], ['reference-to-composition'])
            self.assertEqual(matches[0]['type'], 'decision-guide')
        for shelf in ('expression.md', 'motion.md'):
            text = (dk.ROOT / 'library' / shelf).read_text()
            rows = [x for x in text.splitlines() if '#品牌身份改变表达不偷换对象' in x]
            self.assertEqual(len(rows), 1)
            self.assertTrue(all(x in rows[0] for x in ('静音', '未常速', '未听审', '不是新族')))
        guide = (dk.ROOT / 'reference-to-composition.md').read_text()
        self.assertIn('## 品牌身份：改变表达，不偷换对象', guide)
        self.assertIn('全不透明帧数不得命名为“可读帧数”', guide)

    def test_real_catalog_and_portable_links(self):
        self.assertEqual(dk.validate(), [])

    def test_literal_search_and_no_match(self):
        data = dk.catalog()
        self.assertEqual(dk.find(data, '功能色')[0]['id'], 'ui-002-instrument')
        self.assertEqual(dk.find(data, 'Dashboard')[0]['id'], 'ui-001-dashboard')
        self.assertEqual(dk.find(data, 'dashboard', 'instrument-interfaces'), [])
        self.assertEqual(dk.find(data, 'no-such-design-zzzz'), [])
        self.assertEqual(dk.find(data, '受众')[0]['id'], 'content-decisions')

    def test_shared_reference_workflow_is_discoverable(self):
        matches = dk.find(dk.catalog(), '跨例')
        self.assertEqual([e['id'] for e in matches], ['reference-to-composition'])
        self.assertEqual(matches[0]['type'], 'decision-guide')
        guide = dk.ROOT / matches[0]['path']
        self.assertTrue(guide.is_file())
        self.assertIn('本阶段创造目标：需求驱动的迭代循环', guide.read_text())
        base = Path(__file__).resolve().parents[1]
        # UI is repository-only; a Motion portable has only its root SKILL.md.
        motion = base / 'skills/motion-film-director/SKILL.md'
        entries = [motion if motion.exists() else base / 'SKILL.md']
        ui = base / 'skills/ui-design-director/SKILL.md'
        if ui.exists():
            entries.append(ui)
        import re
        for entry in entries:
            links = re.findall(r'\[[^\]]*\]\(([^)]+)\)', entry.read_text())
            refs = [x for x in links if x.endswith('/reference-to-composition.md')]
            self.assertEqual(len(refs), 1)
            self.assertEqual((entry.parent / refs[0]).resolve(), guide.resolve())

    def test_bounded_static_methods_are_literal_navigation(self):
        data = dk.catalog()
        for term in ('静态合同', '透明壳', '样本版本', '章节预览', '等距选区'):
            matches = dk.find(data, term)
            self.assertEqual([e['id'] for e in matches], ['static-ui-reference-study'])
            self.assertEqual(matches[0]['type'], 'decision-guide')
            self.assertEqual(matches[0]['path'], 'static-ui-reference-study.md')
        self.assertEqual(dk.find(data, '样本版本', 'brand-posters'), [])
        self.assertEqual(dk.find(data, '无对应方法zzzz'), [])
        cases = [e['id'] for e in data['entries']]
        self.assertNotIn('static-ui-reference-study', cases)
        for shelf, anchor, limits in (
            ('motion.md', '参照外壳主体遮挡与壳体透明度分别验证', ('正交相机', '封闭凸盒', '不代表')),
            ('sound.md', '通道场景排队的是受控内容不是一个名称', ('有限界面状态模型', '不是实时调度', '听审证据')),
        ):
            text = (dk.ROOT / 'library' / shelf).read_text()
            rows = [line for line in text.splitlines() if '#' + anchor in line]
            self.assertEqual(len(rows), 1)
            self.assertTrue(all(word in rows[0] for word in limits))

    def test_spatial_narrative_reuses_the_shared_guide(self):
        for term in ('空间叙事', '局部遮护', '阻断补位', '地点留读', '尺度揭示'):
            matches = dk.find(dk.catalog(), term)
            self.assertEqual([e['id'] for e in matches], ['reference-to-composition'])
            self.assertEqual(matches[0]['path'], 'reference-to-composition.md')
        anchor = '空间与因果叙事让环境变化兑现主张'
        for shelf in ('expression.md', 'motion.md'):
            text = (dk.ROOT / 'library' / shelf).read_text()
            self.assertIn('../reference-to-composition.md#' + anchor, text)
        guide = (dk.ROOT / 'reference-to-composition.md').read_text()
        self.assertIn('## 空间与因果叙事：让环境变化兑现主张', guide)
        for title in ('观察者与环境回应', '局部遮护必须在环境仍继续时成立',
                      '先看见阻断，再用同一规则兑现变化', '地点承载文字，留下经过而非留住旧字幕',
                      '隐去上下文后，以同一物件揭示尺度'):
            self.assertIn('### ' + title, guide)
        self.assertIn('没有音轨是制作选择，不是声音已经听过', guide)

    def test_emotion_methods_keep_shared_navigation_and_limits(self):
        for term in ('成功反应', '画域边界', '跨景行程', '禁用控件', '字形腾空'):
            self.assertEqual([e['id'] for e in dk.find(dk.catalog(), term)], ['reference-to-composition'])
        for shelf in ('expression.md', 'motion.md'):
            self.assertIn('#情绪与品牌让动作和部件承担表达', (dk.ROOT / 'library' / shelf).read_text())
        guide = (dk.ROOT / 'reference-to-composition.md').read_text()
        for limit in ('未连接状态', '不构成通用排版', '显示遮罩与数值边界条件分开', '不能把有声样片误写成静音'):
            self.assertIn(limit, guide)

    def test_environment_strategy_is_a_bounded_existing_guide(self):
        for term in ('环境解法', '支撑交接', '最小可达距离'):
            self.assertEqual([e['id'] for e in dk.find(dk.catalog(), term)], ['reference-to-composition'])
        shelf = (dk.ROOT / 'library/motion.md').read_text()
        self.assertIn('#已有环境怎样让第二次尝试成为新策略', shelf)
        guide = (dk.ROOT / 'reference-to-composition.md').read_text()
        for limit in ('最小可达距离', '支撑标记不证明重心平衡', '样片无音轨，原片并非无音轨', '两者均未常速观看、未听审'):
            self.assertIn(limit, guide)

    def test_shared_space_methods_are_bounded_and_discoverable(self):
        for term in ('共同投影', '暂时让路', '用途改变', '通路反例'):
            self.assertEqual([e['id'] for e in dk.find(dk.catalog(), term)], ['reference-to-composition'])
        for shelf in ('expression.md', 'motion.md'):
            self.assertIn('#共同空间合框让路与用途改变', (dk.ROOT / 'library' / shelf).read_text())
        guide = (dk.ROOT / 'reference-to-composition.md').read_text()
        for boundary in ('原创样片全部无音轨', '关键手部被头身遮住', '版本冲突保留', '未靠近支柱', '闭环也可能读成保护或禁闭'):
            self.assertIn(boundary, guide)

    def test_guides_do_not_enter_evidence_catalog(self):
        base = Path(__file__).resolve().parents[1]
        skill = base / 'skills/motion-film-director' if (base / 'skills/motion-film-director').is_dir() else base
        video = json.loads((skill / 'research/video-knowledge/index.json').read_text())
        self.assertTrue(all(video[k] == [] for k in ('cases', 'techniques')))
        self.assertEqual(video['schema_version'], 3)
        self.assertNotIn('legacy', video)
        self.assertTrue(all(e['type'] == 'public-method-summary' for e in dk.catalog()['entries']))

    def test_invalid_duplicate_path_private_locator_and_orphan(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / 'skill/knowledge/design'
            shutil.copytree(dk.ROOT, root)
            data = dk.catalog(root)
            data['entries'].append(dict(data['entries'][0]))
            (root / 'index.json').write_text(json.dumps(data))
            (root / 'cases/orphan.md').write_text('[broken](missing.md)\nfile://private')
            issues = dk.validate(root)
            self.assertTrue(any('duplicate' in i for i in issues))
            self.assertIn('case files/index differ', issues)
            self.assertTrue(any('private locator' in i for i in issues))
            self.assertTrue(any('broken/nonportable' in i for i in issues))

    def test_motion_ids_exist_without_counting_recipes_as_foundations(self):
        base = Path(__file__).resolve().parents[1]
        skill = base / 'skills/motion-film-director' if (base / 'skills/motion-film-director').is_dir() else base
        portable = skill / 'runtime/motion-elements/catalog.json'
        source = skill.parents[1] / 'engine/motion-elements/catalog.json'
        catalog = json.loads((portable if portable.exists() else source).read_text())
        ids = {e['id'] for e in catalog['elements']}
        import re
        doc = (skill / 'references/design-to-motion.md').read_text()
        referenced = set(re.findall(r'`((?:motion|composition|recipe|geometry|transition|reveal)\.[a-z-]+)`', doc))
        self.assertTrue(referenced)
        self.assertEqual(referenced - ids, set())


if __name__ == '__main__':
    unittest.main()
