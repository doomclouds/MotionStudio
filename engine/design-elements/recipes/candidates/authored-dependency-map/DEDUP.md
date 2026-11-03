# Why a small candidate, not another family

Checked against the source tree based on e43bb1c (the supplied local equivalent of current dev), reading the design index and the relevant contracts:

- `design.authored-paths.v1`: illustrative paths with strictly increasing x and legend/caption. It does not own rectangular node IDs, graph edges, DAG validation or endpoint arrows. Useful for a narrative sequence, not branching dependency topology.
- `design.semantic-data.v1`: ordered points with categories/value encodings and strictly increasing x. It does not provide arbitrary directed dependencies. Mapping branch membership into numeric values would misstate semantics.
- `recipes/candidates/radial-node-candidate`: 3–9 radial options, angle separation, selected identity and summary tiles. Its angle-based placement and center menu are not an explicitly authored rectangle DAG.
- `flow-ledger-candidate`: paired rates, exact integrated totals, category partitions and rankings. Flow here means quantities, not task dependencies.
- `timing-diagram-candidate`: digital steps and contiguous symbol buses on a time grid. It is not a directed graph renderer.
- `explicit-geometry-candidates`: explicit geometric layers, not graph semantics.
- `open-design-static-three`: linear chart/light field and a case-local title card; none provide graph identity validation.

Search hits alone were not treated as equivalence. Existing titles/material surfaces remain the right primitives for surrounding composition; they are not copied into this package. The retained gap is deliberately narrow: authored rectangle placement plus validated static directed acyclic relationships, with explicit limitations. Two different compositions exercise that same gap. This does not establish a new public family, a general diagram engine, or that future needs should use this helper instead of a mature layout tool.
