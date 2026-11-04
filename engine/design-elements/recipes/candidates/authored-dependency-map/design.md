# Show authored dependencies without implying execution

This source-only candidate draws a fixed-layout directed acyclic graph. It is not a registered family, formal recipe, workflow engine or accepted portfolio work. [README.md](README.md) covers execution and resources; [CONTRACT.md](CONTRACT.md) defines the input and painting boundaries.

## Choose the relationship, not the silhouette

Use it when stable node identities and explicitly authored directed dependencies are the information to preserve. The caller supplies every rectangle and edge. A DAG check establishes only acyclic topology: it does not prove that a task ran, finished, takes a certain duration, or genuinely depends on another task. A focused node is stylistic emphasis, not a status.

The [implementation](index.mjs) resolves normalized rectangles inside caller bounds and draws straight bottom-center to top-center connections with fixed arrowheads. Top-to-bottom arrangements are a useful authored convention, not an automatic layout result. Position connected rows with enough space to read arrowheads and distinguish branches. Valid nonoverlapping nodes can still have crossing or occluded edges; inspect and revise coordinates yourself. Upward edges are legal but their geometry is not repaired.

## Two compositions exercise different topology

[examples.mjs](examples.mjs) supplies a wide publishing composition with three inputs converging on editorial review, then two planned deliverables. Its tall workshop composition has two inputs, a plan, two review branches and a final planned packet. They change aspect ratio, node count, topology, palette and content while calling the same draw function. Neither is evidence that a real publishing or workshop workflow occurred.

Use node labels to state what each item represents. Do not borrow the synthetic labels as verified operational facts. Keep title, legend, source context, metric/status cards and any phone frame in the host composition. The candidate deliberately extracts only the center graph, not the surrounding source layout.

## Alternatives and failure conditions

[DEDUP.md](DEDUP.md) records the distinction from authored paths, semantic data, radial options, quantitative flow ledgers and timing diagrams. Choose those when the underlying relationship is an illustrative sequence, value encoding, radial choice, quantity flow or time grid. Choose a separate graph-layout tool when placement/routing should be inferred rather than authored.

Labels must fit the supplied font without wrapping or shrinking. Text advance checks cannot certify shaped glyph ink. Theme colors and focus emphasis need an actual contrast/readability review; the graph validator does not perform one. Caller context restrictions and current-path replacement in the contract matter when embedding the painter in a larger scene.

## Evidence boundary

[test.mjs](test.mjs) runs both compositions with an external Canvas and licensed registered font, checks repeat-byte determinism and unchanged inputs, rejects invalid geometry/topology/labels before pixel mutation, and probes actual post-call paint state. This proves bounded behavior in that supplied environment, not automatic routing quality, cross-platform font equivalence, accessibility, motion or aesthetic acceptance. Inspect crossings, endpoint direction and label fit in any new composition even when the technical checks pass.
