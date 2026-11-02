# Motion Elements — 可组合动效基础库

可组合的纯状态机制、配方与 Canvas 适配器，不是影片模板库。当前 [catalog.json](catalog.json) 为60基础＋7配方，全部 `experimental`；sprite-atlas、polyline-sections及数学/时间/适配支持不另计数。数量不代表艺术或生产成熟度。

## 入口与运行边界

- 公共 API：[`lib/index.mjs`](lib/index.mjs)；arrival 使用显式 [`motion-elements/node`](lib/node.mjs)。[API清单](docs/public-api.json) 与 [注册调用示例](examples/registered-foundations.mjs) 按目录定位。
- Node 24+；默认入口经同级 timeline-core 依赖 `node:crypto`，不宣称原生浏览器兼容。arrival也依赖同级核心。保持仓库／portable中的相邻布局，不单拷模块冒称独立可运行。
- 原生预览／像素测试需要已安装的 `@napi-rs/canvas`；编码示例需要 FFmpeg。不自动安装、下载素材或调用云服务。
- 基础机制按 `lib/foundations/<职责>/` 组织；配方在 `lib/recipes.mjs`／`lib/recipes/`，支持在 `lib/support/`，适配器在 `adapters/`。旧candidate barrel及field/IK/sticky平层wrapper已移除，不提供兼容路径。其他尚在平层的真实实现不是别名。
- **运行时验证器管输入行为，catalog管稳定身份和检索，docs管使用边界。** 不从catalog动态执行外部代码，也不把JSON示例当另一个校验器。

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
| 局部揭示／有限落定／片块 | [落定与揭示](docs/guides/settle-and-local-reveal.md)、[固定片块](docs/guides/fixed-tiles.md) |
| 两场景圆域／斜向揭示 | [Iris与linear-mask](docs/guides/reveal-transitions.md) |
| 方向场／分带错位 | [field与slices](docs/guides/field-and-slices.md) |
| 焦点／片块署名／灯点映像配方 | [focus](docs/guides/focus-handoff.md)、[signature](docs/guides/tile-signature.md)、[light echo](docs/guides/light-echo-field.md) |
| UI、数据流、rig、raster与其余注册机制 | [catalog](catalog.json) 的具体 guidance；[当前注册导航](docs/registered-foundations.md) |
| 合成gallery／技术检查／机制提炼 | [展示与收录](docs/guides/gallery-and-registration.md) |
| 既有作品调用与版本桥接 | [历史批次及限定证据](docs/history/production-batches.md)，不是当前作品通过证明 |

## 未注册研究候选

[球面光斑场](docs/guides/spherical-splats-candidate.md)：独立可测试的表面标量投影研究；尚未进入 catalog / 公共 barrel，不增加机制计数，不代表原参考 shader 或真实体积。

## 质量与权利边界

目录命中与技术测试只提供机制候选，不构成风格推荐。实验示例不是优质动效或默认风格锚点。完整作品被用户否决时，私有Case记录作品质量不通过，不能以局部认可或“仅未验”充当成功迁移；也不能反推每个数学原语失效。重用须重新说明场景并验证。

技术、关键帧、常速观看、实际听审、同步、用户接受和跨场景迁移分别记录。参数、颜色、方向、快慢变体及helper不增加机制数量；公开知识链接只能指向已存在且获准公开的资料，不伪造经验或泄露私人回执。

代码适用 [LICENSE](LICENSE)；第三方范围见仓库 [THIRD_PARTY_NOTICES](../../THIRD_PARTY_NOTICES.md) 和 [SOURCE-SCOPE](../../SOURCE-SCOPE.md)。代码许可不自动覆盖字体、图片、声音或私有影片；对应官方参考与许可取舍保留在专项docs，历史来源资料在 [history](docs/history/README.md)。
