# Restricted same-source grid contract

## Scope and ownership

`createFileTiles(api)` returns `{fileGridTile,paneSummaryTile,place}`. The two factories are **one recipe**, not two new public families. Supply a trusted Canvas 0.1.100 API producing fresh default-state surfaces, with exact PGSans400/600 aliases registered. A private 1 × 1 measuring canvas is allocated once per builder. All content validation and actual text-ink checks finish before allocating a tile's paint canvas. This is not a security sandbox; hostile Proxies, patched platform objects and malicious dependencies are outside scope.

Records require exact enumerable own data fields on ordinary/null prototypes. No missing, unknown, inherited, symbol, accessor or hidden fields. Arrays require same-realm ordinary dense canonical own data indices, no holes/accessors/noncanonical numeric keys or extras. Inputs are not coerced, mutated or subsequently consulted. Handles and copied models are recursively frozen; backing canvases are private per-builder WeakMap entries.

## `fileGridTile(input)`

Required keys: `{columns,rows,cellWidth,cellHeight,items,offset,selectedIds}`.

- Integer columns 1–6, rows 1–4, cell width 140–240, cell height 220–300. Output = columns × cellWidth by rows × cellHeight at 1×. Per-tile maximum **1,600,000 pixels** (6,400,000 RGBA bytes before renderer overhead). Not an aggregate memory/lifetime guarantee.
- `items`: 0–128 `{id,name,kind}` records. Unique IDs match `[-_A-Za-z0-9]{1,32}`. Names are nonblank printable ASCII U+0020–007E, maximum 36 characters **and** actual measured 24px ink/advance must fit, including hidden names. `kind` is `folder`, `package` or `text`; all glyphs use original elementary geometry.
- `offset`: integer multiple of columns in 0…max(0,items.length−1). Empty lists only accept 0. Visible items are the exact slice `[offset, offset+columns*rows)`. Input order is retained; no sort, pagination action or filesystem read occurs.
- `selectedIds`: 0–128 unique known IDs, including hidden IDs. Selection changes only static cell fill. `selectedTotal` and `selectedVisible` are distinct. `remaining` counts items **after** the visible window, not all hidden items (items before offset are excluded).
- Total/folder/file/visible/remaining/selection counts are derived. No independent counters can be supplied. Empty cells and unselected backgrounds are transparent; selected cells have opaque pale blue backgrounds. Each glyph and one-line name stays inside its cell. No wrapping, shortening, shrink, fallback font or crop-to-fit.

Handle `{width,height,plan}` contains immutable `items`, `entries`, geometry and counts. Use the model for other annotations rather than repeating arithmetic in a fixture.

## `paneSummaryTile(input)`

Required keys: `{width,label,grid,path}`. Integer width 360–1440; fixed height 145. `grid` must be the actual file-grid handle created by this **same builder**, not a copied, forged, summary or cross-builder handle.

`label`: 1–24 nonblank printable ASCII characters. `path`: 1–4 strings of 1–24 characters, same domain. These are display labels, not parsed paths or commands. All text must additionally fit actual ink and advance at the specified widths. A legal character count or minimum width does not guarantee fit. Status ink ends by y55, path ink by y122, unremovable `STATIC / NO DEVICE` ink by y142. Tall/wide strings reject before tile paint allocation.

`plan.stats` derives total, visible, folders, files, selectedTotal, selectedVisible, selectedHidden (= selectedTotal − selectedVisible) and remaining from the grid. The painted selection status names total selected and visible **items**; an external annotation may explicitly show selectedVisible/selectedHidden. With no selection it shows total/folder/file counts. The summary has an opaque background; the grid is otherwise transparent.

## `place(ctx,handle,x,y)`

Only same-builder handles and finite numeric x/y within ±10000. Exactly one direct `drawImage` at native dimensions; no context save/restore, path edits, transform reset or style changes. Existing clip, transform, alpha, filter, composite and shadow remain effective. Caller owns transformed containment, contrast and intended clipping. The same output is promised only on the locked native engine/font environment, not across browsers.

## Runtime / filesystem / resources

`setup(fontDir)` needs an absolute external regular directory with two exact TTFs and exact copied `font-lock.json`. Every leaf is checked before first registration. `CANVAS_MODULE` is an explicitly trusted testing/dependency override, not untrusted user content. Registration failures throw, but earlier registrations cannot be rolled back.

`fetch-fonts.py` accepts only a new absolute external final directory, rejects live/dangling output symlinks **before resolving**, fetches only locked official URLs, verifies both full responses, then writes. A network/identity failure creates no output directory. `prepare-fonts.py` is offline: verify source+OFL, derive in memory, verify exact expected bytes, precheck every output leaf, then create missing exact files. Existing identical outputs are accepted; changed, symlink or nonregular leaves reject. No transactional rollback is claimed for disk failures after successful preflight.

`writeExact` is an internal trusted render helper, not another generic public input API. It refuses changed/symlink/nonregular output leaves before any writes and allows identical files. Font binaries and render outputs must stay outside the source-package directory. Ancestor directories, mutable dependencies and concurrent filesystem races are trusted; these gates are **not** a general path-confinement or multitenant guarantee.

No DOM/browser, device connection, file operation, live scrolling/sorting, network renderer, animation, RTL/Unicode shaping, or interactive/accessibility acceptance. Formal registration, public deployment and owner aesthetic approval are not implied by this candidate.
