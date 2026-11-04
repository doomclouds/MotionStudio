# 最小间距点集：可重复的圆域稀疏布局

<!-- asset-self-description: composition.poisson-disc -->

Seeded bounded Bridson sampling in a circular domain.

当前注册状态：`experimental`；公共调用入口：`lib/index.mjs`，API：`samplePoissonDisc`。参数验证以实现为准，不把编译、采样或绘图支持再计数。

实现：[lib/foundations/layout/poisson-disc/index.mjs](./index.mjs)。

## 设计意图与选择

让圆形区域或保护区周围的少量点具有稳定中心间距，又不落入机械网格。它只提供静态布局，不负责点之间的运动、视觉层级或真实物体碰撞。

## 输出、身份与降动效边界

返回domain、exclusion、minDistance、maxPoints、points、termination及claims等数据，输入复制、输出冻结。检查实际点数和终止原因，不假设必定达到maxPoints。seed固定时输出可重复，但不承诺不同seed都满足作者的构图偏好。无时间或reducedMotion选项；动态交接由其他机制与调用者处理。

## 参数、用途与边界

```js
import {samplePoissonDisc} from '../../../index.mjs';
const result=samplePoissonDisc({
  domain:{x:0,y:0,radius:300}, exclusion:{x:0,y:0,radius:100},
  minDistance:80, seed:8602, maxPoints:40, attempts:30,
});
```

Original bounded2D Bridson-style active-list sampler. It returns seeded points with at least `minDistance` between centers, inside the circle domain and outside the optional exclusion circle. Exclusion must lie strictly within the domain. This mechanism is static layout, NOT collision dynamics, a trajectory solver, cryptographic RNG, exact-count generator or maximal packing proof. `maxPoints` is a cap; inspect returned count and termination (`point-limit` or `active-list-exhausted`).

Uniform-area annulus proposals use radii between r and2r; background cells accelerate neighbor checks. Initialization is rejection-sampled with a4096-proposal ceiling and may explicitly fail for an extremely narrow available domain. `attempts` defaults30, accepts1–64; points1–128, spatial grid≤262144 cells. Domain/exclusion x/y±1e6, radius0.001–1e5; minDistance0.001–2e5; seed uint32. All records have exact supported ordinary data descriptors; getters/unknown fields reject before reading values. Return is copied/frozen. No array input, callback or new dependency.

中心距约束不等于绘制对象的安全间距：对象半径、描边、阴影外溢以及受保护区域所需的视觉留白，必须由调用者另行检查。静态点集符合 minDistance 也不能证明交接动画路径无碰撞。

## 可执行输入

按 [注册示例](../../../../examples/registered-foundations.mjs) 的 setup/compile/sample 顺序调用；以下为 catalog 输入，不是直接 eval 的代码。

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

注册、技术测试、原生像素、常速观看、实际听审、用户接受和跨场景迁移互不替代。本页没有新增执行或接受声明；当前状态以 [catalog](../../../../catalog.json) 的本条 evidence 为准。此批仍 experimental，通用生产迁移 NOT_RUN；历史试验不能自动升级当前源码。

测试入口：[lib/foundations/layout/poisson-disc/test/poisson-disc.test.mjs](test/poisson-disc.test.mjs).

完整历史合同／研究及来源边界保留在 [历史记录](../../../../docs/history/candidates/poisson-disc.md)；该记录中的旧路径不是调用入口。代码适用 [包许可](../../../../LICENSE)，引用算法、字体、媒体和私有影片不因此取得重新分发许可；相关 SOURCES/来源说明保留在同一历史目录。

## 同目录使用入口与恢复

本页是当前合同；[design.md](design.md)解释选择与导演取舍，[index.mjs](index.mjs)是实际实现，[examples/contract.mjs](examples/contract.mjs)是可执行公开入口示例。目录迁移不新增API或兼容层。机器身份与证据仍只由[catalog](../../../../catalog.json)登记。

Node24+，从仓库根运行：

```sh
node engine/motion-elements/lib/foundations/layout/poisson-disc/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/layout/poisson-disc/test/*.test.mjs
```

实现无外部依赖。公开barrel示例间接依赖同级motion-timeline-core及Node内建crypto，恢复时保留仓库/portable相邻布局。无需Canvas、FFmpeg、字体、媒体或联网；不宣称浏览器原生兼容。示例只验证数值合同，不生成影片。目录调整不升级既有像素、观看、听审、用户接受与跨场景迁移证据。
