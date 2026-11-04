# Metric board — de-branded static recipe

This is a newly composed 960×540 studio/workshop example, not the original merchant phone reproduction. No source screenshot, device frame, product icon, customer names or brandmark is shipped. The original full-phone study remains private and is not made public by this package.

Identity: [recipe-manifest.json](recipe-manifest.json) retains `recipe.metric-board.v1` / `ui.data.validated-metric-tile`, entry `metrics.cjs` and export `drawMetric`. Composition decisions are in [DESIGN-GUIDE.md](DESIGN-GUIDE.md); [VERIFICATION.md](VERIFICATION.md) records historical verification, not a new run or individual acceptance.

## Run from an external source copy

Use Node24 and an already available, authorized complete `@napi-rs/canvas` 0.1.100 runtime. `metrics.cjs`, `render.cjs` and `test.cjs` use bare `require('@napi-rs/canvas')` relative to their source files. Merely running a repository file from another cwd does not select that directory's dependency. There is no runtime environment-variable selector. This package has **no package-lock.json**: do not claim `npm ci` is supported by this payload or borrow another package's lock as its identity.

The following no-install route copies the clean text package into a **new authorized directory outside the repository** and links an existing complete runtime's `node_modules` into that copy. `REPO` is the original checkout root, `SOURCE` is its retained package, `WORK` is the standalone copy and command cwd, `RUNTIME` is the independently supplied runtime root, and `OUTPUT` is a separate external directory. Replace all absolute paths; parents must already exist. The source must not contain `node_modules` or generated files. This package treats **any** ancestor `.git` entry (or an ancestor containing both `engine` and `portfolio`) as its repository boundary, unlike candidates that require MotionStudio-specific markers. Choose `WORK`, output and test-scratch locations accordingly. Keep `RIGHTS.md`, the font lock and OFL notice with the copy. This package does not itself contain the host MIT license: also copy the verified original `REPO/LICENSE` verbatim as `WORK/MotionStudio-LICENSE.txt`. That preserves the host implementation terms without replacing the separate font or reference rights.

```sh
set -eu
REPO=/absolute/MotionStudio
SOURCE="$REPO/engine/design-elements/recipes/candidates/metric-board"
WORK=/absolute/authorized-scratch/metric-board-source
RUNTIME=/absolute/authorized-existing-runtime
OUTPUT=/absolute/authorized-output/metric-board
mkdir "$WORK"
cp -R "$SOURCE/." "$WORK/"
cp "$REPO/LICENSE" "$WORK/MotionStudio-LICENSE.txt"
ln -s "$RUNTIME/node_modules" "$WORK/node_modules"
cd "$WORK"
node -e "const p=require('@napi-rs/canvas/package.json'); if(p.name!=='@napi-rs/canvas'||p.version!=='0.1.100') throw Error('Canvas 0.1.100 required'); require('@napi-rs/canvas');"
TMPDIR=/absolute/existing-external-test-scratch python3 test-output-gates.py
export METRIC_FONT=/absolute/external-assets/IBMPlexMono-Regular.ttf
node test.cjs
METRIC_OUTPUT="$OUTPUT" node render.cjs
```

The dependency probe checks package name/version and successful Native loading, not binary attestation, a reproducible installation, or transitive license clearance. The external runtime must include its matching platform package and retain its own notices. The command changes only `WORK`, not the shared runtime. If no suitable runtime is already available, dependency setup remains a separate prerequisite rather than an implicit install in this source package.

Supply the exact original OFL font in [font-lock.json](font-lock.json), or, when network retrieval is authorized, run `python3 prepare-font.py --out /absolute/external-assets/metric-fonts` from `WORK` and set `METRIC_FONT` to the returned filename. No subset or derived font is needed. The download uses a mutable official URL and fails closed if its bytes no longer match; the historical successful retrieval in VERIFICATION is not proof of a fresh retrieval now. The process checks SHA before registration. Missing/wrong fonts fail rather than silently falling back.

Keep the font, test scratch and outputs outside both `SOURCE` and `WORK` and outside any repository. `test-output-gates.py` needs only Python3 standard library and Node, with temporary files under the explicitly selected existing external `TMPDIR`; it can run before Native/font setup. `METRIC_OUTPUT` is explicit so the CLI's relative default cannot accidentally target `WORK`. The output directory may already exist, but neither `board.png` nor `workshop.png` may exist, including symlinks. Choosing a new external directory is the simplest route. An external source copy's guard does not identify the original checkout elsewhere, so caller path selection still matters.

Output `board.png` and `workshop.png` use the same `drawMetric` export. `scene.mjs` offers the native static interface; direct interface tests do not claim full engine prepareNative integration. A runtime already available locally was used; this package does not claim a network-independent dependency install.

## Contract
`drawMetric(ctx, {label,value,kind}, {x,y,w,h})` accepts count (nonnegative safe integer) or percent (finite 0–100), 1–14 label characters, finite coordinates within ±16384, width120–500, height90–300. Text overflow rejects. Canvas font `MetricMono` must be registered by the caller (the example does this with exact SHA). Cards render offscreen before compositing, preserving the caller path/font; caller transforms/alpha/compositing affect final placement normally. No arbitrary typography or responsive layout contract is implied.

Percent display uses one-decimal rounding: 0.01 → 0.0%, 99.99 → 100.0%; never treat this as exact input recovery. Demo 57/80 ×100 =71.25%, displayed71.3%; 186/240 ×100 =77.5%. Ratios are supplied explicitly, not inferred by the component. Counts and percentages must never be added together.

## Rights and publication boundary
See RIGHTS.md. Authored implementation follows the repository MIT license; IBM font license remains OFL. This is not a new license grant over the private reference screenshot. No automatic commit or push is performed.

`test-output-gates.py` is a font-free standard-library/Node test. The CLI shares
`output-preflight.cjs` with the tested pure preflight: invalid destinations fail
before Canvas/font loading. Positive controls check a valid destination and the
next font-required stage; exact error reasons prevent a missing font from being
mistaken for an output-protection pass. No fonts or media are fabricated. The
locked-font `test.cjs` and actual render still require the original OFL font and
are separate gates; their PNG identity and drawing code are unchanged.
