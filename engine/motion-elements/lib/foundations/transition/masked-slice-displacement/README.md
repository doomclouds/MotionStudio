# masked-slice-displacement（experimental）

<!-- asset-self-description: transition.masked-slice-displacement -->

## 当前资产入口

本页是`transition.masked-slice-displacement`当前合同，状态与证据登记在[catalog](../../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/masked-slice-displacement.test.mjs)补充独立数学断言，原field-slices混合测试继续保留。旧实现位置不留wrapper；共享组合guide、scene及混合测试保留原职责。

本次只迁移文件并修正相对导入，不改变算法。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


### `transition.masked-slice-displacement`

```js
const plan = compileSliceDisplacement({
  width:380,height:170,bands:11,maxOffset:55,seed:'study',instanceId:'panel',
  range:{start:rational(1),end:rational(5)},jitterCycles:3
});
const state = sampleSliceDisplacement(plan, rational(2), {reducedMotion:false});
withSliceDisplacement(ctx, state, drawLocalContent, {Path2D:canvasApi.Path2D});
```

This is a one-content distortion transition, **not** an outgoing/incoming scene
switcher. The caller authors overlap or replacement. Fixed horizontal band IDs
`band:i` partition [0,height] using integer floor boundaries. Odd bands move right,
even bands left. For normalized authored time u, envelope E=sin(πu)²; displacement
is sign × maxOffset × E × [0.75+0.25sin(2π·jitterCycles·u+seededPhase)]. There is no
frame-count random stream, hidden clock or discontinuous frame-index jitter.
`jitterCycles=0` gives a seeded constant amplitude multiplier. |offset|≤maxOffset;
endpoint offsets explicitly equal +0. Before/start and end/after return exact home.
Reduced motion returns home at every time, preserving phase/progress and range.

Width/height integer 1..8192, area ≤16,777,216, bands 2..min(height,256), maxOffset
0..8192, jitterCycles integer 0..32. Seed/instanceId use `seededUnit` limits;
range uses existing rational time validation. High cycle counts in short ranges
can alias: caller must choose duration/frame rate appropriately. Every input
rejects unknown own fields (including symbol and nonenumerable keys), null and nonfinite values. Plan/state are branded and
frozen; catalog contains only data and never executes source strings or callbacks.

Adapter requires explicit native/browser Path2D, clips strips **before** applying
their local horizontal translations, and never reapplies the parent matrix.
At exact identity it calls content once with no added clip: raster equals direct
whole-content rendering with the same incoming context. Content should be authored
within [0,width]×[0,height]; motion clips to that viewport whereas identity does not
clip out-of-bounds content. Transparent holes remain transparent. During motion,
rotated/subpixel parents may show antialiased strip seams; no arbitrary-affine
seam-free guarantee. Every draw is save/try/finally/restore: native transform,
alpha, clip and drawing styles are restored, including on exceptions. This backend's
style getters may retain stale assigned strings after restore; tests check actual
raster restoration. Adapter paths are separate Path2D objects. Callback-owned
current-path mutations, external side effects, unbalanced save/restore, reset() or
canvas resize are outside the restoration guarantee. Callbacks must be synchronous,
reentrant and balanced; they run once per band during motion and must render the
same authored content without advancing mutable animation state. AsyncFunction and
returned thenables are rejected, not sandboxed or rolled back.


组合示例、原验证范围和听审/生产边界见[共享field/slices说明](../../../../docs/guides/field-and-slices.md)。

## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/foundations/transition/masked-slice-displacement/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/transition/masked-slice-displacement/test/*.test.mjs
```

保留共享validate/math/time及既有timeline依赖；跨资产示例仍共享，不复制组合代码，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

field计划与slice计划/状态使用canonical品牌，保存原始定义重新compile。local reveal是同步绘制函数，不编译品牌计划或返回冻结状态。纯采样结果深冻，不保留播放历史。代码适用[包MIT许可](../../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。

专用[canvas.mjs](canvas.mjs)与采样实现共置，公共withSliceDisplacement直接导出同一函数。
