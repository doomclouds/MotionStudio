# raster.temporal-exposure

<!-- asset-self-description: raster.temporal-exposure -->

## 当前资产入口

本页为`raster.temporal-exposure`当前合同，机器登记与证据见[catalog](../../../../catalog.json)；[design.md](design.md)说明设计选择，[index.mjs](index.mjs)是实际实现，[examples/contract.mjs](examples/contract.mjs)运行公共barrel与catalog输入的独立断言，[专属测试](test/temporal.test.mjs)保留原数值回归。原模块/guide/test位置不保留wrapper。


Finite temporal tap integration with premultiplied alpha.

当前注册状态：`experimental`；公共调用入口：`lib/index.mjs`，API：`compileTemporalExposure`。参数验证以实现为准，不把编译、采样或绘图支持再计数。

实现：[lib/foundations/raster/temporal-exposure/index.mjs](index.mjs)。

## 参数、用途与边界

Original JavaScript implementation.

`compileTemporalExposure({offsets,weights,boundary})` freezes 1–32 unique integer past-frame offsets (0–3600), finite nonnegative weights with positive sum, and an explicit `transparent` or `clamp-start` boundary. Weights normalize via maximum scaling to avoid sum overflow; underflowing positive relative/normalized weights are rejected. Exact caller arrays must be dense, ordinary data arrays without extra fields/symbols/accessors; no custom iterator is invoked.

`sampleTemporalExposure(plan,frame,{width,height,readFrame})` requests each distinct positive-weight source frame once, in first-tap order, copying each returned base Uint8ClampedArray before further callbacks. Shared backing buffers/subclasses are rejected. Frame is a nonnegative safe integer; only past offsets are supported. Before start, transparent contributes zero without renormalization, or clamp reuses frame 0. No automatic end-of-media policy exists: the caller owns the frame provider for every requested nonnegative absolute frame.

Dimensions 1–2048, at most 1,048,576 pixels and 8,388,608 pixel-taps per call. No history accumulator or hidden warm-up: repeated/out-of-order calls depend solely on source data and plan. Resource checks precede frame callbacks. Callback work itself remains caller-controlled; no time bound on user code is promised.

Input is straight RGBA8. Samples accumulate weighted alpha and weighted RGB×alpha, then unpremultiply and round; zero-quantized alpha is canonical transparent black. Arithmetic is **encoded-byte RGB**, not linear-light/physical camera exposure, optical flow or sub-frame interpolation. Output sourceFrames records actual callback identities. It is distinct from spatial convolution and source-over layers; this distinction does not itself guarantee visual quality or public foundation status.

## 可执行输入

按 [注册示例](../../../../examples/registered-foundations.mjs) 的 setup/compile/sample 顺序调用；以下为 catalog 输入，不是直接 eval 的代码。

```json
{
  "offsets": [
    0,
    1
  ],
  "weights": [
    1,
    3
  ]
}
```

## 当前证据与来源边界

注册、技术测试、原生像素、常速观看、实际听审、用户接受和跨场景迁移互不替代。本页没有新增执行或接受声明；当前状态以 [catalog](../../../../catalog.json) 的本条 evidence 为准。此批仍 experimental，通用生产迁移 NOT_RUN；历史试验不能自动升级当前源码。

测试入口：[test/temporal.test.mjs](test/temporal.test.mjs).

完整历史合同／研究及来源边界保留在 [历史记录](../../../../docs/history/candidates/temporal-exposure.md)；该记录中的旧路径不是调用入口。代码适用 [包许可](../../../../LICENSE)，引用算法、字体、媒体和私有影片不因此取得重新分发许可；相关 SOURCES/来源说明保留在同一历史目录。

## 运行与恢复

从完整仓库根运行：

```sh
node engine/motion-elements/lib/foundations/raster/temporal-exposure/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/raster/temporal-exposure/test/*.test.mjs
```

Node24+。实现无外部依赖。公共barrel还间接加载相邻motion-timeline-core及Node内建crypto，恢复时保留仓库/portable相邻布局。示例不联网、不读取媒体、不生成影片。代码适用[包MIT许可](../../../../LICENSE)，不授权参考文献图表或历史作品的媒体、字体、声音。

目录整理不改变算法、数值范围或接受状态。历史影片和旧版等价记录仍绑定原版本，不能从文件搬迁推导新版影片重渲或听看通过。现有跨资产集成测试保留在包test目录，不复制进每个资产。

readFrame必须返回非共享buffer上的基础Uint8ClampedArray straight-alpha RGBA8帧，返回数据会复制。输出{width,height,data,sourceFrames,tapCount}可变，但不修改plan或输入帧；sourceFrames记录本次实际读取身份，不证明读取器无副作用。1像素示例只验证算术与首帧边界，不代表动态画面质量或听审。
