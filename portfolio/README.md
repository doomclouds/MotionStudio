# MotionStudio · 单一作品合同

本文件是作品保留与准入的唯一规范性 Markdown 入口。作品清单见自动生成的 [统一索引](INDEX.md)；每件作品唯一机器真源为 `works/<id>/work.json`，合同为 `motionstudio.work/1`。不读取旧格式，不保留旧 CLI、wrapper、双写或兼容分支。

## 同一结构，不抹平作品差异

- `kind=static|video`：静态只存画幅/入口，封面frame=null，不编造帧率、音频或听审；视频保留各自有理帧率、帧数、音频合同与听审/同步维度。
- `resources[].kind`说明资源类型；与`fetch|generate|provide`获取方式独立。无法从来源合同确认类型时明确unclassified，不猜MIME。原许可、来源链接、hash、说明逐值保留。
- `lifecycle=retained`保留原作品版本、公开范围和接受声明；静态检查不等于本次重新渲染、观看、听审或授权。
- `lifecycle=candidate`是新版本待复验，当前verification=NOT_RUN、publication=not-published，不具有当前acceptance；原接受/权利/封面绑定在history。历史预览不能冒充新版本输出。

Tessel和Favorite52的帧率、音频、PARTIAL、NOT_LISTENED及NUMERIC_ONLY保持各自原值。三件共享模块指导路径变化的作品（pixel-hiking-study、film-festival-study、hk-street-signs-study）以新依赖身份作为候选，旧接受不转授。候选可能通过源码安全检查，但不能据此标为准入通过。

## 日常只用一个入口

从仓库根：

```sh
python3 portfolio/work.py inspect
python3 portfolio/work.py admit-check
python3 portfolio/work.py query --kind video
python3 portfolio/work.py query --text 品牌
python3 portfolio/work.py query --family design.print-poster.v1
python3 portfolio/work.py index --write
python3 portfolio/work.py index --check
```

`inspect`检查源码、文件身份、JPEG/路径/URL安全、runtime锁、资源许可范围和实际代码依赖。`admit-check`只判断记录是否满足已保留作品门槛，待复验候选返回非通过；它不执行真实渲染、感知评审或法律批准。query是字面检索，不评分；族来源与实际调用分开。索引覆盖静态与视频，候选明确分列。

运行只依赖Python标准库。schema检查仅实现本合同使用的严格子集，未知关键词/类型/pattern拒绝；不是完整通用JSON Schema引擎。制作流程提供真实参数、已有锁、源码清单及事实；不要为填模板虚构版本、资源、许可、审核人或通过状态。没有自动制作/自动审美接受功能。

## 外部引用是参数，不是可达性保证

外部资源和报告引用保留原值/含义。不下载、不探测可达，不要求全部外部材料存在作为本次结构整理或最终发布门；source_url不是自动下载URL，也不授予许可。需要真实制作时，素材使用仍必须合法并按其原合同提供。

公开work/索引的`reviewArtifacts=NOT_INCLUDED`只表示不携入私人审查材料，不表示材料缺失或已经审查。私人记录身份、报告指纹和存储信息不进入新公开投影；原始完整记录保留在固定Git历史。不得增加强制ledger、外部可用性字段或新用户私密档案。

## 源码保留与验证边界

源码、运行/资源锁、署名和各级LICENSE/NOTICE/RIGHTS保持各自约束。仅既有允许的封面可入库；不新增字体、原图、音轨、成片、私有报告或额外媒体许可。代码和清单通过不等于法律许可。

作品完成、明确保留、技术恢复、视觉、实际听审、同步与权利范围分开。PARTIAL、NOT_LISTENED、NUMERIC_ONLY、NOT_RUN不得互相替代或自动升为PASSED。最终验证按用户授权另行执行，不能把这里的静态检查说成最终验收。

## 一次性切换记录

本次起点及作品新身份见 [MIGRATION.json](MIGRATION.json)。旧元数据及私人原字段留Git历史；未重写历史。当前活动树不保留旧解析器或一次性迁移脚本。新work是唯一运行真源；history是事实绑定，不是旧格式运行fallback。原始外置制作目录/素材不因整理而删除或改动。
