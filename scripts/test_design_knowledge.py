import json
from pathlib import Path
import shutil
import tempfile
import unittest
import design_knowledge as dk


class DesignKnowledgeTests(unittest.TestCase):
    def test_material_space_method_navigation(self):
        for term in ('材料后显', '折面续纹', '同钟呼应', '转侧见层', '近递姿态'):
            matches = dk.find(dk.catalog(), term)
            self.assertEqual([e['id'] for e in matches], ['reference-to-composition'])
            self.assertEqual(matches[0]['type'], 'decision-guide')
        for shelf in ('expression.md', 'motion.md'):
            rows = [line for line in (dk.ROOT / 'library' / shelf).read_text().splitlines()
                    if '#材料与空间分清身份连续和控制因果' in line]
            self.assertEqual(len(rows), 1)
            self.assertTrue(all(word in rows[0] for word in
                ('有限2.5D/二维非物理', '二次编码来源', '无真实交互', '近静音不代听审',
                 '未常速', '未听审', '不是新积木')))
        guide = (dk.ROOT / 'reference-to-composition.md').read_text()
        section = guide.split('## 材料与空间：分清身份连续和控制因果', 1)[1]
        for boundary in ('材料说明先于最终整合展示', '后存PNG仍含先前压缩',
                         '不是原始渲染证明', '没有真实交互', '只共享影片时钟',
                         '深度线索组合消融，不是单变量试验', '必须删除旧定长声称及测试',
                         '朝向相机的billboard', '不是整案影片'):
            self.assertIn(boundary, section)
        for private_marker in ('-private-', '/workspace/', 'SHA256', 'file://'):
            self.assertNotIn(private_marker, section)

    def test_invitation_revision_method_navigation(self):
        for term in ('字牌合列', '主名伴语', '负路成景', '首字带句', '拒案换件'):
            matches = dk.find(dk.catalog(), term)
            self.assertEqual([e['id'] for e in matches], ['reference-to-composition'])
            self.assertEqual(matches[0]['type'], 'decision-guide')
        for shelf in ('expression.md', 'motion.md'):
            rows = [line for line in (dk.ROOT / 'library' / shelf).read_text().splitlines()
                    if '#邀请与修订让组合关系承担有限主张' in line]
            self.assertEqual(len(rows), 1)
            self.assertTrue(all(word in rows[0] for word in
                ('静态imagegen', '脚本非自动规划', '源片段不代表整案音轨', '未常速', '未听审', '不是新积木')))
        guide = (dk.ROOT / 'reference-to-composition.md').read_text()
        for boundary in ('邀请词没有重复品牌身份', '各字按顶部对齐可能把句号抬成近似撇号',
                         '时间顺序满足不代表运行时验证', '只称指定中央入口受阻', '该静态结果没有声音'):
            self.assertIn(boundary, guide)

    def test_reveal_continuity_method_navigation(self):
        for term in ('轨迹成标', '同纹再框', '颗粒撤出', '同形换面', '移壳见架'):
            matches = dk.find(dk.catalog(), term)
            self.assertEqual([e['id'] for e in matches], ['reference-to-composition'])
            self.assertEqual(matches[0]['type'], 'decision-guide')
        for shelf in ('expression.md', 'motion.md'):
            rows = [line for line in (dk.ROOT / 'library' / shelf).read_text().splitlines()
                    if '#显露与延续确认变化前后保留了什么' in line]
            self.assertEqual(len(rows), 1)
            self.assertTrue(all(word in rows[0] for word in
                ('组合消融非单变量', '二维示意非物理', '源有音但未听审', '原创静音', '未常速', '不是新积木')))
        guide = (dk.ROOT / 'reference-to-composition.md').read_text()
        for boundary in ('标题独立淡入', '独立绘制的粉末擦痕不是工具实际画出的结果',
                         '去掉颗粒层', '不是最终院线镜头', '不等于完整空间桁架'):
            self.assertIn(boundary, guide)

    def test_brand_carrier_method_navigation(self):
        for term in ('纸面隐喻', '多载体同标', '跨面图场', '图形呼应', '经过后响应'):
            matches = dk.find(dk.catalog(), term)
            self.assertEqual([e['id'] for e in matches], ['reference-to-composition'])
            self.assertEqual(matches[0]['type'], 'decision-guide')
        for shelf in ('expression.md', 'motion.md'):
            text = (dk.ROOT / 'library' / shelf).read_text()
            rows = [x for x in text.splitlines() if '#品牌与载体区分视觉呼应和实际共享关系' in x]
            self.assertEqual(len(rows), 1)
            self.assertTrue(all(x in rows[0] for x in ('源静帧不证原动效', '近静音不代听审', '未常速', '不是新积木')))
        guide = (dk.ROOT / 'reference-to-composition.md').read_text()
        self.assertIn('## 品牌与载体：区分视觉呼应和实际共享关系', guide)
        self.assertIn('一组程序绘制的静态载体', guide)
        self.assertIn('测量底噪附近的数值不等于音轨不存在', guide)
        self.assertIn('不是保持铰线/纸长的真实折叠', guide)

    def test_atmosphere_relationship_navigation(self):
        for term in ('近缘遮挡', '同色异织', '接触后变形', '共同到岸', '缺席残影'):
            matches = dk.find(dk.catalog(), term)
            self.assertEqual([e['id'] for e in matches], ['reference-to-composition'])
            self.assertEqual(matches[0]['type'], 'decision-guide')
        for shelf in ('expression.md', 'motion.md'):
            text = (dk.ROOT / 'library' / shelf).read_text()
            rows = [x for x in text.splitlines() if '#氛围与关系让情绪先有可读的画面依据' in x]
            self.assertEqual(len(rows), 1)
            self.assertTrue(all(x in rows[0] for x in ('静态imagegen', '静音二维示意', '未常速', '未听审', '非参考级', '不是新积木')))
        guide = (dk.ROOT / 'reference-to-composition.md').read_text()
        self.assertIn('## 氛围与关系：让情绪先有可读的画面依据', guide)
        self.assertIn('五项不全是影片', guide)
        self.assertIn('中心线零隙不保证全轮廓不穿透', guide)
        self.assertIn('不是水体/空气的物理分层', guide)

    def test_material_timing_method_navigation(self):
        for term in ('固定灯位', '重复镜头', '延迟倒影', '暗面辨形', '延后释放'):
            matches = dk.find(dk.catalog(), term)
            self.assertEqual([e['id'] for e in matches], ['reference-to-composition'])
            self.assertEqual(matches[0]['type'], 'decision-guide')
        for shelf in ('expression.md', 'motion.md'):
            text = (dk.ROOT / 'library' / shelf).read_text()
            rows = [x for x in text.splitlines() if '#材质与时序先隔离变量再判断表达' in x]
            self.assertEqual(len(rows), 1)
            self.assertTrue(all(x in rows[0] for x in ('静音', '未常速', '未听审', '非参考级', '不是新积木')))
        guide = (dk.ROOT / 'reference-to-composition.md').read_text()
        self.assertIn('## 材质与时序：先隔离变量再判断表达', guide)
        self.assertIn('固定图像裁切拉远没有三维视差', guide)
        self.assertIn('参数原点固定不等于图形面积质心固定', guide)
        self.assertIn('不能同时宣称金属真实度提高', guide)

    def test_view_reading_method_navigation(self):
        for term in ('微缩通行', '细节单位', '整句恢复', '分支来路', '弯带读窗'):
            matches = dk.find(dk.catalog(), term)
            self.assertEqual([e['id'] for e in matches], ['reference-to-composition'])
            self.assertEqual(matches[0]['type'], 'decision-guide')
        for shelf in ('expression.md', 'motion.md'):
            text = (dk.ROOT / 'library' / shelf).read_text()
            rows = [x for x in text.splitlines() if '#尺度与阅读先兑现关系再分配注意力' in x]
            self.assertEqual(len(rows), 1)
            self.assertTrue(all(x in rows[0] for x in ('未常速', '未听审', '审美验收', '不是新积木')))
        guide = (dk.ROOT / 'reference-to-composition.md').read_text()
        self.assertIn('## 尺度与阅读：先兑现关系再分配注意力', guide)
        self.assertIn('阶段标签不是首个满遮罩像素', guide)
        self.assertIn('坐标边界倍率不等于像素数量', guide)
        self.assertIn('不保证有损编码帧逐像素不变', guide)
        self.assertIn('构图对齐不等于共同三维空间', guide)

    def test_material_story_method_navigation(self):
        for term in ('片瓣改读', '同材显形', '漫画回落', '包装保护', '异媒介共处'):
            matches = dk.find(dk.catalog(), term)
            self.assertEqual([e['id'] for e in matches], ['reference-to-composition'])
            self.assertEqual(matches[0]['type'], 'decision-guide')
        for shelf in ('expression.md', 'motion.md'):
            text = (dk.ROOT / 'library' / shelf).read_text()
            rows = [x for x in text.splitlines() if '#材质与讲述让身份线索先于解释' in x]
            self.assertEqual(len(rows), 1)
            self.assertTrue(all(x in rows[0] for x in ('未常速', '未听审', '审美验收', '不是新积木')))
        guide = (dk.ROOT / 'reference-to-composition.md').read_text()
        self.assertIn('## 材质与讲述：让身份线索先于解释', guide)
        self.assertIn('固定ID列表不证明每片运行时追踪', guide)
        self.assertIn('明确为生成资产', guide)
        self.assertIn('最终文字/主体零相交不能证明开场标题/页脚不相撞', guide)

    def test_state_story_method_navigation(self):
        for term in ('来源与序列', '隔墙通行', '概念界面', '跨景手势', '跳过与等待'):
            matches = dk.find(dk.catalog(), term)
            self.assertEqual([e['id'] for e in matches], ['reference-to-composition'])
            self.assertEqual(matches[0]['type'], 'decision-guide')
        for shelf in ('expression.md', 'motion.md'):
            text = (dk.ROOT / 'library' / shelf).read_text()
            rows = [x for x in text.splitlines() if '#状态与叙事让变化兑现具体关系' in x]
            self.assertEqual(len(rows), 1)
            self.assertTrue(all(x in rows[0] for x in ('未常速', '未听审', '非实时', '非真实产品', '不是新积木')))
        guide = (dk.ROOT / 'reference-to-composition.md').read_text()
        self.assertIn('## 状态与叙事：让变化兑现具体关系', guide)
        self.assertIn('没有可见共同交付物', guide)
        self.assertIn('不是实时条件执行', guide)

    def test_carrier_field_method_navigation(self):
        for term in ('行色记忆', '载体读窗', '环境呼应', '源线可见', '成员相位'):
            matches = dk.find(dk.catalog(), term)
            self.assertEqual([e['id'] for e in matches], ['reference-to-composition'])
            self.assertEqual(matches[0]['type'], 'decision-guide')
        for shelf in ('expression.md', 'motion.md'):
            text = (dk.ROOT / 'library' / shelf).read_text()
            rows = [x for x in text.splitlines() if '#载体与场让共同依据决定可见变化' in x]
            self.assertEqual(len(rows), 1)
            self.assertTrue(all(x in rows[0] for x in ('静音', '未常速', '未听审', '不是新积木')))
        guide = (dk.ROOT / 'reference-to-composition.md').read_text()
        self.assertIn('旧来源动态补证，不计新来源', guide)
        self.assertIn('不是同一几何输入', guide)
        self.assertIn('二维均匀源线长度的可见比例', guide)

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
