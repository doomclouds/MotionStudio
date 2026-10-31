# Orbital · radial broadcast
User-approved static study (1024×576), not a functioning app, motion, deck export or whole deck.

Install the exact external Canvas dependency from locks/npm-package-lock.json in an external folder (copy it as package-lock.json and derive package.json from packages[""]). Set CANVAS_MODULE to that external @napi-rs/canvas directory. Supply exact files from font-lock.json in external OD_FONT_DIR; all hashes fail closed before rendering. No font binaries bundled; not turnkey without these external inputs. Set OD_OUTPUT_DIR to an existing external output folder.

Run `node render.cjs` then `node test.cjs`. Outputs and tests never need original screenshots. `node test-resources.cjs` checks missing/tampered inputs and package-local output rejection.

See DESIGN-RETENTION.md for the actual composable helpers and limitations. Helpers are local reusable code, 0 new registered UI families. Owner approval covers static work; motion/interaction not checked. Orbital caller current path is unsupported; globe replaces it. Caller must use default alpha/filter/shadow/compositing, then beginPath after the helper.

Resource boundary: all font/runtime/output directories must resolve outside the entire repository. Every font call rechecks every regular non-symlink file and SHA; no cross-directory cache. Outputs reject symlinks and use exclusive create (wx), never overwrite. Use a fresh external output directory for each full render/test pass. Caller must not concurrently mutate resource directories.
