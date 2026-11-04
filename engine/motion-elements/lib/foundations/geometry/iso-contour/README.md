# Regular-grid iso-contour extraction — experimental

<!-- asset-self-description: geometry.iso-contour -->

## 当前资产入口

本页是`geometry.iso-contour`当前合同，状态与证据登记在[catalog](../../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/iso-contour.test.mjs)保留原断言。旧guide、实现和测试位置不留wrapper。

本次只迁移文件并修正相对导入，不改变算法。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


One geometry foundation, not separate effects for different fields, levels or colors. `compileContourGrid` freezes the regular grid metadata and brands the plan; `extractIsoContours` produces polylines for one scalar level. Consulted source references and boundaries are listed below. Implementation and drawing have no package downloads, browser, GPU or clock dependency.

```js
const grid = compileContourGrid({columns:3,rows:3,x:0,y:0,width:2,height:2});
const result = extractIsoContours(grid,{
 values:[0,0,0,0,2,0,0,0,0], level:1
});
```

## Explicit numerical/topology contract

- Grid sample dimensions are integers 2..1025, with at most 65,536 samples. x/y are finite ±1e6; width/height are finite .001..1e6. Samples are row-major, y increases by row; geometry is a regular rectangular grid.
- Each quad is split along **NW–SE** into `(NW,NE,SE)` and `(NW,SE,SW)`. Scalars are linear inside those triangles. This removes the *choice* at a bilinear saddle by making a declared different interpolation domain; it is **not** an asymptotic decider, bilinear marching-squares equivalence, diagonal-independent topology or analytic level set.
- Records must be this realm's ordinary plain objects; null-prototype and foreign-realm objects reject. All documented fields are required. `values` is a dense ordinary Array of exactly sampleCount finite numbers in ±1e12. `level` has the same range. Unknown own string/Symbol keys, accessor fields and sparse arrays are rejected. Inputs are not changed; outputs are recursively frozen.
- Classification is `value > level`; equality is below. Crossings on grid vertices are merged by vertex ID, ordinary crossings by stable undirected grid-edge ID. Duplicate segments are coalesced. `plateauTriangles` counts triangles with all three samples exactly equal to the level. `zeroLengthSegments` counts discarded triangle segments: both crossings have the same topological ID, or both actual IEEE coordinates compare exactly equal. Two triangles can each contribute a discarded segment. This differs from coalescing duplicate nonzero graph edges, which does not increment this counter. Distinct edge/vertex IDs are not merged merely because their points are close or even coincident outside such a triangle. No epsilon snapping is used. Branch vertices stop traversal through a junction and are reported. A walk that returns to its starting branch can still be marked closed, while another walk at that junction is open. Thus branch diagnostics can coexist with both closed loops and open strips; closed=true alone does not certify a nonsingular or independently fillable shape.
- Output includes contours `{points,closed}`, segment/closed/open counts, degeneracy counts and fixed triangulation name. Closed loops do not repeat their first point. Orientation, area/holes, component identities across time and stable loop indices are not promised. Deterministic order reflects row-major triangle/graph traversal, not temporal identity.
- Open strips stop on the grid boundary or an exact-level branch. The function returns isolines, **not a general filled-domain solution**. In particular all-above or all-below scalar grids have no isoline. Callers who fill closed loops using even-odd must establish the domain boundary is strictly below the level and that no open strips/branch/plateau condition compromises their interpretation. This must be checked per scene; the API does not establish it for the caller.
- The API does not create metaballs, infer a field from images, conserve mass, simulate fluids, smooth contours, interpolate animation time, control tessellation error, triangulate filled polygons, or rasterize. Finer sampling can improve geometric approximation, but no fixed-grid fidelity or temporal smoothness guarantee is claimed.

## Reuse, not parameter inflation

Suitable for animated field silhouettes that merge/split, thresholded heat-field outlines, or topographic line artwork, with caller-supplied scalar samples. A single contour mechanism covers all levels, colours, fields and frame times. Field-source choreography, gradients, sound, fonts and composition are project art, not extra foundations or recipes.

Compared with existing library: registered polygon morph keeps predetermined point correspondence/topology; raster matte/displacement returns pixel processes; this mechanism extracts changing line topology from explicit scalar samples. Existing opacity is reused for the final message. Reduced motion is a caller presentation choice, not a hidden input or new animation clock; this task has not yet created a generic reduced-motion demo.

Import from `lib/foundations/geometry/iso-contour/index.mjs`. Run `node --test lib/foundations/geometry/iso-contour/test/iso-contour.test.mjs` from `engine/motion-elements`. Synthetic tests, actual video-use traces and decoded frames are separate from normal-speed viewing, listening, owner acceptance and public registration.

## Numerical and resource limits

Interpolation uses ordinary IEEE arithmetic, not robust predicates or exact rational geometry. A strictly positive interpolation fraction can underflow, or adding a tiny displacement to a large coordinate can round back to the endpoint. Exactly collapsed triangle segments are now discarded and reported. This narrow fix does **not** guarantee all near-degenerate topology is stable, that adjacent levels vary smoothly, or that arbitrary coincident IDs are globally welded. Very short nonzero segments remain nonzero; there is no geometric epsilon. Branch splitting may produce open strips at singular exact-level vertices, so an open strip need not be a domain-boundary path.

The public cap is **65,536 samples**, deliberately smaller than the prototype's 262,144. Each dimension remains integer2..1025 but the product must fit the cap. Samples and result graph processing are synchronous CPU work. Worst-case alternating-sign grids create many short components and allocate a substantial graph. This is bounded offline geometry, not a realtime/constant-memory claim. Grid plans hold only metadata; each extraction constructs its own temporary graph, with no global field/cache/history. Returned objects are deeply frozen. Values are not retained; callers can reuse a plan with new arrays, but must not use mutating proxies or concurrent side effects as data.

Tests include all3,125 combinations of five integer corner values and five integer levels on a2×2 grid, compared with an independently implemented BigInt rational triangle-intersection oracle. That finite oracle converts rational coordinates for a12-decimal comparison; it is not a proof of all floating-point inputs. Other tests cover shared edges, exact vertices, duplicate edges, branches, plateaus, underflow, translated coordinate collapse, strict objects/arrays, shuffled extraction and a fresh Node process. Native raster probes and resource receipts are separate engineering evidence, not a portable pixel guarantee or artistic approval.

## Primary references and original implementation

Checked2026-10-29. No third-party source, tables, packages or binaries are copied or bundled.

- [ContourPy algorithm](https://contourpy.readthedocs.io/en/stable/description.html): consistent sample classification, crossing interpolation and stitching. This implementation does not use its two-pass scan or filled-contour algorithm. [Its quad-as-triangles option](https://contourpy.readthedocs.io/en/v1.3.0/user_guide/calculate/quad_as_tri.html) uses a virtual center and four triangles; our fixed two-triangle domain is deliberately different. [ContourPy1.3.0 license](https://github.com/contourpy/contourpy/blob/v1.3.0/LICENSE): BSD-3-Clause.
- [VTK triangle source](https://github.com/Kitware/VTK/blob/v9.3.0/Common/DataModel/vtkTriangle.cxx) and [VTK Book chapter6](https://examples.vtk.org/site/VTKBook/06Chapter6/): triangle scalar contouring yields interpolated line segments. No case table or locator code was copied. [VTK9.3 copyright/license](https://github.com/Kitware/VTK/blob/v9.3.0/Copyright.txt): BSD-3-Clause.
- From the user's requested library study, [Paper.js Path](https://paperjs.org/reference/path/) and [v0.12.18 Path source](https://github.com/paperjs/paper.js/blob/v0.12.18/src/path/Path.js) were read for explicit segment lists, closing first/last segments and path topology. [MIT license](https://github.com/paperjs/paper.js/blob/v0.12.18/LICENSE.txt) checked. These are useful drawing/representation responsibilities, **not** an implementation of scalar-grid extraction and not the algorithm source for this module. A renderer could consume these output polylines without replacing this solver.

## Actual candidate film and version bridge

An actual10.4-second/624-frame sound candidate calls1 grid compile and624 extractions. Returned vertices drive624 fills,624 clips and624 outlines, consuming471572 contour vertices; field-source generation, gradients, gloss, typography and sound are project-only work. The scene checks open/branch/plateau conditions before filling. Independent review recomputed actual fixed-triangle interpolation, replayed all624 Native states/draw paths, inspected48 decoded nodes and rebuilt22 representative frames in separate Node processes.

The original film uses a prototype with a different hash and larger resource cap. Its media, source and historical manifests remain unchanged. A separate public-revision bridge substitutes only this module in a private copy: both versions reproduce all624 actual usage records and fill/clip/outline geometry exactly, and22 selected original raw PNGs plus22 fresh-process rebuilds match. This is not a new full encoded film, all-frame pixel comparison, cross-platform guarantee or a proof of all input domains. The film does not exercise the repaired subnormal/coordinate-collapse case; dedicated boundary tests do.

Actual source/media/usage hashes and bridge receipts are privately retained, not bundled with the public library. Keep normal-speed viewing NOT_DONE, audioListening NOT_LISTENED, owner artistic acceptance PENDING_USER, and generic production transfer NOT_RUN. Technical source/limited-frame passes do not upgrade these gates. Reproduce the public contract with the synthetic example and dedicated tests above; reproducing the private artwork additionally requires its separately retained licensed assets/source.


## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/foundations/geometry/iso-contour/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/geometry/iso-contour/test/*.test.mjs
```

保留原实现的专属输入校验和内部数值函数，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

计划品牌仅当前canonical模块实例有效；保存原始定义并重新compile。iso-contour结果深冻，两个raster返回新可变缓冲；不得并发修改调用中的输入。代码适用[包MIT许可](../../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。
