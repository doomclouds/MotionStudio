# 孤立圆盘事件：有界弹性碰撞与回放

<!-- asset-self-description: motion.hard-disc-isolated-events -->

Bounded isolated elastic hard-disc events and absolute-time replay.

当前注册状态：`experimental`；公共调用入口：`lib/index.mjs`，API：`compileHardDiscs`。参数验证以实现为准，不把编译、采样或绘图支持再计数。

实现：[lib/foundations/motion/hard-disc-events/index.mjs](./index.mjs)。

## 设计意图与选择

用少量圆盘的接近、接触与速度交换说明碰撞因果。模型使用作者一致的空间单位与秒；绘图、声效、接收器和遮挡不由本资产生成。适合孤立事件，不适合堆叠、多点接触或真实刚体仿真。

## 输出、身份与降动效边界

编译plan深冻结，保存有界事件、分段状态、数值合同与间距审计；采样返回新的time与discs状态，采样结果不冻结。plan只认当前模块实例，序列化副本不是可调用plan；恢复时重新编译输入。没有reducedMotion参数，调用者自行选择静态替代；不以静止画面声称碰撞过程已验证。

## 参数、用途与边界

`compileHardDiscs({bounds,discs,duration,maxEvents})` compiles isolated perfectly elastic events. Bounds x/y are ±10000; width/height 1..10000. Duration is 0.001..30 seconds, maxEvents an integer 0..256. Let S=max(width,height): 1..16 discs have unique ASCII IDs of 1..32 characters, radius S/1000..0.49S, mass 0.1..100, velocity components ±4S. Initial positions must be strictly clear of walls and other discs. Input records have exact data fields; unknown fields/accessors reject.

Compilation sorts IDs and precomputes bounded segments/events. Ambiguous grazing, near-simultaneous or unresolved contact, penetration and exhausted event budgets explicitly fail; this is not a general rigid-body solver. No gravity, friction, stacking or multi-contact resolution. `sampleHardDiscs(plan, {time})` consumes its own compiled plan and absolute bounded seconds; caller draws the returned world-space state. A receiver/occluder authored in a film is not simulated capture. See the implementation and focused tests for numerical exclusion thresholds; input maxima are not performance guarantees.

## 可执行输入

按 [注册示例](../../../../examples/registered-foundations.mjs) 的 setup/compile/sample 顺序调用；以下为 catalog 输入，不是直接 eval 的代码。

```json
{
  "bounds": {
    "x": 0,
    "y": 0,
    "width": 1000,
    "height": 600
  },
  "discs": [
    {
      "id": "a",
      "x": 100,
      "y": 300,
      "vx": 100,
      "vy": 0,
      "mass": 1,
      "radius": 20
    },
    {
      "id": "b",
      "x": 400,
      "y": 300,
      "vx": 0,
      "vy": 0,
      "mass": 1,
      "radius": 20
    }
  ],
  "duration": 3,
  "maxEvents": 64
}
```

## 当前证据与来源边界

注册、技术测试、原生像素、常速观看、实际听审、用户接受和跨场景迁移互不替代。本页没有新增执行或接受声明；当前状态以 [catalog](../../../../catalog.json) 的本条 evidence 为准。此批仍 experimental，通用生产迁移 NOT_RUN；历史试验不能自动升级当前源码。

测试入口：[lib/foundations/motion/hard-disc-events/test/hard-disc-events.test.mjs](test/hard-disc-events.test.mjs).

完整历史合同／研究及来源边界保留在 [历史记录](../../../../docs/history/private-candidates/hard-disc-isolated-events/README.md)；该记录中的旧路径不是调用入口。代码适用 [包许可](../../../../LICENSE)，引用算法、字体、媒体和私有影片不因此取得重新分发许可；相关 SOURCES/来源说明保留在同一历史目录。

## 同目录使用入口与恢复

本页是当前合同；[design.md](design.md)解释选择与导演取舍，[index.mjs](index.mjs)是实际实现，[examples/contract.mjs](examples/contract.mjs)是可执行公开入口示例。目录迁移不新增API或兼容层。机器身份与证据仍只由[catalog](../../../../catalog.json)登记。

Node24+，从仓库根运行：

```sh
node engine/motion-elements/lib/foundations/motion/hard-disc-events/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/motion/hard-disc-events/test/*.test.mjs
```

实现无外部依赖。公开barrel示例间接依赖同级motion-timeline-core及Node内建crypto，恢复时保留仓库/portable相邻布局。无需Canvas、FFmpeg、字体、媒体或联网；不宣称浏览器原生兼容。示例只验证数值合同，不生成影片。目录调整不升级既有像素、观看、听审、用户接受与跨场景迁移证据。
