# Swiss Grid 静态设计积木

## 实看后的结构判断
完整原图是 1920 × 1080 浅灰画布，不是一个被裁出来的统计卡。视觉重心位于
左中区域：1200 × 12 深蓝水平线、巨大 HYPERFRAMES、细字副标题，最后在其上
覆盖一张金色 47% 统计卡。右侧和下方大量留白是完整构图的一部分。

原图并非“整理好的信息卡”：统计卡有意覆盖标题，且约 96.3% 的不透明度让
底层字和横线微弱透出。复刻须保存此状态，不擅自把卡片挪到角落或删掉透字。
来源中的网格背景、视频和其他统计卡不在这张完整 poster 中可见，不能自行补上。

## 可复用规则
1. **横线作坐标，不作装饰。** 固定左 160 / 高 360，标题左 190，有意形成 30 px 差。
2. **三级文字重量。** 大标题厚重，百分比突出，副标题与说明轻；不能统一成粗体。
3. **对比来自比例。** 180 / 140 / 64 / 24 px 四级尺寸；不要增加彩色图标或边角圆角。
4. **硬边、硬阴影。** 卡片无圆角，左金条 10 px，影子右下各 20 px；透明度是组级，
   不是逐个对象透明。否则叠加区域会比原图更深。
5. **字体可授权先于伪精确。** 原作 Helvetica 系统字体未附文件；本版选 OFL 文字，
   显式说明宽高、字重校准和剩余字形差异，不复制商业字体，也不引入 AGPL 字体。
6. **文案服从固定尺寸。** 调用 compose 前通过长度和测量校验；超出预算报错，
   不偷偷缩小、不裁字、不自动换行。不同语言应新建布局。

## 工程积木
`drawSwissIntro`、`drawStatisticOverlay` 可以分离使用；`drawStatisticValue` 可以
绘制新的数值或百分比。`compose` 在调用者画布中接受 x/y/scale，实现整体嵌入，
但不会改变这张图自身 1920 × 1080 的内部坐标。参考截图不参与任何渲染。

## 不应复用的内容
47% 仅为来源样例，不是已核验数据；HYPERFRAMES 是来源样例品牌，不代表本项目
获其背书。外用时替换并核实。源 JS 中的动效和运行库未复制，Native 结果不是视频。
完整对照图为主要审查证据；局部图只帮助看字体差异，不单独称为一件完整复刻。


## Engineering candidate boundary (2026-10-31)
Owner static retention approved by the latest explicit batch instruction; unified submission not yet performed. One case-local recipe, zero registered public families; no generic family dependency is claimed. All resources/output are external. No raw preview, private report or source fonts are in this overlay.
Only compose is the bounded reusable entry. It preserves host current path/state and isolates text/effects via a fresh procedural surface, while retaining caller transform/clip. Low-level drawSwissIntro/drawStatisticOverlay/drawStatisticValue/trackedText remain expert, unvalidated scene helpers requiring caller isolation; not separate validated bricks. Opacity belongs to the scene, not inherited host alpha.
