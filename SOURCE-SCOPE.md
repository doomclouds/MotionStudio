# Public source scope

This is a deliberately narrow **toolkit source snapshot with explicitly reviewed portfolio source entries**, not publication of the private production workspace, general film-project collection, research archive, or finished films.

## Policy and exact media identities

This document defines the publication and rights boundaries. The machine-readable list of reviewed media paths and SHA-256 identities is [scripts/source-assets-allowlist.json](scripts/source-assets-allowlist.json); [scripts/check-source-tree.py](scripts/check-source-tree.py) enforces it together with source exclusions and media constraints. The detailed entries below preserve the scope and rights of each exception, not a separate permission to add media. Changes must keep policy, allowlist and checks aligned; a hash or a passing check does not grant rights. Portfolio retention requirements remain in [portfolio/README.md](portfolio/README.md).

## Included

- `engine/sound-elements/` retains original procedural SFX/BGM candidate source, per-asset self-describing contracts, derived navigation and synthetic tests. `knowledge/sound/` is its reading/navigation layer, not a second inventory. No audio binary or private listening record is added; outputs remain outside the repository. Existing exact-media permissions are unchanged. These unlistened candidates do not establish artistic acceptance.

- Original bounded static design primitives (existing print-poster plus typography, color sections, material surfaces, semantic node sequences, parameter controls, expressive typography, radial scales, diagonal fields and illustrative authored paths), design guidance, synthetic composition recipes and tests in `engine/design-elements/`, linked to public design guidance. No source artwork, production recreation, bundled fonts, generated previews or private review evidence are included.

- Native Canvas rendering core, bounded local audio edit/mix core, shared rational audio-timeline contract, small original technical fixtures, and synthetic tests. Video clip editing remains deferred.
- A reusable motion-elements package: pure time-sampled actions, transitions, layouts and recipes, static metadata, synthetic example source and regression tests. Generated previews remain outside Git. These elements do not turn the audio timeline into a video NLE or establish artistic approval.
- General director guidance and reusable authoring/review helpers.
- Source packaging and source-boundary checks. Portable review-tools includes only the standalone stdlib event-interval arithmetic and static receipt-report modules, their documentation and synthetic example/tests, under the root MIT LICENSE; the full profile-generating reference benchmark and its numerical dependencies remain repository-only.
- On `dev`: generic reference-benchmark and content-review tools, schemas, and explicitly synthetic examples. These tools require user-supplied, authorized local media; no private films or observations are bundled.
- Applicable upstream copyright, license, provenance and rights notices; original documentation illustrations.
- One explicitly authorized README diagnostic preview: `docs/assets/report-overview.png` (1800 × 5400, SHA-256 `bbf9e87737e3f84dfb9a998ee0c973081418631b76a745b017b012d76b95e7c1`, maximum 2 MiB). This is a candidate illustration, not artistic approval or a published benchmark result. Its reference-image MIT credit is retained in `docs/licenses/cinetic-MIT.txt`. The exception does not authorize any other generated media.

- One reviewed, unofficial, source-rerenderable portfolio entry: `portfolio/works/tessel/`. Its 33-second/1980-frame implementation, fixed resource acquisition metadata, actual npm/pip locks, platform constraints, source identities, credits and complete MIT/OFL notices are included. It does not read the original film or the accepted 8-second encoded sample. Five expressly licensed external inputs are acquired only by explicit preparation with fixed hashes, or restored from an authorized hash-matching offline cache; generated fonts, audio, background images and renders remain outside Git.
- Exactly one Tessel cover: `portfolio/works/tessel/cover.jpg` (1280 × 720, 29,470 bytes, SHA-256 `ebfaf532643c1ac096ac44a05da0c81dede735e1703e2c3230ab3073857133f8`, maximum 1 MiB), selected from frame 480 of MotionStudio's own completed recreation, not an original-source video frame. This path/hash exception does not authorize another image or cover for another work.
- Portfolio retention is not a claim that every review was performed: Tessel records `visual: PARTIAL`, `listened: NOT_LISTENED`, and `av_sync: NUMERIC_ONLY` separately from completed technical restoration and the user's full-film retention decision. See the single retention specification, [portfolio/README.md](portfolio/README.md).

## Kept outside this repository

- The entire private `production/` collection, including validation-film implementations, call receipts, hashes, comparison reports and media.
- The entire private `projects/` collection: film implementations, project assets/fonts, restoration metadata, source acquisition indexes, product evidence, briefs, private reviews, and feedback.
- Director Skill research datasets and production cases, including media identity hashes, local evidence locations, acquisition records and individual commissioning feedback.
- Actual production catalog and case datasets (distinct from the synthetic, static motion-element API catalog). Generic query/validation tools remain, with an empty default library and explicitly synthetic test fixtures; passing those tests is not validation of any private production case.
- Generated frames, films, review reports (except exact reviewed preview/cover identities in the source asset allowlist, within the rights boundaries described here), private reference media, and historical Git development commits.

These materials remain in the original private workspace; they were not deleted there. The explicitly listed Tessel entry is rerenderable after its licensed resource setup; Favorite52 is separately retained as a conditional source release requiring exact user-supplied resources, as detailed below. Neither publishes a private production directory. Tessel font restoration code is included, while font binaries and all runtime audio/background assets remain external. No fonts, photographs or audio are redistributed by this snapshot.

Rights restrictions were not waived: source availability does not grant media reuse, trademark, likeness, music synchronization or film-publication rights. A hash establishes identity, not permission. Keep real media and observation records outside public source control and obtain the permissions needed for your use. The generic core fixture verifies the pipeline, not film quality.

## Favorite52 source release

`portfolio/works/favorite52/` is an accepted 52-second unofficial source release, not a fully supplied-resource download. All 16 runtime resources are individually declared with official provenance links, size and SHA-256; the offline preparation tool imports only exact user-supplied local files or the selected resource members of the hash-locked private recovery ZIP. No SVG, photograph, font binary, mixed audio, original film, output film or frame sequence is bundled. No original-film-expression or mixed-track blanket license is asserted.

The public relocated source has been rendered through all 1560 frames using those supplied resources: all RGBA frame hashes and the final MP4 bytes equal the retained favorite film. This conditional restoration result is not permission to redistribute the external files, or a clean-OS/cross-platform guarantee. `visual: PARTIAL`, `listened: NOT_LISTENED`, `av_sync: NUMERIC_ONLY` remain explicit.

The sole additional approved image is `portfolio/works/favorite52/cover.jpg`: 1280 × 720, 71,600 bytes, SHA-256 `86a8a0c0a08c06ddab3dac47da45078dce055746c5dfd0c15ddb99079f6cab5d`, maximum 1 MiB. It is frame 450 from the completed self-rendered favorite film, not the original reference; multilingual cards avoid the external SVG, photograph and game characters. Original composition/font/emoji credits are retained. This precise exception does not allow other covers or media.

## Vinyl static UI exception

The explicitly retained `portfolio/works/vinyl-study/` includes complete editable Native case code, content, restoration instructions, MIT/OFL notices and one rebuilt JPEG cover (exact path/hash allowlist). No upstream screenshot or font binary is distributed. Fonts remain external. This narrow exception does not admit other production cases or review archives. Schema 4 distinguishes static UI from films.


## Tea voice complete static work

The retained `portfolio/works/tea-voice-study/` contains full editable Native code, the MIT source specimen's static SVG bar geometry as JSON, content, design reasoning, runtime locks and attribution. Font binaries, upstream JPG/HTML, private reports and rendered frame sequences are excluded; original and derived fonts are hash-checked external inputs. The sole additional cover is `portfolio/works/tea-voice-study/cover.jpg`: 1200 × 750, 164,520 bytes, SHA-256 `73c6d71dd8f6463641672cefae8077f26ac769892dda22027fd59648723aa343`, maximum 1 MiB, derived from this work's own complete Native reconstruction. This exact exception authorizes no other media. Schema 4 records a static work, not a video or audio review.

## Huashu B01 additional retained static works

Four further complete fixed-frame studies retain editable code, content, design reasoning, external-font preparation, licenses and one self-rendered cover each. No upstream screenshots, font binaries, reports, audio or frame sequences are included. These are case works, not new motion mechanisms; cycling-year-report is a presentation visual rather than a full product UI. Exact additional JPEG exceptions (1200 × 750, each maximum 1 MiB):

- `portfolio/works/muqi-study/cover.jpg`: 120,327 bytes; SHA-256 `59b793b814eb157d24e16dc585500f47c1d3175c77a31470fda5c2b7853d0d3a`.
- `portfolio/works/cycling-year-report/cover.jpg`: 107,346 bytes; SHA-256 `cfe7778644708495e5937cd1bec1323fd80c3072ac82d56a6ead396976c88044`.
- `portfolio/works/hardware-sampler-study/cover.jpg`: 93,138 bytes; SHA-256 `98f00db4ebf08339a2e55975ce0133cf65ce5a029460db108deaef557852b766`.
- `portfolio/works/shanghai-deco-study/cover.jpg`: 95,401 bytes; SHA-256 `ec6f76cea9a55360a5c7cc0c82543735335e5dc194fbc8b23d9ed5561431d251`.

No wildcard media permission is granted. Their work.json kind=static records the original static source-release facts and explicit visual residuals, without implying audio, animation or interaction review.

## Huashu B02 retained static works

Five further fixed-frame studies retain full editable source, design reasoning, runtime locks, attribution and external-font preparation. Upstream screenshots/HTML, review reports, font binaries, audio and render sequences are excluded. These are case works, not new motion mechanisms. Posters and presentation narratives are explicitly distinguished from full product UI. Exact additional JPEG exceptions (1200 × 750, each maximum 1 MiB):

- `portfolio/works/hanzi-poster-study/cover.jpg`: 87,105 bytes; SHA-256 `cfdea6b1874b3b88bb363044cf556ca06f4ce665aa7e07e47adb2da669441ee4`.
- `portfolio/works/slow-roast-study/cover.jpg`: 108,347 bytes; SHA-256 `35f604bb0dd4e83bfeae7c4e8c72a539d0d6ca35c8acd5d68b6e837ab01c2707`.
- `portfolio/works/tea-conversation-map/cover.jpg`: 110,907 bytes; SHA-256 `25836584db11ca8ec85dd0266fb5a9eec7afb050da6809d1950c5596b14dff2b`.
- `portfolio/works/theatre-narrative-wave/cover.jpg`: 89,026 bytes; SHA-256 `8c5e96fba95b2e572387ebcc5ff7c7a8131f1df85a4b307af87fb4d9ee63e5b1`.
- `portfolio/works/liquid-glass-study/cover.jpg`: 239,267 bytes; SHA-256 `dafc85a12ef859aadc0de540cba83c7fd2b8bdcf68e64a6211bd15f346ec7026`.

No wildcard media permission is granted. Covers derive only from the accepted Native recreations; kind=static does not imply browser, interaction, audio or animation validation.

## Huashu B03 retained static works

Five complete fixed-frame studies retain editable code, design reasoning, runtime locks, attribution and externally supplied fonts. No upstream images/HTML, review reports, font binaries or render sequences are included. Exact additional JPEG exceptions (each maximum 1 MiB; dimensions preserve each accepted work):

- `portfolio/works/cosmic-observatory-study/cover.jpg`: 1200 × 750, 119,111 bytes; SHA-256 `e4ff31cfb20c7fe3c815ce867e91ab3c556152a09816265613135faeddd3e03b`.
- `portfolio/works/pro-camera-study/cover.jpg`: 1200 × 750, 110,683 bytes; SHA-256 `486a229cd763d088a6724a3d047c0f5dba0a37f8aa5fa6b77848daea23f86433`.
- `portfolio/works/bus-morning-study/cover.jpg`: 1200 × 750, 222,287 bytes; SHA-256 `568e310c946778081e8e402f3f1dc57899a9570829acdd082737d79c8665436c`.
- `portfolio/works/wave-weather-study/cover.jpg`: 1200 × 750, 157,870 bytes; SHA-256 `40be54ada883fd596aaabf9072ef5489fcc13375323fbe51b320296000b60c48`.
- `portfolio/works/meridian-study/cover.jpg`: 1440 × 900, 142,391 bytes; SHA-256 `4ba747751f084e0f9420bc09435b4b218b4aded8f3844c8a455460a350b422ce`.

No wildcard media permission is granted. Covers derive from the accepted Native recreations; kind=static does not imply browser, interaction, audio or animation validation. Meridian is retained at its original 1440 × 900 frame, not rescaled to the other works.

## Huashu B04 retained static works

Five complete fixed-frame studies retain editable code, design reasoning, runtime locks, attribution and externally supplied fonts. No upstream images/HTML, review reports, font binaries or render sequences are included. Exact additional JPEG exceptions (each maximum 1 MiB; dimensions preserve each accepted work):

- `portfolio/works/hk-street-signs-study/cover.jpg`: 1200 × 750, 237,422 bytes; SHA-256 `6d83409c6444e4ea6bd903075b7652300f6be7a066c15aa4bb0f06131aae4223`.
- `portfolio/works/pixel-hiking-study/cover.jpg`: 1200 × 750, 117,790 bytes; SHA-256 `3e520725c9ca504d5b1e6cf45880f29bec31ce8bd3f1b03ffbd77af4d79eb82b`.
- `portfolio/works/market-section-study/cover.jpg`: 1200 × 750, 358,874 bytes; SHA-256 `8c2aee6ce836fac4610270451202731430a2fd897b035366b4e73c0018c21a5b`.
- `portfolio/works/playful-roast-timer-study/cover.jpg`: 1200 × 750, 208,684 bytes; SHA-256 `9eacecbbdad38c57c037c3b2bbd2ace1d1f24566218598e4a04cfd4ec59379c4`.
- `portfolio/works/market-method-study/cover.jpg`: 1200 × 750, 123,298 bytes; SHA-256 `cba9bdf156b79022d86c51dcc6371b537ca2de95bb29e86c61724f24d63255b9`.

No wildcard media permission is granted. Covers derive from the accepted Native recreations; kind=static does not imply browser, interaction, audio or animation validation.

## Huashu B05 retained static works

Five complete fixed-frame studies retain editable code, design reasoning, runtime locks, attribution and externally supplied fonts. No upstream images/HTML, review reports, font binaries or render sequences are included. Exact additional JPEG exceptions (each maximum 1 MiB; dimensions preserve each accepted work):

- `portfolio/works/song-block-print-study/cover.jpg`: 1200 × 750, 261,982 bytes; SHA-256 `6223f4018b87f59c3cd4613450e216250a5687f96973640d01302d59da5151a3`.
- `portfolio/works/bauhaus-theatre-study/cover.jpg`: 1200 × 750, 136,036 bytes; SHA-256 `131a46b5fb87e7012c7c66343812a1715cc39ecb43b943c03d433a145539a28a`.
- `portfolio/works/ocean-plastic-treemap-study/cover.jpg`: 1200 × 750, 196,990 bytes; SHA-256 `a29e8e88bbf480f08814ca2a6359ced3eb03244afdcc287b6208887b0b575488`.
- `portfolio/works/health-color-code-study/cover.jpg`: 1200 × 750, 155,611 bytes; SHA-256 `224b2740ccb52dab46f5ef7fd8c67fd7c6d650f4d03a927d4c7057c2c557d982`.
- `portfolio/works/irreverent-pop-study/cover.jpg`: 1200 × 750, 160,993 bytes; SHA-256 `df8f621e07865727a8d2a99fe66d9ce23e7b5747861732a14a503152dff72f35`.

No wildcard media permission is granted. Covers derive from the accepted Native recreations; kind=static does not imply browser, interaction, audio or animation validation.


## B06 approved static covers

Five retained fixed-size studies; only these self-rendered cover identities are permitted. External fonts and private source comparison reports are not redistributed.

- `portfolio/works/film-festival-study/cover.jpg`: 1200 × 750, 233,664 bytes; SHA-256 `f97635fde456907014bd3711307301381b0070f27960cca46437658a4d1aa0fb`.
- `portfolio/works/nanyuan-cartographic-study/cover.jpg`: 1200 × 750, 161,434 bytes; SHA-256 `cf130c02fa97f29e200df7f092dbd99dd6921c35c754548e935973bafb29dff9`.
- `portfolio/works/ocean-letter-study/cover.jpg`: 1200 × 750, 160,669 bytes; SHA-256 `7cfa0901c6fed9bef76975cd73817dfd9ac9d3292e58d4024d168af4d7bf8d20`.
- `portfolio/works/solar-terms-study/cover.jpg`: 1200 × 750, 145,341 bytes; SHA-256 `42b5e88e2e60a87c2406b01a2d5323e4578421155cf2efbd094a479f132cd81d`.
- `portfolio/works/trail-pictogram-study/cover.jpg`: 1200 × 750, 168,331 bytes; SHA-256 `9d536ff3f96812e4dcb473883be09cbeaf9f159c24f4f912de5d3e43265d8461`.


## B07 approved static covers

Five retained fixed-size studies; only these self-rendered cover identities are permitted. External fonts and private source comparison reports are not redistributed.

- `portfolio/works/mandala-observatory-study/cover.jpg`: 1200 × 750, 220,560 bytes; SHA-256 `940e922906ba722bdba20e62062e0b634cb05326a7842cd7d28dfa55f34c2e1f`.
- `portfolio/works/recursion-lecture-study/cover.jpg`: 1200 × 750, 78,910 bytes; SHA-256 `abae41e0704b87e56c88bf9e5da552ec149ef13a1805fd128c5a0e9af751bf4c`.
- `portfolio/works/salary-unit-stack-study/cover.jpg`: 1200 × 750, 238,964 bytes; SHA-256 `348c4bcc4ad087a3d568e8fb5d4d5cf665aa6acf8a26aa95f1e59e38c181ecb0`.
- `portfolio/works/topo-outdoor-study/cover.jpg`: 1200 × 750, 187,937 bytes; SHA-256 `829b73f016c879ca4f5735f73a2a7fff07fb66abe695f583642431548aa9bec9`.
- `portfolio/works/weather-art-study/cover.jpg`: 1200 × 750, 150,795 bytes; SHA-256 `6d9f45c310d3bbbb37a819afebc983ac52a4e2177f0badedddac760eea5a1099`.


## B08 approved static covers

Five retained fixed-size studies; only these self-rendered cover identities are permitted. External fonts and private source comparison reports are not redistributed.

- `portfolio/works/editorial-weekly-study/cover.jpg`: 1200 × 750, 164,990 bytes; SHA-256 `011a4aae22f89e50b227c4d4e66b26154655b5e56b15cccc9dde366675b5e39c`.
- `portfolio/works/friendly-fintech-study/cover.jpg`: 1200 × 750, 205,945 bytes; SHA-256 `d19435c87f4c6d25a19265cc830c6b44a70ef9111217febc7e5e03bf3fbbef1d`.
- `portfolio/works/mountain-book-jacket-study/cover.jpg`: 1200 × 750, 108,357 bytes; SHA-256 `f90472b7510634a7a855e3bfab20c0e4f91c16bf6a0b49b1377ee4c780bd2144`.
- `portfolio/works/scientific-figure-study/cover.jpg`: 1200 × 750, 147,644 bytes; SHA-256 `cf0f57eef7b5a588912f92b7b9a5fa1f7d46d4aec494c9ce42414842c14b07ca`.
- `portfolio/works/theatre-manifesto-study/cover.jpg`: 1200 × 750, 201,964 bytes; SHA-256 `186ebadd944bbdbef3eb1dfc86034029d11c7b6652ab363cc13a4102a7a0ddd0`.


## B09 approved static covers

Five retained fixed-size studies; only these self-rendered cover identities are permitted. External fonts and private source comparison reports are not redistributed.

- `portfolio/works/bookcraft-vinyl-annual-study/cover.jpg`: 1200 × 750, 193,405 bytes; SHA-256 `e75311525d8cf18afce8c89872dd8677e72ca198e0bbfc90d0894cb9921e3dac`.
- `portfolio/works/command-palette-study/cover.jpg`: 1200 × 750, 97,805 bytes; SHA-256 `2a4b676ad49db5bdd097e10ab7ae35c2f4f5a1d0962989c76f5341b169bdb3d8`.
- `portfolio/works/market-livingroom-study/cover.jpg`: 1200 × 750, 166,485 bytes; SHA-256 `38c4cdf514c1150df39da015cae5d135290e918dc40cb3c75f39a286e170726a`.
- `portfolio/works/vinyl-isotype-study/cover.jpg`: 1200 × 750, 265,080 bytes; SHA-256 `17b9b7282aafd6d089050b8dd1c303968579b28075bcb34aa11af65a18e40412`.
- `portfolio/works/xie-symbol-study/cover.jpg`: 1200 × 750, 83,091 bytes; SHA-256 `3857723b400db96dadb7fec8e274751eaa671364cfd8fce9d990e476ae094834`.


## B10 approved static covers

Five retained fixed-size studies; only these self-rendered cover identities are permitted. External fonts and private source comparison reports are not redistributed.

- `portfolio/works/cycling-magazine-study/cover.jpg`: 1200 × 750, 209,180 bytes; SHA-256 `82efe5b537943425775a49dc5f227528b04356a4149ac7caafb1cab644afe16c`.
- `portfolio/works/gentle-activity-study/cover.jpg`: 1200 × 750, 149,010 bytes; SHA-256 `5eac8a263b2c9769c12c06c37a5b2a77a113b44084e83f23336ca7c4dbf8e6ab`.
- `portfolio/works/memory-case-study/cover.jpg`: 1080 × 1920, 263,373 bytes; SHA-256 `1507cc6721c7bcaed6cff2d08b48f8bd62cba3913670961fed11425af80cb8e9`.
- `portfolio/works/night-observatory-study/cover.jpg`: 1200 × 750, 93,415 bytes; SHA-256 `4a2a59fbaae1d081fa9ab6e3cae3e4c305c07658215c0528e50229ac731f14bc`.
- `portfolio/works/rollcall-docs-study/cover.jpg`: 1200 × 750, 137,973 bytes; SHA-256 `5ba73d7726a1ecb90b36ca33e5132888abdd5f888b3e24f5ddd64e16da5b7c86`.

## Hokusai exhibition study
`portfolio/works/hokusai-exhibition-study` adds only source, resource/font locks, MIT/OFL/public-domain attribution and one exact allowlisted self-rendered cover. Met JP11 input artwork and font binaries remain external; no upstream reference screenshot, private report or bird image is distributed. This new case does not restore or publish the missing former workspace batches.

## Proposed isolated static-effects code candidate

The prepared increment under `engine/design-elements/recipes/candidates/static-effects-candidate/` contains bounded native code, synthetic input fixtures, design guidance, public source/font locks, external-only acquisition/runtime/output adapters and Apache/OFL notices. It adds no media exception, portfolio entry, registered design family or admitted public recipe. Original previews/HTML, fonts, render outputs, private review evidence and case-specific owner feedback stay external. The owner has requested consolidation/submission of this group; this proposal does not itself execute that submission or assert itemized adapter aesthetic acceptance.

## OpenDesign second group Swiss Grid and Data Rollup static studies

Two owner-retained fixed-frame Native studies are included as case-local source recipes, not new public design families. Fonts and runtimes remain externally supplied with exact locks; upstream PNG/HTML, private comparisons and reports, font binaries, video and audio are excluded. Restoration requires the declared external resources, not an unverified clean-machine download guarantee. Visual review remains PARTIAL; browser, interaction and motion are untested. Only these two self-rendered 1280 × 720 JPEG covers are added, each at most 1 MiB:

- `portfolio/works/od-swiss-grid-study/cover.jpg`: 63,672 bytes; SHA-256 `09ac9706b0af3a554931d6c748bb05c6dc8f77aa30747fabc269e7e3efa27ba5`.
- `portfolio/works/od-data-rollup-study/cover.jpg`: 64,888 bytes; SHA-256 `a72af5cadfb735fa5d3d5488f383bc82a8f2f9e88a8188eddb57b7dd52c35e98`.

These exact exceptions do not authorize any other media. The case-local helpers do not increase the registered public-family count.

## OpenDesign second-group selective source retention

`engine/design-elements/recipes/candidates/open-design-static-three/` retains two bounded source candidates (synthetic zero-baseline chart and deterministic static light field), plus three complete static source-case snapshots for Data Chart, Light Leak and Bold Signal. Bold Signal remains case-local; this adds zero public families and zero formal recipes. Batch retention/submission is authorized, without inventing separate owner approval for the two new synthetic cross-content compositions. No portfolio entry or cover is added. All original/derived fonts, original previews/HTML, comparisons, rendered examples and private review records remain external. Explicit optional font preparation uses fixed official URLs, size/Git blob/SHA checks and output paths outside the repository; rendering never fetches. Existing source-media allowlists are unchanged. Static Native adapter verification does not establish motion, browser or cross-platform equivalence.

## Public semantic-index projection

The generated portfolio indexes and query output expose only public work/1 source relationships and recorded declarations. Review/comparison artifacts, private record identifiers, document fingerprints and storage metadata are NOT_INCLUDED; this does not claim absence or review. Original values remain in fixed Git history without rewriting it. External references are data, not accessibility guarantees or new material-existence gates. Candidate dependency upgrades remain NOT_RUN, with original acceptance and cover bound only to history. No new media permission is granted.

## Fifth-group restricted static source recipes

Exactly three candidate source packages are added under `engine/design-elements/recipes/`: `scalar-field-candidate` (14 UTF-8 files), `file-grid-candidate` (25), and `indexed-pixel-layer-candidate` (18). A separate [candidate/case-selection index](engine/design-elements/recipes/batches/fifth-static-candidates/Index.md) links guidance, contracts, examples and complete notices without changing the public family registry, formal recipe catalog or portfolio. These 57 package files contain no image/font binary, original application markup/screenshot, generated preview, prior image-derived pixel model, private audit identity or storage receipt.

Only file-grid needs fonts; its fixed official Inter/OFL acquisition and derivation scripts write to caller-owned external directories. Runtime dependencies are externally installed. Graphite proprietary branding, OpenMTP third-party icons, Pixelorama original artwork/editor shell, and the separate GPL Surge study are excluded. Two synthetic compositions per candidate are tests of limited reuse, not new accepted client works or a promise of animation/interaction.

## Sixth-group same-source static candidates

Exactly two source-only candidate packages are retained: `byte-field-diagnostic-candidate` (23 text files) and `spatial-character-snapshot-candidate` (21). The [candidate/case-selection index](engine/design-elements/recipes/batches/sixth-static-candidates/Index.md) links their contracts, design guidance, synthetic examples and licenses. They add no formal family, recipe registration or portfolio work. No original screenshot/application, private review identity, font/image binary or generated example is included.

The first links an original quantized field, histogram and sampled-byte note, not real diagnostic data; its exact external Liberation font is provide-exact, with public binary recovery unverified. The second links an ASCII-address grid and derived summary, not executable code; its exact IBM Plex Mono font is recoverable from a fixed official URL. All resources and outputs for this integration must remain outside the repository. Static source validation does not establish browser, interaction, animation or per-example user acceptance.

## Seventh-group reconstructed source-only candidates

The [timing and glyph-evidence selection index](engine/design-elements/recipes/batches/seventh-static-candidates/Index.md) links exactly two restricted packages: `timing-diagram-candidate` (27 UTF-8 texts) and `glyph-evidence-candidate` (35). They are new audited reconstructions, not claimed recovery of unavailable prior candidate bytes. No public family, formal recipe registration, portfolio entry or media exception is added. Original references/applications, private review/storage metadata, font binaries, generated outline JSON, example PNGs, reports and caches remain excluded.

The timing model is synthetic and unitless; its exact Liberation font is external provide-exact, not verified public binary recovery. Glyph evidence is fixed unshaped font data, not a shaping engine; fixed official OFL masters and OFL-derived outlines remain external. All dependencies/resources/output must be outside the repository. Static technical checks do not establish browser, motion or individual aesthetic acceptance.

## Bounded drape and radial-node source candidates

The two packages under `engine/design-elements/recipes/candidates/drape-material-candidate` and `radial-node-candidate` contain60 reviewed text files only. Generated previews, original references, private evidence/checkpoint identifiers, installed dependencies and font binaries are excluded. The discovery index adds no registry entry. Radial fonts are fetched/prepared to external directories from exact pinned public bytes; drape has no font/image inputs.

## Ninth-group cue and authored-byte source candidates

Exactly64 reviewed package text files are added under `engine/design-elements/recipes/candidates/cue-interval-candidate` (31) and `authored-byte-edits-candidate` (33), with a separate [discovery index](engine/design-elements/recipes/batches/ninth-static-candidates/Index.md). No registered family, formal recipe/portfolio entry or source-media exception changes. The two packages retain their distinct MIT and BSD-2-Clause licenses; OFL fonts are externally restored/prepared from pinned official sources, with no font binary in Git. Original application/reference imagery, film/generated stills, product UI, rendered previews, private audit/storage records, caches and dependencies remain outside the source projection. All example content is synthetic; static models do not establish playback, parsing, automatic diff discovery, animation or user aesthetic acceptance.

## Tenth-group separated text-only candidates

The [three-package index](engine/design-elements/recipes/batches/tenth-static-candidates/Index.md) links exactly62 reviewed UTF-8 package texts: linked-volume21, sampled-window-dialogue23 and shared-trace18. The first two retain MIT source terms; shared-trace remains MPL-2.0 with its MIT helper separately noticed. This is source distribution, not a conversion to the root license. No catalog/registry, portfolio or media allowlist changes.

No PHASEPAIR/Mixxx/Tango GPL or CC BY-SA package, original screenshot/application markup, private audit/storage record, font binary, generated image, preview or runtime dependency is projected. All resources, fonts, installed dependencies, generated SVG/PNG/JSON and reports stay outside the repository. Synthetic volume bytes, authored messages and finite traces are not clinical data, actual communication, measured telemetry or live interaction. Historical private/pending wording inside unchanged package snapshots does not assert current publication or owner itemized acceptance.

## Eleventh-group exact source candidates

The [two-package index](engine/design-elements/recipes/batches/eleventh-static-candidates/Index.md) links 47 reviewed UTF-8 texts: 22 flow-ledger and 25 explicit-geometry. Only independent source mechanisms and synthetic examples are included, not FLOWGROVE/MENDRA source applications, whole source pages, private previews or original references. No catalog, registry, portfolio, source-policy or media exception is changed.

Flow uses MIT terms with Sniffnet's MIT alternative and both authentic alternative notices preserved, plus separate helper/label notices. Geometry remains MIT with retained 8B influence attribution; external Native MIT and Instrument Sans OFL are separate. All installed dependencies, font masters, outputs and audit/storage records stay external. No GPL/CC BY-SA package, image or font binary is in this increment. Historical pending/private flags inside unchanged snapshots do not assert current publication or production readiness.

## Twelfth-group exact complementary-seam source candidate

The [discovery index](engine/design-elements/recipes/batches/twelfth-static-candidates/Index.md) links exactly 25 reviewed UTF-8 source files. One caller-supplied plane is partitioned by one monotone seam; existing sampled-window code is only a pinned external example input, not another new method. No catalog, registry, portfolio, source-policy or media exception changes.

MIT core/example/helper terms remain intact; example Native MIT and unmodified Instrument Sans OFL are separate, external resources. Exclude all private screenshots/generated art, fonts/outlines, app shells, audit/storage records and GPL selection-summary. Raw RGBA ownership is distinct from Native premultiplication and ideal geometry. Historical pending/private wording in exact source snapshots does not assert current publication or production readiness.

## Thirteenth-group exact ink-bay text candidate

The [discovery index](engine/design-elements/recipes/batches/thirteenth-static-candidates/Index.md) links 32 exact reviewed UTF-8 package texts. Primary actual ink plus a gap derives a same-row opposite annotation bay; existing ink alignment is not a new method. No catalog, formal recipe registry, portfolio, source-policy or media exception changes.

Independent MIT implementation/helpers retain their notices; the8B design-origin MIT notice does not bring its implementation, imagery or brand. Native MIT and Instrument Sans/Geist OFL resources are separate and external. No screenshots, generated art, fonts/outlines, private audit/storage records or GPL package are projected. Historical PENDING/private wording in exact source snapshots is not current publication, production or aesthetic acceptance.

## Three spot-ink source candidate

[spot-ink-print-candidate](engine/design-elements/recipes/candidates/spot-ink-print-candidate/README.md) retains one credited MIT-derived compositor, validated render-plan interface, original synthetic fixtures and bounded diagnostic tools as text only. LemoLab’s full MIT notice and fixed source provenance remain authoritative. No registered family, foundation, portfolio entry or media exception is added. Upstream oracle, film sources, fonts, original/rebuilt sound, rendered media, installed dependencies and production evidence remain outside this repository. Real-browser execution and artistic acceptance are not established by the offline shader checks.

## Protected palette model candidate

The [protected-palette-model-candidate](engine/design-elements/recipes/candidates/protected-palette-model-candidate/README.md) contains six text files: two bounded helpers, synthetic tests, contract and complete MIT notices. It prepares models for the existing indexed-pixel renderer without changing its dimensions or palette contract. No source story, character, pixel font, palette artwork, soundtrack, upstream test oracle, production evidence or generated media is included. No family, foundation, registry, portfolio or media exception is added.

## Fixed isometric camera candidate

The [isometric-camera-candidate](engine/design-elements/recipes/candidates/isometric-camera-candidate/README.md) retains six source/contract/license texts only: fixed-angle projection and plane inversion, positive log zoom, original synthetic tests and full MIT notices. It adds no renderer, world scene, family, foundation, registry, portfolio work or media exception. Source film, fonts, original or experimental audio, private oracle, render reports and production evidence remain external.
