# Deterministic particle field — bounded candidate

One **font-free transparent point-field tile**, not a new public family, motion recipe, dashboard, or source-case adapter. `index.mjs` has no imports, network, timers, DOM, fonts or ambient random state. Its only public functions are `planField`, `particleFieldTile`, and `place`.

The owner acknowledged the eight-work study batch and requested consolidation/submission. That is not a separate aesthetic acceptance of these new schematic examples or approval to register a public API family. Independent review and coordinator integration remain required. This package does not push, publish or change a catalog.

## Use with a trusted Canvas 2D provider

```js
import {particleFieldTile, place} from './index.mjs';

const tile = particleFieldTile({createCanvas, pixelRatio: 2}, {
  width: 480, height: 320, count: 3200, seed: 42,
  radius: 140, aperture: .4, color: '#66aacc', opacity: .65,
});
place(ctx, tile, 24, 30); // x/y address the logical layout, excluding the 4 px guard
// Draw the caller's cards, diagrams or other content in front of or behind this layer.
```

The immutable handle deliberately does not expose its canvas. `place` performs a single standard `drawImage` and does not alter caller state or current path. Caller transforms, clipping, alpha, blending, shadows and filters still apply; the asset does not promise visual containment after such caller effects. See [CONTRACT.md](CONTRACT.md) for all bounds and trusted-provider limits.

## Reproduce outside the repository

Node 24 and the locked `@napi-rs/canvas` 0.1.100 are the tested native stack. No font setup is needed. Run these commands from this candidate directory; choose `WORK` **outside the repository** with sufficient free space:

```sh
CANDIDATE="$PWD"
WORK="$(mktemp -d)"
mkdir "$WORK/runtime"
cp "$CANDIDATE/package.json" "$CANDIDATE/package-lock.json" "$WORK/runtime/"
(cd "$WORK/runtime" && npm ci --ignore-scripts --no-audit --no-fund)
export PARTICLE_RUNTIME="$WORK/runtime"
node --test "$CANDIDATE/test.mjs" "$CANDIDATE/test-runtime.mjs"
node "$CANDIDATE/examples/render.mjs" --output "$WORK/previews"
```

`previews` must be new; existing files, directories and final-component symlinks (including dangling ones) are rejected before rendering. Outputs are two PNGs plus a SHA manifest, never written into this repository. The native package is an external development dependency, not bundled code. Do not run `npm ci` in this source-only directory.

## Two genuinely different composition contexts

* **Schedule board, 1040 × 640:** a low-opacity clay-colored field behind an opaque, fictional five-lane grid. Count 6500, seed 71, aperture .24; single exposure.
* **Route diagram, 700 × 920:** a violet annulus beneath three fictional paths and node markers. Count 4600, seed 902, aperture .60; lifted exposure.

Both are original **font-free schematic composition fixtures**, not finished product interfaces: short bars denote nonsemantic text slots, not actual text; there are no labels, dates, addresses, brands or real statistics. Neither is a replica of the original visualizer. The dots are decorative, not values. The difference is content structure and aspect ratio, not a recolored source title. Generated previews are deliberately excluded from the source projection.

## Scope and rights

[DESIGN-GUIDE.md](DESIGN-GUIDE.md) explains composition choices. [RIGHTS.md](RIGHTS.md), [NOTICE](NOTICE) and [source-lock.json](source-lock.json) preserve fixed upstream identities and the Apache/MIT metadata distinction. The historical Inter OFL notice is retained for attribution only; **no font is included, loaded, fetched or needed**. [source-policy.json](source-policy.json) excludes reference images/HTML, private reports, brands, fonts, binaries and runtime output.

Static native behavior is tested. Browser parity, accessibility of a complete UI, animation, Worker/GPU performance and any physical simulation are **not tested or implemented**. Seed determinism is not a cryptographic or statistical-quality promise. Exact native PNG repeatability is limited to the pinned renderer/platform; geometrically equivalent output on another Canvas implementation need not be byte-identical.
