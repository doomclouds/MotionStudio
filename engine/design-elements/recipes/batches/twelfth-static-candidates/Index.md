# Twelfth-group complementary seam candidate

**One restricted method, 25 reviewed UTF-8 source files; 0 new registered families, recipes or portfolio works.** This is a discovery index, not an authoritative registry of every method or itemized aesthetic acceptance. Private/pending/publication wording inside the unchanged source snapshot describes its author stage; joint integration review and any publication remain separate gates.

| Method | Relationship | Implementation and guidance | Terms / external resources |
|---|---|---|---|
| [Complementary seam](../../candidates/complementary-seam-candidate/README.md) | One supplied RGBA plane + one authored monotone seam → two independently placeable full-plane pieces with complementary pixel-center ownership | [Contract](../../candidates/complementary-seam-candidate/CONTRACT.md), [design](../../candidates/complementary-seam-candidate/DESIGN-GUIDE.md), [core](../../candidates/complementary-seam-candidate/index.mjs), [examples](../../candidates/complementary-seam-candidate/examples/compositions.mjs), [deduplication](../../candidates/complementary-seam-candidate/NON-DUPLICATION.md) | [MIT](../../candidates/complementary-seam-candidate/LICENSE), [separate notices](../../candidates/complementary-seam-candidate/CREDITS.md); font-free core, trusted caller Canvas adapter. Examples use external Native Canvas MIT and full unmodified Instrument Sans OFL. |

## What is new—and what is reused

The existing [sampled-window helper](../../candidates/sampled-window-dialogue-candidate/lib/sampled-window.mjs) provides rectangular center-nearest sampling. It is not recopied or counted as a new method: the examples validate its pinned published bytes as an external input. The new relationship partitions one supplied plane by a nonrectangular, authored monotone seam; aligned pieces reconstruct that plane's ownership. Rectangular shuffle/lift, colored stage layouts, generic line charts and texture generation are not additional assets here.

Raw `Uint8ClampedArray` partitioning preserves RGBA bytes including hidden RGB at alpha zero. Native Canvas premultiplication/PNG decoding is a separate path, not the raw byte oracle. Pixel-center counts and doubled ideal polygon areas differ; neither equals post-transform screen coverage. Return planes/canvases are mutable. Placement inherits caller compositing/clip/transform/shadow, and the fresh factory/intrinsics are trusted. Finite translation tests are not universal pixel or host-state guarantees.

Only one monotone seam and two full-plane pieces are supported—not arbitrary polygon cuts, branching, material physics, segmentation, puzzle solving or collision-free collage. Read actual dimension/pixel/point budgets and validation domains in the contract. Example labels and composition choices are authored, not generalized typography, accessibility or factual-data certification.

## Source and asset boundaries

The new core/examples and reused data helper retain their MIT copyright notices. Native Canvas and Instrument Sans have separate complete notices; root MIT does not relicense either dependency. Core numerical partitioning needs neither backend nor font. Install dependencies, restore pinned helper/font inputs and render outputs **outside this repository** using the package README. No future network availability is promised.

No original/reference/generated picture, photograph, font binary/outline, full application shell, page HTML/GSAP/Lenis, private audit/storage locator or GPL statistics package is projected. Selection-summary remains outside this increment. Any later supplied image needs its own rights; code licensing is not image, brand or commercial clearance. This is a bounded static source candidate, not a running editor, browser/animation tool or production guarantee.
