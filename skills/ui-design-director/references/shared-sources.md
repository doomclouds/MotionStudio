# 共享来源与本地入口

通用设计知识唯一维护于 `knowledge/design/`；不保留旧目录、包装或兼容索引，Motion 专项仍由 Motion 导演维护。下表路径相对 **MotionStudio 仓库根**，不是相对本 Skill。

|用途|唯一现有来源|
|---|---|
|按需求读总索引→分类→具体文件|knowledge/design/library/INDEX.md|
|方法卡总索引|knowledge/design/INDEX.md|
|通用视觉设计指导|knowledge/design/DESIGN-GUIDE.md|
|内容与信息结构取舍|knowledge/design/CONTENT-DECISIONS.md|
|复刻来源、状态和证据合同|knowledge/design/static-ui-reference-study.md|
|Motion 迁移导航，仅委托时按需读|skills/motion-film-director/references/design-to-motion.md|
|可调用静态资产与准确 API|engine/design-elements/README.md；engine/design-elements/catalog.json|
|完整作品与真实调用|portfolio/INDEX.md；portfolio/work.py|

仓库内使用：明确仓库根后读取以上文件。从仓库根运行 `python3 skills/ui-design-director/scripts/check_sources.py --repo-root .`（其他 cwd 使用脚本和仓库的实际绝对路径） 只检测文件可读，不评估设计、版本兼容或完整依赖。设计资产代码源仍在 `engine/design-elements/`。

独立拷贝本 Skill：上面资料、引擎、作品、字体**不随本草案提供**。应连接明确版本的 MotionStudio 完整仓库，再使用[本地设计索引](../../../knowledge/design/INDEX.md)、[积木入口](../../../engine/design-elements/README.md)、[作品索引](../../../portfolio/INDEX.md)。这些是完整仓库的本地入口，不是独立 Skill 自带文件；不使用可变 dev 远端作运行依赖。没有完整仓库时不声称已经读取作品或完全独立可运行。外部参考链接仅作为数据保留，不探测可达性或据此新增发布门。

未来 UI portable 构建须从唯一来源生成快照并锁 commit/hash，适配其中相对链接及 runtime 路径；该构建功能本草案未实现。现有 Motion portable 的 runtime/design-elements 也不能据此假定在当前 UI Skill 中存在。

注意通用规则与历史委托边界：共享设计指南为 0.2 整理草稿；有关某轮案例数量或是否进入视频练习的历史安排不能机械推广为每个新任务门槛，新的具体任务授权优先。静态资料不能证明动效、浏览器、响应式或无障碍认证。

仓库公共方法检索：`python3 scripts/design_knowledge.py list` / `find --text <关键词>` / `validate`。只使用该共享 CLI；仅检索方法元数据，不检索完整作品或私有证据。

完整仓库作品查询使用 `python3 portfolio/work.py query --text <关键词>`，可加 `--kind static`、`--kind video` 或 `--family <族ID>`。当前版本与历史接受分开，candidate/NOT_RUN 不代表已经复验；NOT_INCLUDED 只表示公开不含审查材料，不表示材料缺失或已通过。
