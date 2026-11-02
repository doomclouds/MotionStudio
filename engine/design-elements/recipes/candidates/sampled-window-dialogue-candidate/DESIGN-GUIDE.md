# Rules that map to code

## Why these are reusable

The useful architectural idea is **one source sampled through independently positioned windows**, not six fixed building strips. `panels[]` supplies actual source/destination rectangles; the core has no facade, six-band assumption, title, navigation or city photograph. Different source aspect ratios and arbitrary nonoverlapping panels are supported, including transparent gaps and source alpha.

The useful chat idea is **who said what, in which authored order**, not a complete messaging application. `messages[]` is the sole content source; model grouping, visible summary, synthetic time labels and plan rows are derived from it. The grouping rule is explicit and testable; it is never inferred from typography alone.

Large typography, paper-like palettes and empty space already have established typography/material primitives; these candidates do not create a duplicate formal family. A florist's scripted conjunction and fixed delivery slots are case-specific and are not mislabeled generic composition. Botanical shapes here are new decorative procedural input, not a reused bouquet or biological model.

## Two actual combinations

1. **Studio Notes**,1440x1100: light landscape layout, stepped three-panel source sampling left, narrower chronological review excerpt right. Programmed dots are decoration, not halftone physics or scalar statistics. Source stretch is intentional; panel ordering helps the eye follow the review.
2. **Night Garden**,1100x1210: dark portrait composition, one long top band plus two lower windows; a wider dialogue below. Original ellipse/petal art replaces photos. Two voices/five messages become three contiguous groups, rather than hardcoding three cards.

Both call the **same window and dialogue engines**. The fixtures, dimensions, source pixels, orientation and themes differ; neither engine imports the other. Each tile can be placed without the surrounding scene, and the independent PNGs demonstrate transparency. The fixed example headline/footer wrapper remains an example, not a promised general layout engine.

## Usage guidance

- Preserve noticeable gaps between panels; the API allows touching edges but does not promise that choice communicates a good composition.
- Author suitable source rectangles for meaningful framing; nearest lookup may alias/stretch fine patterns. Do not call decorative dots data or use distorted images for scientific/medical interpretation.
- Leave timestamp gutter separate from copy; actual fit rejects rather than truncates or wraps. Shorten lines or increase width, not silently drop messages.
- Split groups only by the model rule; don't visually invent an author change. Same-person adjacent posts may be one group, but separate timestamps remain visible.
- Stronger light/dark accents do not establish full accessibility. Neither keyboard/screen-reader semantics nor real chat navigation exists in these raster examples.
- Supply your own properly licensed image/font data for new use cases. No stock/reference/generated media rights are transferred by this code license.
