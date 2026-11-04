# design.radial-scale.v1 · 径向刻度与读数

<!-- asset-self-description: design.radial-scale.v1 -->

## 选择与身份

把一个线性数值沿开放圆弧映射到指针和读数。knob保留圆形实体，gauge以粗弧与端点表示量程位置。适合单参数说明，不是交互控件、校准工具、安全关键仪表、对数频率或真实响度映射。[design.md](design.md)解释来源与视觉层级。

唯一登记 [catalog](../../catalog.json)；[index.mjs](index.mjs) 导出id/version/guidance/validate/draw，总 [dispatcher](../../index.mjs)直接调用同一实现。旧平层实现、说明、输入路径直接移除，无兼容别名。状态与版本遵循catalog，技术测试不提升作品接受。

## 输入与角度契约

`validate(props)` / `draw(ctx, props)`；无时间、事件、文件系统或网络依赖。调用者注册字体和持有 Canvas；静态绘制后返回语义几何。

- bounds：x/y 有限，width 280–1600，height 340–1600。是外层限值，不保证所有字号和刻度数均能布局。
- data：label（1–60字符）、unit（1–12字符），均单行非空。unit 是显式展示标签，不自动推断设备单位。
- min/max/value 均有限，正的有限量程，value 必须在量程内；越界拒绝不夹取。
- startAngle 默认135，范围−360..360；endAngle 默认405，范围−330..660。单位是**度**，0°指向右侧，正角沿屏幕顺时针。`endAngle-startAngle` 必须30..300°。不自动取模、不自动寻找短弧；例如270→90拒绝，跨越0°应传−90→90或270→450。
- min 对应起始角，max 对应结束角，位置严格线性。即便量程跨零（例如−24..12），强调弧仍从 min 累积到 value，不表示“从零偏移”。不支持逆时针、满圆、对数声学或非线性物理映射。
- ticks：2–21整数，包含两个端点。precision：0–3整数，用于当前值及刻度显示；只改变显示舍入，不改变原 value 或位置。刻度舍入后重复会拒绝。调用者应根据数据真实精度选择，不把小数位当作测量精度证明。
- variant：`knob` 或 `gauge`；theme 的 surface/ink/muted/accent/track 为 #RRGGBB，fontFamily 调用者拥有，fontSize 12–28。

## 安全布局与返回

标题、完整圆周和底部值各有独立保留区域。绘前测量标题/当前值/每个刻度，检查刻度盒边界和两两6px间距；可用半径不足55px、文字溢出、刻度重叠或精度隐藏差异均在画任何像素之前拒绝。字体度量受调用者实际字体影响；不能以空白裁切代替修正输入。仪表也保留完整圆周布局区域，半圆下方会有留白，不擅自重新排版。

返回 id、bounds、center、radius、normalized、原始value、displayedValue（舍入后字符串）、unit、pointer、ticks的值/字符串/实际文字盒，及 staticOnly:true。状态保存/恢复；不修改输入。

## 默认值与宿主责任

theme默认surface #171b22、ink #f6f1e9、muted #9da7b6、accent #ff8438、track #414956、fontFamily sans-serif、fontSize18。ticks默认7、precision默认0、variant默认knob。`validate`返回新的bounds/data/theme记录并补默认值，不改输入；不是拒绝所有未知字段的严格schema。共享上下文支持恢复列出的样式及transform，当前路径可变化。此实现不清除宿主dash，调用者需要实线圆弧时应传入没有dash的上下文；不要把状态恢复等同于忽略所有输入状态。

## 实际示例与测试

[两份输入](examples/cases.mjs)分别为暗橙输出旋钮与米紫容量仪表；它们改变量程、单位、弧段、实体形态、尺寸与颜色，数值均是合成资料。[render](examples/render.mjs)实际调用draw，默认输出PNG哈希、几何和字体SHA256，不写媒体。

```sh
export MOTION_ENGINE_ROOT=/absolute/path/to/installed/runtime
export UI_TEST_FONT_DIR=/absolute/path/to/dejavu
node engine/design-elements/families/radial-scale/examples/render.mjs
node engine/design-elements/families/radial-scale/test/contract.mjs
```

Node24+；示例/测试需要外置已安装@napi-rs/canvas及DejaVuSans.ttf、DejaVuSans-Bold.ttf、DejaVuSerif.ttf、DejaVuSerif-Bold.ttf。`RADIAL_SCALE_FONT_DIR`可覆盖UI_TEST_FONT_DIR，不自动安装、下载或以缺字字体静默替代。包内命令将engine换runtime。可加 `--out /absolute/new-external-directory`输出到尚不存在的仓库/Skill外目录，文件独占创建；调用者须信任文件系统和路径。

[同目录测试](test/contract.mjs)实测两个变体、min/mid/max角位置、刻度精度拒绝、错误输入不留像素、确定性、输入不变和dispatcher一致。专题组合见 [specialist-compositions](../../examples/specialist-compositions.mjs)。Native技术通过不证明浏览器、交互、无障碍、动效、测量真实性或用户审美接受。

## 依赖、来源与权利

实现仅依赖 [shared.mjs](../../shared.mjs)的数值/文字/上下文支持；复制本目录时须同时保留该依赖或使用完整源码包。Canvas与合法字体由调用者提供，无网络和文件读取。源码为本库原创有界实现，遵循根 [MIT](../../../../LICENSE)、[第三方声明](../../../../THIRD_PARTY_NOTICES.md)和[源码范围](../../../../SOURCE-SCOPE.md)。设计来源为hardware-sampler-study的形体/方向/标签关系，独立增加本族的数值量程契约；不复制设备logo、原图或字体，不声称来源作品已经调用本族。外部字体与媒体许可仍独立核实。
