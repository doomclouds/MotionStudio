# Bounded evidence contract

## Resource trust

`index.mjs:createGlyphEvidenceKit()` loads exact external resources then Native Canvas0.1.100. GE_RESOURCE_DIR / GE_RUNTIME_DIR must be absolute existing directories outside this package, without symlink or dot path components. Code constants authenticate lock bytes; editable lock files cannot self-authorize empty/replaced font data. Six fixed ASCII faces (4 specimen/2 UI) each contain95 glyphs. Runtime registers no fonts and uses no platform fallback.

Native, Node, FontTools, filesystem and process environment are trusted. `lib/kit.mjs`, `textPlan` and `sceneText` are internal helpers, not arbitrary-font or arbitrary-untrusted-text public constructors. Tests inject trusted fresh Canvas factories for allocation counting/expanded ink. No hostile Proxy, monkey-patched builtin, fake native API, reused/dirty factory, filesystem race or transaction sandbox guarantee.

## Model and protocol

Records must have Object.prototype, only allowed enumerable own data fields; custom/null prototypes, accessors, symbols, extra keys and boxed/coercible scalars reject. Optional omitted/undefined values take defaults; explicit null rejects. Tag arrays must have Array.prototype and dense enumerable own data indices, no extras/symbols/custom iterators/accessors. Validation does not execute getters or input iterators. A snapshot is deeply frozen and owned by its kit; copies/foreign handles reject.

`model({text,instance,size})`:
- Nonblank printable ASCII32–126,1–20 characters; spaces retained. No tabs/controls, Unicode scripts, combining marks or emoji.
- Integer size48–220px.
- Instance exactly serif-display / serif-soft / sans-text / sans-heavy, specified in `instance-spec.json`. No arbitrary font or continuous axis variation.
- cmap gives glyph name/path; hmtx gives horizontal advance units. advancePx = advanceUnits × size / unitsPerEm. Positions sum these advances. Space has advance/no ink, ink may overhang. Bounds come from the same instanced outlines. Float arithmetic is not decimal exactness.
- Table names are font-local names, not numeric GIDs. Unicode, names, outline, ruler positions and axes share this model.
- **No kerning, ligatures, HarfBuzz, GSUB, GPOS, BiDi or shaping.** `AV` sums separate advances intentionally. hmtx advance is not shaped advance. Axis effects requiring shaping tables are unapplied; not every axis changes every glyph.

## Three tile types

All dimensions integer. Final tile≤1800×800 and≤750,000px. Syntax and all actual outline/advance/slot checks happen before output Canvas allocation; model construction allocates no Canvas. Valid models can fail narrow views; no silent cropping, wrapping or auto-shrink.

1. `specimenTile(model,{width,height,ink?,background?,padding?})`: width120–1800, height80–380; padding4–40 default18. Primitive #RRGGBB; white ink default, omitted background means transparent. Both actual ink and full advance fit padding, including negative sidebearings.
2. `glyphTableTile(model,{width=450,rowHeight=44,start=0,count=remaining,dark=true})`: width420–700, rowHeight30–60. Slice must be inside text; header+rows determine height. Both ink/advance fit each cell. Long names may explicitly reject. total/start/count/index disclose partial tables. `adv u` means font units, not pixels.
3. `axisPanelTile(model,{width,rowHeight=100,tags,dark=true})`: width400–700,rowHeight80–100,1–6 unique tags among opsz,wght,SOFT,WONK,slnt,wdth,CASL,MONO,CRSV,GRAD. Value/range/ratio from selected master; absent axes show n/a/no knob. A shared tag list does not mean shared font capabilities. dark is primitive boolean.

`png(tile)` returns detached bytes. Frozen handles hide normal mutable raster storage; trusted factories can still observe surfaces. `place(ctx,tile,x,y)` uses own handle and finite coordinates−8192…8192, one drawImage, no state/currentPath mutation. **Caller transform, clip, alpha, composite, shadow/filter are intentionally inherited.** It does not clear the host; no background-independent appearance or cross-platform/different-surface pixel-invariance guarantee.

## IO and fixed scenes

Renderer outputs to a new absolute external directory with real existing parent, no symlink/dot components. Existing/dangling targets reject; basenames fixed and validated. Writes are not transactional rollback. Preparation verifies exact inputs/derived resources before creating output. Tests cover invalid targets before read/network/output.

Example renderer is two fixed scenes plus a transparent tile, not arbitrary UI text. No app, OS, user font collection, SVG/XML execution, font editor, live control, animation, path-following text, morph topology, GPU or shaping is claimed. Future motion requires new synchronized frame tests; static tests do not prove it.
