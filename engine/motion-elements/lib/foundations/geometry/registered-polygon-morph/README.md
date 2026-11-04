# registered-polygon-morph（experimental）

<!-- asset-self-description: geometry.registered-polygon-morph -->

## 当前资产入口

本页是`geometry.registered-polygon-morph`当前合同，状态与证据登记在[catalog](../../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/registered-polygon-morph.test.mjs)保留原断言。旧实现、专属测试及scene位置不留wrapper；paths-and-contours仅保留跨机制导航。

本次只迁移文件并修正相对导入，不改变算法。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


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
node --test engine/motion-elements/lib/foundations/geometry/registered-polygon-morph/test/registered-polygon-morph.test.mjs
node engine/motion-elements/scripts/render-gallery.mjs --demo registered-polygon-morph --out /tmp/polygon-clean-new
node engine/motion-elements/scripts/render-gallery.mjs --demo registered-polygon-morph --debug --out /tmp/polygon-debug-new
```

Technical tests cover exact endpoints and independent Native RGBA baselines, caller
path/style/exception isolation, reverse/seek/process determinism, 24/30/60fps grids,
invalid geometry and off-grid collapse. These are not artistic or production acceptance;
human playback and semantic ID-trajectory review remain pending.


## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/foundations/geometry/registered-polygon-morph/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/geometry/registered-polygon-morph/test/*.test.mjs
```

保留共享validate及公开barrel引用的math/time/matrix、timeline依赖；Canvas绘制仍复用原共享适配层，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

编译计划或band品牌仅当前canonical模块实例有效；保存原始输入重新compile，polygon绘制还要求对应的真实sample状态。输出深冻，不保留可变输入或播放历史。代码适用[包MIT许可](../../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。

原合成示例：[registered-polygon-morph-scene.mjs](examples/registered-polygon-morph-scene.mjs)，可调用Canvas函数或gallery scene；不是自动生成的生产影片。
