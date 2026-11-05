# 纸面标注与图卡交接：先组合，不新造电影模板

本页是组合选择指南，不新增基础机制、catalog 项或通用影片配方。[双内容技术消费者](../../examples/annotation-prefix.mjs)与[测试](../../test/annotation-prefix.test.mjs)只消费现有折线区间支持；没有移植参考影片源码、镜头表、数据、字体或美术。

## 选择与反例

- **纸面**：[material-surfaces](../../../design-elements/families/material-surfaces/README.md) 的 paper 是容器、硬偏移影与内容槽，不是纸纹。纸色、静态颗粒、方向纤维、排线与暗角分层设计，纹理应在初始化生成后复用。不要逐帧全屏重抽随机噪声制造闪烁，也不要用玻璃模糊冒充纸张。现有族未提供这些纹理生成器；新增受限 [paper-drawing](../../../design-elements/recipes/candidates/paper-drawing/README.md) 只补静态纤维/颗粒/点格与笔尖锚定图标，不是已迁移原电影纸面。
- **线的生长**：[polyline-sections](../support/polyline-sections.md) 提取 [0, p×totalLength]，保留每个原折点。零区间不绘线，不把单锚点画成提前出现的圆点。若只是移动一个物体，已有 [polyline-trail](../../lib/foundations/geometry/polyline-trail/README.md) 的 samplePath 足够；其等距 sampleTrail 不应代替保转角裁切。
- **笔跟随**：笔尖直接取同一 section 的最后一个顶点，和墨迹用同一父变换一次。笔身可独立朝向，但笔尖必须保持该锚点。以字体 advance 宽度驱动横向 clip 只是模拟书写揭示，不是真实字形笔画顺序。字形溢出需要实际字体墨迹边界与上下留白；不移植参考中固定的 clip 高度。用 [local-geometry](../../lib/foundations/reveal/local-geometry/README.md) 做局部揭示时仍由调用者提供真实 bounds 与 Path2D。
- **重点标注**：先给事实阅读时间，再出现一个引线、圈、括号或下划线。路径形状与目标位置是导演/排版输入；库不会识别事实，也不会自动避让标签。先标记再写注释、先写再划线都是叙事选择，不是两种新机制。闭合圈要明确末尾与开头的身份，不把跨缝区间塞给不支持 wrap 的 API。
- **图表与插画卡交接**：保留图表的时间/单位和被解释对象，卡片进场前交代它回答哪个问题，退场后回到对应数据锚点。复用 [transform](../../lib/foundations/motion/transform/README.md)、[opacity](../../lib/foundations/motion/opacity/README.md) 和局部 clip。已有 [focus-handoff](../../lib/recipes/focus-handoff/README.md) 只在固定三卡、固定时间和尺寸合同适用时采用；任意插画卡不是这个配方。纸卡上移加旋转也不是物理卷纸/三维剥离。
- **boiling line**：每若干帧切换一次、按顶点/种子确定的形变，与 [motion.shake](../../lib/foundations/motion/shake/README.md) 平滑整体变换不同。不要为此冒用 shake 或新增同名封装。需要保留尖角、节点共享和拓扑时，先明确扰动身份、幅度、时钟与 reduced-motion 策略；新增受限 [held-vertex-jitter](../../lib/support/held-vertex-jitter/README.md) 提供明确帧组和顶点身份；采用前仍核短段/拓扑及坐标余量。

## 已有候选与未覆盖责任

纸面研究还应先读已有 [spot-ink-print-candidate](../../../design-elements/recipes/candidates/spot-ink-print-candidate/README.md)：它是三色墨密度合成的真实代码候选，提供 paper/grain/boil 参数和明确后端合同；不是普通 RGB 图像自动分色、Native Canvas 纸纤维生成器或逐顶点沸腾。它的真实浏览器与艺术接受边界仍按自身合同，不因本指南提及而晋级。

数据图不要从外观推断语义能力：[semantic-data](../../../design-elements/families/semantic-data/README.md) 的阅读序列/名义圆面积不等于精确时间轴；[authored-paths](../../../design-elements/families/authored-paths/README.md) 明确只接受 illustrative 路径；[proportional-partition](../../../design-elements/families/proportional-partition/README.md) 与 [ratio-rings](../../../design-elements/families/ratio-rings/README.md) 各自只处理合同内的份额编码。需要年份、单位、零基线、缺失值和堆叠一致性时，先审查对应图表候选和数据合同，不能把装饰序列改名为统计图。本增量没有实现通用时间柱图，也没有转存参考数据。

可复用的机制与导演输入分别拥有：模块负责有界几何/状态；导演仍负责标注哪个事实、何时读完、何时抬笔、卡片为何出现、回到哪个数据锚点。真正的笔顺书写另需获准的逐笔路径/顺序资源及验证，不由字体覆盖或横向 clip 自动获得。当前 [ordered-stroke-reveal](../../lib/support/ordered-stroke-reveal/README.md) 已有原创顺序/中线/轮廓消费者，但不带字库、不恢复字体笔顺，也不承诺完整终态的补全无跳变。

## 一个时钟、一个路径、一个坐标合同

例子用两种原创合成内容：折线图解引线，以及旋转父坐标下的测量括号。它们不是参考影片的航天故事或参数变体。预编译固定路径，绝对 progress 驱动现有 extractPolylineSection；同一结果提供已显墨迹与笔尖。此处 progress 由消费者输入，影片中应由现有 rational 时间/曲线求值，不以“上帧加一点”维护状态。每帧裁切只涉及有界路径点，不新建全屏纹理。

例子的 showPen 只在 0<p<1 为真；完成后保留完整墨迹、隐藏笔。reduced-motion 选择完整静态标记且不显示笔，是技术示例的明确策略，不是公共 API 新默认。短暂停笔、抬笔、离场与两笔之间的飞行需要独立导演时间，不把自动最短连接线画成新墨迹。

## 来源、复用证据与未验边界

设计观察来自 [RyanBowie/ai-video-creation-guide 的 Launch Race](https://github.com/RyanBowie/ai-video-creation-guide/tree/d40133983b8765f7ecf255448d38e99c65032c29/examples/launch-race)：engine.js 的弧长路径、纸面缓存、笔轨迹/文字 clip，以及 cards.js 的分段扰动和卡片交接。这里只归纳选择与反例；没有复制上游代码或数据，因此没有把上游 MIT 或 GCAT 数据 CC BY 4.0 许可混作本库素材授权。若以后移植代码须保留完整对应版权许可，使用数据须另行署名；字体/音轨/影片的权利分别处理。

从仓库根执行：

```sh
node --test engine/motion-elements/test/annotation-prefix.test.mjs engine/motion-elements/test/polyline-sections.test.mjs
```

Node 24+，无安装、联网、字体或 Canvas 依赖；公共入口仍依赖相邻 timeline-core。测试覆盖独立的解析坐标期望、尖角保留、父变换一次、线尾/笔尖共源、零/终态、乱序重复与静态降动策略。它证明两份合成内容实际调用旧支持模块，不证明电影已经改用该模块，也不证明纹理、文字、boiling、图卡交接的像素或常速观感。技术、视觉、听审、同步、真实生产迁移和用户接受分别复验。


### Native Canvas 技术复验（与几何测试分开）

`drawAnnotationExample` 实际消费上述 section，用 lineTo 绘制保角前缀与红色笔尖标记。调用者拥有画布清理、背景和输出；函数恢复 paint state/transform/clip，但不保留 current path。内部 screenVertices 已应用示例父矩阵，若调用者再设置 ctx transform，它会作为另一个外层变换作用一次。

```sh
MOTIONSTUDIO_CANVAS_MODULE=/absolute/path/to/installed/@napi-rs/canvas node --test engine/motion-elements/test/annotation-prefix-native.test.mjs
```

需现有 Native Canvas；无自动安装或字体。独立像素断言检查两个内容的拐角、未到达区域透明、笔尖颜色位置、零态无像素、重复采样像素一致和绘图状态恢复。几何测试与 Native 技术像素测试分别运行；后者仍不是参考影片视觉保真、纸纹观感、常速播放或艺术接受。
