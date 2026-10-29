# Weighted hierarchy — private layout candidate

`layoutWeightedHierarchy({tree,bounds,axis?})` performs original ordered alternate-axis slice-and-dice partitioning. `axis` is `x` (default) or `y`. `tree` nodes have unique ASCII IDs matching `[A-Za-z0-9_-]{1,64}`. A leaf has `{id,weight}`; a branch has `{id,children}` and derives its weight solely from descendants. It does not accept a branch weight. Output nodes retain parent ID, depth, aggregate weight, leaf flag and rectangle.

```js
import {layoutWeightedHierarchy} from '../../lib/candidate-index.mjs';
const result = layoutWeightedHierarchy({
  tree:{id:'root',children:[{id:'work',weight:2},{id:'garden',weight:3}]},
  bounds:{x:0,y:0,width:500,height:300}, axis:'x',
});
```

Continuous leaf areas are proportional to weights within floating-point arithmetic; each split preserves order and parent containment. Zero leaves/branches occupy zero area; all-zero root rejects. No squarification, aspect-ratio optimality, pixel rounding, dynamic transitions or architecture constraints are promised. Tiny positive regions that cannot retain positive representable extents reject rather than silently disappear.

Limits:256 nodes, depth16 (root0),128 children per branch; leaf weight0–1e9 and total≤1e12. Bounds x/y±1e6 and positive width/height0.001–1e6. Ordinary records/dense arrays only; accessors, duplicate IDs, cycles, missing fields and unknown fields reject. Input copied, output deeply frozen; no global randomness/clock/dependency.

Different from grid/wrap because fixed total area is recursively allocated by hierarchical weights; different from DAG because this is a strict rooted tree; different from weighted-flow because the result is nested area, not flow-band ports. Existing layout handoff may interpolate output rectangles, but intermediate geometry is not automatically a freshly weighted partition. That distinction is explicit in ROOM TO GROW's private film evidence.

Tests: exact known oracle,100 deterministic randomized hierarchy partitions, all-pairs nonoverlap/containment/area, zero subtrees, resource boundaries, precision failures, immutable data and descriptor rejection. Original code, established algorithm; research/rights in SOURCES.md.
