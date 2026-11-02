# geometry.ray-chain

Geometric Snell refraction and total-internal-reflection ray chains through one convex medium.

当前注册状态：`experimental`；公共调用入口：`lib/index.mjs`，API：`compileOpticalMedium`。参数验证以实现为准，不把编译、采样或绘图支持再计数。

实现：[lib/foundations/geometry/ray-chain.mjs](../../lib/foundations/geometry/ray-chain.mjs)。

## 参数、用途与边界

One new responsibility: nearest-boundary traversal and medium state across a single convex dielectric, including chosen Snell transmission and total internal reflection (TIR). NOT merely a direction helper; NOT a visibility fan, image warp, general scene/path tracer, Fresnel splitting or3D.

## API and finite inputs
`compileOpticalMedium({width,height,polygon,ior})`: viewport `[0,width]×[0,height]`, dimensions1..10000;3..32 finite vertices strictly convex **counterclockwise in numeric x/y coordinates** (positive cross product; this appears clockwise on a y-down Canvas). Every nonadjacent vertex must lie more than the distance guard inside each edge halfplane. Polygon wholly inside viewport guard. Glass IOR1.01..4, ambient air index fixed1. Each edge>4 distance guards. No holes/nesting/overlapping media/curves.

`traceOpticalRay(plan,{origin,direction,maxInteractions})`: origin strictly inside viewport, at least one distance guard from every finite medium edge; may lie inside or outside medium. Direction finite components bounded±1e6, norm>1e-12, normalized internally. Budget integer1..64 actual interfaces. Returns frozen chain segments from source to viewport. Each segment reports endpoints, medium, direction and ending (`transmit`,`tir`,`viewport`); an interface reports nearest edge, incoming-facing normal, outgoing unit vector, n1/n2, cosI, sin² transmitted angle. Complete successful output only; budget overflow throws, never masquerades as escaped light. Plans WeakMap authenticated; source data copied; result deeply frozen. All inputs ordinary own data objects/dense arrays; accessors, unknown fields, symbols, sparse/subclass arrays rejected. Hostile Proxy/intrinsic monkeypatching is not sandboxed.

## Meaning and geometry
Edges have outward right-hand normal `(dy,-dx)/length` for numeric CCW. First medium classification uses all edge halfplanes. A ray intersects all edges except its immediately previous edge; the smallest positive valid distance wins. At an interface, inside state requires outward-facing travel, outside requires inward-facing travel. Failure throws `medium orientation mismatch`.

Snell uses n1/n2 and a normal facing against incident travel. Undercritical: follow **only the transmitted branch**, toggle medium. Overcritical: specular TIR, keep medium. No partial reflection below critical, Fresnel power, absorption, polarization, dispersion model, coherent phase, diffraction, scattering or radiance/energy calculation. Separate per-ray IOR would be caller parameters, not a spectral renderer. There is no physical time-of-flight; later arc-length reveals are graphic pacing.

Polygon containment and convexity mean an inside ray must encounter another medium boundary before viewport; a missing inside intersection throws `lost enclosing boundary`. Outside misses may reach viewport. Previous edge is excluded by identity, not by nudging the origin. Returned interface endpoint is shared exactly by adjacent output records. Source and viewport boundary corners are separate from medium corner uncertainty; viewport corner exit is permitted because no refractive branch is chosen there.

## Explicit exclusion bands
Scale = viewport diagonal. `distanceGuard = scale * 1e-7` in source coordinate units. At1280×720 it is0.000146860478 pixels. Directional `angularGuard=1e-10` is dimensionless normalized cross/dot; `criticalGuard=1e-9` is dimensionless `|1−sin²θ_transmitted|`. These constants are part of plan identity, not adjustable silent tolerances.

- Source within distanceGuard of finite medium edge: reject.
- Nearest hit within distanceGuard along an edge of either vertex: reject `vertex guard`.
- Two nearest interfaces less than distanceGuard apart: reject `ambiguous nearest boundary guard`.
- Positive/near-origin candidate≤distanceGuard: reject, do not push ray.
- Ray near-parallel to a supporting edge and within distanceGuard of its supporting line, with forward finite-edge extent: reject `grazing supporting line guard`. Else parallel edges contribute no candidate. Incidence normalized dot≤angularGuard rejects.
- Critical discriminant within±criticalGuard: reject; never silently clamp to transmitted or TIR branch.

These guards define a restricted floating-point API, NOT exact predicates or interval arithmetic. No claimed universal error bound for all ill-conditioned accepted scenes. Tests cover analytic slab and right-prism oracles, but artistic paths must be checked separately across all sampled and relevant extrema states. Explicit failures are retained as counterexamples.

## Resources and identity
At most32edges×65trace iterations; at most65returned segments. Polygon validation≤1024halfplane checks. No callback, recursion in tracing, stochastic integration or mutable frame history. Identity is canonical JSON string containing version/viewport/ordered normalized vertices/IOR/guards; caller may SHA256 it. It is not itself a cryptographic digest. Same frozen plan can be sampled out of order.

## 可执行输入

按 [注册示例](../../examples/registered-foundations.mjs) 的 setup/compile/sample 顺序调用；以下为 catalog 输入，不是直接 eval 的代码。

```json
{
  "width": 1000,
  "height": 1000,
  "polygon": [
    {
      "x": 200,
      "y": 200
    },
    {
      "x": 800,
      "y": 200
    },
    {
      "x": 800,
      "y": 800
    },
    {
      "x": 200,
      "y": 800
    }
  ],
  "ior": 1.5
}
```

## 当前证据与来源边界

注册、技术测试、原生像素、常速观看、实际听审、用户接受和跨场景迁移互不替代。本页没有新增执行或接受声明；当前状态以 [catalog](../../catalog.json) 的本条 evidence 为准。此批仍 experimental，通用生产迁移 NOT_RUN；历史试验不能自动升级当前源码。

测试入口：[test/ray-chain.test.mjs](../../test/ray-chain.test.mjs).

完整历史合同／研究及来源边界保留在 [历史记录](../history/private-candidates/ray-chain/ORIGIN-CONTRACT.md)；该记录中的旧路径不是调用入口。代码适用 [包许可](../../LICENSE)，引用算法、字体、媒体和私有影片不因此取得重新分发许可；相关 SOURCES/来源说明保留在同一历史目录。
