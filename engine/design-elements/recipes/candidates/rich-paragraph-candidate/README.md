# Rich Paragraph · bounded static candidate

One font-injected Native Canvas paragraph atom: **plain text, emphasis, and unbroken inline code chips**. It is not a copied article, HTML renderer, Markdown parser, text editor, or general typesetting engine. Prepared against MotionStudio `dev@41e939b96099ef12c4d01b2d879b92a65b2c7f20`. **0 registered families, 0 formal recipes, no portfolio entry or media exception.**

```js
const {createRichParagraphEngine} = require('./paragraph.cjs');
// Register licensed fonts first. Factory and registered fonts are trusted inputs.
const engine = createRichParagraphEngine({
  createCanvas,
  faces: {
    text: {family:'YourSans', weight:400},
    em:   {family:'YourSans', weight:600},
    code: {family:'YourMono', weight:400}
  }
});
const model = {
  width:440, height:240, fontSize:20, lineHeight:34,
  runs:[
    {kind:'text', text:'Make the '},
    {kind:'em', text:'constraint visible'},
    {kind:'text', text:'. Inspect '},
    {kind:'code', text:'demo --local'},
    {kind:'text', text:' before sharing.'}
  ]
};
const {canvas,layout} = engine.tile(model); // fresh transparent tile; frozen metadata
ctx.drawImage(canvas,40,60);
// Or engine.draw(ctx,model,40,60): layout isolated; caller appearance inherited.
```

No font/runtime dependency is required to import `paragraph.cjs`. The core never reads a file, installs a font, performs network IO, or searches for a fallback font. Supported input is explicitly **printable ASCII**. Wide Latin glyphs are measured; CJK, emoji, combining marks and bidi are rejected, not silently substituted. See [CONTRACT.md](CONTRACT.md).

## Reproducible supplied-font examples

The optional local adapter uses unmodified, fixed OFL Inter and JetBrains Mono masters. Their public source URLs, sizes, SHA256 and Git blobs are in `font-lock.json`. Keep the two files outside the **entire repository**, named `inter.ttf` and `mono.ttf`. Obtain them through an authorized official download or supply hash-identical files; this candidate does not auto-fetch. Aliases are registration-only; it does not modify internal font names. Emphasis is real Inter variable weight 600, **not italic**.

Copy only `package.json` and `package-lock.json` to a new external runtime directory, then run there:

```sh
npm ci --ignore-scripts --no-audit --no-fund
export OD_RICH_CANVAS=/absolute/external/runtime/node_modules/@napi-rs/canvas
export OD_RICH_FONTS=/absolute/external/fonts
export OD_RICH_OUTPUT=/absolute/external/fresh-output-directory
# Output directory must already exist. Output filenames must not already exist.
node --test test.cjs test-runtime.cjs
node examples/render.cjs
python3 check-source.py
```

Native backend pinned to Canvas 0.1.100; tested on Node 24.22.1 / Linux x64. No Python package is needed. Runtime/resource/output paths must be external, absolute and without symlink components. Outputs are exclusive-create. No automatic retries, replacing existing outputs, or in-repository dependency installation.

Two original synthetic compositions use the same atom: a warm release fieldnote with a dark sidebar, and a violet collection-workshop pair of cards. They demonstrate editorial and inventory content; no real product, collection, benchmark, or upstream original image is included. Generated PNG/layout JSON remain outside Git. [DESIGN.md](DESIGN.md) explains how to reuse the atom.

Native changes are Apache-2.0. Retain **HTMLAnything Apache-2.0 and OpenDesign's separately scoped MIT declaration**, plus OFL notices for external fonts; [NOTICES.md](NOTICES.md) explains the verified historical chain. Batch retention was authorized; this newly extracted candidate has not received separate aesthetic or independent-review acceptance. No browser, animation, accessibility certification, cross-platform pixel identity, or formal promotion is claimed.
