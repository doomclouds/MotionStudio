# 订单流转与瓶颈变化 — 使用指导

本批为 **2 个基础机制＋1 个配方**，全部 experimental。已有 14 秒有声原创验证作品的真实调用证据。用户对交付有限接受，但未将其视觉设计认可为范例，记录为 `LIMITED_ACCEPTANCE_NOT_STYLE_ENDORSEMENT`；它不是优秀作品或默认风格推荐。`NOT_LISTENED`、常速连续观看 `NOT_DONE`、未验证迁移仍分开保留。无新运行时依赖，无外部代码复制，不做真正3D。

## 场景及去重

- `layeredDagLayout`：把有分支/汇合的有向无环关系排成前后阶段。位置由拓扑最长路径及明确的有限排序启发式决定，不是把grid转方向，也不只支持树。
- `weightedFlowLayout`：用共用量纲把链路数值映射为端口竖向厚度；对同一节点的各条输入/输出分别分配位置，跨两端保持链路身份。新内容是图数据的加权端口分配，不把曲线或颜色当新机制。形状编译、Path2D绘制继续用已有`compileSampledBand`/`drawSampledBand`，不重复登记包络。
- `compileFlowHandoff`/`sampleFlowHandoff`：配方，不是基础机制。在相同节点/链路拓扑上切换两组内部守恒的权重快照；组合已有keyframe轨道、smoothstep/lerp和加权流布局。入场/镜头/标题仍用既有transform/opacity/stagger。

## 分层DAG接口

```js
layeredDagLayout({
  nodes:[{itemId:'received',width:100,height:120},{itemId:'review',width:100,height:120}],
  links:[{linkId:'review-orders',fromId:'received',toId:'review'}],
  layerGap:160,nodeGap:40,
});
```

- nodes为0..64项，links为0..128项；所有对象/数组严格验证未知字段、稀疏、Symbol、null。
- itemId/linkId各自唯一，ID沿用ASCII `[a-zA-Z0-9_-]{1,64}`；端点必须存在。允许不同linkId的并行边，但拓扑邻居去重。
- width/height=.001..4096，layerGap=.001..4096，nodeGap=0..4096。
- 拒绝环和自边；空nodes只能配空links。无自动删边、修复或回退。
- 最长路径决定层；每层按最大节点宽度推进x。按实际高度和nodeGap排列，并垂直居中于最高一层。
- 层内先ID排序，再固定2轮双向barycentric sweep；邻居求和顺序按ID固定，避免输入边顺序影响浮点结果。不承诺最少交叉、不做避障布线。
- 返回深冻结`{items,placements,extent}`。items为标准layout字段；返回顺序/zIndex沿用nodes输入顺序，同ID几何不受nodes/links重排影响。placements为`{itemId,layer,order}`。empty extent为0×0。
- 有项时输出可接既有layout-handoff。返回范围不包含文字、描边、阴影，调用者负责父变换/视口和可读性。

## 加权流接口

```js
weightedFlowLayout({
  nodes:layout.items,
  links:[{linkId:'review-orders',fromId:'received',toId:'review',value:60}],
  unitsToPixels:0.9,portGap:8,samples:128,
});
```

- nodes为0..64项标准平移layout；rect坐标/translation为±1e7，rect尺寸.001..1e7，geometryBounds须一致。拒绝非平移矩阵、重复节点、陈旧bounds。
- links为0..128项，linkId唯一，value=0..1e6，unitsToPixels=.001..1000，portGap=0..10000，samples=2..256整数。
- 只支持左节点右边缘到右节点左边缘，且必须正向分离；不支持反馈环、回头线或同x垂直连接。
- 竖向厚度=value×unitsToPixels。输入/输出各自按对侧节点中心y、对侧ID、linkId排序；端口组在节点高度内居中。
- 每侧sum(thickness)+(linkCount−1)×portGap必须容纳于节点高度，最多容许32个相应数值量级的机器epsilon舍入误差。禁止暗中压缩量纲或重叠端口。
- **零权重链路仍保留其身份和端口间距**，形状退化不绘制；恒零身份保留自己的位置，不代表配方支持0↔正值交接。若要移除身份，应另做有明确策略的拓扑交接，不用本配方。
- 中心线以单调x和smoothstep y采样；竖直半宽不变。它是分段线性带形包络，不是等法线宽度的描边。采样不足可能有折线感，不能宣传精确曲线或抗锯齿等价；无法表达为严格递增x/正厚度的浮点几何会拒绝。
- 返回`{links,ports,balances}`，包括每条实际编译的旧机制band；可以用已有`drawSampledBand(ctx,link.band,{fill}, {Path2D})`绘制。序列化band不是可绘制缓存，需重算。
- 基础布局仅报告incoming/outgoing/net，不验证业务守恒；source/sink与缺失边语义必须由调用者解释。端口不重叠不等于整个流带无交叉，也不等于没有遮住中间节点。

## 流量交接配方

```js
const plan=compileFlowHandoff({nodes:layout.items,from:beforeLinks,to:afterLinks,
  range:{start:T(4),end:T(9)},unitsToPixels:0.9,portGap:8,samples:128});
const state=sampleFlowHandoff(plan,T(6),{reducedMotion:false});
// {phase,progress,flow:{links,ports,balances}}
```

from/to必须拥有同一组linkId和相同端点，节点几何不变；返回links始终按to顺序。v1每条链路必须两端同为0（恒隐）或两端同为正；不支持0与正值之间的出现/消失，不能用任意近时点的不可表示正宽度让渲染中途抛错。正链路还须满足保守数值裕量：两端最小半宽至少为`32 * Number.EPSILON * max(1, abs(node.bounds.y)+node.bounds.height+1)`（对全部节点取最大值）。这是一项明确的编译域限制，不隐式阈值掉小流量、不伪造量纲。内部节点（同时有输入和输出链路）两端快照必须守恒，source/sink可不平衡；仅容许`32 * Number.EPSILON * max(incoming,outgoing)`的相对求和误差；双零通量容差为0，不使用单位1的绝对下限，以免微量流量被允许凭空倍增。没有外部业务数据验证或自动推导缺失流量。

range沿用start≥0、end>start、end≤24小时rational Time。**共享时钟限制：输入Time分子/分母各不超过30位，中间差分也受同一位数上限约束；极端异分母输入即使各自合法，仍可能抛`Rational exceeds 30-digit bound`。因此不保证每个合法Time组合都能seek。调用者应在渲染前验证计划使用的时间集合，优先使用同一项目帧率生成的时钟；本批不改已发布共享时钟。**配方用旧keyframe求绝对进度、旧smoothstep求空间混合比例；from/to端点值精确保留；对称调用旧lerp避免大到小的消减。reduced直接使用终态权重，但仍返回原phase/progress/时段；是否适合信息变化要由调用者决定，不能据此宣称无障碍通过。

纯状态输出，不绘图/播放声音/写全局时钟；输入复制、输出深冻结，plan仅同模块实例认可。它不是拓扑形变、流体模拟、订单调度算法或实际吞吐提升功能。

## 工程复现与验证范围

```sh
node --test engine/motion-elements/test/layered-dag.test.mjs \
  engine/motion-elements/test/weighted-flow.test.mjs \
  engine/motion-elements/test/flow-handoff.test.mjs
```

当前覆盖基础/边界/非法数据、200个确定种子DAG oracle、可组合尺寸极值、权重/端口/守恒、恒零权重/零跨越预拒绝、数值下溢与安全宽度、reverse seek、进程隔离与Native像素状态。数值合同已独立审计；工程测试与作品实际调用的证据分开管理。源代码存在或单测通过均不构成影片艺术验收。


从仓库根目录可运行不依赖媒体的合成例：

```sh
node --input-type=module <<'JS'
import {rational as T, layeredDagLayout, weightedFlowLayout,
  compileFlowHandoff, sampleFlowHandoff} from './engine/motion-elements/lib/index.mjs';
import {createOrderFlowPlan, sampleOrderFlow} from './engine/motion-elements/examples/order-flow-data.mjs';
const {layout, plan} = createOrderFlowPlan();
console.log(layout.extent, sampleOrderFlow(plan, T(7)).display);
JS
```

合成例是数据/状态最小复现，时段为 4.5–9.5 秒，不是影片源码或电影同版复刻；
真实成片按导演需要改为下列参数。绘制应把本模块生成的 `link.band` 交给同一 runtime
实例的旧 `drawSampledBand`，不要在两份 import 路径之间混用 WeakSet 校验对象。
数字显示建议由同一总量推导互补取整值，避免两个 .5 独立四舍五入显示 101 单；
这只是调用方展示策略，不是新基础机制或实际订单预测。

## 《订单流动》真实作品覆盖

14 秒、1920×1080、60 fps、840 帧，含原创离线合成声音。
故事为同一批 100 单进入流程，40 单等待；演示规则开关触发后，等待降到 5，履约变为 95。
所有数据明确为合成说明，不宣称真实产品有此自动优化能力。

| 新项 | 实际调用与可见输出（0-based，帧端点均包含） | 不可扩大为 |
|---|---|---|
| `composition.layered-dag` | 初始化 1 次；节点与端点消费输出于 f157–839 | 每帧重算图、最少交叉/全局避障 |
| `composition.weighted-flow` | 直接初始化 1 次，直接输出可见 f161–407；配方生成的输出可见 f408–839 | 新曲线/流体算法；内部调用次数独立埋点 |
| `recipe.flow-handoff` | 编译 1 次、直接采样 432 次，f408–839；变化中间帧 f409–506，f507 起终态 | 任意拓扑变更、0↔正值出现消失、业务求解 |

实际参数：6 节点尺寸 170×160，`layerGap:265,nodeGap:130`；
`unitsToPixels:1.22,portGap:10,samples:128`；交接范围 rational `6.8–8.45` 秒。
图关系为 Received→Auto(40)/Review(60)、Auto→Ready(40)、
Review→Held(40→5)/Ready(20→55)、Ready→Fulfilled(60→95)。
以上几何和数值真实驱动画面，不是导入函数后另画手调线宽。
影片实际相机倍率上限 1.2，当前 uniform-x / smoothstep-y 采样的最大弦误差保守界约 0.0141 像素；
该数学界不包含栅格化/抗锯齿/文字误差，不能作为艺术通过指标。

旧项实际复用：`motion.transform`、`motion.opacity`、`motion.stagger`、
`geometry.sampled-band`、`motion.keyframe-track`。内部 sampleKeyframeTrack / compileSampledBand
由冻结源码控制流证明，不冒称另有逐函数埋点。规则开关、光痕、标题、取整、镜头和声音为项目层，不追加条目。

私有交付包含最终 MP4、`manifest.json`、逐帧 `actual-api-usage.json`、指导文档、
重建源码/字体许可/原创声音、SHA-256 与独立审查回执；本仓库不附这些私有资源。
完整影片复现须使用该交付的冻结项目，在已有 Node 24、Canvas 0.1.100、FFmpeg/ffprobe、Python 环境下
执行其 `source/score.py`、`source/qa.mjs`、`source/preview.mjs`、`source/render.mjs`、`source/finalize.py`，
无安装、网络、密钥。公共合成数据例不能替代此完整制作链。

已核查全部 840 帧数值守恒、15 帧顺逆序及 7 帧独立新进程像素、全片解码、密集邻帧与实际消费。
影片保留原冻结 runtime 身份；其后微量守恒校验修复以原片全部实际帧状态和 Native 代表帧的新旧等价回执单独绑定，不能称原片已由修复版全长重渲。

常速连续观看 `NOT_DONE`；听审 `NOT_LISTENED`；用户交付评价 `LIMITED_ACCEPTANCE_NOT_STYLE_ENDORSEMENT`，不是设计风格推荐。技术结果保持原状态，不能把视觉评价推成数学失效，也不能把有限接受推成普遍迁移通过。
空图、非法输入、极端数值、恒零及 reduced-motion 的工程测试不等于它们在影片中出现或获视觉接受。
工程/静帧通过不能默认推荐作品风格；数量目标仍是 100 个基础机制，配方单列。

官方原理、具体源码入口和许可核查见[参考决定](data-flow-reference-decisions.md)。
