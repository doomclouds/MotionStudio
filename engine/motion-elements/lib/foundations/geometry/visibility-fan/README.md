# 可见扇区：整数拓扑下的最近遮挡

<!-- asset-self-description: geometry.visibility-fan -->

Nearest-blocker visibility fan inside a rectangle.

当前注册状态：`experimental`；公共调用入口：`lib/index.mjs`，API：`visibilityFan`。参数验证以实现为准，不把编译、采样或绘图支持再计数。

实现：[lib/foundations/geometry/visibility-fan/index.mjs](./index.mjs)。

## 设计意图与输出职责

用一个视点与有限不透明线段界定二维可见区，适合解释遮挡，不提供照明风格。返回冻结source、fans、rayTests、coordinateErrorBound、segmentCount与contract；每个fan含a、b、segmentId，与同一source组成三角形。它是无状态查询，不需要编译plan；不包含软影、亮度或时间。

## 参数、用途与边界

`visibilityFan({bounds:{x,y,width,height},source:{x,y},segments:[{a:{x,y},b:{x,y}}]})`

All coordinates are explicit safe integer lattice units, each in [-1e9,+1e9]. Width/height are 1..1e9 and viewport maximum coordinates must remain within the coordinate range. There is **no silent rounding**. Caller may encode 1 pixel as 64 lattice units, but must record that quantization. Source and all supplied segment endpoints must be strictly inside the rectangular viewport. Up to 64 nonzero segments; no proper crossing, overlapping segment or T junction. Exact shared endpoints are permitted, including collinear continuation. Source must not lie on any segment. A closed obstacle loop is supported as its edges, but checking that a source is outside the filled obstacle is the caller's semantic responsibility: the primitive knows opaque segments, not filled solids.

Output is a frozen source and ordered triangle fan sectors (`source,a,b`) whose union is the **regularized** visibility area. Zero-width visible needles and the effects of purely radial zero-width occluders are not represented. No soft shadow, light falloff, perspective, reflection, continuous-time guarantee or illumination physics. `segmentId` identifies the nearest input edge; 64..67 identify implicit viewport edges.

## Algorithm and numeric contract

BigInt exact orientation and intersection tests validate topology; direction order uses half-plane and cross products, not atan2. Exactly equal angular events merge. Between adjacent event directions, a positive vector sum gives an interior ray. Every edge is tested, and the nearest nonnegative rational distance is chosen by exact cross multiplication. Nonintersecting edges cannot exchange order inside a sector. Each chosen edge is intersected with both **unperturbed** boundary directions. No ±angle epsilon, snapped-event tolerance or floating-point topology predicate.

Only final exact rational coordinates are converted to binary64. At the bounded input scale, the conservative absolute coordinate conversion budget is **1e-6 lattice units**, not zero. Source integer coordinates are exactly representable. Each output triangle must have a positive floating determinant above `4e-6*sum(abs(relative components)) + 16*EPSILON*(abs(product1)+abs(product2)) + 16e-12`; otherwise the query explicitly throws `RangeError: output fan too thin for certified binary64 coordinates`. This is a conservative rejection for output resolution, not geometric merging. Exact predicates do NOT imply exact rendered pixels. Antialiasing seams and compositing are renderer responsibilities, checked separately.

Supporting-line collinearity is legal if the source is off the actual segment. Distinct almost-collinear directions stay distinct internally; unresolved output wedges reject. Exact radial events are handled as regularized boundaries. All queries are stateless and deterministic. Each complete query returns or throws; there is no partial result/cached continuation.

## Resource and data contract

At most 68 edges and 136 unique endpoint directions, hence at most 9,248 interior ray tests; O(n²) exact bounded-integer operations and O(n) output. Integer bit widths are bounded by the coordinate cap. No user callbacks, iterators, random source, allocation controlled by arbitrary dimensions, or runtime dependencies. Ordinary/null-prototype record data descriptors only; exact required keys, no extra/symbol fields. Arrays must be dense ordinary arrays of data slots. Accessors rejected without invocation. JavaScript Proxy traps are not sandboxed by this API.

调用者必须对实际运动路径逐帧及密集取样检查量化后位置，另核端点及光源与实体（light-solid）的关系；仅合法端点不能证明两端之间的连续路线都满足输入域或视觉要求。机制输出不代替调用方的路径／遮挡 QA。

## 可执行输入

按 [注册示例](../../../../examples/registered-foundations.mjs) 的 setup/compile/sample 顺序调用；以下为 catalog 输入，不是直接 eval 的代码。

```json
{
  "bounds": {
    "x": 0,
    "y": 0,
    "width": 1000,
    "height": 800
  },
  "source": {
    "x": 121,
    "y": 333
  },
  "segments": []
}
```

## 当前证据与来源边界

注册、技术测试、原生像素、常速观看、实际听审、用户接受和跨场景迁移互不替代。本页没有新增执行或接受声明；当前状态以 [catalog](../../../../catalog.json) 的本条 evidence 为准。此批仍 experimental，通用生产迁移 NOT_RUN；历史试验不能自动升级当前源码。

测试入口：[lib/foundations/geometry/visibility-fan/test/visibility-fan.test.mjs](test/visibility-fan.test.mjs).

完整历史合同／研究及来源边界保留在 [历史记录](../../../../docs/history/private-candidates/visibility-fan/ORIGIN-CONTRACT.md)；该记录中的旧路径不是调用入口。代码适用 [包许可](../../../../LICENSE)，引用算法、字体、媒体和私有影片不因此取得重新分发许可；相关 SOURCES/来源说明保留在同一历史目录。

## 同目录使用入口与恢复

本页是当前合同；[design.md](design.md)解释选择与导演取舍，[index.mjs](index.mjs)是实际实现，[examples/contract.mjs](examples/contract.mjs)是可执行公开入口示例。目录迁移不新增API或兼容层。机器身份与证据仍只由[catalog](../../../../catalog.json)登记。

Node24+，从仓库根运行：

```sh
node engine/motion-elements/lib/foundations/geometry/visibility-fan/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/geometry/visibility-fan/test/*.test.mjs
```

实现无外部依赖。公开barrel示例间接依赖同级motion-timeline-core及Node内建crypto，恢复时保留仓库/portable相邻布局。无需Canvas、FFmpeg、字体、媒体或联网；不宣称浏览器原生兼容。示例只验证数值合同，不生成影片。目录调整不升级既有像素、观看、听审、用户接受与跨场景迁移证据。
