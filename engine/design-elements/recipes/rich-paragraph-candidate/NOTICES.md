# Scoped source and license notices

## Native candidate

The changed Native implementation, bounded validators, font injection, ink-aware wrapping, isolated tiles, synthetic compositions and tests are supplied under **Apache-2.0** (`LICENSE`). This is not a whole-source copy of the original HTML or of the full Engineering Article study. It carries no claim of original authorship of the upstream editorial design. Parent repository MIT does not erase this directory's explicit terms.

## HTMLAnything origin — Apache-2.0

HTML Anything contributors, ©2026 as declared by the original README:
- [Original README/license statement](https://github.com/nexu-io/html-anything/blob/3aecb36ea24e59ef39031f70bf3622e622b866f9/README.md#license)
- [Original Apache LICENSE](https://github.com/nexu-io/html-anything/blob/3aecb36ea24e59ef39031f70bf3622e622b866f9/LICENSE), Git blob `d645695673349e3947e8e5ae42332d0ac3164cd7`; exact copy in `licenses/HTMLAnything-Apache-2.0.txt`.
- [Original blog-post example](https://github.com/nexu-io/html-anything/blob/3aecb36ea24e59ef39031f70bf3622e622b866f9/src/lib/templates/skills/blog-post/example.html), blob `a8e1e46dc63a6ec949426cbfe8a62126ef4315d9`.

That example is byte-identical to the fixed OpenDesign example below. No separate blog-path license or NOTICE was present in the original complete tree. This file is a new attribution document, not an invented upstream NOTICE.

## OpenDesign adaptation — separate MIT declaration

- [Fixed blog-post example](https://github.com/nexu-io/open-design/blob/12d970eacc8971150e3c76470d2a9afe16dc2ed1/plugins/_official/examples/blog-post/example.html)
- [Fixed manifest](https://github.com/nexu-io/open-design/blob/12d970eacc8971150e3c76470d2a9afe16dc2ed1/plugins/_official/examples/blog-post/open-design.json), blob `5a75f6c5431236589299590de38520ab4940b4a6`, declares MIT and OpenDesign.

`licenses/OpenDesign-MIT-declared-terms.txt` supplies standard MIT terms based on that declaration and labels its status; it is not claimed to be an original standalone repository LICENSE. No copyright year, relicensing authorization or “choose MIT instead of Apache” grant is invented. Retain both scoped notices and mark modifications when redistributing derived source. Trademark/endorsement rights are not granted.

## Optional example fonts — OFL-1.1

Google Fonts fixed commit `2e61f4355afd22b801791b0df176065082423b87`:
- [Inter](https://github.com/google/fonts/tree/2e61f4355afd22b801791b0df176065082423b87/ofl/inter): Copyright 2020 The Inter Project Authors. Exact full OFL in `licenses/Inter-OFL.txt`.
- [JetBrains Mono](https://github.com/google/fonts/tree/2e61f4355afd22b801791b0df176065082423b87/ofl/jetbrainsmono): Copyright 2020 The JetBrains Mono Project Authors. Exact full OFL in `licenses/JetBrainsMono-OFL.txt`.

Original variable masters are external and unchanged; aliases `RichDemoSans` / `RichDemoMono` only register them for this process. Inter real variable weights 400/600 at opsz14 and Mono weight400 are used, not simulated italic or a claim of the screenshot's original fonts. Exact byte identities and official public paths are in `font-lock.json`. Font software remains OFL, not Apache/MIT. Retain its copyright/license when redistributing fonts elsewhere; this repository distributes no font binaries.

Canvas 0.1.100 is MIT under its package's own retained license; it is externally installed using the npm lock. No source image, external photograph, icon set, model-generated bitmap, benchmark claim, actual person or company identity is required by these examples.
