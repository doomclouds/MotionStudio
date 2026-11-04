# 设计知识 · 方法入口

公开、去素材化的方法真源，不是素材库、完整作品目录或验收记录。UI、Motion 与声音导演按当前问题选读；来源、许可和未验范围跟随各正文，见[分发边界](NOTICE.md)。

## 已经知道问题，直接读正文

| 需要决定什么 | 唯一正文 |
|---|---|
| 内容、受众和信息任务如何决定结构 | [内容决策](CONTENT-DECISIONS.md) |
| 构图、字体、配色、品牌与素材如何协作 | [设计指南](DESIGN-GUIDE.md) |
| 怎样找参考、比较反例、组合并验证 | [参考到组合](reference-to-composition.md)：稳定流程，以及按问题拆分的有限研究专题 |
| 静态参考如何绑定状态、尺寸和对照 | [固定画幅研究合同](static-ui-reference-study.md) |
| 静态关系如何交给影片制作 | [Motion 制作导航](motion-production.md)：只路由，不复制专项合同 |

不知道问题属于哪个领域时，去[创作图书馆](library/INDEX.md)选架；已经命中正文就继续读其来源、适用和反例，不必再返回图书馆。

## 方法卡：不是作品全集

| 问题 | 分类 | 方法卡 |
|---|---|---|
| 数据密度、容器与状态层级 | [数据界面](categories/data-interfaces/INDEX.md) | [固定画幅 dashboard](cases/ui-001-dashboard.md) |
| 功能色、模块与仪器控件 | [仪器界面](categories/instrument-interfaces/INDEX.md) | [模块化仪器](cases/ui-002-instrument.md) |
| 主物、品牌态度与印刷语法 | [品牌招贴](categories/brand-posters/INDEX.md) | [印刷招贴与运行例](cases/ui-003-print-poster.md) |

找代码直接读[设计积木](../../engine/design-elements/Index.md)；找完整上下文读[作品索引](../../portfolio/INDEX.md)。唯一作品机器真源为各版本 `work.json`；以 kind 区分静态/视频，以 lifecycle 区分已保留版本与候选，设计说明唯一入口由 `design.decisionCard` 指向各自 `design.md`，不保留平行设计卡。来源与真实调用、当前候选与历史接受分别记录；三件候选的待复验状态不因文档整理改变，公开审查材料 NOT_INCLUDED 不提升接受状态。portable 不含作品集或 portfolio/work.py，缺目录不是零作品；外部引用只作来源数据，不保证可达或转授素材权利。

## 可选维护工具

`index.json` 是现有方法卡与指南的字面元数据，不登记全库资产、不作语义检索或自动推荐。专题仍属于原指南，不新增第二份专题机器目录。无需运行命令即可沿上面的链接阅读。

```sh
python3 scripts/design_knowledge.py list
python3 scripts/design_knowledge.py find --text 功能色
python3 scripts/design_knowledge.py validate
```

仓库与 portable 从各自根运行。条件取交集，零匹配如实返回；该工具不搜索私有报告，也不代表检索了所有作品。

## 维护与增长

- 方法卡用稳定 ID、一个主分类及 tags；同例更新版本，不按作品数量复制卡片。先有真实问题和适用/反例，再建分类。
- [新增模板](templates/CASE.md) → 私有证据复核 → 分别核作品接受与方法公开授权 → 去素材化审查 → 同步卡片、分类、本页与 index.json → 验证。未确认内容留私有工作区。
- 通用流程只保留稳定做法；有限观察进入相应研究专题，保留来源、反例、版本与未验范围，不把研究批次堆回流程页。既有专题链接直接指新正文，不留旧锚点兼容。
- 外置 Case/Technique 继续按[私有知识工作流](../../skills/motion-film-director/research/video-knowledge/WORKFLOW.md)管理；默认公开库为空，方法摘要不是视频证据。
- 撤回内容时同步活动链接；删除当前文件不消除 Git 历史。迁移和打包边界见[组织说明](ORGANIZATION.md)。
