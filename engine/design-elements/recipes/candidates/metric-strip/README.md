# Metric strip — fixed horizontal snapshot model

Status: bounded source candidate, not a formal family, accepted work, live dashboard, or renderer.

[metric-strip.mjs](metric-strip.mjs) exports the existing source identity `recipe.metric-strip.v1` and `layoutMetricStrip({bounds,items})`. This identity does not register a family or change the candidate status. The layout function returns equal-width card rectangles, labels, integer value strings, optional explicit part/whole denominator strings, and caller-supplied delta text/meaning. Input is not mutated. It performs no I/O, drawing, refresh, animation or connector access.

- 2–6 uniquely identified items; each cell at least 180 units wide; total width at most 8192, height 100–400, finite position within ±16384.
- `kind: count` takes a nonnegative safe integer and no denominator. `kind: part-whole` takes 0 <= value <= positive integer total. No percentages, units, locale formatting, negative levels or summation across cards.
- `delta: {text,meaning}` is optional. `meaning` is explicitly favorable, unfavorable or neutral. A decrease is not automatically bad. Text and meaning remain an author responsibility; the model cannot verify the business interpretation or matching numbers.
- Labels/delta are nonblank single-line strings, max 45/60 UTF-16 units. No font fit, wrapping, clipping or responsive claims. Consumers must measure and verify their actual text with their actual font. Returned geometry is in caller units, not a browser layout.
- Source/data provenance and a sample-data disclosure must remain visible when the surrounding UI is illustrative. This model does not certify that data is real, live or connected.

## Executable model examples

[examples.mjs](examples.mjs) calls the actual layout function with two synthetic domains: a three-card workshop count/part-whole snapshot with an explicitly favorable decrease, and a two-card library snapshot without deltas. It prints JSON geometry, formatted values and reading order, not pixels or evidence of a live source.

```sh
PKG=/absolute/path/to/metric-strip
node "$PKG/examples.mjs"
node "$PKG/test.mjs"
```

Node, no installed packages/fonts/network, and no output files. [test.mjs](test.mjs) exercises the input domains and separate content cases. Historical private Native examples are not shipped here; their prior visual inspection is not a portable render-fixture or new visual-acceptance claim. The caller draws returned fields with its own renderer and rights-cleared font.

## Why this candidate

Existing `metric-board` intentionally uses a locked monospace face, limited labels, count/percent, and a fixed card style. Its contract was not widened to reproduce an unrelated UI. `semantic-data` is a legend/area encoding and is not a metric row. This candidate supplies only the shared count/explicit-part-whole layout model; it does not replace those assets or copy an app shell.

## Source and boundaries

Visual study: [OpenDesign Live Dashboard screenshot](https://github.com/nexu-io/open-design/blob/12d970eacc8971150e3c76470d2a9afe16dc2ed1/apps/web/public/community-templates/live-artifact.webp) and [example](https://github.com/nexu-io/open-design/blob/12d970eacc8971150e3c76470d2a9afe16dc2ed1/design-templates/live-dashboard/example.html). Apache-2.0 source attribution retained in [NOTICE](NOTICE) and [LICENSE](LICENSE). Independent model implementation under Apache-2.0. No original image, font, app identity, personal record or external connector is included.

The source screenshot colors a decreasing review backlog red. The replica preserves that source choice; this is not evidence that reduced backlog is unfavorable. Do not use the screenshot's sign/color convention as a generic business rule.
