# linear-mask（experimental）

<!-- asset-self-description: transition.linear-mask -->

## 当前资产入口

本页是`transition.linear-mask`当前合同，状态与证据登记在[catalog](../../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/linear-mask.test.mjs)保留原断言。旧实现、专属测试与scene入口不留wrapper；共享reveal导航与Canvas适配层继续保留。

本次只迁移文件并修正相对导入，不改变算法。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


## Experimental: linear-coordinate mask reveal

One mechanism, `transition.linear-mask`, with `band` and `sweep` parameter variants.
It fills a missing two-scene centered-band/oblique-edge reveal, not a new 3D renderer.
Existing `rect-wipe` remains appropriate for axis-aligned edge wipes; `iris-reveal`
uses a radial metric. Existing stagger + transform + finite-settle already covers
card timing/rotation; route selection can compose path/opacity and caller-owned
layer order. Those were **not** duplicated as new catalog elements.

```js
const state = sampleTransition({
  type:'transition.linear-mask', version:1,
  range:{start:rational(1),end:rational(3)}, curve:{type:'smoothstep'},
  params:{width:640,height:360,mode:'band',angle:Math.PI/2}
}, at, {reducedMotion:false});
drawTransition(ctx,state,{outgoing:drawOld,incoming:drawNew},{Path2D:canvasApi.Path2D});
// Oblique left-to-right sweep: mode:'sweep', angle:0.17.
// Reverse sweep: mode:'sweep', angle:Math.PI.
```

For local position p, s=p.x*cos(angle)+p.y*sin(angle). Let lo/hi be its extrema
at the four viewport corners. `sweep` reveals s≤lo+(hi−lo)q; `band` reveals
|s−(lo+hi)/2|≤(hi−lo)q/2. Angle is the **normal**, in radians in Canvas y-down
coordinates, not the edge angle. Thus angle π/2 yields a horizontal centered band.
Negative angles and reversed sweeps are parameter changes, not new mechanisms.
A bounded convex polygon is clipped from the viewport; no 3D points or source images.
At q=0 the incoming callback is skipped; at q=1 the exact viewport is used.
q is the existing curve applied to rational-time progress. Reduced motion uses
raw time midpoint q=0/1, preserving phase, progress and all authored timings.

Width/height finite 1..8192, area≤16,777,216 (fractional local sizes accepted);
angle ∈[−π,π], mode band/sweep, version1. Nulls/unknown fields, including symbol
and nonenumerable fields, invalid ranges and unsupported curves reject. Samples
are immutable and module-branded: serialization is for inspection, not draw-state
rehydration; resample the original spec after transport. No retained frame history.

Composition is explicitly **over-reveal**: full A stays underneath B even at end
and after; transparent B holes show A. This is not transparent replacement. Each
callback is viewport-clipped, source-over; caller alpha and parent transform remain
in effect. No second parent transform is applied. Separate Path2D preserves the
caller's current path, and save/finally/restore isolates state on errors. Callbacks
must be synchronous, reentrant, balanced, and must not reset/resize the canvas or
clear through the intended composition; caller path mutations/external async effects
cannot be undone. AsyncFunction and returned thenables reject. No arbitrary-backend
or transformed-antialiasing identity is promised; avoid declaring pixel tests an
artistic or accessibility approval.

`lib/foundations/transition/linear-mask/examples/linear-mask-study.mjs` exports `drawLinearMaskStudy(ctx,at,options)` with
neutral bars→circles, three variants, portrait/landscape and reduced-motion support.
It does not encode a film or load private assets. `lib/foundations/transition/linear-mask/test/linear-mask.test.mjs` covers
state/geometry, rational endpoints, strict validation, raw-midpoint reduction,
random-order state/native pixels, fresh-process state, independent half-plane
pixel classification, opaque-edge coverage, transparent end behavior, and callback
exception/current-path isolation. New generic code has no full-video/art/audio
review; source-project visual evidence does not automatically transfer to this API.

## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/foundations/transition/linear-mask/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/transition/linear-mask/test/*.test.mjs
```

保留共享validate/matrix/math/time和timeline；sampleTransition/drawTransition及drawTileScatter仍通过原共享适配器，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

输出深冻，不保留播放历史。linear-mask状态与tile计划/状态使用canonical实例品牌，JSON复制不能供对应适配器绘制；iris不增加品牌。保存原始定义重新采样/编译。代码适用[包MIT许可](../../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。

原合成示例：[ linear-mask-study.mjs ](examples/linear-mask-study.mjs)。它是可调用Canvas函数或gallery scene，不是自动播放的生产影片。
