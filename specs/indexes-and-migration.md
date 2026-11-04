# 索引、迁移与落地

## 索引真源（CURRENT）

- motion-elements / design-elements 的 catalog 与各自契约：按所属工具维护，稳定 ID 不因标题变化重造。
- `portfolio/works/*/work.json`：唯一作品机器真源；静态/视频以 kind 区分，当前候选与历史接受分开。设计说明唯一入口由 `work.json` 的 `design.decisionCard` 指定，已整理场景使用 `design.md`；尚未迁移的三件候选仍保留合同指定的 `DESIGN-RETENTION.md`，不得按旧文件名批量删除；`portfolio/index.json` / `portfolio/INDEX.md` 由 `portfolio/work.py index --write` 同源生成，不手工造第二套目录。
- `knowledge/design/index.json` 与分类/方法卡：按该目录 INDEX.md 同步；它只覆盖所收方法卡，不代表全部作品。
- 外置 video-knowledge 库：按自己的 schema/工作流维护；公开默认空库保持为空。
- specs/README.md 只索引治理规则，不缓存所有作品、方法或机制数量。数量与实现状态查询当时实际 catalog/工具，避免永久写死。

## 已落地范围与历史阶段

最初的文档阶段提案只新增 AGENTS 与 specs，不搬目录或修改机器契约；这是历史阶段边界，不是当前整合树的全部变更范围。其后另有 UI 薄流程及入口、Skill 导航与方法、交接结构检查、仓库 launcher 和依赖说明等独立增量。各自以实际源码、契约与提交差异为准，不将后续功能混算成“七个治理文档已实现全部目标”。

后续经明确授权，公共设计知识及其 CLI 已直接迁移至 `knowledge/design/` 与 `scripts/design_knowledge.py`；Motion 指定机制实现与支持模块也已归入 canonical 路径，本次替代的旧入口不保留兼容层。活动消费者及打包路径同步更新；保留作品冻结源码/锁、许可及固定历史 commit 来源链接。目录已迁移不等于治理逐条获批、完整流程验证或所有门已自动执行。DRAFT 与待实现边界见 [规范索引](README.md) 和 [双导演协作](production-and-knowledge.md)。

## 后续变更与迁移步骤（PROPOSED）

1. 记录实际 HEAD、任务范围、允许修改路径和已有变更；不覆盖他人工作，不再假设 AGENTS/specs 是待新建路径。
2. 先判断修正文档/导航能否解决问题。目录迁移、接口/schema 变化、依赖新增与公开范围变化分别论证，不能由整理任务自动推导。
3. 核冲突和重复真源，列实际消费者与影响面；只实施当前授权范围，未解决项明确保留。
4. 对纳入文件做相对链接、敏感内容与适用源码策略检查；实际差异应与声明范围一致，而非一律声称“仅文本新增”。保持许可、权利、源码范围和 allowlist 的独立审查边界，不因整理顺手放宽。
5. 记录治理采纳状态、规范版本与兼容策略；发布、提交、推送仍按具体授权，不由文档落地推导。
6. 真需迁移时，提交旧→新路径/稳定 ID 映射、消费者清单、兼容/失效策略、验证与回滚；先证明目标副本可用，再经授权处理源。历史清理与普通迁移分开授权。

## 验证层次

**文档/导航变更的局部检查：** 检查全部内部链接目标在实际工作树中存在；新路径不触发现有 forbidden；AGENTS 明确引用 specs；无私有数据/媒体；没有假称自动化已部署。

**达到明确的最终验证阶段时，按实际影响面在完整隔离 checkout 执行：**

```sh
python3 scripts/check-source-tree.py --help
python3 scripts/test-source-tree.py
python3 portfolio/work.py index --check
python3 portfolio/work.py inspect
python3 -m unittest discover -s portfolio -p 'test_work*.py'
python3 scripts/test-skill-package.py
```

上述为验证命令入口，不是本页保存的通过记录；结果须绑定被测 commit 与环境，历史通过不能代替当前版本结果。普通整理修改先做必要局部检查，不自动触发最终验收。先读各脚本参数和依赖，再按当前源码工具执行实际源码审计（其检查 Git 索引/历史；只验证工作树不足以代表最终提交）。打包验收需要可用 Git 索引与仓库外全新输出；完整依赖/运行环境缺失时标为 BLOCKED/NOT_RUN，而非通过。仅新增文档通常不需渲染整片，但不能宣称核心回归或跨平台通过。

**若后续涉及 Skill 包：** 在干净的审定来源构建；检查 manifest/许可证；解包到不含完整仓库的环境，验证入口、按需文档、空知识库与链接。根 specs 未进包是当前预期，不是遗漏文件；公共 `knowledge/design/` 则按当前布局规则从唯一真源生成包内快照，包中不恢复旧知识路径。

回滚应按本次明确变更范围撤回对应提交或恢复受影响文件；如果已有其他人在其上修改，先协调，禁止强制覆盖或重写历史。

## 单一作品合同直接切换

作品结构在 `bd3750a` 基线上直接改为 work/1；当前 CLI 不再解析旧作品 entry/retention，不提供 wrapper、双写或按旧 schema 回退。旧字节及原私人引用保留 Git 历史，不重写历史。外部链接/资源引用仅保留原值和含义，不要求可达或实际材料存在作为结构迁移/最终发布门；公开索引不复制私人标识、报告 hash 或存储信息。

指导路径调整导致依赖模块身份变化的三个新版本保持 candidate/NOT_RUN，旧接受记录仅作历史事实。`inspect` 是静态检查，不等于复渲或新的接受；`admit-check` 会拒绝尚待复验的候选，不能通过更改状态绕过。最终实际复渲、视觉、听审、同步及用户接受仍须按当前任务授权逐项报告。
