# composition.minimum-cost-assignment

Deterministic minimum-cost one-to-one assignment for a square cost matrix.

当前注册状态：`experimental`；公共调用入口：`lib/index.mjs`，API：`minimumCostAssignment`。参数验证以实现为准，不把编译、采样或绘图支持再计数。

实现：[lib/foundations/layout/minimum-cost-assignment.mjs](../../lib/foundations/layout/minimum-cost-assignment.mjs)。

## 参数、用途与边界

## 通用合同

所有记录必须为普通对象、准确字段集合、数据属性，拒绝未知字段、symbol和getter；代理对象不属于支持输入。数组必须为稠密数据数组；不读取索引getter。点为 `{x,y}`，每轴有限且在[-10000,10000]；矩形 `{x,y,width,height}`，宽高[0.0001,10000]。不修改输入，不缓存调用者数组。浮点运算不是鲁棒精确计算几何内核。外部ID由输入顺序对应，算法不生成业务身份。验证器、矩阵求解、插值strength与示例时钟全部支持层，不另计基础。

### 2. `minimumCostAssignment(costs)`

1–128方阵、成本[0,1e9]，返回 `{columns,totalCost}`；`columns[i]`为第i源匹配的唯一目标列。Hungarian算法O(N³)时间、O(N²)输入副本；支持浮点非负成本，相同输入固定tie策略，但不承诺所有等价最优解中字典序最小。没有遗漏/新增对象，不能传Infinity表示禁边。

应用：同数量对象从散落状态到目标位置、角色排位、物件搬运；调用者可把路线长度/颜色差/业务成本作为矩阵。区别layout-handoff：后者要求ID已对应，本项解未确定的一一对应；不同grid-transport的栅格场输运。匹配不等于轨迹，不保证运动途中无相撞。

## 可执行输入

按 [注册示例](../../examples/registered-foundations.mjs) 的 setup/compile/sample 顺序调用；以下为 catalog 输入，不是直接 eval 的代码。

```json
[
  [
    10,
    1
  ],
  [
    2,
    9
  ]
]
```

## 当前证据与来源边界

注册、技术测试、原生像素、常速观看、实际听审、用户接受和跨场景迁移互不替代。本页没有新增执行或接受声明；当前状态以 [catalog](../../catalog.json) 的本条 evidence 为准。此批仍 experimental，通用生产迁移 NOT_RUN；历史试验不能自动升级当前源码。

测试入口：[test/seven-foundations-geometry.test.mjs](../../test/seven-foundations-geometry.test.mjs).

完整历史合同／研究及来源边界保留在 [历史记录](../history/private-candidates/seven-foundations/geometry-GUIDE.zh-CN.md)；该记录中的旧路径不是调用入口。代码适用 [包许可](../../LICENSE)，引用算法、字体、媒体和私有影片不因此取得重新分发许可；相关 SOURCES/来源说明保留在同一历史目录。
