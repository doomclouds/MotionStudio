# UI 设计积木索引

[配方源码角色分层](recipes/README.md)：`reviewed/` 按既有技术复核声明组织、`candidates/` 保留其他受限源码、`batches/` 仅保存批次导航。目录不授予成熟或审美状态，不保留旧路径兼容。

## 历史包声明与当前 Git 树

包内 README / manifest 可能保留作者冻结时的 `private`、`not pushed`、`NOT_PERFORMED` 或待集成声明。已明确标注为快照的文字按其作者阶段理解；其他声明仍按原件作用域读取，不能由目录存在自动判为过期。

文件存在于所查询的已提交 Git 树，只证明该版本已纳入该树；不证明远端已推送、公开发布、独立审查完成、正式族/配方晋级或用户审美验收。导航展示当前查询提交与原始声明，不覆写历史 manifest；私有素材/证据边界和各级许可继续适用。按需查询工具只读已提交树，未提交整理须另行核对。

计数单位为可调用的设计族，不是作品、函数或截图。

| 稳定 ID | 文字指导 | 代码 | 复用场景 |
|---|---|---|---|
| design.print-poster.v1 | [独立入口](families/print-poster/README.md) | [源码](families/print-poster/index.mjs) | 既有印刷海报，保持原 API |
| design.typographic-focus.v1 | [文字主视觉](docs/typographic-focus.md) | [代码](typographic-focus.mjs) | 主张、章节标题、嵌套活动信息 |
| design.color-sections.v1 | [色彩分区](docs/color-sections.md) | [代码](color-sections.mjs) | 主张与证据分区、互换阅读顺序 |
| design.material-surfaces.v1 | [材质表面](docs/material-surfaces.md) | [代码](material-surfaces.mjs) | 纸、实体、显式背景玻璃及内容槽 |
| design.semantic-data.v1 | [语义序列](docs/semantic-data.md) | [代码](semantic-data.mjs) | 类别、阶段、明确量程的面积符号 |
| design.parameter-controls.v1 | [参数刻度](families/parameter-controls/README.md) | [代码](families/parameter-controls/index.mjs) | 有数值范围的横/纵静态参数 |
| design.expressive-type.v1 | [层叠/切片](docs/expressive-type.md) | [代码](expressive-type.mjs) | 有边界的2D标题效果 |
| design.radial-scale.v1 | [圆弧读数](families/radial-scale/README.md) | [代码](families/radial-scale/index.mjs) | 旋钮/半圆量程，线性静态 |
| design.diagonal-field.v1 | [斜切色域](families/diagonal-field/README.md) | [代码](families/diagonal-field/index.mjs) | 带安全内容矩形的方向分区 |
| design.authored-paths.v1 | [叙事路径](families/authored-paths/README.md) | [代码](families/authored-paths/index.mjs) | 有声明的故事弧与序列示意 |

## 新增专项：技术复核，不等于用户审美验收

| 稳定 ID | 文字指导 | 代码 | 边界 |
|---|---|---|---|
| design.vertical-imprint.v1 | [纵列印记](docs/vertical-imprint.md) | [代码](vertical-imprint.mjs) | 右起字列/批注；非混排竖排引擎 |
| design.geometric-marks.v1 | [几何标识](docs/geometric-marks.md) | [代码](geometric-marks.mjs) | 共享网格图形家族；不自动设计品牌 |
| design.proportional-partition.v1 | [比例分区](docs/proportional-partition.md) | [代码](proportional-partition.mjs) | 声明明确的面积编码；非任意层级treemap |
| design.ratio-rings.v1 | [比率圆环](docs/ratio-rings.md) | [代码](ratio-rings.mjs) | 数值比率与弧长一致；非医学判断 |

公共族合计14（既有10+新增4）；新增族通过独立合成组合与技术/视觉复核，没有改写原B05作品，sourceSceneMigrated=false，userAestheticApproval=false。原作品真实调用仍以自动覆盖表为准。新组合入口[examples/b05-compositions.mjs](examples/b05-compositions.mjs)。

- [机器索引 catalog.json](catalog.json)：版本、状态、来源、样例与验证。
- [组合配方](examples/compositions.mjs)：固定 1440×900 二栏演示；标题/材料/数据/参数由 recipe 输入。
- [全部静态作品覆盖账单](CASE-COVERAGE.md)：来源启发与实际调用分列；由作品sidecar自动生成，不以适配关系冒充已重构。
- [使用/运行方法](README.md)：Native Canvas 环境、字体注入与测试。
- [证据生成入口](examples/render.mjs)：重渲染合成组合；私有视觉报告不随源码发布，不计为新增收藏作品。

## MotionStudio 使用顺序
先按内容目的选表达方式（主张→文字；对比→分区；数据→带数值/图例的语义图；设备参数→刻度），再选材料与品牌颜色；不能先挑好看的积木硬塞内容。先在固定尺寸静态画面验证阅读层级，用户通过后才能进入后续 motion 实验。当前资产没有时钟/运动参数，不能声称自动产出动画。

## 入库门槛
每族需有文字契约、稳定 ID、可调用代码、不同内容的例子、输入边界测试、实际渲染与独立视觉复核。合成测试通过不替代用户审美确认。原作品保留与通用资产状态分别管理。

二阶段组合入口：[specialist-compositions.mjs](examples/specialist-compositions.mjs)。上区使用安全矩形容纳效果标题与可读支持，下区使用路径与圆弧读数，所有数据由recipe输入。

## 已验证组合配方

以下是组合配方，不是新增通用族，不计入14族。原作品调用自己的局部helper，未迁移到新组合。

| 配方 | 内容目的 | 设计与运行入口 |
|---|---|---|
| recipe.ordered-focus.v1 | 24项读序与当前任务焦点 | [说明](recipes/reviewed/b06/docs/ordered-focus.md) · [运行](recipes/reviewed/b06/README.md) |
| recipe.editorial-evidence.v1 | 编辑式长文与同源面积证据 | [说明](recipes/reviewed/b06/docs/editorial-evidence.md) · [运行](recipes/reviewed/b06/README.md) |

每种配方以两份不同内容验证；字体和生成图/报告全部外置，实际依赖与边界见配方manifest及锁。

## B08 句法与份额配方

[两种1200×750受限配方](recipes/reviewed/b08/README.md)：显式句法宣言与完整外图例单环份额。新公共族0；五来源作品未迁移，新合成组合未获用户审美认可。两种内容变体、绘前边界/输入拒绝及源码出处均有独立审查。

## B09 强调词与单位图符配方

[两种1200×750受限配方](recipes/reviewed/b09/README.md)：有安全边界的旋转词块与同尺寸全/半/零单位图符。新公共族0；五来源作品未迁移，新合成组合未获用户审美认可。两种内容变体、绘前边界/输入拒绝及源码出处均有独立审查。

## B10 文本片段与数值格网

[显式彩色文本与等面积格网](recipes/reviewed/b10/README.md)是两种固定尺寸受限配方。0新增族，原scene未迁移，新组合未用户审美认可。量程/空值/单位和显式片段角色必须由内容提供，不执行或解析代码。

## OpenDesign 局部候选与去品牌配方

[Social / Lull / FlowAI受限适配候选](recipes/candidates/open-design-three/Index.md)：独立测试候选，来源作品未迁移；不计新增公共族或正式配方。

[Metric board去品牌配方](recipes/candidates/metric-board/README.md)：仅通用指标板与合成示例，不发布Merchant手机原画、品牌或商标；不计新增公共族。

## 待审：静态通道标题与软光团编辑配方

[static-effects-candidate](recipes/candidates/static-effects-candidate/README.md) 仅为隔离候选集成：Glitch / Liquid 两个局部配方，外置字体与输出，不新增公共族、正式配方或portfolio条目；当前登记与配方声明分别以[catalog](catalog.json)及[配方原始manifest与只读查询](recipes/README.md)为准。用户已对本组表达认可并要求沉淀提交；不等于适配器单项审美验收。技术测试不替代独审或真实复用；此链接是拟议增量，不表示已执行提交。

## OpenDesign 第二组 · 选择性沉淀

[两项受限候选与三案源码](recipes/candidates/open-design-static-three/README.md)：显式零基线线性图表、固定种子光场；Bold Signal仅保留案例配方。批次保留/提交已获授权；新组合未单独用户审美验收，0新增公共族/正式配方。字体全部外置且固定官方URL可获取；Native静态适配不等于动画。

## 第五组：材质场、文件格网与索引色像素层

[三项受限静态候选与双内容案例索引](recipes/batches/fifth-static-candidates/Index.md)链接设计指导、契约、可调用代码、样例与完整许可。只保留去品牌的57文本源码投影；不增加公共14族、正式配方或portfolio作品，不把私有完整研究画面或其审计记录作为公开资产。标量场与像素层无需字体，文件格网使用固定官方来源的外置OFL字体。

## 第六组：同源字节诊断与空间字符

[两项受限静态候选索引](recipes/batches/sixth-static-candidates/Index.md)连接原创量化场/直方图/采样注记，以及二维字符/标记/光标/同源摘要。44 个文本文件，不含原图、字体二进制或审查记录；0 新增公共族、正式配方和 portfolio 作品。外置精确字体条件分别为 Liberation provide-exact 与固定官方 IBM OFL 获取，不能混称全部公网恢复已验证。

## 第七组：离散时序与字形证据

[两项受限候选与组合索引](recipes/batches/seventh-static-candidates/Index.md)链接同源半 tick 数字/符号总线和固定实例的 outline/Unicode/hmtx/轴证据。62 个新重建文本（27＋35），不含参考图、字体/轮廓资源或私有记录；0 新增公共族、正式配方和 portfolio。精确外置字体条件不同，PULSE provide-exact 不冒称公网恢复。新组合的技术审查不等于用户逐项审美验收，静态不等于 motion。

## Eighth restricted static recipes

See [bounded drape and radial categories](recipes/batches/eighth-static-candidates/Index.md): opt-in source candidates only;0 new registered families.

## 第九组：毫秒字幕状态与作者指定字节编辑

[两项受限源码候选索引](recipes/batches/ninth-static-candidates/Index.md)链接同模型字幕列表/区间/透明当前字幕，以及给定编辑的base→target坐标/来源证据。64个原包文本（31＋33），0新增公共族、正式配方或portfolio。MIT/BSD-2与外置OFL分别适用；不带原图、字体、预览或私有审查。不是播放器/自动转录/自动diff，独立技术验证不等于用户逐项审美验收。

## 第十组：体积切片、采样窗/对话与共享游标

[三包四种受限方法](recipes/batches/tenth-static-candidates/Index.md)：21文本linked-volume（MIT）、23文本sampled-window/authored-dialogue（MIT）、18文本shared-trace（MPL-2.0＋MIT辅助）。62原包文本保持审定字节，0新增族/正式配方/portfolio；字体/依赖/产物外置，不含PHASE GPL私存、参考图或私有记录。静态与同源模型验证不等于应用/浏览器/音频/医学能力或用户逐项审美认可。

## 第十一组：精确账本与显式段/方形

[两包三种受限方法](recipes/batches/eleventh-static-candidates/Index.md)：flow-ledger 22 文本＋explicit-geometry 25 文本。前者把积分总量、完整分区与稳定排名绑定同一合成模型；后者保留自编二进制连续段和有序嵌套理想面积，不自动升级为字体/随机纹理/通用图表。MIT 与独立来源/字体通知原样保留；0 正式族/配方/portfolio，资源/产物外置，私图、字体二进制与 GPL 队列排除。

## 第十二组：同一平面的互补分界

[Complementary seam 受限候选](recipes/batches/twelfth-static-candidates/Index.md)：25 文本、1 方法、0 新正式族/配方/portfolio。单调分界决定同一 RGBA 平面的互补像素归属；两份可独立由宿主放置。既有 sampled-window 仅复用，不另计；不是通用多边形切割/纸张模拟。MIT 与外置 Native/OFL 通知保留；私图、字体和 GPL 统计队列排除。

## 第十三组：随主墨迹变化的注记区

[Ink-bay 受限候选](recipes/batches/thirteenth-static-candidates/Index.md)：32 文本、1 个受限组合关系、0 新正式族/配方/portfolio。主字墨迹加显式间隔派生同一行相反侧注记区，次文本通过实际 fit 才可绘制；既有墨迹对齐不重复计数。MIT 实现和独立外置 OFL/Native 通知保留；无私图、字体二进制或 GPL 队列，不声称自动换行、动态布局或用户逐项审美验收。

## 补充源码入口（保持原声明，不自动晋级）

以下既有源码包补齐发现入口，不改变族、正式配方、作品计数或包内历史状态。生命周期与权利仍以各包原始 manifest、契约和通知分别读取。

- [确定性粒子场](recipes/candidates/deterministic-particle-field/README.md)
- [合成演示账本](recipes/candidates/invoice-demo-ledger/README.md)
- [OpenDesign 第二组候选源码](recipes/candidates/od-second-group-candidate/README.md)
- [静态评审片段](recipes/candidates/review-tiles-candidate/README.md)
- [XHS08 语义面积源码](recipes/candidates/xhs08/README.md)（已被 portable 构建/测试引用；不等于完成正式配方晋级）

从仓库根目录运行，按需查询已提交树：`python3 scripts/design-navigation.py --repo . --format markdown`；`--details` 展开逐项来源声明和权利入口。该工具不读取未提交更改、不登记资产，也不生成需手工维护的第二份清单。

## 决策建议与验证边界 · 待审候选

[Decision support](recipes/candidates/decision-support/README.md)：将作者给定的建议、竞争解释、下一步测量和可逆试验放在同一受限静态面板；不自动推断因果或判断研究可信度。复刻首屏中实际调用，并有两份合成内容与单测；0 新公共族、正式配方或已接受作品。Apache-2.0，字体与图像证据外置，非网页/响应式验收。

## Metric strip · fixed snapshot candidate

[Count / explicit part-whole strip](recipes/candidates/metric-strip/README.md) returns a bounded horizontal layout and display fields without drawing or live-data claims. Caller-authored delta meaning is not inferred from its sign; font fit remains the consumer's responsibility. Independent Apache-2.0 model inspired by OpenDesign, with no original screenshots, fonts or connector. Not a formal family or accepted work.

## 编辑主次与显式依赖 · 受限候选

- [编辑式信息组](recipes/candidates/editorial-feature-group/README.md)：六条短消息的固定角色与主次关系，不编码数量比例；作者分行、实际字体规划，不自动换行或响应式。
- [作者指定依赖图](recipes/candidates/authored-dependency-map/README.md)：稳定 ID、作者坐标与静态无环依赖，不自动布局或避障，也不证明流程运行。

两项均为源码候选，不增加公共族、正式配方或已接受作品；实际使用须读取原契约、许可并检查输出。

## Continuous Latin inline runs · unregistered candidate

[Inline run wrapping](recipes/candidates/inline-run-wrap-candidate/README.md) fits continuous styled ASCII/NBSP text with real glyph bounds, shared baselines and optional strike fragments. Ordinary spaces permit wrapping; style boundaries and NBSP do not. Bounded static candidate only, not multilingual layout, a font resolver, a formal family or an accepted work; fonts and rendered examples remain external.

## Seeded resin illustration · unregistered candidate

[Seeded resin surface](recipes/candidates/seeded-resin-candidate/README.md) generates bounded object-local inclusions and a wide curved light band for a stylized static surface. Two independent size/seed configurations; not photographic optics, live lighting or a flicker-removal guarantee. No new registered family, reviewed recipe or accepted work.

## Contour rim · reusable raster candidate

[Selection and composition guidance](recipes/candidates/contour-rim-candidate/design.md) connects the [bounded same-alpha shader](recipes/candidates/contour-rim-candidate/README.md) to two actual content-driven consumers: a large serif invitation title and an authored open-loop object sheet. Isolated no-rim controls, caller-owned fonts/Canvas and external evidence; no new registered family, reviewed recipe, PBR claim or accepted work.
