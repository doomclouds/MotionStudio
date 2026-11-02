# 目录职责

状态与版本见[工程规范索引](README.md)。下表描述当前检出树的目录职责；最初 v0.1 仅作导航、不迁移文件是历史阶段，不能代表后续已授权实施的共享知识、Motion/Design 目录及作品合同迁移。当前路径以实际源码与所属模块合同为准，治理建议仍按 PROPOSED/DRAFT 边界处理；目录落地不等于最终验收或逐条批准。

| 路径 | 单一职责与真源 | 不承载 |
|---|---|---|
| `specs/` | 跨模块工程治理、边界与导航 | 运行代码、私有证据、逐作品日志 |
| `engine/motion-render-core/` | 原生渲染唯一维护源码、Scene API、技术夹具/测试 | 完整作品、生成 runtime 快照 |
| `engine/motion-timeline-core/` / `motion-audio-core/` | 时间线纯编辑与本地音频执行的各自契约 | 未实现 NLE/DAW 能力承诺 |
| `engine/motion-elements/` | 已登记动效机制、组合配方、catalog、示例/测试；[当前合同与用法](../engine/motion-elements/docs/guides/core-api-and-time.md)归入 `docs/guides/`，[批次历史](../engine/motion-elements/docs/history/production-batches.md)归入 `docs/history/`，README 只作导航 | 用参数变体虚增机制数量 |
| `engine/design-elements/` | 静态设计族、受限配方/候选源码、契约与示例 | 将候选/示例直接认作正式族或作品 |
| `knowledge/design/` | 共享公共设计知识、静态参考合同、方法卡与自身索引 | Motion 专项时序规则、实际作品/私有证据、第二份旧目录正文 |
| `skills/motion-film-director/` | 导演决策与按需参考、调用入口、合法可分发方法 | 默认私人项目库、媒体及历史反馈 |
| `skills/ui-design-director/` | UI 设计薄流程、共享真源导航和交接结构检查 | 第二份设计知识、引擎/字体、自动调度或已验网页能力 |
| `portfolio/works/` | 按portfolio规范保留的作品源码及明确candidate/NOT_RUN的新版本投影 | 全部私有制作记录、失败样片、额外媒体 |
| `portfolio/` | 单一work/1准入/静态检查及静态、视频统一索引 | 第二套证据台账 |
| `tools/reference-benchmark/` | 视听特征、对照与证据结构工具；`schemas/` 契约、`examples/` 合成示例、`research/` 研究来源 | 自动艺术评分/实际听审证明、新研究媒体或私人记录入库权限 |
| `scripts/` | 源码安全、打包、审查编排等仓库工具 | 私有产物或依赖安装缓存 |
| `docs/` | 面向读者的说明、已授权文档资产、许可原文 | 任意参考截图/报告仓库 |
| 仓库外授权工作根 | 项目源码工作副本、素材、输出、评审、私有知识与备份 | 未获授权的上传/共享 |

添加顶层目录前说明现有目录为何不能容纳，并审查 source policy/打包/链接影响；不要先造空目录。根 README 做概览与入口，不累积每批制作全过程。来源快照、既有专项源码、第三方许可证保留其语义与归属，不能为了“整洁”移动或改名。

`skills/.../runtime/` 是生成包快照而非新的维护源。仓库外生产根可包含 output、verification 等，但具体布局按当前制作契约，不向公开库新增 projects/ 或 production/。`.gitignore` 不是权限控制；最终仍审查 Git 索引与源码门禁。

本次已授权直接迁移：共享设计知识移至 `knowledge/design/`，检索入口移至 `scripts/design_knowledge.py`；Motion 已登记机制归入 canonical foundations/support/internal，删除本次替代的 candidate barrels 与嵌套重复时间代码，不保留新兼容别名。具体活动路径以 [注册导航](../engine/motion-elements/docs/registered-foundations.md) 为准；其他既有路径不因本次整理自动迁移。作品冻结源码与锁文件不变，固定历史 commit 链接仍用于来源追溯。
