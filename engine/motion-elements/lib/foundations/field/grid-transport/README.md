# 网格输运：静态速度场中的绝对时间轨迹

<!-- asset-self-description: field.grid-transport -->

Midpoint integration and cached absolute-time transport through a bilinear velocity grid.

当前注册状态：`experimental`；公共调用入口：`lib/index.mjs`，API：`compileGridTransport`。参数验证以实现为准，不把编译、采样或绘图支持再计数。

实现：[lib/foundations/field/grid-transport/index.mjs](./index.mjs)。

## 设计意图与输出职责

让一组材料点共享空间速度场，而非分别编写路径。先compileVelocityGrid，再compileGridTransport，最后sampleGridTransport。grid/plan均冻结并有模块实例身份；采样返回新的planIdentity、time、index、fraction与points，可变输出不会改变后续seek。不能用JSON重建plan，恢复时重新编译输入。

## 参数、用途与边界

Original portable ES module, no import/dependency. One mechanism: shared static velocity-grid material transport. Noise, streamfunction derivatives, palettes and widths are caller authoring, not separate mechanisms.

## Difference from existing code
The existing attractor field samples normalized radial/tangent **orientations**, not velocity/trajectory history. Existing finite-particles is independent constant-acceleration trajectories with finite lifetime; this module integrates the SAME spatially varying field from all seeds. It is neither an alpha/trail compositor nor a manual sine perturbation of a strip.

## Inputs and boundaries
`compileVelocityGrid({columns,rows,vectors})`: 2..128 inclusive each axis; exactly rows×columns ordinary dense vector array, row-major nodes at `(column/(columns-1),row/(rows-1))`; velocity components finite −4..4 unit-square coordinates/sec. Bilinear interpolation, closed [0,1]² only. No callback, time-varying grid or mutable external reference.

`compileGridTransport(grid,{seeds,duration,steps})`: 1..256 ordinary dense `{x,y}` seeds inside closed unit square, duplicates permitted as distinct ordered addresses. Duration [.0001,30] seconds, integer steps1..4096. Reject before allocating/integrating if `seedCount*(steps+1)>262144`. Fixed explicit midpoint RK2: `m=p+h*v(p)/2; next=p+h*v(m)`. All midpoint and endpoint stages must be inside CLOSED square in actual IEEE arithmetic; otherwise compilation rejects, no partially returned cache. No epsilon clipping, wrapping, sliding, extrapolation, obstacle detection or automatic boundary handling. An ODE might leave/reenter between sampled stages even if all stages pass; we do NOT claim a certified continuous ODE containment proof.

`sampleGridTransport(plan,{time})`: finite [0,duration]. Piecewise-linear interpolation of cached step endpoints; exact cache endpoint is returned at horizon. Fresh point objects, arbitrary out-of-order repeatable seeking, no integration during seek and no previous-frame state. This is a defined discrete approximation, not the exact continuous ODE or an adaptive integrator. Linear cache segments are within the convex square when compilation succeeds. This is NOT proof about unsampled exact ODE positions.

`sampleVelocityGrid(grid,{x,y})` exposes the same bilinear interpolant for testing/reuse.

## Identity and resources
Plans are WeakMap-authenticated and frozen. Source inputs copied, grid vectors hidden/frozen, cache private. Canonical JSON identity includes normalized finite inputs (−0 canonicalized to0), grid dimensions/vector order, seed order, duration, step count and explicit algorithm/version/boundary/seek. It is an exact comparison string, **not a cryptographic digest**. Caller may SHA256 it (concept harness does); no Node-only import in core. A changed parameter cannot intentionally reuse the same canonical string. No cross-process cache loader yet; replay recompiles the source. Output mutation never changes later seek.

Grid input max16384 vectors; each interpolation reads four grid corners, independent of grid size. Work is O(gridNodes + seeds×steps), NOT gridNodes×seeds×steps. Accepted worst cache262144 point states =4194304 Float64 payload bytes, at most524288 velocity evaluations /2097152 four-corner reads (loose safe bounds; endpoints count reduces actual maximum). Validation and identity strings add bounded input/output overhead. One seek outputs at most256points and does not resample grid. All numeric maxima are checked before integration; arbitrary callbacks/iterators/accessors/unknown keys/symbol keys/subclass arrays/sparse arrays rejected for normal data inputs. Hostile Proxy traps and monkey-patched platform intrinsics are not a sandboxed input model.

## Numeric limits
Bilinear field is continuous but generally not smooth across cells; no general second-order convergence guarantee asserted for arbitrary fields/near boundaries. Constant and affine-shear exact analytic oracles and smooth linear rotation convergence tests pass; midpoint rotation has numerical radius drift and is NOT energy-preserving. Floating precision, spatial grid resolution, material-segment resolution and piecewise-linear temporal interpolation all contribute error. No fluid pressure, incompressibility, collision or material inextensibility guarantee. Caller widths do not conserve mass.

## 可执行输入

按 [注册示例](../../../../examples/registered-foundations.mjs) 的 setup/compile/sample 顺序调用；以下为catalog的transport输入，必须先用同一条记录exampleSetup.velocityGrid编译grid；[本目录示例](examples/contract.mjs)实际执行这两步，不把JSON当可eval代码。

```json
{
  "seeds": [
    {
      "x": 0.2,
      "y": 0.6
    }
  ],
  "duration": 3,
  "steps": 79
}
```

## 当前证据与来源边界

注册、技术测试、原生像素、常速观看、实际听审、用户接受和跨场景迁移互不替代。本页没有新增执行或接受声明；当前状态以 [catalog](../../../../catalog.json) 的本条 evidence 为准。此批仍 experimental，通用生产迁移 NOT_RUN；历史试验不能自动升级当前源码。

测试入口：[lib/foundations/field/grid-transport/test/grid-transport.test.mjs](test/grid-transport.test.mjs).

完整历史合同／研究及来源边界保留在 [历史记录](../../../../docs/history/private-candidates/grid-transport/ORIGIN-CONTRACT.md)；该记录中的旧路径不是调用入口。代码适用 [包许可](../../../../LICENSE)，引用算法、字体、媒体和私有影片不因此取得重新分发许可；相关 SOURCES/来源说明保留在同一历史目录。

## 同目录使用入口与恢复

本页是当前合同；[design.md](design.md)解释选择与导演取舍，[index.mjs](index.mjs)是实际实现，[examples/contract.mjs](examples/contract.mjs)是可执行公开入口示例。目录迁移不新增API或兼容层。机器身份与证据仍只由[catalog](../../../../catalog.json)登记。

Node24+，从仓库根运行：

```sh
node engine/motion-elements/lib/foundations/field/grid-transport/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/field/grid-transport/test/*.test.mjs
```

实现无外部依赖。公开barrel示例间接依赖同级motion-timeline-core及Node内建crypto，恢复时保留仓库/portable相邻布局。无需Canvas、FFmpeg、字体、媒体或联网；不宣称浏览器原生兼容。示例只验证数值合同，不生成影片。目录调整不升级既有像素、观看、听审、用户接受与跨场景迁移证据。
