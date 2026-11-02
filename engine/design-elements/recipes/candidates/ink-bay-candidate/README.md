# Ink-bay — restricted static typography candidate

One method: derive a same-row annotation bay from the paired headline's actual occupied ink and an explicit gap. It is not a new text-measurement primitive, full page, cropping method or automatic layout system. See CONTRACT.md and DESIGN-GUIDE.md.0 new registered families/formal recipes; static examples are not user-approved works.

- `lib/model.mjs`: strict authored pairs and reading order.
- `lib/layout.mjs`: actual-ink anchoring → residual bay → note fit, one immutable plan.
- `lib/kit.mjs`: transparent Native layer and host-preserving placement.
- `examples/`: wide exhibition placard and taller fictional screen-credit card.

Only text/notices belong in the source projection. All fonts, runtime installation and images are external. Fixed font preparation/recovery is documented in notices/fonts/README.md. Node24/Canvas0.1.100 and Python3.12/FontTools4.61.1 are observed tools, not a clean Python bootstrap claim. Set `INKBAY_RUNTIME` to an external Native package directory and `INKBAY_FONTS` to external prepared resources; use `DISABLE_SYSTEM_FONTS_LOAD=1`. No system fallback or private reference required.

`npm test`, `python3 verify-model.py`, `node --expose-gc verify-ink.mjs`, `python3 test-io.py --work /ABS_NEW_EXTERNAL --masters /ABS_EXTERNAL_MASTERS`, `node examples/render.mjs --output /ABS_NEW_EXTERNAL`, `python3 package.py --output /ABS_NEW_EXTERNAL.zip` are bounded commands. Existing outputs are refused. A matching existing npm cache can support a new offline install; that is not empty-cache network or Python recovery proof.

Current method extraction remains a private candidate until independent review and later integration authorization. No commit/push is performed here. Font/asset licenses and metadata are separate from implementation MIT. No original site/artwork, private report, font binary or GPL queue is admitted into the text ZIP.


For a new isolated runtime, copy package.json/package-lock.json to a new external directory and run `npm ci --ignore-scripts --no-audit --no-fund` there; point INKBAY_RUNTIME to that directory's node_modules/@napi-rs/canvas. Font fetch and prepare use separate new external folders; then set INKBAY_FONTS to the derived folder. Resource preflight: `python3 test-resources.py --work /ABS_NEW_EXTERNAL`. Existing FontTools4.61.1/Pillow are tools, not installed by this package.

Author expanded-raster check:200 accepted finite cases at pad13,624 text operations,5,856,344 surrounding pixels alpha0, internal channel difference0 for that set. This does not imply all glyphs/inputs fit or arbitrary backend/origin error bounds. Native glyph fitting is a conditional gate, not a general font engine or browser guarantee.
