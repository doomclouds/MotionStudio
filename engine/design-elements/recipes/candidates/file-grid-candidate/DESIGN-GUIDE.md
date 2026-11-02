# Design guidance: one list, two honest views

## Reuse the relationship, not the window skin

The useful abstraction is **complete collection → static viewport → same-source summary**. A grid and a number card that happen to look aligned are not enough: an off-window selection must still count toward selectedTotal. The summary accepts only the grid's minted handle, so it cannot silently describe a different list. This is one small recipe, not a file manager or another generic metric-card family.

1. Author a complete fictional list, with stable unique IDs. IDs identify content; name/kind describe it. Preserve the provided order rather than suggesting an unimplemented sort.
2. Choose columns, rows and cell dimensions; then choose a row-aligned offset. `remaining` means after this window, not total minus visible when offset > 0.
3. Pass the actual handle into the summary. If you want a separate sidebar, read `grid.plan` or `summary.plan.stats`. Label “selected here” separately from “items visible.”
4. Compose on your own host. Unselected cells are transparent; select a quiet sufficiently contrasting background. Selected cells intentionally remain opaque pale blue. The palette is fixed, not an open theme API.
5. Keep the synthetic/static disclosure visible. An illustrative breadcrumb is not a navigation affordance; do not attach live-file claims to these PNGs.

## Typography and density

The cell label is one 24px line. Increase cellWidth or shorten editorial wording deliberately; do not silently ellipsize or shrink a failed input. Character limits are guardrails, not a promise of fit: repeated wide glyphs can fail sooner. Hidden items are validated too so moving the authored viewport cannot reveal an unchecked name.

The summary needs more width when a long label and count text share a line. Keep labels brief and reserve the strongest typographic contrast for the content panel, not the status rail. The glyph block and label share a repeatable rhythm; increasing rows changes capacity, not font size. Treat the 1.6M-pixel tile ceiling as a hard local budget, not a performance benchmark.

## Two proof compositions

- **Field study:** 3 × 2 grid on warm paper, 10 items, offset 3. Only one of three selected IDs is visible. A dark-indigo annotation panel explicitly shows 1 selected here / 2 outside. Counts are model-driven. This is useful for review queues or prepared material kits.
- **Edition desk:** 2 × 3 larger cells on warm white, 9 entirely different items, no selection. A lilac editorial panel distinguishes no selection from an empty collection. This is useful for publications or lessons without pretending to show a connected device.

Both use the same two factories and different complete datasets/cell dimensions/host dimensions. They do not reuse a source screenshot, dual-device frame, product brand or third-party icon. The folder/package/document geometry is authored in code. The examples are not additional reusable API entrypoints.

## Deliberate exclusions

Do not turn this into a universal document renderer, real directory listing, file picker, selectable UI or responsive component without a separate contract and tests. No semantics are attached to actual filenames or extensions beyond the explicit `kind`. No filesystem enumeration, network assets, drag/drop, clipboard, execution or device discovery belongs in this recipe. Keep private reference material, audit evidence and original-product assets out of any future repository projection.
