# Restricted static contract

## Model
`createModel({name,nodes,selected})` requires own data fields: name 1–24 trimmed printable ASCII; 3–9 nodes; selected null or an existing id. Node fields: id (lowercase slug, max20), label (trimmed printable ASCII max18), angle (finite 0..359.999 degrees), marks (integer0..8), icon (one of `ICONS`). IDs and labels are unique. Circular separation is at least28 degrees, but this alone does not ensure a tile fits. Angle zero is up; positive clockwise. Classification angle/hue is not a ratio, probability or time. Mark total is the exact integer sum. Model fields/nodes are frozen and handles owned; spreading/JSON-cloning a model does not create an accepted handle.

Records must have Object.prototype or null prototype, known own data descriptors only. Arrays must have current-realm Array.prototype, dense canonical own data indices and no extra keys/methods/symbols. Own accessors, inherited required values, boxed primitives, callback iterators and sparse arrays reject without invoking input callbacks. Internal copies create own indexed properties rather than inheriting temporary array-like indices. Hostile Proxy traps, replaced builtins/source modules and concurrent mutation/TOCTOU are not a sandbox promise.

## Trusted environment and external fonts
`createKit({createCanvas,regular,semibold})` trusts a fresh NativeCanvas-compatible factory and existing font registry. Aliases are primitive alphanumeric names beginning with a letter, max48. A fresh private1×1 measurement canvas is used; font, kerning, direction, alignment, baseline, wordSpacing and letterSpacing are explicitly set. The optional exact Node loader uses code-constant size/SHA for two font bytes **before** registration, checks regular nonsymlink files/ancestors and successful register+has for both aliases. `font-spec.json`/`font-generation.json` are explanatory, not mutable authorities. The font master/derived binaries are not included in this package.

A manually injected environment is an explicit caller responsibility: missing or substituted fonts do not magically become exact. Core finite metric/ink validation is not a test of font licensing, coverage or registry honesty. Fresh factory/global font registry, Native API and destination context are trusted. Reusing a dirty output canvas is not supported; returned output Canvas is mutable, even though the wrapper/plan is frozen.

## Radial plan and tile
`kit.planRadial(model, options)` and `kit.radialTile(model, options={})` accept only:
- width integer600..1800 (default900), height integer500..1600 (default650);
- cx,cy finite within canvas (defaults center), radius120..240 (default136), scale0.75..1.5 (default1);
- tone `'dark'`/`'light'` (defaultdark), hueOffset finite−360..360 (default0).

Undefined optional values use defaults; null rejects. Node coordinates = center + radius×scale×(sin(angle),−cos(angle)). An actual 26×scale text measurement determines capsule length, direction, baseline and complete ink box. Advance≤220×scale; ink must fit the capsule inset12×scale horizontally and8×scale vertically. Conservative AABBs include icon/lobes/capsule stroke; 3px tile margin, 3px neighboring-box gap, center-node and center-label checks. Central count actual ink is preflighted too. The algorithm rejects collisions/overflow; it does not reflow, truncate, reduce type, solve arbitrary routing, or reorder nodes.

All input syntax/domain/model errors precede measurement. Geometry/ink failures may allocate only a1×1 measurement canvas; no result canvas is allocated/painted. Shape planning contains no random/time source. `radialTile` returns `{canvas,plan}` with the model count/total/selection and immutable rows/bounds.

## Summary
`kit.summaryTile(model,{width=340,tone='dark',hueOffset=0})`: integer width300..720; derived height=190+66×count. Same name/count/total/angles/count marks/selected ID, never independent duplicated numbers. Actual text must fit20px canvas inset; too-wide valid input rejects before a result. Its selected label is textual, not a click state. Summary and diagram must receive the **same tone/hueOffset** when matching colors are desired; a caller may deliberately style them separately. Angular display is rounded to2 decimals, geometry uses full precision.

## Placement and raster
`kit.place(ctx, tile, x=0,y=0)` accepts this kit's tile and finite positions±10000. It performs one native `drawImage`, does not alter caller state/path, and inherits caller transform/clip/alpha/shadow/composite. It cannot prevent deliberate clipping by the host. Another kit's tile is rejected. Result surfaces are not immutable/security capabilities.

Exact cold PNG bytes apply only to the pinned tested runtime/fonts/environment. Expanded-canvas redraw can differ at antialiasing edges, especially straight RGB on near-transparent pixels; no universal translation/scale equivalence or global channel-error bound is claimed. No pointer, hotkey, animation, scheduler, OS action, audio, 3D, accessibility certification or real data connection exists.
