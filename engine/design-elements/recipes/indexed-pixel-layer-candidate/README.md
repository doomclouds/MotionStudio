# Indexed pixel layer — constrained retention candidate

One font-free pipeline: finite caller-owned palette/index matrix → exact integer-cell RGBA → optional fresh Canvas layer. **0 new public families, 0 formal recipe registrations.** This is not a Pixelorama workspace, source artwork, image quantizer, value-grid chart or animated renderer.

```js
const {renderIndexedPixels,createPixelLayer}=require('./index.cjs');
const spec={width:200,height:160,model:{
  columns:2,rows:2,palette:['#333955','#e8b47c'],indices:[0,1,-1,0]
}};
const rgba=renderIndexedPixels(spec); // no imports or external runtime
const api=require('@napi-rs/canvas');
const layer=createPixelLayer(spec,{createCanvas:(w,h)=>api.createCanvas(w,h)});
// A host owns its background, labels, transforms and composition:
hostContext.drawImage(layer.canvas,40,60);
```

`npm ci --ignore-scripts --no-audit --no-fund`, then `npm test` installs the pinned optional-in-concept test/example backend (a declared package dependency) and runs the new projection's tests. `node examples.cjs /absolute/new/external/directory` writes two PNGs and layout JSON. `CANVAS_MODULE` may point to an existing absolute Canvas 0.1.100 module directory. Core does not read that variable or require Native. For locked restoration use the source bundle containing package-lock.json; npm pack conventionally omits that lock, so its tarball is not the complete locked source bundle.

The two original synthetic arrays and fixed compositions are fresh demonstrations, not the prior generated landscape/model. No screenshot, photograph, icon library, font, SVG, original study report, review identity or storage credential is included. PNG output stays outside the package/repository and is not part of this text-only source candidate.

See CONTRACT.md for validation and resource limits, DESIGN-GUIDE.md for visual usage, CREDITS.md/SOURCES.json and full licenses. Current extraction and new examples are not claimed individually owner-approved or independently reviewed; final review is external to this source package. No automatic promotion, commit or push is authorized by this package.
