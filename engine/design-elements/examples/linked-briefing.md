# Linked briefing: a static same-source composition example

This original example combines existing `material-surfaces` and `metric-strip`; it is not a new family, recipe, portfolio entry or accepted reproduction. It shows how a short authored priority list can select records by stable identity while the detail list and computed counts use the same input snapshot. The caller must rerun after edits: previous output is not live, subscribed or automatically synchronized. Selection order is authored, never inferred urgency.

## Why an example, not another component

`metric-strip` owns bounded equal-width count cells, not the source of their values. `material-surfaces` owns backgrounds/content slots, not record identity or prioritization. This caller computes three explicitly named counts, resolves selected IDs to copied detail fields, and actually paints returned metric labels/values and surface geometry. Two original content sets change record count and selection order/width. This small integration fills a caller responsibility without widening either asset contract or adding a registry entry.

`planBriefing(input)` accepts 2–6 details (`id`, `title`, `note`, `state: open|ready`) and 1–3 unique priority IDs referring to those details, plus a title. It returns an independent projection, not mutable links to source records. `renderBriefing(api,input,fontFamily)` requires a caller-registered font and returns a 1200×1000 Canvas plus the plan, actual asset-call list and measured text labels. Labels are single-line; overflow throws instead of shrinking, truncating or hiding text. No arbitrary text flow, multilingual shaping, mobile behavior, calendar, browser UI or connector is claimed.

The summaries count *listed records*, *open records* and *selected priorities*. They do not pretend all open records are selected, or that selection implies a record is open. Titles, state and identity for each selected record come from the same detail record. The examples are fictional workshop preparation and archive preparation, not operational advice or real records.

## Run with the existing Native runtime

Use the existing `engine/motion-render-core` runtime/package lock (`@napi-rs/canvas` 0.1.100, Node >=24), or its already-installed external equivalent. No new dependency or font is bundled. Provide a legally usable TTF/OTF file; the test reports its SHA-256 and fails registration rather than silently falling back. Images are local artifacts, not repository assets:

```sh
DISABLE_SYSTEM_FONTS_LOAD=1 \
MOTION_ENGINE_ROOT=/absolute/path/to/installed/motion-render-core \
BRIEFING_FONT_FILE=/absolute/path/to/authorized-font.ttf \
BRIEFING_OUTPUT_DIR=/absolute/path/outside/repository/briefing \
node engine/design-elements/examples/linked-briefing.test.mjs
```

The output directory must be new and outside this repository, with an existing parent directory; existing output directories are rejected rather than overwritten. Omit `BRIEFING_OUTPUT_DIR` to run without writing outputs. Native rendering still executes; it is not a skipped test. The executable checks missing/duplicate identities, input updates, counts, explicit font requirement, text overflow, record limits, geometry, projected content and same-environment repeated PNG equality. It renders both content sets. These checks do not certify aesthetic quality, every font, accessibility or cross-platform pixel identity; manually inspect outputs with the chosen font. Changing fonts/content invalidates previous visual evidence.

## Source and rights

The information relationship was studied in [OpenDesign's morning briefing](https://open-design.ai/showcase/morning-briefing-dashboard-design/). This example was independently written with different content, layout, geometry and colors. It contains none of the reference HTML, text, SVGs, screenshots, brands or embedded fonts. Source availability does not authorize reference media reuse. The example source is MIT; the imported metric-strip retains its existing Apache-2.0 [license](../recipes/candidates/metric-strip/LICENSE) and [notice](../recipes/candidates/metric-strip/NOTICE), unchanged. Fonts belong to the caller and retain their own license. No generated image is included or allowlisted.
