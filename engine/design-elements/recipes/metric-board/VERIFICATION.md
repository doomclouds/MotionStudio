# Local verification — 2026-10-30

- Base repository: dev `ab20a97cc1e76ada16461a083fcc9fbe8b7d5555`.
- Canvas runtime: `@napi-rs/canvas` 0.1.100; Node24 environment. No runtime install performed as part of this verification.
- Both 960×540 PNGs personally viewed: no clipped labels, complete four-tile composition; rounded-value note visible.
- `test.cjs`: 25 passing assertions/check groups including fixed board PNG identity, deterministic repeated draw, invalid counts/types/coordinates/overflow, safe-integer boundary, rounding cases, caller path/font preservation, distinct workshop output, explicit ratio arithmetic, native scene t0/t999 same bytes.
- Board PNG SHA256: `92d2d977b7fcf98336f684dc7b996dc22865e120e6869064f5bdc8174ed6c0a9`.
- `prepare-font.py`: actually retrieved the original font from its official source, checked exact locked SHA, and the recovered file passed the render tests.
- `python -O prepare-font.py --out <inside-recipe>` was rejected before creating its output directory. Final output files must not already exist (including symlinks).
- No screenshots or pixel crops shipped in this recipe. No claim of full animation-engine preparation, production app behavior, commercial data, trademark permission or user approval of the new composition.

- Final blue-violet/orange technical examples replace an earlier green draft; this is a reusable-component demonstration, not a claimed new brand-design work.
- `test-output-gates.py`: seven negative cases passed, including repository root/sibling destinations, existing PNG and broken final-file symlinks.
