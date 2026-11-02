# composition.poisson-disc

Seeded bounded Bridson sampling in a circular domain.

当前注册状态：`experimental`；公共调用入口：`lib/index.mjs`，API：`samplePoissonDisc`。参数验证以实现为准，不把编译、采样或绘图支持再计数。

实现：[lib/foundations/layout/poisson-disc.mjs](../../lib/foundations/layout/poisson-disc.mjs)。

## 参数、用途与边界

```js
import {samplePoissonDisc} from '../../lib/index.mjs';
const result=samplePoissonDisc({
  domain:{x:0,y:0,radius:300}, exclusion:{x:0,y:0,radius:100},
  minDistance:80, seed:8602, maxPoints:40, attempts:30,
});
```

Original bounded2D Bridson-style active-list sampler. It returns seeded points with at least `minDistance` between centers, inside the circle domain and outside the optional exclusion circle. Exclusion must lie strictly within the domain. This mechanism is static layout, NOT collision dynamics, a trajectory solver, cryptographic RNG, exact-count generator or maximal packing proof. `maxPoints` is a cap; inspect returned count and termination (`point-limit` or `active-list-exhausted`).

Uniform-area annulus proposals use radii between r and2r; background cells accelerate neighbor checks. Initialization is rejection-sampled with a4096-proposal ceiling and may explicitly fail for an extremely narrow available domain. `attempts` defaults30, accepts1–64; points1–128, spatial grid≤262144 cells. Domain/exclusion x/y±1e6, radius0.001–1e5; minDistance0.001–2e5; seed uint32. All records have exact supported ordinary data descriptors; getters/unknown fields reject before reading values. Return is copied/frozen. No array input, callback or new dependency.

中心距约束不等于绘制对象的安全间距：对象半径、描边、阴影外溢以及受保护区域所需的视觉留白，必须由调用者另行检查。静态点集符合 minDistance 也不能证明交接动画路径无碰撞。

## 可执行输入

按 [注册示例](../../examples/registered-foundations.mjs) 的 setup/compile/sample 顺序调用；以下为 catalog 输入，不是直接 eval 的代码。

```json
{
  "domain": {
    "x": 0,
    "y": 0,
    "radius": 100
  },
  "minDistance": 20,
  "seed": 0,
  "maxPoints": 12
}
```

## 当前证据与来源边界

注册、技术测试、原生像素、常速观看、实际听审、用户接受和跨场景迁移互不替代。本页没有新增执行或接受声明；当前状态以 [catalog](../../catalog.json) 的本条 evidence 为准。此批仍 experimental，通用生产迁移 NOT_RUN；历史试验不能自动升级当前源码。

测试入口：[test/poisson-disc.test.mjs](../../test/poisson-disc.test.mjs).

完整历史合同／研究及来源边界保留在 [历史记录](../history/candidates/poisson-disc.md)；该记录中的旧路径不是调用入口。代码适用 [包许可](../../LICENSE)，引用算法、字体、媒体和私有影片不因此取得重新分发许可；相关 SOURCES/来源说明保留在同一历史目录。
