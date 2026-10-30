# Static design building blocks

This layer stores **design intent linked to callable implementation and composition evidence**. It is separate from the existing 60 motion mechanisms and 7 motion recipes. A scene, helper function, screenshot or source-case count is not a building-block count.

## Inventory and truth boundary

`catalog.json` is the single index. There is **1 existing published asset family**, `design.print-poster.v1`, and **13 added source-published, technically reviewed families** (5 base + 4 specialist + 4 B05), for **14 families total**. Publication does not mean the synthetic compositions are user-approved brand designs. The four full compositions and eighteen per-family sample renders are synthetic transfer tests, not 22 new accepted designs. Existing portfolio scenes remain unchanged; this layer does not claim they already import these APIs.

| Stable ID | Intent / code | Explicit input responsibility |
|---|---|---|
| design.print-poster.v1 | [existing guide](https://github.com/doomclouds/MotionStudio/blob/cae18d21f2fbef9702c8ce94ce68abd9eda826a4/skills/motion-film-director/research/design-knowledge/cases/ui-003-print-poster.md), [code](print-poster.mjs) | paper panels, offset type; existing fixed poster recipe |
| design.typographic-focus.v1 | [design card](docs/typographic-focus.md), [code](typographic-focus.mjs) | authored short lines, typography roles and exact text bounds |
| design.color-sections.v1 | [design card](docs/color-sections.md), [code](color-sections.mjs) | two semantic slots, order, area ratio and explicit colors |
| design.material-surfaces.v1 | [design card](docs/material-surfaces.md), [code](material-surfaces.mjs) | paper / opaque / caller-supplied glass backdrop, content slot |
| design.semantic-data.v1 | [design card](docs/semantic-data.md), [code](semantic-data.mjs) | categories, values, legends and illustrative/quantitative distinction |
| design.parameter-controls.v1 | [design card](docs/parameter-controls.md), [code](parameter-controls.mjs) | value, range, units, orientation, selected/disabled states |
| design.expressive-type.v1 | [design card](docs/expressive-type.md), [code](expressive-type.mjs) | bounded layered/striped glyph effects, readable repeated label |
| design.radial-scale.v1 | [design card](docs/radial-scale.md), [code](radial-scale.mjs) | clockwise linear value, range, unit, knob/gauge |
| design.diagonal-field.v1 | [design card](docs/diagonal-field.md), [code](diagonal-field.mjs) | authored color boundary and safe content rectangles |
| design.authored-paths.v1 | [design card](docs/authored-paths.md), [code](authored-paths.mjs) | explicit illustrative anchors, not measured data |

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

## Specialist backfill

Four further families — expressive-type, radial-scale, diagonal-field and authored-paths — link design cards, bounded APIs, examples and tests through [Index.md](Index.md). `examples/specialist-compositions.mjs` consumes diagonal-field safe geometry and combines these modules with typography in two synthetic briefs. Paths explicitly represent illustration, radial controls a clockwise static linear scale, and sliced titles require readable repetition. The compositions retain a fixed 1440×900 structure, not arbitrary automatic layout. [CASE-COVERAGE.md](CASE-COVERAGE.md) distinguishes extracted relationships from intentionally case-specific details.

## 新增四族与外置字体验证

新增vertical-imprint、geometric-marks、proportional-partition、ratio-rings四族；公共族合计14。它们是技术和独立视觉复核后的源码资产，未迁移原B05场景，也没有用户对新合成作品的审美验收。原作品调用不随族提取自动增加。

在现有MOTION_ENGINE_ROOT与UI_TEST_FONT_DIR之外，测试须设置`UI_B05_FONT_FILE=/absolute/path/to/NotoSerifTC-variable.ttf`，提供覆盖实际样例汉字的合法外置完整TC字体；不能误用原作品子集字体。已验证字体SHA256：`0077e18f57c6908f4a000969880940bdb0dad057c0e8d98b49dc364c3d1b09c6`。字体不打包；从官方Google Fonts Noto Serif TC来源按OFL合法准备，其他输入先过覆盖检查。Python检查需要fontTools。

```sh
python engine/design-elements/test/verify-cjk-font.py
node engine/design-elements/test/verify.mjs /absolute/test-results.json
node engine/design-elements/examples/render.mjs /absolute/render-output
```

Skill包中同样使用runtime/design-elements路径；打包测试只有三个外置环境参数齐备才运行完整绘制检查，缺少会明确NOT_RUN而非假装通过。12幅新增样例/组合图和私有报告不随源码发布；4个组合见examples/b05-compositions.mjs。验证范围不是Motion、历史真本、临床指标、自动品牌生成或普适信息图引擎。

## B06 composition recipes

Two bounded [composition recipes](recipes/b06/README.md) reuse existing families and source-case helpers; each has two different-content fixtures. They add zero families, do not migrate original scenes, and do not confer user aesthetic approval. Runtime imports/fonts are pinned; generated evidence is written only to caller-owned external directories.

## B08 bounded recipes

[Explicit manifesto + full-legend partition](recipes/b08/README.md) adds two source-only composition recipes, not public families. Fixed two-column contracts, no automatic typography/financial/scientific inference, no source-scene migration or new user aesthetic approval.

## B09 bounded recipes

[Bounded rotated emphasis + equal-size unit pictograms](recipes/b09/README.md) adds two source-only composition recipes, not public families. Fixed two-column contracts, finite rotated bounds and whole/half units; no automatic typography or real-world inference, no source-scene migration or new user aesthetic approval.

## B10 bounded recipes

[Explicit code spans and semantic value grid](recipes/b10/README.md): two bounded source-only recipes; zero new families, no migrated source scenes, no user aesthetic approval of synthetic combinations. Explicit ranges/nulls/units, LTR authored spans; not a parser or factual log.
