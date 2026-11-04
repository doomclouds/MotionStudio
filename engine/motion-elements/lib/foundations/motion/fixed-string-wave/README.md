# 固定弦波：固定两端的绝对时间传播

<!-- asset-self-description: motion.fixed-string-wave -->

Fixed-end one-dimensional wave via odd periodic extension.

当前注册状态：`experimental`；公共调用入口：`lib/index.mjs`，API：`compileFixedStringWave`。参数验证以实现为准，不把编译、采样或绘图支持再计数。

实现：[lib/foundations/motion/fixed-string-wave/index.mjs](./index.mjs)。

## 设计意图与选择

让一次拨弦在反射与反相后仍可倒序回采。适用于一维初始形状传播的解释图，不适用于衰减弹簧、布料、强迫振动或音频合成。归一化位置与位移如何缩放到画布由调用者决定。

## 输出、身份与降动效边界

编译返回冻结profile与speed，采样返回time、phase、points及明确的零初速/固定端/无阻尼说明；采样输出不是冻结对象。plan只认当前模块实例，JSON复制的plan会拒绝；保存原始输入再编译。没有reducedMotion选项，调用者可选择初始或静态姿态并保持内容读时，不传未知字段。

## 参数、用途与边界

Original implementation of a bounded1D initial-value solution, not a new damped-response parameter or manually animated sampled band.

`compileFixedStringWave({profile,speed})`: ordinary dense array2..128 normalized piecewise-linear points, x0..1 with minimum knot gap1e-6, y−1..1, endpoints exactly(0,0),(1,0); speed0.01..8 normalized string lengths/second. Strict data-object/array validation rejects unknown fields/accessors/symbol iterators. The plan copies/freeze-seals input.

`sampleFixedStringWave(plan,{time,samples})`: t0..60s,2..1024 uniform positions, absolute-time seek. A period2 odd extension of the initial profile is sampled at x±ct, then averaged. Endpoints are exactly zero in output; no cache history, temporal integration, force, drag or damping. Reflection changes sign through the extension. This is a weak solution for a piecewise-linear initial profile: zero initial velocity is in the weak and away-from-initial-knot sense, not a claim of a classical derivative at every sharp pluck corner. Initial displacement is exact at returned x values; a uniformly sampled output need not include every input knot.

Output mode/value bounds and time range are deliberately narrow. Floating-point phase reduction is not exact real arithmetic and very tiny phase motion can quantize away. No large-time or arbitrary-precision promise. The domain's finite speed/time product avoids overflow; sampled geometry can still alias sharp moving corners and should be sufficiently dense for display.

## 可执行输入

按 [注册示例](../../../../examples/registered-foundations.mjs) 的 setup/compile/sample 顺序调用；以下为 catalog 输入，不是直接 eval 的代码。

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

注册、技术测试、原生像素、常速观看、实际听审、用户接受和跨场景迁移互不替代。本页没有新增执行或接受声明；当前状态以 [catalog](../../../../catalog.json) 的本条 evidence 为准。此批仍 experimental，通用生产迁移 NOT_RUN；历史试验不能自动升级当前源码。

测试入口：[lib/foundations/motion/fixed-string-wave/test/fixed-string-wave.test.mjs](test/fixed-string-wave.test.mjs).

完整历史合同／研究及来源边界保留在 [历史记录](../../../../docs/history/private-candidates/fixed-string-wave/ORIGIN-CONTRACT.md)；该记录中的旧路径不是调用入口。代码适用 [包许可](../../../../LICENSE)，引用算法、字体、媒体和私有影片不因此取得重新分发许可；相关 SOURCES/来源说明保留在同一历史目录。

## 同目录使用入口与恢复

本页是当前合同；[design.md](design.md)解释选择与导演取舍，[index.mjs](index.mjs)是实际实现，[examples/contract.mjs](examples/contract.mjs)是可执行公开入口示例。目录迁移不新增API或兼容层。机器身份与证据仍只由[catalog](../../../../catalog.json)登记。

Node24+，从仓库根运行：

```sh
node engine/motion-elements/lib/foundations/motion/fixed-string-wave/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/motion/fixed-string-wave/test/*.test.mjs
```

实现无外部依赖。公开barrel示例间接依赖同级motion-timeline-core及Node内建crypto，恢复时保留仓库/portable相邻布局。无需Canvas、FFmpeg、字体、媒体或联网；不宣称浏览器原生兼容。示例只验证数值合同，不生成影片。目录调整不升级既有像素、观看、听审、用户接受与跨场景迁移证据。
