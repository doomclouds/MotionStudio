# composition.weighted-hierarchy

Recursive weighted slice-and-dice hierarchy partition.

当前注册状态：`experimental`；公共调用入口：`lib/index.mjs`，API：`layoutWeightedHierarchy`。参数验证以实现为准，不把编译、采样或绘图支持再计数。

实现：[lib/foundations/layout/weighted-hierarchy.mjs](../../lib/foundations/layout/weighted-hierarchy.mjs)。

## 参数、用途与边界

`layoutWeightedHierarchy({tree,bounds,axis?})` performs original ordered alternate-axis slice-and-dice partitioning. `axis` is `x` (default) or `y`. `tree` nodes have unique ASCII IDs matching `[A-Za-z0-9_-]{1,64}`. A leaf has `{id,weight}`; a branch has `{id,children}` and derives its weight solely from descendants. It does not accept a branch weight. Output nodes retain parent ID, depth, aggregate weight, leaf flag and rectangle.

```js
import {layoutWeightedHierarchy} from '../../lib/index.mjs';
const result = layoutWeightedHierarchy({
  tree:{id:'root',children:[{id:'work',weight:2},{id:'garden',weight:3}]},
  bounds:{x:0,y:0,width:500,height:300}, axis:'x',
});
```

Continuous leaf areas are proportional to weights within floating-point arithmetic; each split preserves order and parent containment. Zero leaves/branches occupy zero area; all-zero root rejects. No squarification, aspect-ratio optimality, pixel rounding, dynamic transitions or architecture constraints are promised. Tiny positive regions that cannot retain positive representable extents reject rather than silently disappear.

Limits:256 nodes, depth16 (root0),128 children per branch; leaf weight0–1e9 and total≤1e12. Bounds x/y±1e6 and positive width/height0.001–1e6. Ordinary records/dense arrays only; accessors, duplicate IDs, cycles, missing fields and unknown fields reject. Input copied, output deeply frozen; no global randomness/clock/dependency.

Different from grid/wrap because fixed total area is recursively allocated by hierarchical weights; different from DAG because this is a strict rooted tree; different from weighted-flow because the result is nested area, not flow-band ports. Existing layout handoff may interpolate output rectangles, but intermediate geometry is not automatically a freshly weighted partition.

Tests: exact known oracle,100 deterministic randomized hierarchy partitions, all-pairs nonoverlap/containment/area, zero subtrees, resource boundaries, precision failures, immutable data and descriptor rejection. Original code, established algorithm; research/rights remain in the linked historical source notes.

## 可执行输入

按 [注册示例](../../examples/registered-foundations.mjs) 的 setup/compile/sample 顺序调用；以下为 catalog 输入，不是直接 eval 的代码。

```json
{
  "tree": {
    "id": "r",
    "children": [
      {
        "id": "a",
        "weight": 1
      },
      {
        "id": "b",
        "weight": 3
      }
    ]
  },
  "bounds": {
    "x": 0,
    "y": 0,
    "width": 100,
    "height": 80
  }
}
```

## 当前证据与来源边界

注册、技术测试、原生像素、常速观看、实际听审、用户接受和跨场景迁移互不替代。本页没有新增执行或接受声明；当前状态以 [catalog](../../catalog.json) 的本条 evidence 为准。此批仍 experimental，通用生产迁移 NOT_RUN；历史试验不能自动升级当前源码。

测试入口：[test/weighted-hierarchy.test.mjs](../../test/weighted-hierarchy.test.mjs).

完整历史合同／研究及来源边界保留在 [历史记录](../history/candidates/weighted-hierarchy.md)；该记录中的旧路径不是调用入口。代码适用 [包许可](../../LICENSE)，引用算法、字体、媒体和私有影片不因此取得重新分发许可；相关 SOURCES/来源说明保留在同一历史目录。
