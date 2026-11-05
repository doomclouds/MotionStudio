# Design recipe source roles

These directories classify existing source packages, not acceptance or maturity. Stable IDs, original manifest claims, source identities, resource locks and nested license terms remain authoritative. No old-path aliases are provided.

| Role | Scope | Not implied |
|---|---|---|
| `reviewed/` | Packages whose existing recipe records declare `technical-reviewed-static-recipe` | Whole-package maturity, production readiness, user aesthetic approval, or review of every bundled source |
| `candidates/` | Other bounded source packages, including unknown or mixed statuses and `technical-reviewed-static-recipe-candidate` | Promotion to a registered family or reviewed recipe |
| `batches/` | Historical discovery indexes only, linking packages by original selection group | Another source implementation or authoritative lifecycle registry |

Directory placement never updates a manifest status. `xhs08` remains a candidate. Frozen locks/provenance retain their original commit-scoped paths and URLs; those are historical identities, not current runtime entrypoints. Local active links and build inputs use only the new layout. Public family registration remains in `../catalog.json`.

Start at [design index](../Index.md), or query the committed tree from the repository root:

```sh
python3 scripts/design-navigation.py --repo . --format markdown
python3 scripts/design-navigation.py --repo . --details
```

The query is read-only and excludes uncommitted edits. Per-package contracts, rights notices and explicit external resources remain required. This directory change does not establish fresh rendering, visual/audio review, cross-platform behavior or final acceptance.

## Material rendering candidate

[Three spot-ink print](candidates/spot-ink-print-candidate/README.md) adapts a credited LemoLab shader into a bounded density-plate compositor and portable render plan. It is source-only, with synthetic tests and optional external-oracle diagnostics; it adds no registered family or portfolio work. Real-browser and artistic acceptance remain separate.

[Protected dual palette model](candidates/protected-palette-model-candidate/README.md) preserves semantic index identity and prepares two-palette selection for the existing indexed-pixel renderer. It adds no rasterizer, quantizer, registered family or portfolio work.

[Fixed isometric camera](candidates/isometric-camera-candidate/README.md) adapts a fixed 30° projection, horizontal-plane inverse and positive log zoom into an immutable camera snapshot. It provides no renderer, depth sorting or timeline and adds no registered family or portfolio work.

[Screen-space ink path](candidates/screen-ink-path-candidate/README.md) derives affine point transformation, fixed screen-distance resampling and deterministic normal displacement from credited LemoLab code. It returns geometry only, with open-endpoint and nonperiodic seam limits; no character rig, renderer, film, registered family or portfolio work.

[Umbrella pictogram geometry](candidates/umbrella-pictogram-geometry-candidate/README.md) extracts a credited normalized opening/furling silhouette and its shaft, hook and ferrule. It returns fixed-topology geometry only, with explicit bounded overshoot; no Canvas, palette, story, weather, physical cloth or registered family is bundled.

[Original flat-color brush](candidates/flat-color-brush/README.md) draws a bounded tool illustration and returns its literal finite contact edge. Caller-owned straight ribbons and concave clipped rows are synthetic consumers, not a paint engine, formal family or accepted artwork.
