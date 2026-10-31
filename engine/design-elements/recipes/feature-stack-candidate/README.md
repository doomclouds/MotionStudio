# Feature Stack · restricted composition candidate

One case-local native component, exposed as `layoutFeatureStack` and `drawFeatureStack`.
Prepared against MotionStudio `dev@1f29b18f2e93d26e5937e533b5b9aeada96d5d7b`.
**0 new registered families, 0 formal recipes, no portfolio entry or cover.**
The request authorizes preparation of this candidate, not itemized owner aesthetic
acceptance, independent admission, a commit or publication.

This is a feature-list extraction, not the source marketing poster. It retains the
icon/title/description rhythm and row alignment while removing the source brand,
claims, decorative matrix, URL/command, background, screenshot and emoji assets.
There are two truly different synthetic compositions in `examples.cjs`, rendered
by the same bounded code: a three-item single-column note and a six-item two-column
workshop sheet. These are migration proofs, not additional accepted artworks.

## External setup

Fonts, native dependencies and output images must stay outside the entire Git
repository. Do not run `npm ci` inside this candidate directory.

1. Copy `package.json` and `package-lock.json` to a new external runtime directory;
   run `npm ci --ignore-scripts --no-audit --no-fund` there. Canvas is pinned to
   0.1.100. Set `FEATURE_STACK_CANVAS` to its absolute `node_modules/@napi-rs/canvas`.
2. In an external Python environment install `requirements.txt` (FontTools 4.61.1).
   Supply the exact authorized Inter Tight variable font described in `font-lock.json`.
   There is no automatic network fetch or unverified font fallback.
3. Derive the two renamed weights into a **new, nonexistent external directory**:

```sh
python3 prepare-fonts.py --input "$EXTERNAL_INTER_TIGHT_INPUT" --out "$NEW_EXTERNAL_FONTS"
export FEATURE_STACK_CANVAS="$EXTERNAL_RUNTIME/node_modules/@napi-rs/canvas"
export FEATURE_STACK_FONTS="$NEW_EXTERNAL_FONTS"
export FEATURE_STACK_FONT_INPUT="$EXTERNAL_INTER_TIGHT_INPUT"
export FEATURE_STACK_OUTPUT="$EXISTING_EXTERNAL_OUTPUT_DIRECTORY"
node test.cjs
python3 test-prepare.py
node render.cjs
```

Existing outputs, dangling symlinks, symlink ancestors, missing/tampered fonts and
in-repository runtime/resource/output paths reject. Rendering uses exclusive-create
files: choose a fresh external directory for another run. File operations assume a
trusted local process/filesystem, not adversarial concurrent directory replacement.

```js
const {loadFeatureStackEnvironment} = require('./runtime.cjs');
const {layoutFeatureStack,drawFeatureStack} = require('./feature-stack.cjs');
const env = loadFeatureStackEnvironment(); // exact fonts + pinned external Canvas
const model = {x:40,y:50,width:520,columns:1,items:[{
  icon:'check',title:'Keep the next step small',description:'A synthetic example.'
}]};
const bounds = layoutFeatureStack(model,env); // measured geometry; no caller paint
const canvas = env.canvasApi.createCanvas(640,300);
drawFeatureStack(canvas.getContext('2d'),model,env);
```

See [CONTRACT.md](CONTRACT.md) for domains/state/atomicity, [DESIGN.md](DESIGN.md)
for visual decisions and [NOTICES.md](NOTICES.md) for source/font boundaries.
No browser, animation, interaction, original-font identity or cross-platform PNG
identity is asserted. Tests with retained resources do not prove fresh network
acquisition. Native registration is process-global: isolate processes if untrusted
code may change font families or mutate the native module after environment loading.
