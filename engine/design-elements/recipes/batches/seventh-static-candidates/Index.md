# 第七组：离散时序与字形证据受限候选

这是发现/选择索引，不是公共族注册表。两项新重建源码候选保留 **62 个文本（27＋35）**；新增公共族、正式配方注册和 portfolio 作品均为 **0**。原先不可用的提取包未被假称恢复，本版本经过新的独立技术审查。用户对本组给过正面反馈并要求沉淀；不等于这两组新组合的逐项审美验收，也不授予被排除素材的公开权利。

| 内容目的 | 设计指导 / 契约 | 代码 / 两种组合 | 许可与外置资源 |
|---|---|---|---|
| 用同一半 tick 模型解释数字状态、符号总线、周期与摘要 | [指导](../../candidates/timing-diagram-candidate/DESIGN-GUIDE.md) · [契约](../../candidates/timing-diagram-candidate/CONTRACT.md) · [运行](../../candidates/timing-diagram-candidate/README.md) | [compileTiming / createTimingKit](../../candidates/timing-diagram-candidate/index.mjs) · [5 周期概览与 8 周期概览＋细节](../../candidates/timing-diagram-candidate/examples.mjs) · [不同输入](../../candidates/timing-diagram-candidate/fixtures.mjs) | [MIT / WaveDrom 上下文 / OFL](../../candidates/timing-diagram-candidate/CREDITS.md)；Liberation Sans 精确外置 provide-exact，公网精确二进制恢复未验证 |
| 将轮廓、Unicode、字形名、advance 与固定轴读数连接到同一字体实例 | [指导](../../candidates/glyph-evidence-candidate/DESIGN.md) · [契约](../../candidates/glyph-evidence-candidate/CONTRACT.md) · [运行](../../candidates/glyph-evidence-candidate/README.md) | [createGlyphEvidenceKit](../../candidates/glyph-evidence-candidate/index.mjs) · [Advance is not ink / Small marks](../../candidates/glyph-evidence-candidate/examples/scenes.mjs) | [Apache-2.0 / FontGoggles AUTHORS / OFL / MIT 依赖](../../candidates/glyph-evidence-candidate/NOTICES.md)；固定官方 masters 外置获取，派生 outline JSON 也是 OFL 字体软件，不能当普通 MIT 数据公开 |

## 真正增加的表达方法与去重

- 时序候选增加离散高低电平和完整符号分区的共同坐标模型。通用 [interval lanes](../../../../motion-elements/lib/foundations/layout/interval-lanes/index.mjs) 仍用于任意区间排布，既有 [timeline](../../../../motion-timeline-core/lib/timeline.mjs) 仍处理时间运算；本候选不再造时间引擎，不把每个 lane 算一个新方法。tick 无物理单位，符号不解析成十六进制，非真实采样或协议仿真。
- 字形证据的重点是同一固定字体轮廓与 cmap/hmtx 信息相互解释，不是另一套标题排版皮肤。既有 [expressive type](../../../families/expressive-type/index.mjs) 处理受限文字视觉效果；[参数刻度](../../../families/parameter-controls/index.mjs) 处理声明值的视觉编码。本候选把真实实例的轴元数据和字形度量绑定起来，但仍是 **unshaped**：无 kerning、GSUB/GPOS、ligature、BiDi、实时可变轴或完整字体编辑器，字形名不是数字 GID。
- 两包内部的视图入口各自仍只构成一条受限配方；共享 Canvas、输入防护和 IO 帮助函数不另算公共族。四张固定组合是可迁移演示，不是四件新收藏作品。

## 组合与 motion 使用边界

先确定内容目的，再选择表达。时序用于离散过程解释；字形证据用于字体知识/排版教学。每包的摘要和细节必须使用自身同一不可变模型，不能把两个包的数字混称同一测量。两者可作为一页中的独立证据面板，宿主负责阅读顺序、背景、标注和像素对齐。色彩依据用途与层次选取，没有禁色规则。

两包只验证静态 Native 输出。后续视频可使用生成的图层，但时间采样、连续帧内存、编码可读性和播放尚未验证，不称 animation-ready 或浏览器通过。`place` 保持状态/current path，继承 transform、clip、alpha、composite、shadow/filter；Native0.1.100 在分数 clip/save 序列下可能有抗锯齿差异，字段恢复不等于任意宿主像素等价。不要偷偷加读回刷新作为通用修复。

## 资源、路径和公开范围

保持两份包内的完整许可证及声明，不因根目录 MIT 而改写 Glyph 的 Apache-2.0 或字体 OFL。无上游应用、源截图、原品牌窗口、私有审查/存储记录、字体二进制、派生轮廓 JSON、生成 PNG/报告或依赖缓存进入这 62 个文本。参考权利与代码许可分别处理。

本索引要求所有字体/masters/派生资源、运行依赖、临时测试和输出放在整个仓库之外。PULSE 的路径门会识别 MotionStudio 根；Glyph 的门限仅为其 package 外，不能冒称整个仓库安全边界。调用者落实更严格的外置规则。PULSE 可用外置 Native 安装目录的 `NODE_PATH` 执行原包，不需写入仓库 node_modules；Glyph 使用 `GE_RUNTIME_DIR`。精确字体条件不同，不能把 Glyph 的已验证固定官方恢复外推成 PULSE 也可自动恢复。

这些候选不接收恶意 Proxy、任意字体或不可信 Canvas 工厂；不是安全沙箱。冻结包内候选/未发布状态不由发现索引自动晋升；独立审核、联合源码政策、实际复用、用户验收和发布是不同门槛。
