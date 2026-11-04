# sampled-band（experimental）

<!-- asset-self-description: geometry.sampled-band -->

## 当前资产入口

本页是`geometry.sampled-band`当前合同，状态与证据登记在[catalog](../../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/sampled-band.test.mjs)保留原断言。旧实现、专属测试及scene位置不留wrapper；paths-and-contours仅保留跨机制导航。

本次只迁移文件并修正相对导入，不改变算法。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


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
`lib/foundations/geometry/sampled-band/examples/sampled-band-study.mjs` shows neutral wave and chart uncertainty envelopes;
`lib/foundations/geometry/sampled-band/test/sampled-band.test.mjs` covers reusable geometry, bounds, numerical degeneracy,
validation, native raster equivalence and adapter isolation. No generated media or
commercial assets are included.

## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/foundations/geometry/sampled-band/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/geometry/sampled-band/test/*.test.mjs
```

保留共享validate及公开barrel引用的math/time/matrix、timeline依赖；Canvas绘制仍复用原共享适配层，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

编译计划或band品牌仅当前canonical模块实例有效；保存原始输入重新compile，polygon绘制还要求对应的真实sample状态。输出深冻，不保留可变输入或播放历史。代码适用[包MIT许可](../../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。

原合成示例：[sampled-band-study.mjs](examples/sampled-band-study.mjs)，可调用Canvas函数或gallery scene；不是自动生成的生产影片。
