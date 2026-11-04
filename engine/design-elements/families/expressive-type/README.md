# design.expressive-type.v1 · 有边界的表现性文字

<!-- asset-self-description: design.expressive-type.v1 -->

唯一登记 [catalog](../../catalog.json)；[index.mjs](index.mjs)导出id/version/guidance/validate/draw，总 [dispatcher](../../index.mjs)直接调用本实现。状态与版本以catalog为准。旧平层源码/说明/样例路径已移除，无兼容别名。

## 选择与设计关系

以短字/数字作为一个主视觉：layered-extrusion用有界偏移制造层叠重量，sliced-text用水平条带和交替颜色形成节奏。[design.md](design.md)解释来源与取舍。这是2D文字处理，不是3D、光照、字库轮廓/汉字笔画拆解或音频映射。支持文字应恢复正常排版，不能让切片文字成为唯一的信息载体。

适合实验活动标题、成绩数字或章节开场，不适合正文、合同、账户余额、医疗/安全指令及要求快速精确读取的信息。大字不能证明主张真实。

## 自足输入合同

`draw(ctx, {bounds,data,theme})`需要提供真实可见glyph metrics的Canvas 2D context；`validate`返回原输入、不改对象、不自动补全，非严格未知字段schema。

- bounds：x/y有限像素，width/height 40–4096；还需容纳文字与效果的实际墨迹范围。
- theme必需：surface/ink/muted/accent四个六位#RRGGBB色、fontFamily非空至多100字符；字体由调用者安装和注册，模块不读字体文件。
- data.variant必需为 `layered-extrusion` 或 `sliced-text`；lines为1–3个非空字符串，每行≤24字符且不得含换行/回车。
- fontSize必需48–400px；padding默认24，0–100；lineGap默认12，0–100；align默认left，可选center/right；paintBackground默认true，false时保留底层像素。
- layered-extrusion：depthX/depthY默认18，各−60..60px；layers默认18，2–60整数；theme.depthColors必需，1–6个六位#RRGGBB色。按由远到近顺序画层，再画ink前景；颜色选择沿离散偏移比例分段，不做连续光照或材质模拟。
- sliced-text：offsets必需，4–32个−40..40px水平偏移；fillRatio默认0.6，0.2..1，表示每个水平条带保留高度；条带交替使用ink/accent，不自动恢复被挖掉的文字。

按字体actualBoundingBoxLeft/Right/Ascent/Descent取得可见墨迹盒，再合并全部偏移范围。有限可见墨迹高度必须>0。每行完整效果盒需落在padding内，否则绘前拒绝；不自动缩字、截断或修改内容。换字体后必须重测。层数/偏移有界不等于所有内容仍然易读。

返回 `id,variant,regions,readingOrder,semantics,staticOnly`；regions是每行含效果的绝对边界盒，readingOrder为line-0等位置标签，不是语义节点。sliced条带可能在盒内留下空白，不表示每像素都有字。save/restore支持恢复上下文，当前路径可能变化，无时钟、事件、响应式排版、ARIA或浏览器质量保证。

## 两份例子与验证重点

[输入](examples/cases.mjs)分别是虚构180分钟的层叠数字和MAKE WAVES双行切片口号，改变内容、变体、字体尺寸、主题、对齐与留白。不是训练建议或天气数据。[同目录测试](test/contract.mjs)实测两例、实际墨迹/效果边界、负偏移、透明底保留、越界绘前拒绝、确定性和dispatcher一致。完整可读解释须由宿主另外提供。

## 实际执行与恢复

[render](examples/render.mjs)真实import并调用draw，默认只报告PNG哈希、返回几何和字体SHA256，不写媒体。

```sh
export MOTION_ENGINE_ROOT=/absolute/path/to/installed/runtime
export UI_TEST_FONT_DIR=/absolute/path/to/dejavu
node engine/design-elements/families/expressive-type/examples/render.mjs
node engine/design-elements/families/expressive-type/test/contract.mjs
```

Node24+；示例/测试需要外置已安装@napi-rs/canvas，以及DejaVuSans.ttf、DejaVuSans-Bold.ttf、DejaVuSerif.ttf、DejaVuSerif-Bold.ttf。可用`EXPRESSIVE_TYPE_FONT_DIR`覆盖UI_TEST_FONT_DIR。包内命令将engine换runtime。可加 `--out /absolute/new-external-directory`写到尚不存在的仓库/Skill外目录，文件独占创建；路径/文件系统须受信任。不自动下载或安装，不静默替代缺失字体，不分发node_modules或字体。

## 依赖、来源与验收

实现依赖 [shared.mjs](../../shared.mjs) 的校验/字体/上下文支持；本目录不能作为脱离支持模块的独立单文件包。来源关系见design.md和catalog，方法来源不等于源作品实际调用。源码为本库原创有界实现，遵循根 [MIT](../../../../LICENSE)、[第三方声明](../../../../THIRD_PARTY_NOTICES.md)及[源码范围](../../../../SOURCE-SCOPE.md)；不复制参考媒体，外部字体/品牌/素材权利另核。

同目录测试与 [总族测试](../../test/verify.mjs)属于Native静态技术验证。新文案、新字体、新构图需重新审查；它们不代表视觉、浏览器、交互、无障碍、Motion或用户接受，作品锁与验收状态独立保留。
