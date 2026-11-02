# Reuse boundaries — one frozen private candidate

## What is actually proven in a film

HOMEWARD v01 is one10s /600frame production using the frozen ray-chain implementation SHA `ac8dcf6756008b3306295eed91110f7100726685101eb8201886d3d0fd3b8ca0`. Its static right-angle prism has a single air→glass transmission, a45°TIR, a glass→air transmission, then viewport exit. The render performs **one medium compile and one optical trace**. The resulting static chain is consumed in600frames by existing polyline-sections. An independent cubic path moves the boat. Do not report600ray traces, three new foundations, or a generic real-time optical engine.

Film packet: `../motion-homeward-study/delivery-packet-v01.json`. Final independent evidence: `../motion-homeward-final-independent/result.json`. Core front review: `../motion-homeward-independent/result.json`. One actual production is not proof that all future optical shots will be aesthetically or numerically valid.

## Cross-scene scope matrix

| Use | Supported responsibility | Caller obligations / unproven part |
|---|---|---|
| Oblique parallel plate | Two refractions, correct medium order; emergent ray parallel to incident with lateral shift | Plate is one convex polygon, source/rays clear every exclusion band; no transmitted power/Fresnel ghost ray |
| Right-angle prism | Genuine TIR preserves medium, subsequent transmission exits | Incidence must be away from critical exclusion; no claim about real prism coatings, absorption or lighthouse lenses |
| Source inside a slab | Initial medium classification and first exit refraction | Source stays away from finite boundaries; light source/energy are not modeled |
| Nonparallel convex wedge | Multiple nearest-interface hits and direction changes | Ordered polygon must be strictly numeric-CCW and convex, all guards respected; no prescribed spectral dispersion |
| Ray missing medium | Returns one straight viewport-bound segment | This is not occlusion detection against arbitrary scene furniture |
| Animated source or prism | Each isolated valid input can be traced | **Not yet film-validated**. Recompile changed polygon, test all relevant states and inspect branch changes/guard failures; no continuous topological guarantee from a sparse frame grid |
| Multiple glass objects, nested water/glass, curved lens | Unsupported | Must reject at data-contract level or use a different explicitly designed mechanism; do not stitch independent traces and claim equivalent nested-medium physics |
| Rainbow/colour separation | Same mechanism can accept separate fixed IORs per plan | Colour/IOR table would be caller input, not another foundation or measured-spectrum rendering |
| Reflections below critical | Unsupported in the returned branch chain | Transmitted branch is selected intentionally; there is no reflected sibling, Fresnel amplitude or energy conservation account |
| Physical photon arrival / wave optics | Unsupported | Arc-length sections are motion-graphic timing only; no speed-of-light, phase, interference, polarization or diffraction |

## Explicit negative cases

`qa/reuse-fixtures.json` is generated from the exact frozen core. It contains five accepted **mechanism-only** fixtures and five explicit rejected counterexamples:

1. Source on finite interface → `origin boundary guard`.
2. Ray reaching a medium vertex → `vertex guard`, not arbitrary nearest-edge choice.
3. Forward ray on a supporting edge line → `grazing supporting line guard`, not an unexplained transparent miss.
4. Critical-angle ray → `critical-angle guard`, not an arbitrary TIR/transmitted branch.
5. Insufficient interface budget → `interaction budget exceeded`, not a truncated path labeled viewport escape.

These examples do not enlarge the13author+5independent core-test count, create extra movies, or establish artistic approval. They clarify behavior already tested and make errors reproducible. Additional contract guards include strict convexity, near-origin intersections and ambiguous nearest boundaries.

## Integration checklist

- Preserve core identity and units. Distance guard scales with viewport diagonal; angular and critical guards are dimensionless. Camera/pixel transforms belong outside optical coordinates.
- Feed numeric-CCW vertices, not an assumed screen-space visual winding. Outward normal definition is `(dy,-dx)/length`.
- Handle explicit errors as rejected scene configurations. Never silently drop rays, shrink exclusion bands, nudge vertices or substitute an authored bent line under a claimed valid trace.
- Draw returned endpoints. If revealing paths, preserve returned vertex order and real cumulative distances; geometric reveal is not optical travel time.
- Attach receipts to the actual scene source/version. A changed source or polygon must get a fresh identity; successful math tests alone do not establish rendered consumption.
- Recheck source/event anchors. HOMEWARD’s actual reception point is(990,325), distance890 of total1180; audio/visual each quantize the shared event seconds independently.
- Keep provenance: this remains a private unregistered candidate. No public push, registry increment or publication approval is implied by these files.

### Concrete moving-ray trap (not present in HOMEWARD)

`qa/dynamic-critical-counterexample.json` uses the same prism with a tilted source direction `(sin θ, −cos θ)`. Atθ=−5° the trace successfully transmits through the sloping face; atθ=0° it successfully TIRs then exits the right face. However the intermediate angle

`θ = −asin(1.5 × sin(π/4 − asin(1/1.5))) ≈ −4.787626120042641°`

hits `critical-angle guard`. Thus two valid endpoint frames do **not** certify a valid continuous sweep. A sparse frame grid may miss the narrow exclusion band and jump between branch topologies. A future animated ray shot must explicitly plan its branch-domain intervals or reject this sweep; never hide the failure as a disappearing beam. HOMEWARD uses only the fixedθ=0°chain and is unaffected.
