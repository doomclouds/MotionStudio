# UI 设计知识 · 总索引

这是**公开、去素材化的方法导航**，不是素材库、完整私有案例库或自动风格推荐器。只收已获发布授权的方法卡与明确标注的原创合成运行例；本目录不承载原图、品牌资产、字体二进制或私有评审材料。作品及待复验候选的源码导航见[作品集](../../portfolio/README.md)，各版本收录与接受状态以 work.json 为准；公共设计代码见[UI 积木索引](../../engine/design-elements/Index.md)；外置资源与私有评审证据仍按各自权限保留，不能因公开源码推定素材或评审报告可公开。前两例的方法已存在于[固定画幅研究合同](static-ui-reference-study.md)，本目录分类导航，不复制正文，也不新增运动积木。

## 按创作需求进入

先读[创作参考图书馆总索引](library/INDEX.md)，再选领域/需求书架，最后读原始契约、例子与反例，由模型分析并选择。下文保留公共方法自身的分类导航；图书馆不替代这些真源，不要求新增或运行查询工具。

## 先决定内容怎样表达

先读[视觉设计规范与实践指导](DESIGN-GUIDE.md)：从内容、受众和品牌意图出发，决定创意隐喻、构图、配色、字体与素材，再分析参考、复刻和可视化验证。该指导为可迭代的 0.2 整理草稿，不将组件数量或截图相似度当作审美提升。引用成品仅用于方法分析，不代表新增已验收案例。

先读[内容→UI 方案决策指南](CONTENT-DECISIONS.md)：内容事实 → 受众/目的 → 信息任务 → 结构/风格/密度 → Motion 绑定 → 验证。未知或冲突不武断推荐；现有案例只有静态经验，不冒称视频实测。

原创方向先执行[参考发现、蒸馏与有意图组合](reference-to-composition.md)：两导演共享流程，覆盖跨例实看、反例、跨目录检索、组合决策与真实输出对照；小修按影响缩减，不新增案例或验收声明。

## 从任务进入

| 任务/风格语法（不是品牌皮肤） | 分类 | 已收方法卡 | 视频迁移 |
|---|---|---|---|
| 密集数据、克制容器、状态层级 | [数据界面](categories/data-interfaces/INDEX.md) | [固定画幅 dashboard](cases/ui-001-dashboard.md) | 数据先准确，再分配焦点与读时 |
| 功能色、不等高模块、仪器控件 | [仪器界面](categories/instrument-interfaces/INDEX.md) | [模块化仪器](cases/ui-002-instrument.md) | 保留角色色与控制关系，不冒称 DSP |
| 内容、主物、品牌态度、印刷语法 | [品牌招贴](categories/brand-posters/INDEX.md) | [印刷招贴＋运行例](cases/ui-003-print-poster.md) | 静态关系先锁定，视频另验 |
| 来源/状态、token、几何、文字、对比复核 | [方法入口](static-ui-reference-study.md) | 前两卡共用；差异写适用/反例 | [MotionStudio 制作路径](motion-production.md) |

仓库命令从仓库根运行；portable 包从包根运行相同命令。共享知识在两种环境均位于 `knowledge/design/`：

```sh
python3 scripts/design_knowledge.py list
python3 scripts/design_knowledge.py find --text 功能色
python3 scripts/design_knowledge.py find --text dashboard --category data-interfaces
python3 scripts/design_knowledge.py validate
```

检索是 `index.json` 元数据的字面匹配，不搜索私有报告，不排名、评分或推定适用。多个条件取交集；零匹配就是零匹配。分类不替代反例阅读。

## 如何长期增长

- 一例一个稳定 `ui-NNN-*` ID、一个主分类、多个 tags；同例修订只更新版本，不重复收录。分类按问题而非品牌命名，有案例再建分类，避免空目录膨胀。
- 卡片只写来源、适用、反例、可迁移规则指针、已验/未验边界；公共参考 URL 可署名，但署名不授予素材许可。
- [新增模板](templates/CASE.md) → 私有证据复核 → **作品接受与方法公开授权分别核实** → 去素材化审查 → 卡片、分类 INDEX、总 INDEX 与 `index.json` 一起更新 → validate/测试/portable 检查 → 最小源码提交。
- 未确认案例留私有工作区，不预填公开目录。撤回时移除活动索引/分类链接，并记录非敏感方法修订；需要消除历史泄露须另行处理 Git 历史，删除现行文件不等于删除历史。
- [外置知识工作流](../../skills/motion-film-director/research/video-knowledge/WORKFLOW.md)继续保存可绑定证据的 Case/Technique；其默认公开库仍为空。这里的摘要不能喂给 `video_knowledge.py` 当视频实证或通过记录。

## 已保留作品与实际代码调用

静态设计与视频作品的统一入口是[作品设计索引](../../portfolio/INDEX.md)，`work.json` 是唯一机器真源，以 kind 区分静态/视频，以 lifecycle 区分已保留版本与待复验候选；设计说明唯一入口由 `work.json` 的 `design.decisionCard` 指定，记录内容/品牌/配色/构图决策；已整理场景归并至 `design.md`，尚未迁移的三件候选仍按各自合同进入 `DESIGN-RETENTION.md`，不保留同一作品的平行设计卡。外部引用仅作为原始数据保留，不检查或保证可达；公开审查材料 NOT_INCLUDED，不提升历史或候选接受状态。公共族的来源作品与实际调用分列，不把方法适配说成已重构原作品。

这里现有三张独立方法卡不等于作品总量；`scripts/design_knowledge.py`只检索本目录index.json，不自动检索作品。查看全部作品使用上述索引，校验运行 `python3 portfolio/work.py index --check`。将来新增方法卡仍需独立归纳与审阅，不按作品数量机械复制。

上述链接指向当前完整仓库的本地作品目录，不依赖可变 dev 远端。作品集及 portfolio/work.py 不随 Skill 打包；打包投影将这些仓库专用链接显示为“仅完整仓库”，不产生包外断链。维护命令仅在完整仓库运行，Skill 环境不能把缺少作品目录当作零作品。

完整仓库提供作品级只读检索，与本目录三张方法卡的检索分开：

```sh
python3 portfolio/work.py query --text 品牌
python3 portfolio/work.py query --text 像素 --family design.color-sections.v1
```

这是标题/统一卡/原分析的字面检索；族过滤只匹配真实调用，条件取交集，零结果如实返回，不排名或推定适用。命令不随 Skill 包提供；仅有 Skill 时须回到完整仓库查询，不假装包内已有作品索引或已检索全部作品。
