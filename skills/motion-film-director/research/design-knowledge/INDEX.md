# UI 设计知识 · 总索引

这是**公开、去素材化的方法导航**，不是素材库、完整私有案例库或自动风格推荐器。只收已获发布授权的方法卡与明确标注的原创合成运行例；原图、品牌资产、字体、生产源码、评审报告与个案反馈保持仓库外。前两例的方法已存在于[固定画幅研究合同](../../references/static-ui-reference-study.md)，本目录分类导航，不复制正文，也不新增运动积木。

## 先决定内容怎样表达

先读[视觉设计规范与实践指导](DESIGN-GUIDE.md)：从内容、受众和品牌意图出发，决定创意隐喻、构图、配色、字体与素材，再分析参考、复刻和可视化验证。该指导为可迭代的 0.1 工作草稿，不将组件数量或截图相似度当作审美提升。引用成品仅用于方法分析，不代表新增已验收案例。

先读[内容→UI 方案决策指南](CONTENT-DECISIONS.md)：内容事实 → 受众/目的 → 信息任务 → 结构/风格/密度 → Motion 绑定 → 验证。未知或冲突不武断推荐；现有案例只有静态经验，不冒称视频实测。

## 从任务进入

| 任务/风格语法（不是品牌皮肤） | 分类 | 已收方法卡 | 视频迁移 |
|---|---|---|---|
| 密集数据、克制容器、状态层级 | [数据界面](categories/data-interfaces/INDEX.md) | [固定画幅 dashboard](cases/ui-001-dashboard.md) | 数据先准确，再分配焦点与读时 |
| 功能色、不等高模块、仪器控件 | [仪器界面](categories/instrument-interfaces/INDEX.md) | [模块化仪器](cases/ui-002-instrument.md) | 保留角色色与控制关系，不冒称 DSP |
| 内容、主物、品牌态度、印刷语法 | [品牌招贴](categories/brand-posters/INDEX.md) | [印刷招贴＋运行例](cases/ui-003-print-poster.md) | 静态关系先锁定，视频另验 |
| 来源/状态、token、几何、文字、对比复核 | [方法入口](../../references/static-ui-reference-study.md) | 前两卡共用；差异写适用/反例 | [MotionStudio 制作路径](MOTIONSTUDIO.md) |

查找命令从 Skill 根运行：

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
- [外置知识工作流](../video-knowledge/WORKFLOW.md)继续保存可绑定证据的 Case/Technique；其默认公开库仍为空。这里的摘要不能喂给 `video_knowledge.py` 当视频实证或通过记录。
