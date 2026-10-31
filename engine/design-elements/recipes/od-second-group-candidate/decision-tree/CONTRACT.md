# Decision Tree / fixed-frame composition contract

## Unit and scope

One complete 1920×1080 static work, not seven separate works. Source-coordinate
canvas is enlarged 1.2× around (960,300); final frame does not reflow. Preserve
the large lower whitespace. This is not a working graph editor or a movie.

Truth: `evidence/reference.png` is the selected upstream preview. It visibly
contains corrected **Python**, a selected Python card, a cursor at (408,636)
in output pixels, its **You** tag, and a reaction. Do not infer a timeline
timestamp: the original animation also contains other, inconsistent states.

## Reusable entry points

- Native: `await compose(canvasContext, scene, {x, y, scale})` in `render.cjs`.
  Placement is in host pixels, scale must be positive. Context state is saved
  and restored; clipping is limited to the component. `render(output,scene)`
  writes a standalone PNG. Renderer reads only pinned assets and text data.
- HTML: `render_component(scene, instance_id, asset_prefix)` in `decision_tree.py`.
  Include `decision-tree.css` once. Use a unique ID per instance. The function
  returns a section, escapes text, does not mutate data, and has no JS runtime.
  HTML companion has **not** passed browser QA in this environment.
- Edit `scene.json` for text/tone inputs. Geometry and graph topology are fixed
  because the connector asset is a pinned upstream vector, not a graph solver.

## Copy budget (source pixels at 18px Inter 500)

| Slot | Current text | Max measured advance |
|---|---|---:|
| root | Should I learn to code? | 200 |
| yes | Yes | 40 |
| not-sure | Not sure | 80 |
| python | Start with Python | 150 |
| nocode | Try no-code first | 150 |
| website | Build a personal website | 215 |
| course | Take a free intro course | 210 |

All text stays on one line, with 24px horizontal/16px vertical padding. Labels
use Inter 600 at 14px; the cursor tag uses Inter 600 at 12px. Current font files
cover Latin; no Chinese/fallback fidelity is claimed. New languages require an
explicit font/license choice and a new layout review. Character count alone is
not a width guarantee: rerun native tests and inspect `layout-metrics.json`.

## Stable geometry and tokens

Seven node centers: (960,100); (600,300); (1320,300); (400,500); (800,500);
(1120,500); (1520,500). Connectors remain the six upstream 4px SVG paths.
Output centers become (960,60); (528,300); (1392,300); (288,540); (768,540);
(1152,540); (1632,540). Corner radius is 12 source pixels; selection uses a
2px blue stroke outside the Python node. Dot spacing is 20 output pixels.

Source palette: yellow #e8d44d, green #c2e8a0, peach #f5c5a3, lavender #d4c5f9,
blue #a8d8f0, pink #f8b4c8, ink #333, selection #0b84f3, tag #9747ff.
Native optical corrections are documented in code: shadow-alpha compensation
for canvas 0.1.100, and 0.5-source-pixel text outline without advance-width change.
They are renderer corrections, not new source design tokens.

## Exclusions / substitutions

- No GSAP, no timer, no selection behavior, no cursor movement, no video export.
- No flattening the reference into an image layer; SVG connectors/cursor remain
  the actual supplied source geometry, not approximated brand/image assets.
- The reaction uses a licensed Noto glyph asset, not the unknown original system
  emoji. All reuse must keep `NOTICE` and `LICENSES/`.
- Native render is verified. Browser preview, responsiveness, interaction and
  publication are not verified. No push or deployment has been performed.
