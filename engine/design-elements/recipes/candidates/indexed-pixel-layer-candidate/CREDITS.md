# License and provenance

New extraction/reimplementation, helper code, tests, original synthetic arrays and composition guidance use this repository's MIT license, reproduced in `LICENSE` (Copyright (c) 2026 Palink). This expressly states the new candidate's license; a private source study's retention alone would not establish publication permission.

The design investigation involved Pixelorama, an open-source pixel-art editor. Preserve its MIT attribution in `licenses/Pixelorama-MIT.txt` (Copyright (c) 2019-present Orama Interactive and contributors). Fixed public source links and root LICENSE Git identity appear in SOURCES.json. This package does not run or embed Pixelorama/Godot code, its interface, assets or image-processing implementation; the scalar validation, integer cell raster and ordinary HSV math are the new bounded implementation here.

No original screenshot, source castle, generated landscape, image-derived index model, project report or audit record is included. Fixtures were newly written as small synthetic arrays. No third-party visual input is required. There are no font binaries or font dependencies, so no OFL resources are needed in this package.

Optional example/test renderer: `@napi-rs/canvas` 0.1.100, MIT declared; full package license is in `licenses/Native-canvas-MIT.txt`, and npm package/platform integrities are locked. Native modules are installed externally/not committed. Any redistribution of a complete runtime needs its applicable transitive notices; this copied package notice is not a blanket grant for all third-party dependencies.

Public source availability does not authorize branding, screenshots or artwork. The candidate remains private/pending review and coordinated integration; it is not an instruction to publish.
