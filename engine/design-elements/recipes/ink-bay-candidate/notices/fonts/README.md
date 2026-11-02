# External OFL resources

The MIT scripts do not relicense the fonts. Geist and Instrument Sans masters and aliases remain SIL OFL 1.1; complete original notices accompany this text package. Fixed Google Fonts commit 6c1dbe27dcf7d817d4b62cec033ba77fa8e2a5ec, not historical screenshot WOFF2 identity. fonts.json fixes six input bytes (two masters, OFL and metadata). No font binaries, contours, or PNGs belong to the source package.

Fetch into a new external absolute directory; prepare into a second new external directory. BayDisplay selects actual Instrument Sans wdth88/wght400; BayText Geist wght400. ASCII U+0020..007E plus layout/composite closure only. Independent aliases, regular metadata400, original selected outlines and copyright/license name records retained. FontTools drops unsupported meta tables during subsetting; original masters remain intact. No shaping/browser/raster equivalence claimed. Filesystem is trusted single-writer; this is not a hostile interpreter or TOCTOU sandbox.

`python3 tools/fetch-fonts.py --output /ABS/NEW-MASTERS`

`python3 tools/prepare-fonts.py --input-root /ABS/NEW-MASTERS --output /ABS/NEW-DERIVED`

`python3 tools/verify-fonts.py --input-root /ABS/NEW-MASTERS --derived-root /ABS/NEW-DERIVED`

Fixed complete derived-lock SHA256: `e20264693a5bf0bb89826c2d805152cd5abeccd3d6069642313ddf972de13461`; source-lock/fonts.json SHA256: `cbdc041b1f1a574d39793a0fa8bf07f22bf0e66b32e00de570e8a9a12a9e3dff`. The preparer refuses output if the derived manifest differs. The verifier checks the whole fixed manifest before per-glyph comparison. Fetch downloads all six fixed inputs into memory and verifies size/SHA256/Git blob before creating the output directory; one normal request per input, no retries. Preparation similarly validates all inputs and derived payloads before output creation. Normalized absolute, new external output and regular non-symlink inputs/ancestors are required. Font verification is an author check, not independent project acceptance.
