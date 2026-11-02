# motion.finite-particles

Seeded finite emissions with analytic constant-acceleration absolute-time sampling.

当前注册状态：`experimental`；公共调用入口：`lib/index.mjs`，API：`compileFiniteParticles`。参数验证以实现为准，不把编译、采样或绘图支持再计数。

实现：[lib/foundations/motion/finite-particles.mjs](../../lib/foundations/motion/finite-particles.mjs)。

## 参数、用途与边界

Compile `{seed, emissions}` with a uint32 seed and1–512 ordinary dense records. Each record has unique bounded ASCII `id`, numeric `birth` seconds0–3600, `position` and `velocity` with x/y `[minimum,maximum]` intervals, constant `acceleration` x/y, and `[minimum,maximum] lifetime` seconds. Coordinates±16384, velocity±4096, acceleration±1024, lifetime0.001–60. Intervals are closed authoring bounds; sampled random fraction is in[0,1). Accessors and unknown fields are rejected before evaluating property values. No unsafe generic host-object/proxy contract is claimed.

`compileFiniteParticles` returns frozen copied parameters. The seed mixer is deterministic per ID and parameter channel; changing order or removing another identity cannot change retained particle random samples. It is not cryptographic or a statistically certified generator. All births are explicit once-only events; there is no hidden loop, recycling, frame integration or unbounded emitter.

`sampleFiniteParticles(plan, at)` accepts bounded IEEE Number seconds0–3660 and returns frozen alive states. Birth is included; computed `death=birth+lifetime` is excluded. Age is `at-birth`; position is `x0+v0*age+0.5*a*age²`; velocity is `v0+a*age`. Not exact rational time, force integration, collision or fluid simulation. Plans are branded to their module instance. Seek order does not matter.

## 可执行输入

按 [注册示例](../../examples/registered-foundations.mjs) 的 setup/compile/sample 顺序调用；以下为 catalog 输入，不是直接 eval 的代码。

```json
{
  "seed": 1,
  "emissions": [
    {
      "id": "a",
      "birth": 0,
      "position": {
        "x": [
          0,
          0
        ],
        "y": [
          0,
          0
        ]
      },
      "velocity": {
        "x": [
          1,
          1
        ],
        "y": [
          2,
          2
        ]
      },
      "acceleration": {
        "x": 0,
        "y": 0
      },
      "lifetime": [
        1,
        1
      ]
    }
  ]
}
```

## 当前证据与来源边界

注册、技术测试、原生像素、常速观看、实际听审、用户接受和跨场景迁移互不替代。本页没有新增执行或接受声明；当前状态以 [catalog](../../catalog.json) 的本条 evidence 为准。此批仍 experimental，通用生产迁移 NOT_RUN；历史试验不能自动升级当前源码。

测试入口：[test/finite-particles.test.mjs](../../test/finite-particles.test.mjs).

完整历史合同／研究及来源边界保留在 [历史记录](../history/candidates/finite-particles.md)；该记录中的旧路径不是调用入口。代码适用 [包许可](../../LICENSE)，引用算法、字体、媒体和私有影片不因此取得重新分发许可；相关 SOURCES/来源说明保留在同一历史目录。
