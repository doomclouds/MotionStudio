# design.material-surfaces.v1 · 材质与表面层级

代码：[`material-surfaces.mjs`](../material-surfaces.mjs)。示例：[`examples/material-surfaces.mjs`](../examples/material-surfaces.mjs)。

## 设计判断

表面的任务是把信息从背景中分离，并让物体的语气和品牌一致：纸签适合印刷、手作和现场活动；近实色面板适合阅读；玻璃适合让背景色参与画面且信息不密集的场景。颜色、字重和可读性由整体主题负责，不能把每个内容框一律变成玻璃。

来源追踪：已接受的 `portfolio/works/liquid-glass-study/design/scene.mjs` 提供了“同画布背景、半透明白色覆层、细亮边、真实可见柔影”的视觉经验；`portfolio/works/vinyl-study` 提供纸张硬偏移影；深色工具作品提供前后表面分离。这里的代码是重新参数化的通用实现，未复制来源图片或原作尺寸；不是原场景回归替换。

## 契约

`draw(ctx, props, env)` / `validate(props)`，`props.bounds={x,y,width,height}`；`data.variant` 为 `paper/opaque/glass`，可选 title、subtitle、padding、radius、elevation、opacity。`theme` 为 surface/ink/muted/edge/shadow 五个十六进制颜色、fontFamily、fontSize。字体由调用者提供。

- width 120–1600，height 100–1200，有限坐标；padding 8–80 且不能占满内容区。
- elevation 0–3。纸张生成硬影；其他表面生成有界 alpha-mask 三次 box blur 柔影。不是 CSS shadowBlur 等效声明。
- opacity .04–.75 仅控制玻璃白色覆层，不代表真实材料透射率。
- title/subtitle 单行最多100字符，绘制前按实际字体测量；溢出拒绝，不自动缩字。
- `env.canvasApi.createCanvas` 用于阴影。glass 还必须提供 `env.backdrop({ctx,width,height,bounds})`，由调用者画该表面应采样的背景。无默认远程图像，无网络访问。
- 返回 bounds、contentBounds、headingHeight、material。上层可把任意图表、正文或控件放进 contentBounds；本模块不负责整页内容。
- 保持 Canvas 状态；不读时钟或随机数，不修改props。背景回调自身也应确定。

## 组合规则与反例

先在完整画面上确定大面积背景，再明确哪些表面要有前后关系。纸签和玻璃可以共存于对照演示，通常不应无理由共存在同一品牌主画面。避免在低对比背景上叠浅色字、多个同强度发光边框；长正文使用 opaque 更稳妥。返回的内容槽可与指标/标题/图形资产组合。

不能称作物理玻璃：没有折射、真实背景模糊或浏览器 backdrop-filter。只提供显式背景采样图层和覆层。边界/阴影向外扩展，布局需预留约70px；调用者clip可能裁掉阴影。暂不支持自动换行和响应式。

## 重组证据与状态

同源码的两个候选样例：蓝紫珊瑚色听音面板；米色印刷工作坊纸签。位置、尺寸、内容、表面、颜色和层级全部参数化，不修改实现。它们是重组验证画面，不新增优秀作品计数；审美需独立看图，不能以像素不同代替好看。正式验证结果由上层统一报告关联，不预填通过。
