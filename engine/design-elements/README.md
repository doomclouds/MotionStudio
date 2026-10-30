# Static design building blocks

This layer stores **design intent linked to callable implementation and composition evidence**. It is separate from the existing 60 motion mechanisms and 7 motion recipes. A scene, helper function, screenshot or source-case count is not a building-block count.

## Inventory and truth boundary

`catalog.json` is the single index. There is **1 existing published asset family**, `design.print-poster.v1`, and **5 added source-published, technically reviewed families**. Publication does not mean the synthetic compositions are user-approved brand designs. The two full compositions and ten per-family sample renders are synthetic transfer tests, not 12 new accepted designs. Existing portfolio scenes remain unchanged; this layer does not claim they already import these APIs.

| Stable ID | Intent / code | Explicit input responsibility |
|---|---|---|
| design.print-poster.v1 | [existing guide](https://github.com/doomclouds/MotionStudio/blob/cae18d21f2fbef9702c8ce94ce68abd9eda826a4/skills/motion-film-director/research/design-knowledge/cases/ui-003-print-poster.md), [code](print-poster.mjs) | paper panels, offset type; existing fixed poster recipe |
| design.typographic-focus.v1 | [design card](docs/typographic-focus.md), [code](typographic-focus.mjs) | authored short lines, typography roles and exact text bounds |
| design.color-sections.v1 | [design card](docs/color-sections.md), [code](color-sections.mjs) | two semantic slots, order, area ratio and explicit colors |
| design.material-surfaces.v1 | [design card](docs/material-surfaces.md), [code](material-surfaces.mjs) | paper / opaque / caller-supplied glass backdrop, content slot |
| design.semantic-data.v1 | [design card](docs/semantic-data.md), [code](semantic-data.mjs) | categories, values, legends and illustrative/quantitative distinction |
| design.parameter-controls.v1 | [design card](docs/parameter-controls.md), [code](parameter-controls.mjs) | value, range, units, orientation, selected/disabled states |

## Common contract

New assets export `id`, `validate(props)`, and `draw(ctx, props, env?)`. Props contain explicit `bounds`, `data`, and `theme`. Each draw returns named geometry or semantic information. `index.mjs` dispatches only an exact known ID and version. Unknown IDs/versions fail. Text overflow and unsupported input fail rather than silently shrinking or dropping content. Drawing preserves caller context and does not mutate inputs. Canvas resources and fonts belong to the caller; modules do not load files or use network/global clocks.

Glass requires `env.canvasApi.createCanvas` plus a callback `env.backdrop({ctx,width,height,bounds})` which paints the caller's background crop. This is an explicit visual backdrop with overlay and soft shadow, not physical refraction or a promise of CSS backdrop-filter equivalence. Controls are static visual assets, not usable interactive widgets.

The existing `print-poster.mjs` API is deliberately left compatible and separate; it is not silently wrapped into the new dispatcher. Source references and case-specific exclusions are in [CASE-COVERAGE.md](CASE-COVERAGE.md).

## Actual composition

`examples/compositions.mjs` holds two briefs and one common renderer: reading sessions vs creative lab. Both invoke the same five registered implementations. The second changes content, region order and proportions, typography, surface material, data semantics/values/positions, color roles and control unit/range/value. It does not copy the implementation or source screenshots. Small decorative specimen examples are not asserted to be compelling originals.

Use existing installed Native core, not a new engine:

```sh
MOTION_ENGINE_ROOT=/absolute/path/to/engine/motion-render-core \
UI_TEST_FONT_DIR=/absolute/path/to/dejavu \
node engine/design-elements/test/verify.mjs /tmp/ui-tests.json

MOTION_ENGINE_ROOT=/absolute/path/to/engine/motion-render-core \
UI_TEST_FONT_DIR=/absolute/path/to/dejavu \
node engine/design-elements/examples/render.mjs /tmp/ui-evidence
```

The test font directory must contain DejaVuSans.ttf, DejaVuSans-Bold.ttf, DejaVuSerif.ttf, DejaVuSerif-Bold.ttf; they are caller-installed licensed fonts, not bundled assets. Evidence records their SHA-256. Renderer requires them explicitly so a missing family cannot silently masquerade as a correct snapshot. Other consumers may provide different permitted fonts, then must remeasure/review layout.

## Verification scope

Tests cover same-source different-content rendering, context/input isolation, deterministic output in this renderer/font environment, rejected invalid values, slot geometry, area-based glyph sizing, control scale and registry lookup. Private review evidence was inspected before publication; it is not distributed in this source package. The examples/render.mjs command regenerates the test views locally. Visual review and user acceptance are separate gates. This change does not claim responsive, browser, interaction, accessibility certification, typography universality or motion/voice transfer validation. Do not resume quantity-driven reproduction merely because a numeric test count passes.

## Portable Skill

The source-only Skill builder includes this layer at `runtime/design-elements/` alongside the four Motion cores. Code imports remain local; catalogue case links point to the pinned repository, not bundled portfolio copies. In an extracted Skill use `runtime/design-elements/` in the commands above and provide the installed Native core and external test fonts explicitly. This adds no font, screenshot, report or dependency binary to the package.
