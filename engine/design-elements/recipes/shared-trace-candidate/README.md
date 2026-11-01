# Shared trace / restricted source candidate

One authored finite dataset, one interpolated cursor, multiple plots and numeric readouts. This is an extraction from the private TRACEWELL study—not its application window, its original screenshot, or a new registered component family.

**MPL-2.0, not MIT.** `lib/input.mjs` retains its separate MIT notice. No third-party font, raster, application code, source screenshot, generated art, private audit, music or brand asset belongs to this source package. The simple uppercase block labels are new rectangle geometry, not a font binary or recovery of historical Qt typography.

## Run without package installation

Node 24.22.1 was used for the checks. There are zero runtime and development npm dependencies; no npm install, network, Canvas or font setup is needed.

```sh
node --test test.mjs
node render.mjs /absolute/new-output-directory
python3 make-package.py /absolute/new-source.zip
```

Render writes two SVG + two JSON files. The SVGs contain only geometry and escaped title metadata, no `<text>`, script, link, image, embedded font, foreign object or external dependency. The SVG bytes, not every browser's rasterization, are the exact cold-reproduction contract. Preview PNGs in the private handoff were made separately with an identified Native renderer; they are not required runtime resources.

Import the bounded public entry `index.mjs`. Compile a dataset, create any number of plot/readout tiles using that same model, then compose translated tiles into a document. `changeCursor` returns a newly compiled snapshot. `inspectTile` returns detached geometry and full-precision readouts. No global mutable cursor, actual telemetry, controls, player, click handler or scientific inference exists.

The two examples are 1280×760 process-comparison and 840×1160 damped-motion plates, with different finite arrays, ranges, cursor, color ordering and dimensions. Both say synthetic through their visible/readable labels and metadata. They are not real measurements.

See `CONTRACT.md`, `DESIGN-GUIDE.md`, `CREDITS.md`, `DEDUP.md` and `source-policy.json`. Public distribution is only a **conditional MPL source candidate**: preserve per-file licensing and notices and obtain the final repository integration/policy review. This package is currently private, unregistered and unpushed. The PHASEPAIR GPL package is separate and is not an import, dependency or part of this whitelist.
