# Contract

`createScalarFieldKit(api)` requires a trusted Canvas API whose createCanvas returns fresh default-state Native surfaces. No constructor allocation or font loading. Malicious factories, proxies, patched built-ins and global-runtime attacks are not sandboxed.

`fieldTile({width,height,phase,frequency,palette})`:
- Required exact enumerable own data fields on ordinary or null-prototype records. Unknown/hidden/Symbol/accessor/inherited fields reject without running getters.
- Integers width64..1600, height64..1000; width×height≤1,500,000 pixels. Per tile, not cumulative cap. Pixel storage has native-raster plus ImageData overhead; do not claim total memory is only4×pixels.
- Finite phase−4π..4π radians; frequency1..10. No coercion. Frequency controls pattern density, not a measured physical frequency.
- palette: exactly3 dense same-realm ordinary arrays of exactly3 integer RGB channels0..255. Canonical own enumerable data indices only. No iterator replacement, sparse/prototype entries, extra fields or getters. Any valid RGB including green is accepted; no color family is banned. No defaults silently impose brand colors.
- All semantic checks and snapshots precede allocation. A successful call creates one raster and its ImageData. CPU O(width×height). Opaque pixels; same runtime/input yields same result. Cross-engine math/PNG identity unverified; this is not seamless periodic tiling, a scientific terrain model or original application algorithm.
- Returned frozen `{width,height,plan}` has deep frozen copied palette and no canvas/ctx exposure. Private raster held by the kit WeakMap; no retained input references. User garbage collection/lifetime still controls aggregate resource use.

`place(ctx,tile,x,y)` only accepts that kit's real handle, finite x/y∈[−8192,8192] and a trusted drawing context. Exactly one drawImage at native dimensions. Does not alter current path, save stack or context properties. All host transform/clip/alpha/blend/shadow/filter/smoothing remain effective; caller owns transformed bounds/overlap. Fractional placement can resample. A copied/cross-kit handle rejects before drawing. This is no arbitrary scale/rotation wrapper; use explicit host composition.

CLI accepts an absolute NEW output directory under a trusted existing parent; existing files/directories and final live/dangling symlinks reject. No parent creation, overwrite or ancestor-symlink/race sandbox. A filesystem failure after directory creation can leave partial outputs; this is not a transactional publication system. PNGs and outputs.json are local generated evidence, not source dependencies.
