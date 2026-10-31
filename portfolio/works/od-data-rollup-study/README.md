# Data Rollup — isolated engineering candidate

**OWNER-APPROVED STATIC STUDY / NOT SUBMITTED BY THIS CANDIDATE.** Complete 1440×810 fixed Native static frame. The user approved the displayed second group and explicitly requested brick retention and submission. This folder remains an isolated overlay awaiting unified integration, not an already-published work. Static retention does not imply motion/browser approval. The two proposed cover exceptions and global indexes require coordinated merging; this change adds zero public families.

## Reproduce with external resources
1. Copy package.json and package-lock.json into a fresh directory **outside the entire repository**. Run `npm ci --ignore-scripts` there (or `npm ci --offline --ignore-scripts --cache YOUR_AUTHORIZED_CACHE` with the exact cached dependency). Node 24.22.1 and Canvas 0.1.100 on Linux x64 GNU were tested.
2. Provide exact regular files from font-lock.json in an external directory. Source URLs document provenance; moving `main` URLs are not automatic exact-download or historical-font recovery promises. See FONT-PROVENANCE.md. No font bytes are bundled.
3. Set CANVAS_MODULE to the absolute external `node_modules/@napi-rs/canvas` path; set OD_FONT_DIR to the absolute external font directory; set OD_OUTPUT_DIR to a **fresh existing external** directory.
4. `node render.mjs` writes faithful.png, then `node test.mjs` writes test receipts and the composition demonstration. `node test-composition.mjs` adds engineering regression cases; `node test-resources.cjs` tests resource/output boundaries.

Every font use rechecks all locked fonts. Runtime/font/output paths resolve outside the whole repository. Font files must be regular non-symlinks; output is exclusive-create, not overwrite. Caller must keep trusted directories stable while executing. Font identity plus successful same-runtime restoration is not a clean-OS/cross-platform guarantee.

## Scope and count
One case-local recipe, zero new registered MotionStudio families. Its helper functions are not separately counted as bricks. Source-specific brand/sample copy stays in the faithful study only and conveys no endorsement or verified statistic. Synthetic changed-content compositions are transfer tests, not new accepted works.

No browser, responsive behavior, interaction, animation, video/audio or accessibility certification. Original comparison imagery and review reports stay in the private archive. The only JPEG here is a proposed cover made from our own exact rerender, not the upstream preview; it is not yet added to the global public allowlist in this isolated overlay.
