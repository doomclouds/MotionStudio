# Sample windows + authored dialogue — private candidates

Two original composable APIs, not a copied landing page. **0 formal families, 0 formal recipes, no registry integration.** This is a private review candidate, not a public-ready or universally safe rendering system.

- `lib/sampled-window.mjs`: immutable issued pixel source and panel model; exact center/nearest pixel sampling into nonoverlapping destination rectangles. Source data is caller-owned RGBA, not a photograph bundled with this package.
- `lib/authored-dialogue.mjs`: authored ASCII messages, chronological synthetic minute labels, consecutive author groups, counts, bounded text/ink plans, and an independent transparent tile. It is not a chat service or history viewer.
- `lib/data.mjs`: strict own-data snapshots, dense canonical indices and own-index writes. Optional values default only when omitted/undefined, never on null.
- `examples/`: two new combinations use **both** APIs with different arrangements, sizes, contents and original programmatic image sources. Fixed example headings are not promoted as a general typography engine.

## Reproduction

Author/cold verification on Linux x64 only. Node 24.22.1 / `@napi-rs/canvas` 0.1.100; Python 3.12.14 / fontTools 4.61.1. Core model tests do not load Native or fonts. No browser, upstream app, animation, audio, network service or 3D is executed.

```sh
node --test test-model.mjs
# In an isolated runtime directory, copy package.json and package-lock.json:
npm ci --ignore-scripts --no-audit --no-fund
# Obtain exact public font master per examples/font-sources.json in a separate folder.
python3 prepare-fonts.py --input /absolute/master-folder --output /absolute/fresh-font-folder
export COMPOSE_RUNTIME=/absolute/runtime/node_modules/@napi-rs/canvas
export COMPOSE_FONTS=/absolute/fresh-font-folder
export DISABLE_SYSTEM_FONTS_LOAD=1
node --test test-model.mjs test-native.mjs
node examples/render.mjs --output /absolute/fresh-output-folder
python3 package-tests.py --work /absolute/fresh-test-folder
python3 build-package.py --output /absolute/fresh-package-folder
```

The font files are **not** in the text ZIP. `examples/font-lock.json` pins three complete derived Open Sans instances. Font preparation must reproduce this lock; `loadNative` first verifies the fixed complete lock SHA, then all three font bytes before loading/registering the Native dependency. Empty/missing/duplicate/altered lock lists cannot skip this gate. No system-font fallback guarantee for arbitrary caller-injected fonts; the renderer trusts the injected measurement/drawing environment. User-provided font families require their own licenses and actual-fit tests.

The private parent study contains two composition PNGs and transparent tiles, source plates, original resource bytes, a frozen manifest and verification evidence. Those are not public source members. No official screenshot, bouquet/pizza image, reference photograph, brand identity, private audit ID or earlier case source enters the text projection.

See CONTRACT.md, DESIGN-GUIDE.md and CREDITS.md for exact boundaries. Text ZIP creation uses a fixed member allowlist and rejects missing, nonregular or symbolic-link inputs/ancestors before reading payload bytes. This is a trusted local rebuild tool, not a semantic privacy scanner or concurrent-mutation sandbox.
