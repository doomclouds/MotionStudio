# 订单流转与瓶颈变化 — 使用指导

本批为 **2 个基础机制＋1 个配方**，全部 experimental。已有 14 秒有声原创验证作品的真实调用证据。用户对交付有限接受，但未将其视觉设计认可为范例，记录为 `LIMITED_ACCEPTANCE_NOT_STYLE_ENDORSEMENT`；它不是优秀作品或默认风格推荐。`NOT_LISTENED`、常速连续观看 `NOT_DONE`、未验证迁移仍分开保留。无新运行时依赖，无外部代码复制，不做真正3D。

## 场景及去重

- `layeredDagLayout`：把有分支/汇合的有向无环关系排成前后阶段。位置由拓扑最长路径及明确的有限排序启发式决定，不是把grid转方向，也不只支持树。
- `weightedFlowLayout`：用共用量纲把链路数值映射为端口竖向厚度；对同一节点的各条输入/输出分别分配位置，跨两端保持链路身份。新内容是图数据的加权端口分配，不把曲线或颜色当新机制。形状编译、Path2D绘制继续用已有`compileSampledBand`/`drawSampledBand`，不重复登记包络。
- `compileFlowHandoff`/`sampleFlowHandoff`：配方，不是基础机制。在相同节点/链路拓扑上切换两组内部守恒的权重快照；组合已有keyframe轨道、smoothstep/lerp和加权流布局。入场/镜头/标题仍用既有transform/opacity/stagger。

## 分层DAG接口

现役完整参数与数值合同已移至[layered-dag](../lib/foundations/layout/layered-dag/README.md)，同目录含设计、实现、可执行示例及专属测试；下方保留三项组合的制作与历史证据，不提供旧运行时兼容入口。

## 加权流接口

现役完整参数与数值合同已移至[weighted-flow](../lib/foundations/layout/weighted-flow/README.md)，同目录含设计、实现、可执行示例及专属测试；下方保留三项组合的制作与历史证据，不提供旧运行时兼容入口。

## 流量交接配方

现役完整参数与数值合同已移至[flow-handoff](../lib/recipes/flow-handoff/README.md)，同目录含设计、实现、可执行示例及专属测试；下方保留三项组合的制作与历史证据，不提供旧运行时兼容入口。

## 工程复现与验证范围

```sh
node --test engine/motion-elements/lib/foundations/layout/layered-dag/test/layered-dag.test.mjs \
  engine/motion-elements/lib/foundations/layout/weighted-flow/test/weighted-flow.test.mjs \
  engine/motion-elements/lib/recipes/flow-handoff/test/flow-handoff.test.mjs
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
