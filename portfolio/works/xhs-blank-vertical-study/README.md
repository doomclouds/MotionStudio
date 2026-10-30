# XHS07 blank vertical study
Fixed 1200x750 double-page sample; two logical pages 1242x1660. Static native scene, no interaction or motion claim. Original replacement birds differ visibly from upstream stickers.

Install pinned Node canvas according to locks/npm-package-lock.json. Prepare external resources (not repository assets): `python prepare-fonts.py --inputs INPUT_DIR --out RESOURCE_DIR`; add exact generated bird outputs named in resource-lock.json. Set `XHS07_RESOURCE_DIR` to RESOURCE_DIR. Run `node render.mjs OUTPUT.png` (default sample), or `node render.mjs OUTPUT.png 0` / `1` for pages. Resource hashes fail closed before drawing.

Test: `node design/test-vertical-editorial.mjs`. Run renders in independent Node processes because font aliases are process-global. No cross-case alias coexistence guarantee. Cover is the unique own-rendered preview. No upstream image or private visual-comparison report is distributed.

## Acquisition limit — not turnkey
The two exact generated bird PNGs are **not publicly downloadable from this package**. Their resource source_url is an applicable terms/context page, not a PNG download endpoint. A user must supply the retained exact outputs whose names and hashes appear in replacement-provenance.json and resource-lock.json. New image generation will not reproduce these exact bytes. Without both PNGs the accepted frame cannot be restored. This is a source-only release, not an out-of-the-box runnable asset bundle.

Font preparation also requires user-provided original font files matching the locked hashes. --out must name a NEW directory outside the package, with an existing parent. Existing output directories/files/symlinks are refused, not overwritten. All input hashes and all in-memory derived hashes are checked before creating output. Checks remain active under python -O.
