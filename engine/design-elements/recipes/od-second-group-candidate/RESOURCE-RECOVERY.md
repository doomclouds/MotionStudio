# Exact-resource contract

Current mode is **provide-exact**, not download/restore automatically. Missing resources intentionally prevent rendering before any native module/font registration. The minimum public-code boundary therefore remains conditional, not out-of-the-box runnable.

| Candidate | Required external files | Origin / reproducibility limit |
|---|---|---|
| Bold Poster | 4 TTF instances | Shrikhand, Libre Baskerville Italic, Space Grotesk 500/700 from pinned OpenDesign WOFF2. font-lock.json binds source and derived bytes; FONT-PROVENANCE.md records conversion. Original font retrieval was done in the study; this adapter has not cold-downloaded/rederived them. |
| Decision Tree | 2 TTF, connectors.svg, cursor.svg, thumb-up-noto.png | Inter 4.001 source is pinned in source-provenance.json. SVG geometry is source-derived. Noto Color Emoji 2.051 glyph u1F44D is an explicitly different licensed glyph. emoji-metadata.json identifies exact local font hash; no public exact font download URL or portable extraction recipe is verified here. |
| Creative Voltage | 4 TTF | Syne 800, Caveat SemiBold, Space Mono regular/bold; font-metadata.json binds upstream WOFF2 and derived bytes. Fixed upstream source paths are pinned; original study conversion used local fontTools and may encode tool/time metadata. This adapter does not promise byte-identical reconstruction from current upstream fonts. |

All 13 exact current assets were supplied from local studies and verified by SHA-256 before integration tests. That proves consumption of the declared inputs, not public online availability of every derived byte. Do not silently substitute newer font versions or a different emoji. To make a future publicly portable package, add and independently test deterministic dependency restoration against pinned public inputs (including Noto) or retain this explicit provide-only condition.
