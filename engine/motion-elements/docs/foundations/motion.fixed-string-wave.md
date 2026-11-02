# motion.fixed-string-wave

Fixed-end one-dimensional wave via odd periodic extension.

当前注册状态：`experimental`；公共调用入口：`lib/index.mjs`，API：`compileFixedStringWave`。参数验证以实现为准，不把编译、采样或绘图支持再计数。

实现：[lib/foundations/motion/fixed-string-wave.mjs](../../lib/foundations/motion/fixed-string-wave.mjs)。

## 参数、用途与边界

Original implementation of a bounded1D initial-value solution, not a new damped-response parameter or manually animated sampled band.

`compileFixedStringWave({profile,speed})`: ordinary dense array2..128 normalized piecewise-linear points, x0..1 with minimum knot gap1e-6, y−1..1, endpoints exactly(0,0),(1,0); speed0.01..8 normalized string lengths/second. Strict data-object/array validation rejects unknown fields/accessors/symbol iterators. The plan copies/freeze-seals input.

`sampleFixedStringWave(plan,{time,samples})`: t0..60s,2..1024 uniform positions, absolute-time seek. A period2 odd extension of the initial profile is sampled at x±ct, then averaged. Endpoints are exactly zero in output; no cache history, temporal integration, force, drag or damping. Reflection changes sign through the extension. This is a weak solution for a piecewise-linear initial profile: zero initial velocity is in the weak and away-from-initial-knot sense, not a claim of a classical derivative at every sharp pluck corner. Initial displacement is exact at returned x values; a uniformly sampled output need not include every input knot.

Output mode/value bounds and time range are deliberately narrow. Floating-point phase reduction is not exact real arithmetic and very tiny phase motion can quantize away. No large-time or arbitrary-precision promise. The domain's finite speed/time product avoids overflow; sampled geometry can still alias sharp moving corners and should be sufficiently dense for display.

## 可执行输入

按 [注册示例](../../examples/registered-foundations.mjs) 的 setup/compile/sample 顺序调用；以下为 catalog 输入，不是直接 eval 的代码。

```json
{
  "profile": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 0.5,
      "y": 1
    },
    {
      "x": 1,
      "y": 0
    }
  ],
  "speed": 1
}
```

## 当前证据与来源边界

注册、技术测试、原生像素、常速观看、实际听审、用户接受和跨场景迁移互不替代。本页没有新增执行或接受声明；当前状态以 [catalog](../../catalog.json) 的本条 evidence 为准。此批仍 experimental，通用生产迁移 NOT_RUN；历史试验不能自动升级当前源码。

测试入口：[test/fixed-string-wave.test.mjs](../../test/fixed-string-wave.test.mjs).

完整历史合同／研究及来源边界保留在 [历史记录](../history/private-candidates/fixed-string-wave/ORIGIN-CONTRACT.md)；该记录中的旧路径不是调用入口。代码适用 [包许可](../../LICENSE)，引用算法、字体、媒体和私有影片不因此取得重新分发许可；相关 SOURCES/来源说明保留在同一历史目录。
