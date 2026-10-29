# Sources and distinct responsibility

- https://pbr-book.org/4ed/Reflection_Models/Specular_Reflection_and_Transmission — direction conventions, IOR ratio, Snell refraction and TIR; distinction between directions and Fresnel energy. Read source, not copied implementation.
- https://openstax.org/books/university-physics-volume-3/pages/1-3-refraction — angle measured to interface normal, Snell relation.
- https://openstax.org/books/university-physics-volume-3/pages/1-4-total-internal-reflection — TIR only from higher to lower IOR and critical-angle relation.

For1.5→1.0 glass/air, critical angle is asin(2/3)≈41.8103°. A45°interface incidence is overcritical, with a genuine angular margin rather than exactly-critical branching. Film will use this direction-level idealization, not actual lighthouse optics/radiometry or physical light propagation timing.

Existing `visibility-fan` finds unbent visible areas around opaque line obstacles. Raster displacement inversely samples image coordinates without traversing material boundaries. Neither maintains refractive medium state or produces successive Snell/TIR interface chains. This is one candidate including compile/intersection/branch traversal, not several helpers counted separately. Existing polyline-sections can reveal returned path lengths; it will remain an existing candidate reuse.
