# 共享设计知识组织与当前消费者

共享设计知识迁移最初以 `c90e291` 的内容为依据；作品结构切换以 `bd3750a` 为基线，按用户最新要求直接迁移，不保留旧路径、兼容索引、CLI 包装或旧包知识布局。新增顶层 `knowledge/` 因为通用设计方法同时服务独立 UI 与 Motion，不能归属其中一个导演；不新增私有案例、作品、runtime 或证据存储。

## 唯一维护位置

- `knowledge/design/`：通用视觉/内容决策、三张方法卡、分类、模板、静态参考合同、索引与许可导航。
- `skills/motion-film-director/references/design-to-motion.md`：Motion 专项制作导航；`content-to-motion.md`：从内容指南分离的视频迁移假设表。共享 `motion-production.md` 仅作领域路由，不复制专项正文。
- `scripts/design_knowledge.py`：共享字面检索/索引校验；`scripts/test_design_knowledge.py`：对应测试。仓库和 portable 均从根执行，知识路径均为 `knowledge/design/`。
- `scripts/skill-layout.py`：仅把维护源码的仓库相对链接转换为原生包布局；不是旧路径映射或兼容生成器。包内共享知识保持中性目录，Motion 入口位于包根。固定历史远端来源链接不改写。

## 退出的旧入口与直接更新

| 旧入口/消费者 | 当前入口/处理 |
|---|---|
| `skills/motion-film-director/research/design-knowledge/` 通用正文与 index | 直接使用 `knowledge/design/`；旧目录和 JSON 已移除，不做跳转 |
| 旧目录 `MOTIONSTUDIO.md` | `skills/motion-film-director/references/design-to-motion.md` |
| Motion `references/static-ui-reference-study.md` | `knowledge/design/static-ui-reference-study.md` |
| Motion `scripts/design_knowledge.py` 与对应测试 | 根 `scripts/design_knowledge.py` / `scripts/test_design_knowledge.py`；旧脚本删除 |
| Motion SKILL/README/research INDEX、references 内链接与命令 | 当前本地引用改到新真源；包构建转换为包内新布局 |
| UI shared-sources.md / check_sources.py | 直接核中立真源及 Motion 专项；可读性不冒充完整依赖检查 |
| Motion NOTICE、baoyu MIT原文 | 原位保留；共享 NOTICE/静态合同显式引用，分发仍携带 |
| scripts/build-skill.py | 收集 tracked 中性知识、共享CLI/测试；required明确新入口；不再收旧知识目录 |
| scripts/test-skill-links.py | 仓库模式核仓库内新目标，portable模式仍禁止包外逃逸 |
| scripts/test-skill-package.py | 隔离索引收新源；逐字节核真源经原生布局转换，非Markdown代码不变 |
| portfolio/works/vinyl-study/README.md | 直接引用 `knowledge/design/cases/ui-003-print-poster.md`；作品源码未删 |
| engine/design-elements/families/print-poster/index.mjs guidance | 指向同目录README；方法卡只保存方法，导出名称及绘制API不变 |
| engine/design-elements README/catalog、生成 portfolio/index.json | 固定旧commit guidance是历史来源溯源，不改写；作品索引由 portfolio/work.py index 统一生成，不手改 |
| README、AGENTS、specs 的根导航/目录职责/阶段声明 | 由集成人统一更新中性真源与直接迁移状态；不能继续宣称有旧入口兼容 |

## 权利、阶段与回退边界

只迁移已有公共文本，未迁入媒体、字体、私有记录；许可说明见 NOTICE。独立复制知识目录不等于完成 UI portable 合法可运行分发。

本阶段直接统一作品为 work/1，并整理真源、当前消费者和分发配置，不实现宿主注册、自动代理调度、UI portable 或网页 runtime，不启动真实作品或最终验收。必要局部检查仅用于防止编辑断链；最终在完整集成后另做干净构建、离线解包、源码边界及真实流程验证。

退出旧路径是用户明确要求的接口迁移，不声称旧第三方调用继续可用。旧版本可从原Git提交取得；不删除历史、不重写历史、不删除作品。撤回整理应撤回本次提交并协调后续改动，不在新目录手写第二份旧正文。

## 单一作品入口

作品机器真源是 `portfolio/works/*/work.json`，静态与视频以 kind 区分，已保留版本与待复验候选以 lifecycle 区分；`portfolio/INDEX.md` 和 `portfolio/index.json` 是同源投影。新 CLI 为 `portfolio/work.py`，不读取旧作品 entry/retention，也不保兼容包装。三件仅指导路径改变而模块身份变化的作品以新版本 candidate/NOT_RUN 标示，历史接受仍绑定旧版本，不能升格为本轮通过。

外部引用作为参数保留原值和含义，不探测其可达性，不作为结构迁移或发布门。原私密引用留 Git 历史，公开投影继续 NOT_INCLUDED；不复制私人标识、报告指纹或存储信息。知识页使用当前仓库本地入口；portable 投影将未打包的 portfolio 链接转为“仅完整仓库”说明，不制造包外断链或引入可变 dev 跳转。
