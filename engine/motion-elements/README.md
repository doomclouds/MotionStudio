# Motion Elements — 可组合动效基础库

可组合的纯状态机制、配方与 Canvas 适配器，不是影片模板库。当前 [catalog.json](catalog.json) 为61基础＋7配方，全部 `experimental`；sprite-atlas、polyline-sections及数学/时间/适配支持不另计数。数量不代表艺术或生产成熟度。

## 入口与运行边界

- 公共 API：[`lib/index.mjs`](lib/index.mjs)；arrival 使用显式 [`motion-elements/node`](lib/node.mjs)。[API清单](docs/public-api.json) 与 [注册调用示例](examples/registered-foundations.mjs) 按目录定位。
- Node 24+；默认入口经同级 timeline-core 依赖 `node:crypto`，不宣称原生浏览器兼容。arrival也依赖同级核心。保持仓库／portable中的相邻布局，不单拷模块冒称独立可运行。
- 原生预览／像素测试需要已安装的 `@napi-rs/canvas`；编码示例需要 FFmpeg。不自动安装、下载素材或调用云服务。
- 基础机制按 `lib/foundations/<职责>/` 组织；配方在 `lib/recipes/offset-reassembly/index.mjs`／`lib/recipes/`，支持在 `lib/support/`，适配器在 `adapters/`。旧candidate barrel及field/IK/sticky平层wrapper已移除，不提供兼容路径。其他尚在平层的真实实现不是别名。
- **运行时验证器管输入行为，catalog管稳定身份和检索，docs管使用边界。** 不从catalog动态执行外部代码，也不把JSON示例当另一个校验器。

## 资产目录迁移

[有限粒子](lib/foundations/motion/finite-particles/README.md) 将使用合同、设计意图、实际实现、可运行示例和测试放在同一目录。catalog 的 `evidence.guidance` 直接进入资产 README；公开 API 保持不变。另已共置[固定弦波](lib/foundations/motion/fixed-string-wave/README.md)、[孤立圆盘事件](lib/foundations/motion/hard-disc-events/README.md)、[最小间距点集](lib/foundations/layout/poisson-disc/README.md)。本批另共置[层级面积](lib/foundations/layout/weighted-hierarchy/README.md)、[可见扇区](lib/foundations/geometry/visibility-fan/README.md)、[网格输运](lib/foundations/field/grid-transport/README.md)、[单介质光链](lib/foundations/geometry/ray-chain/README.md)。再共置[两连杆IK](lib/foundations/geometry/two-link-ik/README.md)、[校准平面视差](lib/foundations/layout/plane-parallax/README.md)、[分区固定标题](lib/foundations/layout/sticky-interval/README.md)。另共置[悬链线](lib/foundations/geometry/catenary/README.md)、[固定区间分轨](lib/foundations/layout/interval-lanes/README.md)、[时间曝光](lib/foundations/raster/temporal-exposure/README.md)。再共置[逐行换行](lib/foundations/layout/flow-wrap/README.md)、[同宽瀑布流](lib/foundations/layout/masonry/README.md)、[锚点标签](lib/foundations/layout/anchored-labels/README.md)。再共置[三次曲线](lib/foundations/geometry/cubic-path/README.md)、[路径字格](lib/foundations/typography/glyph-run-path/README.md)、[刚性铰链](lib/foundations/geometry/hinged-panel/README.md)。再共置[等值线](lib/foundations/geometry/iso-contour/README.md)、[邻域卷积](lib/foundations/raster/convolution/README.md)、[四角投影](lib/foundations/raster/projective-raster/README.md)。再共置[二维蒙皮](lib/foundations/geometry/affine-skin/README.md)、[阻尼响应](lib/foundations/motion/damped-response/README.md)、[分阶段布局交接](lib/recipes/staged-layout-handoff/README.md)。再共置[焦点接力](lib/recipes/focus-handoff/README.md)、[片块署名](lib/recipes/tile-signature/README.md)、[灯点映像](lib/recipes/light-echo-field/README.md)。再共置[有序分带](lib/foundations/layout/ordered-bands/README.md)、[覆盖率网屏](lib/foundations/geometry/halftone-screen/README.md)、[覆盖率形态学](lib/foundations/raster/morphology-coverage/README.md)。再共置[最近站点分区](lib/foundations/geometry/voronoi-cells/README.md)、[矩形避障](lib/foundations/geometry/rectangle-obstacle-route/README.md)、[径向地标变形](lib/foundations/geometry/radial-landmark-warp/README.md)、[最小成本指派](lib/foundations/layout/minimum-cost-assignment/README.md)。再共置[平方距离变换](lib/foundations/raster/distance-transform/README.md)、[调色板误差扩散](lib/foundations/raster/palette-diffusion/README.md)、[投影反应扩散](lib/foundations/field/reaction-diffusion/README.md)。再共置[分层DAG](lib/foundations/layout/layered-dag/README.md)、[加权流](lib/foundations/layout/weighted-flow/README.md)、[流量交接](lib/recipes/flow-handoff/README.md)。再共置[关键帧轨道](lib/foundations/motion/keyframe-track/README.md)、[布局交接](lib/recipes/layout-handoff/README.md)、[到达场](lib/foundations/field/arrival-field/README.md)。再共置[圆域揭示](lib/foundations/transition/iris-reveal/README.md)、[线性遮罩](lib/foundations/transition/linear-mask/README.md)、[固定切片](lib/foundations/fragment/fixed-tiles/README.md)。再共置[折线路径拖尾](lib/foundations/geometry/polyline-trail/README.md)、[登记轮廓形变](lib/foundations/geometry/registered-polygon-morph/README.md)、[采样条带](lib/foundations/geometry/sampled-band/README.md)。再共置[解析方向场](lib/foundations/field/attractor-orientation/README.md)、[分带错位](lib/foundations/transition/masked-slice-displacement/README.md)、[局部几何揭示](lib/foundations/reveal/local-geometry/README.md)。再共置[错峰时间](lib/foundations/motion/stagger/README.md)、[偏移卡片重组](lib/recipes/offset-reassembly/README.md)、[固定格网](lib/foundations/layout/grid/README.md)、[尺寸堆叠](lib/foundations/layout/constraint-stack/README.md)。再共置[偏移卡片](lib/foundations/layout/offset-cards/README.md)、[等分面板](lib/foundations/layout/split-panels/README.md)、[覆盖合成](lib/foundations/raster/matte/README.md)、[二维位移图](lib/foundations/raster/displacement-map/README.md)。其余6项仍按各自guidance进入；共享时间、数学、验证与适配器不复制进每项，未把统一索引误称为全库完成。

## 未注册受限候选

[过去位置与速度采样候选](docs/temporal-motion-candidate.md)：有界绝对时间回采与后向割线速度；区别于空间弧长拖尾及像素曝光，不负责绘图/形变策略，未进入 catalog 或公共 barrel。

[二维半板身份交接](docs/split-flap-candidate.md)：上下半面共轴压缩与中点身份切换的有界支持候选，非三维翻页；不进入公共 barrel/catalog 计数。

[单主体口沿遮挡合成](docs/single-occlusion-candidate.md)仅为单主体、单遮挡、统一前景色的最终 raster 合成候选，复用现有 snapshot 合同；不进入公共 barrel/catalog 计数。先读合同与 Native 验证边界。

## 最小调用

```js
import {
  rational as T, framesToTime, sampleMotion, withMotion,
} from './lib/index.mjs';

const move = {
  type: 'motion.transform', version: 1,
  range: {start: T(0), end: T(2)},
  curve: {type: 'smoothstep'},
  params: {
    from: {x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0},
    to: {x: 120, y: 0, scaleX: 1.2, scaleY: 1.2, rotation: 0},
    origin: {x: 50, y: 50},
  },
};
const at = framesToTime(15, {n: 30, d: 1});
const state = sampleMotion(move, at, {reducedMotion: false});
withMotion(ctx, state, c => c.fillRect(0, 0, 100, 100));
```


`ctx` 由调用者提供。动作按绝对时间求值，不依赖上一帧；需要终态留读时显式安排hold。完整时间／曲线／参数表见[基础 API](docs/guides/core-api-and-time.md)，矩阵、Canvas状态与reduced-motion见[组合合同](docs/guides/canvas-composition.md)。

## 先查机制，再读合同

从仓库根运行：

```sh
node engine/motion-elements/scripts/query-catalog.mjs find --text '重组' --status experimental
node engine/motion-elements/scripts/query-catalog.mjs show --id fragment.fixed-tiles
```

查询只读metadata，不执行示例、不联网、不读取私有知识。完整过滤规则与CLI见[目录查询](docs/guides/catalog-query.md)。命中后读条目的 `evidence.guidance`、参数、反例及未验范围；完整公共入口导航见[注册适配](docs/registered-foundations.md)。

| 任务 | 详细合同 |
|---|---|
| transform／opacity／stagger／初始布局与重组 | [基础 API／时间](docs/guides/core-api-and-time.md)、[矩阵与Canvas组合](docs/guides/canvas-composition.md) |
| 路径／轮廓形变／条带包络 | [几何合同](docs/guides/paths-and-contours.md) |
| 局部揭示／有限落定／片块 | [落定与揭示](docs/guides/settle-and-local-reveal.md)、[固定片块](lib/foundations/fragment/fixed-tiles/README.md) |
| 两场景圆域／斜向揭示 | [Iris与linear-mask](docs/guides/reveal-transitions.md) |
| 方向场／分带错位 | [field与slices](docs/guides/field-and-slices.md) |
| 焦点／片块署名／灯点映像配方 | [focus](lib/recipes/focus-handoff/README.md)、[signature](lib/recipes/tile-signature/README.md)、[light echo](lib/recipes/light-echo-field/README.md) |
| 固定类别份额变化／共享边界分带 | [合同与两种合成内容消费者](lib/foundations/layout/ordered-bands/README.md) |
| UI、数据流、rig、raster与其余注册机制 | [catalog](catalog.json) 的具体 guidance；[当前注册导航](docs/registered-foundations.md) |
| 合成gallery／技术检查／机制提炼 | [展示与收录](docs/guides/gallery-and-registration.md) |
| 既有作品调用与版本桥接 | [历史批次及限定证据](docs/history/production-batches.md)，不是当前作品通过证明 |

## 未注册研究候选

[球面光斑场](docs/guides/spherical-splats-candidate.md)：独立可测试的表面标量投影研究；尚未进入 catalog / 公共 barrel，不增加机制计数，不代表原参考 shader 或真实体积。

[折叠标量场与径向扰动](docs/guides/folded-ripple-candidate.md)：固定五轮二维场与单次绝对时间事件；源码机制研究，未与原例可视预览核验，不增加正式计数。

[多频密度与细脊材料](docs/guides/filament-density-candidate.md)：可播种二维标量纹理；分离密度与扭曲细脊，不是烟流模拟，仅局部静帧研究、不增加正式计数。

## 质量与权利边界

目录命中与技术测试只提供机制候选，不构成风格推荐。实验示例不是优质动效或默认风格锚点。完整作品被用户否决时，私有Case记录作品质量不通过，不能以局部认可或“仅未验”充当成功迁移；也不能反推每个数学原语失效。重用须重新说明场景并验证。

技术、关键帧、常速观看、实际听审、同步、用户接受和跨场景迁移分别记录。参数、颜色、方向、快慢变体及helper不增加机制数量；公开知识链接只能指向已存在且获准公开的资料，不伪造经验或泄露私人回执。

代码适用 [LICENSE](LICENSE)；第三方范围见仓库 [THIRD_PARTY_NOTICES](../../THIRD_PARTY_NOTICES.md) 和 [SOURCE-SCOPE](../../SOURCE-SCOPE.md)。代码许可不自动覆盖字体、图片、声音或私有影片；对应官方参考与许可取舍保留在专项docs，历史来源资料在 [history](docs/history/README.md)。
