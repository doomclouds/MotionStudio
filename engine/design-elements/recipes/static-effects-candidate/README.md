# Static effects · isolated integration candidate

**Two local composition candidates; 0 new registered families, 0 new admitted public recipes.** The owner acknowledged this study group and requested consolidation and submission on 2026-10-31. That group-level instruction is recorded narrowly: it is not itemized adapter aesthetic acceptance, portfolio admission or evidence from real reuse tasks.

This proposed package is prepared against MotionStudio `dev@5f5e8f1395581a89bf5314a4c5f452f8ffb72fb5`, tree `e18aebf410085ca3928cb02256a46c415030b2c1`. It contains reusable native code, synthetic inputs, design guidance, resource locks and notices only. No screenshot, source HTML, font binary, generated preview, private review report, cover or portfolio entry is added. Global family/recipe catalogs are unchanged.

## Entries

- `src/chromatic-frame.cjs`: frozen channel-offset title, scan field, diagnostic decoration and bounded full-frame adapter. [Design guide](docs/chromatic-title.md).
- `src/soft-orb-frame.cjs`: clipped soft-orb field, explicit three-line mixed headline and bounded full-frame adapter. [Design guide](docs/soft-orb-editorial.md).
- `src/index.cjs`: explicit candidate imports; not a global registry hook.
- `examples.cjs`: two synthetic inputs per candidate. Four example PNGs are not four accepted works or two real reuse commissions.
- `deduplication.json`: relationship to existing families, with actual calls distinguished from conceptual overlap.

## External-only setup

Use absolute paths outside the **entire repository** for runtime, fonts and outputs. Real paths and symlink ancestors are checked. Never install or render inside this package.

1. In an external runtime directory, copy `package.json` plus `locks/npm-package-lock.json` (renamed `package-lock.json`) and run `npm ci`. Set `CANVAS_MODULE` to the absolute external `node_modules/@napi-rs/canvas` directory. Native Canvas0.1.100 is required.
2. Supply the five exact original OFL font inputs in an external folder using the filenames/hashes in `font-inputs.json`. Official pinned URLs are included. The optional `--fetch` flag explicitly downloads only missing locked inputs; it is not automatic during rendering.
3. Prepare the eight renamed derived instances into another external folder:

```sh
/usr/bin/python3 prepare-fonts.py --input-dir "$EXTERNAL_FONT_INPUTS" --out "$EXTERNAL_FONT_OUTPUTS"
# Optional explicit acquisition: add --fetch. Requires network access to the listed official URLs.
export OD_EFFECTS_FONT_DIR="$EXTERNAL_FONT_OUTPUTS"
export OD_EFFECTS_OUTPUT_DIR="$EXTERNAL_OUTPUTS"
export CANVAS_MODULE="$EXTERNAL_CANVAS_MODULE"
node render.cjs
node test.cjs
```

Install `locks/requirements.txt` only in an external Python environment if needed. Preparation was verified using Python3.13.5, FontTools4.57.0 and Brotli1.1.0. Exact derived SHA-256 values are checked before writing. Inputs, outputs and runtime must be external; font files must be regular non-symlinks. Unknown, missing or tampered resources fail closed. Outputs are exclusive-create or byte-identical idempotent repeats; symlinks and changed existing files are never overwritten.

The public identity of all five source fonts is pinned. For the large Noto inputs, official pinned directory metadata and the full local bytes have matching Git blob identities; their full binaries were not downloaded again during this integration. Offline preparation succeeded. An end-to-end network `--fetch` / clean-machine npm installation is **not** claimed.

## Evidence boundary / remaining gates

Author technical tests and exact-byte preparation are not owner or independent integration acceptance. Original native case tests/visual review do not automatically approve this new adapter. The owner has now requested submission of this group; the coordinator handles that operation after final integration review. Independent review of the final integration and any itemized adapter aesthetic acceptance remain separate. Formal API admission also requires real new-task use and deduplication review. Motion, responsive UI, live diagnostics and functioning buttons are outside scope.
