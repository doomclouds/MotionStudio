# Static event-interval report

A **receipt snapshot**, not another media evaluator. `event_interval_report.py` reads only the explicitly supplied event-interval receipt, validates its closed shape and internal arithmetic, then writes self-contained HTML with inline SVG. It never opens media, profile files or evidence locators, never executes links, and contains no JavaScript or network assets.

## Run

Keep `event_interval_report.py` alongside `event_intervals.py`. Python standard library only; an actual Git worktree additionally uses existing Git to enforce ignored output. No new package, browser, image library or model is required to generate the HTML.

```sh
python3 tools/reference-benchmark/event_interval_report.py render \
  --receipt /local/interval-receipt.json --out /local/new-review.html
python3 -m unittest discover -s tools/reference-benchmark -p test_event_interval_report.py -v
python3 -m unittest discover -s tools/reference-benchmark -p test_event_intervals.py -v
```

The output must be fresh, with an existing non-symlink parent; in-repository output must already be Git-ignored. The renderer uses the evaluator's shared temporary-write/fsync/exclusive-hardlink publisher, not a second overwrite implementation. Concurrent output creation fails without replacement; interrupted writes do not leave a partial final HTML. Unsupported hardlink publication fails closed.

Exit 0 means a snapshot was rendered, including a valid `STALE`/`MISSING`/`BLOCKED` source receipt. Exit 1 means the supplied receipt itself was missing, changed during reading or inaccessible. Exit 2 means invalid input, unsupported contract, output conflict or resource limit. Invalid input produces no report. A rendered failure receipt contains its reason and **no timing chart or numerical findings**.

## What the visual means

- Each event has four lanes: reference visual/audio and candidate visual/audio. Every lane uses the **same unchanged raw-time scale** for that event. The displayed local window is a zoom, not a per-lane offset, DTW or alignment. First native video PTS and audio domains remain explicit; negative audio-relative times are supported.
- Every declared candidate is displayed. Multiple candidates remain ambiguous; no strongest/nearest candidate is chosen. Unknown/missing observations have text but **no zero-time marker**. Point intervals are lines, not artificial-duration bars. Axis ticks are rounded for display; the table preserves the stored interval strings. Long SVG value labels defer to that table rather than silently rounding evidence.
- Planned ranges use dashed outlines and `PLAN`; their measurement cells remain `PLANNED_ONLY`, not observed differences. Manual is **operator-declared provenance**, not evidence that someone actually watched or listened. Measured ranges are algorithm support, not certified event boundaries.
- The table separates reference/candidate lag, visual/audio shift and lag error. Ranges are conservative arithmetic envelopes, **not statistical confidence intervals**. Containing zero is not equality or acceptable sync; a signed difference is not an artistic failure.
- Review actions identify missing observations, unresolved identities and candidate ambiguity. Exact intervals and optional ±0.25s review context are separate. Locators are escaped text, never hyperlinks.

The HTML's fixed `COLLECTED_NOT_APPROVED` disclaimer cannot be replaced by an input approval status. Source receipt bytes are identified by SHA-256. File bindings and evaluator-source SHA are displayed as **declarations in that receipt**, not freshly verified media or code. To establish current media identity, rerun the evaluator separately with its normal binding checks; refreshing HTML alone cannot do so.

## Bounded contract and safety

Accepted schema: current `motionstudio.event-intervals/1.0` evaluator output. Only collected receipts and the evaluator's three failure shapes are accepted. Unknown fields/statuses, duplicate keys/IDs, incorrect source-binding relationships, contradictory context/measurements/actions, invalid provenance layers, nonfinite or malformed times, out-of-domain candidates and unsupported text controls are rejected. Internal arithmetic is reproduced from the declared ranges; that does not authenticate observations or correspondence.

Receipt input is limited to 4MiB and JSON depth 20; at most 100 events, 800 unique observations, four candidates per slot and 205 file bindings. Source timing precision limits are preserved. No linked source or evidence is read to perform these checks. Text is HTML/XML-escaped, SVG coordinates are numeric, and an explicit content-security policy disables scripts and external resources. This is not a hostile-filesystem sandbox; the shared path, stale-detection and output rules retain their documented boundaries.

## Synthetic gallery (not real-film evidence)

The test helper creates actual synthetic evaluator receipts for positive/negative lag, whole-event shift, ambiguity, missing observations, planned ranges and unknown ranges. Its source files are intentionally **non-media synthetic bytes**, not decoded or watched films.

```sh
DEMO=$(mktemp -d)
python3 - "$DEMO" <<'PY'
import sys
from pathlib import Path
sys.path.insert(0, 'tools/reference-benchmark')
import event_intervals as core
import event_interval_report as report
from test_event_interval_report import make_gallery
root = Path(sys.argv[1])
receipt = make_gallery(root / 'fixture')
core.write_fresh_json(root / 'gallery.receipt.json', receipt)
report.render_file(root / 'gallery.receipt.json', root / 'gallery.html')
print(root / 'gallery.html')
PY
```

The helper also requires `test_event_intervals.py` and its existing synthetic JSON template. Tests exercise XSS strings, finite/depth/size limits, stale/failure snapshots, missing source files, no-overwrite and atomic-write failures. Synthetic tests and viewing a generated diagram do not count as reviewing any actual film. This renderer does not modify the original benchmark report, evaluator receipt schema or review gates.
