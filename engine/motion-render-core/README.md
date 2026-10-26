# MotionStudio native render core

Production rendering is Node.js + @napi-rs/canvas → PNG frames → FFmpeg. No browser, CDP, HTTP server, or GSAP is imported by this core. Historical browser code, dependencies, provenance, and licenses were previously archived separately. This recovered checkout does not contain `archive/browser-core-20261024`; do not treat that historical location as an available local path or bundle the old implementation as native runtime.

## Manual runtime setup

Requires Node.js >=24 (tested here with v24.22.1). The exact direct dependency is `@napi-rs/canvas` 0.1.100; no lockfile is currently supplied. This pins the direct package, not a complete platform/runtime lock or cross-platform pixel equivalence. FFmpeg and ffprobe must be separately available, with the `libx264` encoder for the Skill video wrapper.

Choose one setup route; rendering itself never installs or downloads dependencies:

1. **New installation, explicitly run by you:** from the workspace repository, `cd engine/motion-render-core`; from the extracted portable Skill directory, `cd runtime/motion-render-core`. In that core directory run:

   ```sh
   npm install --ignore-scripts
   node --test test/native.test.mjs
   ```

   The npm command downloads the declared dependency and platform-specific optional package and may create a local lockfile. Do not omit optional dependencies. Merely declaring the dependency does not download it during rendering. Do not commit `node_modules` or platform binaries.

2. **Use an existing installation:** do not run npm. Supply `--canvas-module /absolute/path/to/node_modules/@napi-rs/canvas` to the core or Skill CLI, or set `MOTIONSTUDIO_CANVAS_MODULE` to that path. Use the tested version 0.1.100; the loader records the loaded version but does not enforce the pin for an explicit external installation.

Resolution order is explicit module path, otherwise the environment variable, otherwise ordinary Node resolution from the core, then the existing cloud `/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas` fallback. A supplied invalid explicit/environment path fails without fallback. The cloud fallback is not a prerequisite or a portable installation path.

## Scene API

Import `prepareNative` from `lib/native.mjs` and call `prepareNative({scenePath, canvasModulePath?, width?, height?, fps?, duration?})`. Scene exports:

- `config = {width,height,fps,duration}`.
- `dependencies = ['relative/font.ttf', ...]` listing every asset and imported source influencing output.
- `createScene({canvas,ctx,canvasApi,config,createCanvas,GlobalFonts})` returns `render(t)` or `renderFrame(frame,t)`.

Scene drawing must derive from absolute time. Context state resets for every frame, but scene-owned mutable state remains the scene author's responsibility. Render indices are `[0,frameCount)`; frameCount itself is not a valid frame. Dimensions/timing overrides must match a declared scene; the renderer never silently stretches artwork. Use explicit fonts and include their files in `dependencies`.

`renderer.renderFrame(frame)` updates Canvas. `renderer.png()` returns PNG bytes. `renderer.verifyIdentity()` verifies declared source files remain unchanged; the CLI runs it after capture. `renderer.close()` closes the scene. Fingerprints include declared source hashes, engine source, config, runtime versions and platform/architecture, not temporary frames or output directories. Use a fresh process for rendering changed imported scene modules, since Node caches module imports.

## CLI and checks

`node scripts/render.mjs --scene /absolute/scene.mjs --work /absolute/project/tmp/native-run --frames 0,89,179`

Omit `--frames` to capture the full frame range. Outputs are `output/frames/*.png` and `output/native-frame-report.json` under work. CLI may receive `--width`, `--height`, `--fps`, `--duration`, `--canvas-module`. `MOTIONSTUDIO_CANVAS_MODULE` also selects an existing installation. No automatic installation occurs.

`node --test test/native.test.mjs` tests real PNG hash equality on sequential/shuffled/reopened renders, frame boundaries and configuration. A historical native smoke produced 30 PNGs and a 1-second, 320×180, 30 fps FFmpeg MP4. Those temporary outputs are not included in this recovered checkout; this records a prior runtime test, not currently inspectable evidence, full-film visual acceptance, or cross-platform pixel equivalence.

## Dependencies and provenance

The code in lib/native.mjs and the native CLI/test/fixture was newly authored for this migration and does not import the archived browser implementation. @napi-rs/canvas is a separately installed MIT-licensed dependency; its package license is retained in LICENSES/napi-rs-canvas-MIT.txt. Fonts, artwork, audio, external project code and native binary dependencies have their own rights and notices. Historical archives must retain the notices required by their contents; their presence is not asserted for this recovered checkout. The distributed Skill guidance and project assets retain their own applicable notices and licenses. Packaging must preserve any licenses required by actually distributed dependencies and assets.
