# Protected dual palette model candidate

**0 new foundations, 0 registry entries.** This is a small model-preparation recipe for the existing indexed-pixel renderer, not a standalone image renderer. Do not promote it as a new generic algorithm.

## Why retain only this much

`indexed-pixel-layer-candidate` already turns caller palette/index matrices into RGBA and enlarges exact cells; it permits duplicate RGB entries but offers a single palette and global HSV adjustment, not protected semantic-index transforms or per-cell table selection. `raster.palette-error-diffusion` starts with RGB and quantizes through error feedback; equal input RGB cannot carry separate semantic identity. Its distance metric and dither cannot restore an identity lost during RGB conversion.

The recipe keeps that identity before rasterization. Two indices with identical RGB can respond differently to a caller's palette degradation. An explicit binary mask then chooses palette A or B without interpolating colors. Neither is a new raster primitive: concatenating tables and remapping categorical indices is sufficient. Thus only two small helpers survive, with the existing output layer reused unchanged.

## Stable API

`protectPalette({base,mapped,protectedIndices=[],protect=false})` returns a detached RGB hex array. `base` and `mapped` are equal-length 1..256 palettes. With `protect:true`, replace only entries in `protectedIndices` with base entries. With `false` or omission return the mapped values unchanged. Protected indices must be unique integers in range. Invalid protection inputs reject even if disabled. No mapping/fade algorithm or timeline is imposed.

`prepareIndexedPaletteModel({columns,rows,indices,paletteA,paletteB,selection})` returns `{columns,rows,palette,indices}` consumed directly by `renderIndexedPixels`. Dimensions are integers 1..256; each palette has the same 1..128 entries, each an exact #RRGGBB string. Indices and selection each contain exactly columns×rows entries. Indices are integers -1..N-1; -1 stays transparent. Selection contains integer 0 or 1 only, choosing A or B respectively. The result palette is A concatenated with B, and the result index is i+selection*N for nontransparent cells. No distinct-color compression, deduplication or index merging occurs. Maximum output is 256 palette entries and 65,536 cells, within the existing renderer contract.

Inputs must be plain Object.prototype records with only documented own enumerable data fields; dense unaugmented Array.prototype arrays with own enumerable data entries. Accessors, symbols, unknown/hidden fields, null/custom prototypes, typed arrays, subclasses, sparse arrays, nonfinite values and coercion reject. Optional protection fields default only if absent/undefined. No caller methods/getters run under ordinary inputs. Proxy traps, hostile built-in modifications and concurrent mutation are outside the contract, not a security sandbox. No callback, external state, time, randomness, DOM, Canvas, network or filesystem in `index.mjs`.

Output records/arrays are fresh and mutable; inputs never mutate and outputs do not alias inputs or other calls. String values are immutable. Validation and work are O(cells+palette). Returned mutable arrays can be changed by callers, who own subsequent validity. Modules do not retain data.

## Composition and integration

Larger content may be tiled by the caller without changing either contract. Evaluate a spatial selection mask in global coordinates before dividing it into tiles, then rejoin the returned RGBA rows without interpolation. This package does not provide a tiler or seam-repair algorithm.

Protection is a caller decision, not a universal correction. Historical/limited palettes may intentionally remap every role; another stage may preserve selected roles. Whole-frame darken/whiten may intentionally affect them again. A precomputed protected palette can pass unchanged without invoking protectPalette twice. Only RGB hex tables and explicit -1 transparent indices are supported; packed LUT alpha and unused slots require an explicit caller adaptation.

```js
import {prepareIndexedPaletteModel, protectPalette} from './index.mjs';
import indexed from '../indexed-pixel-layer-candidate/index.cjs';
const paletteA = ['#b95225', '#b95225'];
const paletteB = protectPalette({
  base: paletteA, mapped: ['#263b46', '#263b46'],
  protectedIndices: [1], protect: true
});
const model = prepareIndexedPaletteModel({
  columns: 2, rows: 1, indices: [0, 1],
  paletteA, paletteB, selection: [1, 1]
});
const rgba = indexed.renderIndexedPixels({width: 20, height: 10, model});
```

The same initial RGB has two semantic indices: only the second retains its base color. Caller-owned contents and masks determine the result; the module supplies no narrative, timing, palette art or pixel font.

## Verification and source scope

From this package directory, with existing Node and the adjacent indexed-pixel-layer-candidate source:

```sh
node --test test.mjs
```

Eight test groups cover duplicate-RGB protection on/off, two original diamond/ladder geometries through the existing renderer, categorical selection/transparency, output ownership, malformed dimensions/palettes/masks, strict structures, protection errors and maximum/singleton budgets. No Canvas, font, browser or network dependency is required. The tests create no files.

Independent source-equation comparison used synthetic indices and explicit table/mask combinations; that oracle and its generated evidence are not shipped. Numerical tests do not establish real-browser behavior, artistic quality, continuous viewing, listening or arbitrary content suitability. See [credits](CREDITS.md), [the output dependency](../indexed-pixel-layer-candidate/README.md), and [palette-error-diffusion](../../../../motion-elements/lib/foundations/raster/palette-diffusion/README.md) for their distinct contracts and licenses.
