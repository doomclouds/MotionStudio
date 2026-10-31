# Hanafuda · 1889 static study
User-approved static study (1024×576), not a functioning app, motion, deck export or whole deck.

Install the exact external Canvas dependency from locks/npm-package-lock.json in an external folder (copy it as package-lock.json and derive package.json from packages[""]). Set CANVAS_MODULE to that external @napi-rs/canvas directory. Supply exact files from font-lock.json in external OD_FONT_DIR; all hashes fail closed before rendering. No font binaries bundled; not turnkey without these external inputs. Set OD_OUTPUT_DIR to an existing external output folder.

Run `node render.mjs` then `node test.mjs`. Outputs and tests never need original screenshots. `node test-resources.cjs` checks missing/tampered inputs and package-local output rejection.

See DESIGN-RETENTION.md for the actual composable helpers and limitations. Helpers are local reusable code, 0 new registered UI families. Owner approval covers static work; motion/interaction not checked. Hanafuda faithful.png retains the reference caption/year collision; readable-revision.png is separately identified as our layout correction, NOT another work.

Resource boundary: all font/runtime/output directories must resolve outside the entire repository. Every font call rechecks every regular non-symlink file and SHA; no cross-directory cache. Outputs reject symlinks and use exclusive create (wx), never overwrite. Use a fresh external output directory for each full render/test pass. Caller must not concurrently mutate resource directories.
