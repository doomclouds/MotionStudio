# Indexed pixel layer — constrained retention candidate

One font-free pipeline: finite caller-owned palette/index matrix → exact integer-cell RGBA → optional fresh Canvas layer. **0 new public families, 0 formal recipe registrations.** This is not a Pixelorama workspace, source artwork, image quantizer, value-grid chart or animated renderer.

```js
const {renderIndexedPixels,createPixelLayer}=require('./index.cjs');
const spec={width:200,height:160,model:{
  columns:2,rows:2,palette:['#333955','#e8b47c'],indices:[0,1,-1,0]
}};
const rgba=renderIndexedPixels(spec); // no imports or external runtime
const api=require(process.env.CANVAS_MODULE);
const layer=createPixelLayer(spec,{createCanvas:(w,h)=>api.createCanvas(w,h)});
// A host owns its background, labels, transforms and composition:
hostContext.drawImage(layer.canvas,40,60);
```

## Run without installing into the source tree

The core is dependency-free; the example/test adapter accepts an existing absolute `CANVAS_MODULE` directory. Use an already authorized Canvas 0.1.100 installation, or prepare a new external runtime using this package's original lock:

```sh
PKG=/absolute/path/to/indexed-pixel-layer-candidate
RUNTIME=/absolute/new-external-runtime
mkdir "$RUNTIME"
cp "$PKG/package.json" "$PKG/package-lock.json" "$RUNTIME/"
(cd "$RUNTIME" && npm ci --ignore-scripts --no-audit --no-fund)
export CANVAS_MODULE="$RUNTIME/node_modules/@napi-rs/canvas"
node --test "$PKG/test.cjs" "$PKG/test-output.cjs"
node "$PKG/examples.cjs" /absolute/new-external-output-directory
```

Both external directory parents must exist. The output must be new and outside the repository. No fonts or visual resources are downloaded; Native platform-package availability still applies, and an existing-cache run is not a fresh-network or all-platform guarantee. For locked restoration retain package-lock.json with the source bundle; npm pack conventionally omits it, so that tarball alone is not the complete locked bundle.

The two original synthetic arrays and fixed compositions are fresh demonstrations, not the prior generated landscape/model. No screenshot, photograph, icon library, font, SVG, original study report, review identity or storage credential is included. PNG output stays outside the package/repository and is not part of this text-only source candidate.

See CONTRACT.md for validation and resource limits, DESIGN-GUIDE.md for visual usage, CREDITS.md/SOURCES.json and full licenses. Current extraction and new examples are not claimed individually owner-approved or independently reviewed; final review is external to this source package. No automatic promotion, commit or push is authorized by this package.
