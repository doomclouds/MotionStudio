# field.arrival-field

<!-- asset-self-description: field.arrival-field -->

## 当前资产入口

本页是`field.arrival-field`当前合同，状态与证据登记在[catalog](../../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/arrival-field.test.mjs)补充独立直线距离oracle，原support混合测试保留。旧guide、实现和测试位置不留wrapper。

本次只迁移文件并修正相对导入，不改变算法。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


Quantized Euclidean arrival times with exact rational source starts and deterministic ties.

当前注册状态：`experimental`；公共调用入口：`lib/node.mjs`，API：`compileArrivalField`。参数验证以实现为准，不把编译、采样或绘图支持再计数。

实现：[index.mjs](index.mjs)。

## 参数、用途与边界

## Static arrival field

`compileArrivalField({sources:[{id,position:{x,y},at:{n,d}}],speed,tickRate})` -> branded frozen plan. `sampleArrivalField(plan,{points:[{id,position:{x,y}}]})` -> frozen point records sorted by ASCII ID.

For each point/source: IEEE `Math.hypot(dx,dy)/speed` produces diagnostic `rawTravelSeconds`; `ceil(rawTravelSeconds*tickRate)` produces travelTicks; arrival is exact rational addition of authored source start plus travelTicks/tickRate. The **quantized-travel arrival values**, not underlying exact real distances, determine winners. Distinct continuous arrivals may merge into ties; tiedSourceIds is ASCII sorted and winnerSourceId is first. Equal raw distances do not override unequal source starts. Source starts need not lie on the tick grid, so this is not globally integer-tick event timing.

`rawTravelSeconds` is a floating-point diagnostic, not an exact rational or conservative certified physical value. Ceil is no earlier than the *computed floating product*, not necessarily the exact real arrival. Near rounding boundaries cross-platform libm may change a tick or winner. No epsilon, interval proof, obstacles, attenuation, dynamic source, collision, PDE, Doppler or causal feedback.

Domain: 1..64 sources, 1..4096 queried points; coordinates ±1e6; speed .001..1e6 units/s; integer tickRate 1..192000. All source/query IDs unique in each collection. Earliest arrival at a query must be ≤86400s, otherwise the entire call rejects; far later nonwinning sources are allowed. Source start 0..86400s. Empty queries reject. Storage input permutations preserve the returned plan/state ordering. Plans cannot be JSON-cloned or crossed between module instances.

## Event bindings（不计数支持）

这些支持 API 从 `lib/support/event-bindings.mjs` 直接导入，不由公共 node/index 导出；它们不构成第二个 arrival 机制。

`compileEventBindings({duration,frameRate,sampleRate,sourceIdentity,roles:{visual:[id],audio:[id]},events:[{id,creativeOrder,at,visualRole,audio,silenceReason}]})`.

All clocks are `{n,d}` integer strings. Reuses existing `rational/add/sub/compare/timeToSamples`; no second general time or audio editing system. Duration >0..86400s, fps >0..240, sample rate integer 8000..192000. A raw rational input uses at most 12 decimal digits in numerator magnitude and denominator. Exact derived rationals use existing timeline bounds. Up to4096 events, visual roles1..256, audio roles0..256. IDs ASCII1..64. Event at must be in [0,duration), with a first visual frame strictly inside film.

`creativeOrder` is an explicit integer0..4095 unique across the entire table (stricter than merely same-time unique). Storage array reorder is immaterial; changing creativeOrder changes the creative plan identity and tie ordering. Events sort by exact authored time then creativeOrder. This explicit authored field is not inferred from storage.

Audio is null only with a nonempty silenceReason. Otherwise silenceReason must be null and audio is `{role,offset,duration,offsetReason}`. Roles must be registered, cue duration positive, offset within ±86400s with a nonempty reason. Absolute start=event+offset, end=start+cue duration. Negative starts, tails outside film, or cues quantizing to zero samples reject. No truncation, automatic extension, hidden fade or unverified audible-tail guarantee.

Visual first frame = exact rational ceiling(event*fps), with visualAt and signed visualError recorded. Audio absolute start/end use existing nearest-sample, half-away-from-zero rule, with quantizedStart and signed startError recorded; independently rounded durations are never accumulated. Thus same event does **not** guarantee the same discrete visual/audio instant. Example17/10s at24fps and48kHz -> frame41 at41/24s, audio sample81600 at17/10s.

`eventsThroughFrame(plan,frame,sourceIdentity)` returns all events whose firstVisualFrame is ≤frame, not callbacks or one-shot mutable events. Repeated/reverse seek is deterministic. frame integer0..20736000 and frame time inside film. `audioCues(plan,sourceIdentity)` returns cues ordered by quantized start then creativeOrder. Both require the same declared64hex sourceIdentity: this does not read files or prove the declaration was true. Automatic expiry detection and measured-event provenance are **not implemented**.

## Object/security/ownership boundary

Inputs require exact own data fields on plain/null-prototype records, ordinary dense same-realm arrays, finite numbers; accessors, symbols, unknown fields, array extras and holes reject before getter execution. Proxy traps and modified builtins are outside this contract. Copies and output graphs are deeply frozen. No mutable cache, wall clock, IO, random state, closures, schema eval or network. Returned canonical identity is SHA256 of the compiled declared plan, not an authenticated execution receipt.

## 可执行输入

按 [注册示例](../../../../examples/registered-foundations.mjs) 的 setup/compile/sample 顺序调用；以下为 catalog 输入，不是直接 eval 的代码。

```json
{
  "sources": [
    {
      "id": "a",
      "position": {
        "x": 0,
        "y": 0
      },
      "at": {
        "n": "0",
        "d": "1"
      }
    }
  ],
  "speed": 1,
  "tickRate": 1000
}
```

## 当前证据与来源边界

注册、技术测试、原生像素、常速观看、实际听审、用户接受和跨场景迁移互不替代。本页没有新增执行或接受声明；当前状态以 [catalog](../../../../catalog.json) 的本条 evidence 为准。此批仍 experimental，通用生产迁移 NOT_RUN；历史试验不能自动升级当前源码。

测试入口：[test/arrival-field-support.test.mjs](../../../../test/arrival-field-support.test.mjs).

完整历史合同／研究及来源边界保留在 [历史记录](../../../../docs/history/private-candidates/arrival-field-origin-contracts.md)；该记录中的旧路径不是调用入口。代码适用 [包许可](../../../../LICENSE)，引用算法、字体、媒体和私有影片不因此取得重新分发许可；相关 SOURCES/来源说明保留在同一历史目录。

## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/foundations/field/arrival-field/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/field/arrival-field/test/*.test.mjs
```

保留共享validate/time/matrix及原timeline、transform/opacity依赖，不改Node arrival-validation支持边界，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。本资产从Node入口node.mjs公开，默认index不增加Node-only API。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

计划品牌仅当前canonical模块实例有效；保存原始定义并重新compile。结果复制并深冻，不保留可变输入或播放历史。代码适用[包MIT许可](../../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。
