# Design retention: numeric hierarchy without brand coupling

1. Separate semantic types before arranging tiles: counts are exact integer inputs; rates have explicit unit and rounding. Never use a generic numeric string to obscure that difference.
2. Use stable monospace numerals for scanning, a strong value and quieter but sufficiently dark label. Shared baseline, padding and border make comparisons faster than decorative icons.
3. Layout is a composition concern: the same tile is used in studio and attendance examples, with distinct valid data. The component does not know what an order, visitor or business total means.
4. The private reference used compact mobile summary cards. The public example deliberately changes proportion, palette and content, retaining only general hierarchy and validation logic. Do not smuggle the original app shell or logo back in under a root open-source license.
5. Fail closed for invalid metrics, unsafe integer counts, excessive coordinates and text overflow. Render offscreen so rejected calls do not mutate caller font or current path.
6. Future motion: animate position/opacity at composition level while drawing stable validated card content. Define explicit rounding behavior during count interpolation. This delivery contains no implemented animation and no proof of motion-engine integration.

Evidence limits: two static examples and direct native scene interface tests, not a functional analytics app, accessibility audit, responsive website or production data pipeline. External font/runtime setup remains a dependency; tests run against the locally available versions.
