# Authored dependency map — restricted static candidate

An original, source-only fixed-layout DAG painter. It retains the relationship between explicitly positioned nodes, stable IDs and directed dependencies. It does not include any reference poster, brand, screenshot, phone frame, private report or font. **0 registered families, 0 formal recipes, no portfolio acceptance.**

`drawDependencyMap(ctx, {bounds,nodes,edges,theme})` validates the authored model and labels before painting nodes and directional edges. Use a fresh, trusted Canvas context and an already registered licensed font. See [CONTRACT.md](CONTRACT.md) for precise boundaries and [DEDUP.md](DEDUP.md) for the existing alternatives.

Two independently authored synthetic calls in `examples.mjs` use the same implementation:
- Publishing: three sources → editorial review → two planned deliverables, a wide blue composition.
- Workshop: two inputs → session plan → two reviews → one planned packet, a tall warm composition.

These are actual runnable compositions, not evidence of user acceptance or a real operating workflow. The external renderer's typography is a caller-provided resource; results must be remeasured and viewed after changing it. No original-font match or cross-platform PNG identity is promised.

## Test and render

Node 24.22.1 with external `@napi-rs/canvas` 0.1.100 was used. No dependencies or font binaries are bundled; do not install or render into this checkout.

```sh
export GRAPH_CANVAS_MODULE=/absolute/external/node_modules/@napi-rs/canvas
export GRAPH_FONT_PATH=/absolute/external/authorized-font.ttf
node test.mjs
# Optional new output directory outside the repository:
node test.mjs /absolute/external/new-output
```

The test loader explicitly checks successful font registration, records supplied font SHA256, executes both compositions twice for same-environment determinism, checks input immutability, and exercises invalid geometry, graph topology, typography and palette. A focused state regression checks actual fill/stroke pixels after the call and records color-property readback separately: Native Canvas 0.1.100 can return stale color getters even when subsequent paint is restored. Delimiter-bearing IDs are a positive regression; duplicate identical edges still reject. No image/text fixture is read from the original reference.

The output path must be absent and external; writes use exclusive-create. This is a local test tool with trusted filesystem/environment inputs, not an adversarial filesystem sandbox or transactional exporter. No automatic download, network access, resource acquisition or package install occurs.

Local source-candidate preparation does not authorize publication. Independent review remains required; browser, motion, responsiveness, interaction and automatic graph routing are outside scope.
