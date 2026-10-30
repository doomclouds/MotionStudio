# B06 bounded composition recipes — source only

Two fixed-size composition recipes; **zero new shared UI families**. Existing fourteen families are neither renamed nor modified. Original B06 scenes already call their own author helpers, not these new composite recipes. Helpers are copied byte-for-byte with pinned0506160a source URLs/SHA; synthetic fixtures alone call these composites.

## Reproduce outside the source package

Requirements: installed MotionStudio native engine; Python/fontTools4.61.1; licensed full NotoSerifTC font matching `font-lock.json`. No font binary, PNG or HTML output is distributed with this source tree.

```sh
export MOTION_UI_ASSETS_ROOT=/absolute/path/to/engine/design-elements
export MOTION_ENGINE_ROOT=/absolute/path/to/installed/engine/motion-render-core
export B06_FONT_FILE=/user/fonts/NotoSerifTC-variable.ttf
export B06_TEXT_FONT_FILE=/user/fonts/B06Text600.ttf
export B06_EVIDENCE_DIR=/user/evidence/b06-new-run
python prepare-font.py
node verify.mjs
python verify-font.py
node test-runtime.mjs
python build-report.py
```

Use a new/empty evidence directory for each run. Existing evidence is not overwritten. All generated data and fonts must be outside this package; real-path checks reject symlinked parents pointing back into the source tree. `prepare-font.py` never rewrites the lock, checks the pinned source, generates in memory, checks derived SHA, then exclusively writes an external target. An existing derived target is accepted only if its SHA already matches. `verify.mjs` validates both fonts before registration/rendering.

Font license: `licenses/OFL.txt`; official source repository https://github.com/notofonts/noto-cjk. `font-lock.json` pins source+derived SHA, weight600 and fontTools version. Derived600-weight text improves supporting-text readability while headline size remains unchanged. Regenerate and re-review the lock deliberately when authoring new glyph content; never silently accept another font or overwrite the lock from untrusted inputs.

`asset-lock.json` pins the complete local static import closure of existing design-elements/index.mjs at9cdf152115bf0b3e59108c219c5119ab668a1e85. This is a load dependency lock, not a claim that every family was called. Actual draw calls are separately listed in recipe-manifest.json. A changed dependency fails closed until deliberately reviewed.

## Contents
- docs/: design intent, limitations and all-five-case coverage.
- recipes/: fixed1200×750 composition wrappers; offscreen transactional validation, not ImageGen or screenshots.
- source-recipes/: unchanged source helpers and published-source provenance.
- examples/briefs.mjs: two different content briefs per recipe.
- verify.mjs / verify-font.py / test-runtime.mjs: rendering, glyph coverage, wrong-font/dependency and output-boundary tests.
- build-report.py: generates a private four-image report in the external evidence directory; do not publish generated artifacts with the skill/source.

No source scene is migrated to a new recipe. Font binaries, generated evidence and reports stay private and outside the published code tree. Recipes passed bounded technical and independent static review, not automatically user-approved brand designs or a general layout/navigation system.
