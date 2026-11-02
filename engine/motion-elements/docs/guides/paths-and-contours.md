# 折线路径、登记轮廓形变与条带包络

[返回入口](../../README.md) · [目录与公共 API](../registered-foundations.md)

本页保存对应机制的详细合同、合成示例和已有证据限定。历史批次数量不是当前目录数，已有测试描述不代表本次重新运行或艺术通过。代码片段中相对导入以本页所在目录为基准；shell 命令按各段注明的工作目录运行。

## 局部弧长路径与空间拖尾

一个机制 `geometry.polyline-trail`（experimental），不是把采样函数数量算成多个效果：

```js
import {compilePolyline,samplePath,sampleTrail} from '../../lib/index.mjs';
const path=compilePolyline({points:[{x:0,y:0},{x:120,y:0},{x:120,y:80}]});
const head=samplePath(path,0.1);
const trail=sampleTrail(path,{headProgress:0.1,length:45,samples:16});
// head: {position,unitTangent,distance,segmentIndex}
// trail: {tailDistance,headDistance,points:[same shape as head]}
```

- compile 只计算一次累计弧长，复制并深冻结输入；2..1024 个点，坐标各在 ±1e9 内。相邻重复、长度低于最小正常浮点数（2.2250738585072014e-308）、累计长度无法增加的段一律拒绝。只接收当前模块实例编译结果；序列化后应从 points 重新 compile，不接受伪造缓存。
- progress 必须在 [0,1]，不自动 clamp；按局部累计弧长分配，不按段数等分。精确顶点选出发段，末端选入射段；尖角方向可能跳变，不宣称平滑朝向。
- length 是有限非负**局部空间弧长**，不是秒、屏幕像素或比例；samples 是 2..256 整数。严格区间为 [max(0,headDistance-length),headDistance]。即使起步 headProgress<0.2，任何点都不能领先头部。length=0 返回重复头部点。
- points 为固定数量的等弧长采样；用直线相连跨越尖角时可能近似切角，不是保留全部顶点的精确路径裁剪。增加 samples 可降低近似误差，不承诺消除所有尖角误差。
- 路径函数不读时钟、不保存上一帧。外层通过已有 rational 时间与 sampleMotion 的 progress 驱动；换时间曲线就改变速度。非均匀父缩放后不保证屏幕等速，朝向和父矩阵由调用者显式处理。
- reduced-motion 在示例层选择静态终态，同时保留原时间范围；数学采样 API 不接收未实现的 reducedMotion 字段。
- 该折线API不提供 Bézier、粒子模拟、碰撞、平滑拐弯、时间历史拖尾或 finite-settle 新曲线；这些不应从路径采样能力推断。

两类合成内容在同一 8 秒、非正方形画布 demo：四段电路路径，以及旋转父坐标下的三个流程节点。使用相同函数，不含私有素材。

```sh
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/path-demo-new --demo path
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/path-still-new --demo path --frame 43
```

CLI 默认仍是原十宫格 `--demo gallery`；path demo 保持现有输出文件名 `motion-elements-gallery.mp4`，render.json 的 demo 字段区分内容。技术测试与合成展示不代表真实生产迁移或艺术认可，须另记证据。

## Registered polygon morph (experimental; visual/production validation pending)

One bounded mechanism, `geometry.registered-polygon-morph`:

```js
const plan = compileRegisteredPolygonMorph({
  vertexIds: ['tl', 'tr', 'br', 'bl'],
  from: [{x:0,y:0},{x:240,y:0},{x:240,y:140},{x:0,y:140}],
  to: [{x:20,y:10},{x:200,y:0},{x:250,y:150},{x:0,y:120}]
});
const state = sampleRegisteredPolygonMorph(plan, .5, {direction:'forward'});
drawRegisteredPolygonMorph(ctx, state, {fill:'#e4d9bd',stroke:'#fff',lineWidth:2},
  {Path2D:canvasApi.Path2D});
```

Explicit caller-asserted correspondence only: 3..32 unique IDs, equal vertex counts,
finite local coordinates with absolute value ≤10,000. Last edge closes implicitly;
do not repeat the first point. No reordering, matching, resampling, holes, curves,
glyph/image morph, split/merge, physics or 3D. IDs do not establish semantic correctness.
Both endpoints must be simple and share signed winding (`positive`/`negative`, not
coordinate-independent clockwise labels). Plans and genuine bound sample states are
immutable; cloned/forged plans and states are rejected. `q=0/1` copies exact endpoints;
reverse(p) has the same geometry as forward(1-p). Caller supplies progress in [0,1]
from existing time/curve tools; there is no new clock or unbounded easing.

Geometry tests use one fixed normalization from the union endpoint bounds: center
origin and S=max(1,width,height). Epsilon is 1e-8 in normalized coordinates. Every
sample conservatively rejects short edges, duplicate/near vertices, near-collinear
adjacent unit directions, nonadjacent intersections/touches/distances ≤epsilon,
absolute area ≤N·epsilon, or winding changes. No epsilon override or automatic repair.
Thin mathematically valid polygons may be rejected. Errors expose stable `code`,
`reason`, and `details` containing endpoint or requested progress/direction plus relevant
vertex/edge IDs, without logging coordinates or partial state. Checks are O(N²).

**Valid endpoints, a valid grid, or all rendered frames do not prove continuous-time
topology safety. Only the requested samples are checked.** A square with target IDs
cyclically shifted two places collapses at .5 despite valid same-winding endpoints;
a scaled centered reversal can collapse at .37 while .25/.5/.75 pass. No continuous
proof or safety certification is provided; applications needing that are unsupported.

`state.bounds` is the local vertex AABB, excluding stroke/shadow. `transformBounds`
produces a conservative transformed AABB, not the exact world polygon AABB. Caller
sets the parent transform once; adapter never adds one, checks the current matrix,
or prevents external singular transforms. It uses a separate closed Path2D and
nonzero fill, preserving caller current path and restoring styles in `finally`.
No callbacks are accepted. Colors follow Canvas string semantics (including its
invalid-color behavior). Existing composite/alpha/stroke settings remain caller owned.

Two synthetic examples: a non-affine corner card and concave arrow, each also shown
under a non-singular rotated/nonuniform parent. 8-second forward → hold → reverse,
clean or ID-debug; no text is falsely warped with the polygon, no external imagery.
The gallery draws four objects per frame. Reduced motion presents the target shape.

```sh
node --test engine/motion-elements/test/registered-polygon-morph.test.mjs
node engine/motion-elements/scripts/render-gallery.mjs --demo registered-polygon-morph --out /tmp/polygon-clean-new
node engine/motion-elements/scripts/render-gallery.mjs --demo registered-polygon-morph --debug --out /tmp/polygon-debug-new
```

Technical tests cover exact endpoints and independent Native RGBA baselines, caller
path/style/exception isolation, reverse/seek/process determinism, 24/30/60fps grids,
invalid geometry and off-grid collapse. These are not artistic or production acceptance;
human playback and semantic ID-trajectory review remain pending.

## Experimental: sampled band envelope

`geometry.sampled-band` is one pure geometry mechanism, not a ribbon simulator:

```js
const band = compileSampledBand({samples:[
  {x:0,y:30,halfWidth:0}, {x:60,y:10,halfWidth:12}, {x:140,y:40,halfWidth:4}
]});
drawSampledBand(ctx,band,{fill:'#527d91'},{Path2D:canvasApi.Path2D});
```

The dense array has 2..1024 `{x,y,halfWidth}` samples. x/y are finite numbers in
[-1e9,1e9], x strictly increases, and halfWidth is finite in [0,1e9]. Unknown
fields (including hidden/symbol fields), holes, negative widths, repeated or
reversed x reject. Positive width must yield representably distinct y−width < y
and y+width > y; otherwise it rejects rather than silently collapsing. These
coordinate bounds keep derived vertices and bounds finite (up to ±2e9 and 4e9
extent). Representable subnormal coordinates/widths are allowed; raster visibility
is not guaranteed for tiny shapes. No area multiplication or normalization occurs.

Output is a detached deeply frozen, module-branded `{samples,vertices,bounds,
degenerate}`. Vertices are upper edge (y−halfWidth) in sample order, then lower
edge (y+halfWidth) in reverse; closure is implicit. Segments are **straight**, not
spline reconstruction. Width means **vertical half-width**, not curve-normal
thickness. Zero endpoints and interior pinches are allowed; all-zero widths give
`degenerate:true` and draw nothing (even if center y varies). Zero x span rejects.
Serialization is inspection only; recompile samples to draw after transport.

The fill-only adapter uses a separate Path2D and nonzero fill, preserving current
path and restoring context through finally. Caller transform, alpha, compositing,
clip and explicit layer order remain in effect. Fill must be a nonempty Canvas
color string; CSS color parsing is delegated to the backend. No strokes, joins,
caps, automatic sampling, time interpolation, topology repair, morphing, physical
weaving or 3D are supplied. Caller chooses sufficient sample density.

Deduplication: `compilePolyline`/`sampleTrail` remain the path-distance tools;
registered-polygon morph has a different correspondence/topology contract and
rejects the coincident/collinear/zero-width cases this envelope intentionally allows.
Mask reveals remain viewport clips, not variable-width contour geometry.

The method was extracted from a production scene's upper-forward/lower-reverse
sampled outline and independently validated. **It was not backfilled into that
film; the existing film still uses its original project implementation.** No film
usage, artistic approval or production-transfer validation is claimed for this API.
`examples/sampled-band-study.mjs` shows neutral wave and chart uncertainty envelopes;
`test/sampled-band.test.mjs` covers reusable geometry, bounds, numerical degeneracy,
validation, native raster equivalence and adapter isolation. No generated media or
commercial assets are included.
