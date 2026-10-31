# OpenDesign · two bounded candidates, three source cases

**Selective retention: 2 reusable candidates + 1 case-local composition. New public families0; new formal recipes0.** The owner gave positive batch feedback and authorized retaining/submitting useful blocks. This does not invent separate approval for each adapter or the two new synthetic compositions. No animation or public-family promotion is inferred.

| Keep | Entry | Why / boundary |
|---|---|---|
| Linear chart candidate | `src/linear-chart.cjs:drawLinearChart` | Zero-baseline y from actual synthetic values, explicit domain/ticks; source inconsistent chart geometry remains excluded from this wrapper. |
| Static light-field candidate | `src/light-field.cjs:drawLightField` | Deterministic seeded procedural color field; bounded geometry and caller-path isolation, no photographic texture or motion claim. |
| Bold Signal case only | `bold-signal/signal-frame.cjs:drawCard` | Colored surface + title hierarchy overlaps existing typographic-focus/material-surfaces; preserve authored case and contracts, do not manufacture another public primitive. |

`CANDIDATE-GUIDE.md` gives semantic contracts, known weaknesses and non-use cases. Each case's `DESIGN-GUIDE.md` and `CONTRACT.md` retains detailed source-level decisions. `candidate-manifest.json` is candidate metadata, **not a portfolio entry or owner_keep declaration**. No cover, comparison image, source screenshot, upstream HTML, private receipt, font binary or generated report is distributed.

## Exact external resources

Runtime: Node24.22.1 / Canvas0.1.100. Python preparation:3.13.5 / fontTools4.57.0 / Brotli1.1.0. `package-lock.json` locks the actual npm dependency graph; `locks/python-requirements.txt` pins package versions, not Python wheels/system libraries. Same-runtime PNG identity is verified; not a clean-OS/cross-platform guarantee.

Rendering never downloads or installs. Explicit preparation can fetch exact public font files or accept an already-authorized hash-identical offline cache. `resources.json` pins source URLs, commit/blob, size/SHA and all11 derived faces. There are9 per-case input records /8 unique font binaries; Chart/Light share IBM Plex Mono. Noto Serif SC has a paired official fixedcommit/OFL, not just a private prior copy. Original screenshot Chinese fallback remains unknown and the Noto substitution stays disclosed.

```sh
# Start in this recipe directory. The source stays in its MotionStudio checkout.
RECIPE="$PWD"
# Create the install root OUTSIDE the checkout; copy only the exact npm manifests.
RUNTIME="$(mktemp -d /tmp/od-static-runtime.XXXXXXXX)"
cp "$RECIPE/package.json" "$RECIPE/package-lock.json" "$RUNTIME/"
(cd "$RUNTIME" && npm ci --ignore-scripts --no-audit --no-fund)
export MOTIONSTUDIO_CANVAS_MODULE="$RUNTIME/node_modules/@napi-rs/canvas"
# Alternatively point this variable at an existing exact Canvas 0.1.100 package.

# Use an existing pinned Python environment, or explicitly prepare an external one.
# Requires an available Python 3.13.5 with venv support; never install into the repo.
python3.13 -m venv "$RUNTIME/python"
"$RUNTIME/python/bin/python" -m pip install -r "$RECIPE/locks/python-requirements.txt"
export OD_STATIC_FONT_PYTHON="$RUNTIME/python/bin/python"
"$OD_STATIC_FONT_PYTHON" prepare-fonts.py --help

# Explicit opt-in download, then fully offline derivation. Repeat for all three cases.
"$OD_STATIC_FONT_PYTHON" fetch-fonts.py --case data-chart --output /absolute/new-inputs/data-chart
"$OD_STATIC_FONT_PYTHON" prepare-fonts.py --case data-chart --inputs /absolute/new-inputs/data-chart --output /absolute/new-fonts/data-chart
# --case light-leak / bold-signal use matching sibling input and output directories.
export OD_STATIC_FONT_ROOT=/absolute/new-fonts
node test-all.cjs
node test-integration.mjs

# Each destination directory must be new, external and not a symlink/overwrite target.
OD_STATIC_OUTPUT_DIR=/absolute/new-output/chart node render.cjs data-chart
OD_STATIC_OUTPUT_DIR=/absolute/new-output/compositions node examples/compose.cjs
```

Preparation checks all originals, converts in memory, verifies every derived SHA/glyph map, and only then creates output. Input-file symlinks and changed bytes are rejected. Output final-component symlinks, including dangling links, are rejected lexically before resolution, source reads, font derivation or network acquisition. These are local path checks, not a guarantee against hostile concurrent filesystem replacement. No missing font silently falls back. File writes are caller-explicit; there are no absolute private workspace paths in source.

## Native core integration

Each case has `scene-reference.mjs` and `scene-transfer.mjs` exporting `config/createScene/dependencies`. They are one-frame static adapters (1920×1080, fps1/duration1), **not implemented one-second motion pieces**. Dependencies include pure scene modules, fixtures, resource locks and the resolved external fonts, so Native identity rechecks the actual rendering inputs. `test-integration.mjs` uses MotionStudio `prepareNative` in six separate processes and verifies the existing six PNG SHA values. This avoids claiming arbitrary global font-registry mixing is supported.

The complete original layout and authored fixtures are retained. Five of the six pure source/fixture modules are byte-identical; Bold Signal has a validation-only dense-array correction, with both original and corrected hashes recorded in `source-lock.json`. Painting/layout and canonical PNG bytes are unchanged. Six complete Native frame adapters are included; no original case portfolio entries are migrated. Reference mode preserves the source's inconsistent synthetic MAU geometry and brand-like sample text as an unofficial study. Do not use it as a statistic, causal claim, live graph or official NYT output. Light Leak labels are fictional film copy; Bold Signal is sample launch copy, not a launch record.

## Verification / remaining gates

Actual cold public-font download and offline derivation,27+31+48 case checks (including eight Bold sparse-array regressions),23 candidate checks,14 JavaScript external-IO checks,8 offline Python path checks,6 Native static scenes and2 cross-content renders were run. Full images were viewed; new candidate wrappers additionally preserve caller path and isolate typography internally. Final compositing intentionally follows caller transform/clip/alpha/blend/shadow/filter.

Batch retention/submission is authorized. Independent source-integration review and the repository source-policy checks must be read with the final handoff; passing tests is not independent aesthetic approval of new compositions. Before promotion into the public catalog: use each candidate in at least two real new briefs, resolve annotation collisions/light-field suitability by visual review, decide deduplication, and obtain the appropriate design review. Browser, motion, responsive behavior and audio remainNOT_TESTED. Original completed studies are not silently migrated to these narrower wrappers.
