# FlowAI: dense dark operations snapshot

## Visual truth and source mismatch
Fixed official nexu-io/open-design commit 12d970eacc8971150e3c76470d2a9afe16dc2ed1. Visual source is docs/screenshots/skills/flowai-live-dashboard-template.png, Git blob ed1f23c08b094d26218695c757a7f87b0c107626, 1024×554.
The current design-templates/.../assets/template.html has only 4 KPI cards, no sidebar and different tab contents; it is not the HTML that generated the screenshot. Inventory inspection found no other matching FlowAI HTML. This is independently coded screenshot-driven reconstruction, not an original-program replay or proof of source parity. Parent explicitly accepted that scope.

## Design decisions
- This complete desktop workbench differs from Level's multi-phone lifestyle story: content density, blue-gray surfaces and four information tiers support operational scanning.
- Near-black sidebar, graphite page, slightly lighter cards, tiny subdued boundaries: no heavy outlines or arbitrary rainbow cards. The green current navigation and small success percentages have state roles.
- KPI row → member/roles/seats → workflow table/contributors: summary to explanation to actionable lists. Pastel role bars differentiate roles, not a rainbow ranking scale.
- Sidebar and toolbar are not functional. Avatar marks are authored geometric stand-ins, not copied photos or claimed real identities.

## Reusable limited recipe
activity-table.cjs: drawActivityTable(ctx,{x,y,width=562,rows}); exactly 5 rows, 7 cells, fixed aligned columns (width changes rule length only, NOT column offsets), row IDs unique, text width measured before drawing; finite coordinates abs≤16384, bounded width540..800. Path2D avatars preserve caller path. Two actual contents are original workflow sample and synthetic editorial production tasks. Seven malformed inputs are rejected before pixel changes. The API is display-only strings, not automatic percentages, sorting or live validation. No new public family registered.

## Data and rights
Screenshot values/names/dates are frozen demonstration content, not live workspace data or verified product metrics. Status counts 15+2+18+8=43 exceed total35, and shown status percentages sum80; source role labels do not give a complete100%. We do not infer consistent denominators. Seat35/50=70% is internally consistent; that alone does not verify the rest.
No screenshot is drawn into reconstruction. No upstream JS executed. All shapes/text/avatars rebuilt in Canvas, no imagegen or external bitmap. Root repository Apache-2.0 applies as recorded; official example plugin metadata separately declares MIT (blob55913506808773658bbdd70e4eb76cf45adc787d), not silently merged with the root license. Fonts Inter OFL. No automatic publishing, no blanket brand clearance.

## Differences
Sidebar/top icons and avatar faces are deliberately simplified geometric stand-ins, not merely rasterization differences; small-font rasterization/weight, panel borders, soft shadows and precise chart rounding differ. Source chart heights copied visually, not inferred calibrated data. Output fixed1024×554; no responsive, browser, live-data or interaction claim.
