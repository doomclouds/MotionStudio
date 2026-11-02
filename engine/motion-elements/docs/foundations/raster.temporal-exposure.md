# raster.temporal-exposure

Finite temporal tap integration with premultiplied alpha.

当前注册状态：`experimental`；公共调用入口：`lib/index.mjs`，API：`compileTemporalExposure`。参数验证以实现为准，不把编译、采样或绘图支持再计数。

实现：[lib/foundations/raster/temporal-exposure.mjs](../../lib/foundations/raster/temporal-exposure.mjs)。

## 参数、用途与边界

Original JavaScript implementation.

`compileTemporalExposure({offsets,weights,boundary})` freezes 1–32 unique integer past-frame offsets (0–3600), finite nonnegative weights with positive sum, and an explicit `transparent` or `clamp-start` boundary. Weights normalize via maximum scaling to avoid sum overflow; underflowing positive relative/normalized weights are rejected. Exact caller arrays must be dense, ordinary data arrays without extra fields/symbols/accessors; no custom iterator is invoked.

`sampleTemporalExposure(plan,frame,{width,height,readFrame})` requests each distinct positive-weight source frame once, in first-tap order, copying each returned base Uint8ClampedArray before further callbacks. Shared backing buffers/subclasses are rejected. Frame is a nonnegative safe integer; only past offsets are supported. Before start, transparent contributes zero without renormalization, or clamp reuses frame 0. No automatic end-of-media policy exists: the caller owns the frame provider for every requested nonnegative absolute frame.

Dimensions 1–2048, at most 1,048,576 pixels and 8,388,608 pixel-taps per call. No history accumulator or hidden warm-up: repeated/out-of-order calls depend solely on source data and plan. Resource checks precede frame callbacks. Callback work itself remains caller-controlled; no time bound on user code is promised.

Input is straight RGBA8. Samples accumulate weighted alpha and weighted RGB×alpha, then unpremultiply and round; zero-quantized alpha is canonical transparent black. Arithmetic is **encoded-byte RGB**, not linear-light/physical camera exposure, optical flow or sub-frame interpolation. Output sourceFrames records actual callback identities. It is distinct from spatial convolution and source-over layers; this distinction does not itself guarantee visual quality or public foundation status.

## 可执行输入

按 [注册示例](../../examples/registered-foundations.mjs) 的 setup/compile/sample 顺序调用；以下为 catalog 输入，不是直接 eval 的代码。

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

注册、技术测试、原生像素、常速观看、实际听审、用户接受和跨场景迁移互不替代。本页没有新增执行或接受声明；当前状态以 [catalog](../../catalog.json) 的本条 evidence 为准。此批仍 experimental，通用生产迁移 NOT_RUN；历史试验不能自动升级当前源码。

测试入口：[test/temporal.test.mjs](../../test/temporal.test.mjs).

完整历史合同／研究及来源边界保留在 [历史记录](../history/candidates/temporal-exposure.md)；该记录中的旧路径不是调用入口。代码适用 [包许可](../../LICENSE)，引用算法、字体、媒体和私有影片不因此取得重新分发许可；相关 SOURCES/来源说明保留在同一历史目录。
