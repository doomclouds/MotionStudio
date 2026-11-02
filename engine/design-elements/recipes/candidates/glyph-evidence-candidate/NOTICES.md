# Source and resource rights are separate

## Apache-2.0 source

This newly extracted bounded recipe adapts independently written static glyph/metrics composition code. It does not import or execute the FontGoggles application. Modifications in2026 remove the application window/private image dependencies, narrow resources to two masters, externalize font software, add exact recovery, two educational layouts and new tests. Existing Apache headers are retained.

FontGoggles informs the evidence concept; its exact Apache LICENSE and AUTHORS are retained:
- https://github.com/justvanrossum/fontgoggles/tree/e5d153489a4aa9d3b1ea7edc67dec0320df0b8a1
- LICENSE.txt: https://github.com/justvanrossum/fontgoggles/blob/e5d153489a4aa9d3b1ea7edc67dec0320df0b8a1/LICENSE.txt
- AUTHORS.txt: https://github.com/justvanrossum/fontgoggles/blob/e5d153489a4aa9d3b1ea7edc67dec0320df0b8a1/AUTHORS.txt — Google, LLC.

`licenses/FontGoggles-Apache-2.0.txt`, `licenses/FontGoggles-AUTHORS.txt` and root Apache `LICENSE` are distinct from font/tool licensing. No MIT umbrella relicensing. No source screenshot, ICC conversion, macOS/system icon/font, original application phrase/window, personal collection, private reference or upstream Python implementation is included. Code license is not screenshot/trademark clearance.

## OFL font software, external

Two exact unmodified masters at Google Fonts **2e61f4355afd22b801791b0df176065082423b87**:
- Fraunces regular: https://github.com/google/fonts/tree/2e61f4355afd22b801791b0df176065082423b87/ofl/fraunces
- Inter regular: https://github.com/google/fonts/tree/2e61f4355afd22b801791b0df176065082423b87/ofl/inter

master-lock.json specifies official URLs/bytes/SHA/Git blobs. Exact directory OFL notices are retained. Fraunces directory2018/embedded2020 and Inter directory2020/embedded2016 remain distinct; not silently rewritten. External subsets retain source name records0/1/2/5/13/14, including copyright/family/version/license. No historical screenshot-font equivalence is claimed.

Generated outlines.json is **modified SIL OFL1.1 font software, not Apache JSON/vector art**. New subset names `Evidence Outline …` avoid representing modified subsets as original releases. Six faces (4 specimens+2 UI) each have95 ASCII glyphs; original names identify provenance only. No modified TTF is saved. Both OFL notices accompany external data; do not remove them when distributing font software. The text payload includes neither master binaries nor outline paths/data. All UI text uses the fixed Inter-derived paths; no hidden platform fallback.

No italic master, Roboto Flex, Recursive or arbitrary font adapter is in this extraction.

## Tools

Native @napi-rs/canvas0.1.100 and FontTools4.61.1 are separately MIT, exact notices in `licenses/Canvas-MIT.txt` and `licenses/fonttools-LICENSE.txt`. FontTools source: https://github.com/fonttools/fonttools/tree/4.61.1 . Tool licenses do not override OFL. Fixed2D paths are drawn without upstream app/shaping execution. No photographs, video, imagegen assets, network UI or user data are used.
