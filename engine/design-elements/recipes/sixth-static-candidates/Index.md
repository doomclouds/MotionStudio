# 第六组：同源诊断与空间字符受限候选

这是**发现与案例选择索引**，不是正式族注册表或完整产品发布。保留两条受限静态配方的 44 个文本文件（23＋21）；**公共设计族增量 0、正式配方注册增量 0、portfolio 作品增量 0**。代码审查与合成样例的技术验证不等于用户逐项审美确认，也不自动授予原研究素材的公开权利。

| 内容目的 / 候选 | 设计指导与契约 | 可调用代码与两种组合 | 来源 / 字体边界 |
|---|---|---|---|
| 同一组量化字节的场图、32 桶直方图与采样注记 | [设计指导](../byte-field-diagnostic-candidate/DESIGN-GUIDE.md) · [契约](../byte-field-diagnostic-candidate/CONTRACT.md) · [运行](../byte-field-diagnostic-candidate/README.md) | [模型和三个同源图层](../byte-field-diagnostic-candidate/index.mjs) · [ramp-distribution / wave-sample](../byte-field-diagnostic-candidate/examples.mjs) · [虚构输入](../byte-field-diagnostic-candidate/fixtures.mjs) | [MIT、SHADERed 上下文及 OFL 边界](../byte-field-diagnostic-candidate/CREDITS.md)；原创公式和教学数据，无应用代码/截图/雨景。Liberation Sans 2.1.5 外置 **provide-exact**，公网精确二进制恢复尚未验证 |
| 二维字符地址、标记角色、单光标与同一快照摘要 | [设计指导](../spatial-character-snapshot-candidate/DESIGN.md) · [契约](../spatial-character-snapshot-candidate/CONTRACT.md) · [运行](../spatial-character-snapshot-candidate/README.md) | [normalizeGrid / createSpatialCharacterKit](../spatial-character-snapshot-candidate/index.mjs) · [Read a route / Discrete pattern atlas](../spatial-character-snapshot-candidate/examples/compositions.mjs) | [MIT、Orca 上下文及 IBM OFL](../spatial-character-snapshot-candidate/NOTICES.md)；IBM Plex Mono Medium 500 可由固定官方 URL 外置恢复，无 Input Mono、原程序、窗口或吉祥物 |

## 为什么不是已有配方换皮

- [scalar-field-candidate](../scalar-field-candidate/CONTRACT.md) 与 [halftone-scalar](../halftone-scalar-candidate/CONTRACT.md) 处理材质/标量场表现；本次 byte-field 的重点是**先量化并拥有一份有限字节模型，再由同一字节同时解释画面、分布与某个坐标**。不把场图、柱图、注记各算一个新机制，也不替代通用统计图表。灰度和采样不是真实实验或 GPU 测量。
- [value-grid](../b10/docs/value-grid.md) 有数值量程、单位和空值；[code-spans](../b10/docs/code-spans.md) 是顺序文本片段；[indexed-pixel-layer](../indexed-pixel-layer-candidate/CONTRACT.md) 是调色板索引到 RGBA。空间字符候选保留字符的二维地址、点/空格的差别、角色覆盖与光标优先级；它不执行这些字符，也不提供编辑器、终端或音序器。
- grid 与 summary 两个入口仍是一条受限配方。共享 Canvas 组合、静态快照、显隐/平移不因此成为新族或新 motion 机制。

## 选用及组合注意

1. 先确定解释任务。需要说明量化、分布和取样一致性时用 byte-field；它只支持合同内的原创 ramp / wave 模型，不接收任意图片或测量数据。采样注记必须来自所显示模型，不另填计数。
2. 需要讲解离散地址/状态时用 spatial-character。点是几何占位，空格仍占地址；不是代码语义。角色色明确，安静点是装饰，不承担唯一信息。小单元格可能因真实字形墨迹而拒绝，不能裁字凑数。
3. 每包的两组不同内容/布局是复用演示，不是四件新增收藏作品。宿主负责整页布局、对比度、实际阅读尺度及裁切；背景/标题帮助函数不是额外通用 API。
4. 两包都是静态。后续影片可在既有时间/布局能力上使用，但跳帧、倒序、连续帧内存、帧率与编码后可读性尚未验证；不能把 CPU 公式的 phase 参数说成实时 GPU 或动画通过。

## 资源、路径及保留范围

原封保留两包的许可证和来源文本。Native Canvas 0.1.100 单独安装，字体二进制、输出 PNG/JSON、参考、完整应用、运行缓存以及审查/存储记录均不在此文本投影。SHADERed 的 MIT 软件许可不延伸到被排除的 CC BY-NC-SA 雨景/音乐；Orca MIT 不延伸到被排除的 Input Mono、截图或吉祥物。

Byte-field 的外置字体是精确 SHA 的前置条件，仓库不提供已验证公网恢复流程；不要换字体后冒称同像素。Spatial-character 的 IBM 字体原样外置获取，注册别名不是内部改名。两包 API 信任 Native 运行时与正常调用者，不是恶意模块/Proxy 沙箱。

**本索引统一要求资源、安装目录与输出均放在仓库之外。** Byte-field 自身检查已识别仓库边界；spatial-character 的适配器只保证在其 package 之外，不宣称整个仓库路径隔离。调用者要落实更严格的外置位置，不能把两种 IO 门混为一谈。包内冻结的 candidate / published 状态不因本索引而晋升；注册、部署及审美确认仍是独立门槛。

## Native 合成限制

在锁定的 Canvas 0.1.100 中，分数坐标的已有 clip 与 `save/drawImage/restore`、后续绘制组合，可能因引擎抗锯齿/刷新次序而与不使用 save/restore 的手工基线有边缘像素差；单独原生调用亦可复现。不能从状态字段和路径保持不变推导任意裁切序列的逐像素等价。对需要严格复现的宿主先用整像素裁切/位置并实际核图；不把读回像素强制刷新当作已验证通用修复，也不将此静态候选提升为任意宿主的无差合成保证。
