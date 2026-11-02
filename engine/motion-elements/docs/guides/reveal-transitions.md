# Iris 与线性坐标两场景揭示

[返回入口](../../README.md) · [目录与公共 API](../registered-foundations.md)

本页保存对应机制的详细合同、合成示例和已有证据限定。历史批次数量不是当前目录数，已有测试描述不代表本次重新运行或艺术通过。代码片段中相对导入以本页所在目录为基准；shell 命令按各段注明的工作目录运行。

## Iris reveal：圆域 over-reveal（不是透明场景 replacement）

`transition.iris-reveal` 是独立机制。与现有sampleTransition/drawTransition共用体系，原push/wipe三参数调用保持不变：

```js
const state=sampleTransition({
 type:'transition.iris-reveal',version:1,
 range:{start:rational(1),end:rational(5)},curve:{type:'smoothstep'},
 params:{width:640,height:360,center:{x:210.35,y:180.65}}
},at,{reducedMotion:false});
drawTransition(ctx,state,{outgoing:drawA,incoming:drawB},{Path2D:canvasApi.Path2D});
// Caller-owned shared actor, if any, is drawn exactly once after the backgrounds.
```

width/height是局部视口尺寸，各[1,8192]，面积≤16,777,216；允许非整数。center必须位于闭视口内，包括边/角。range/curve复用现有严格rational与曲线验证，无direction/areaMode/ring/replacement字段。最大半径为center到四角的最大hypot；radius=q·maxRadius，**按半径进度而非面积进度**。state显式提供viewport、center、radius、maxRadius、revealProgress、raw progress和composition='over-reveal'，两层matrix均identity。

唯一合成语义：**A全视口持续保底，B在圆内source-over覆盖**。
- before/start：只调用A，不调用B；
- 中途：完整A，随后viewport∩circle内B；
- end/after：继续调用A+B，B只clip完整viewport，不做圆clip，避免最远角抗锯齿漏角；
- B的透明孔有意显示A。若A也透明，按source-over显示caller底层。不能声称终态等于透明B-only；
- 即使B不透明，也不自动探测并跳过A；库不会自动销毁A场景。A/B按当前时间绘制，不缓存旧帧，after仍需A有效绘制上下文。若需后续独立B场景，caller提供opaque B或显式做另一次交接。

reducedMotion按**raw progress=0.5**从A-only切到完整A+B，不按eased q中点，不改range/cue。终态同over语义，没有突然撤除A。push/wipe自己的行为保持不改。

Iris必须显式注入Path2D，第四参数仅接受Path2D，未知字段拒绝；push/wipe可省略。adapter用独立viewport/circle路径，不调用beginPath，parent由caller设置且只作用一次；非均匀父缩放时屏幕上成为椭圆，这是局部圆合同，不继承push的整数限制。每层临时设置source-over并在finally恢复caller composite、transform、alpha、clip。两个callback类型在绘制前验证，AsyncFunction/thenable拒绝；不是能撤销外部副作用的沙箱。

adapter自身不污染current path；callback自行修改path仍不在回滚保证内。callback应在提供的clip内正常绘制，不clear/reset整个canvas、破坏clip或自行改合成语义；每帧初始化由caller负责。共享actor必须从A/B背景移出，drawTransition后单独画一次；库不检测/去重角色。若需遮挡，caller显式安排独立clip。

互补clip（A圆外+B圆内）曾在Native实测出现opaque场景AA边缘漏caller底色，**不是本实现**。本实现用完整A保底，不靠装饰环遮缝。真正透明replacement的多surface方案及生命周期/显存预算未实现，不暗称具备。运动圈内实际视觉与不同backend仍需验证。

两类合成案例各有中心变化：opaque桌面→几何花园与caller单次绘制角色；红A图表上半透明B及透明孔（偏心/角点），after孔仍显示红A。示例不含私有品牌/素材，无portal装饰环；蓝色圆环是B的内容本身，不是接缝遮盖。8秒单次展示、静音。

```sh
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/iris-study-new --demo iris
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/iris-end-new --demo iris --frame 150
```

技术证据覆盖分数center/radius的opaque红A蓝B绿caller底、透明end/after基线、原始中点、四角覆盖、Path2D/parent/异常隔离与乱序。技术通过不等于复刻/艺术/声音通过。

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

`examples/linear-mask-study.mjs` exports `drawLinearMaskStudy(ctx,at,options)` with
neutral bars→circles, three variants, portrait/landscape and reduced-motion support.
It does not encode a film or load private assets. `test/linear-mask.test.mjs` covers
state/geometry, rational endpoints, strict validation, raw-midpoint reduction,
random-order state/native pixels, fresh-process state, independent half-plane
pixel classification, opaque-edge coverage, transparent end behavior, and callback
exception/current-path isolation. New generic code has no full-video/art/audio
review; source-project visual evidence does not automatically transfer to this API.
