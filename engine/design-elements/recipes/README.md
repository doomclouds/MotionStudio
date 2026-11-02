# Design recipe source roles

These directories classify existing source packages, not acceptance or maturity. Stable IDs, original manifest claims, source identities, resource locks and nested license terms remain authoritative. No old-path aliases are provided.

| Role | Scope | Not implied |
|---|---|---|
| `reviewed/` | Packages whose existing recipe records declare `technical-reviewed-static-recipe` | Whole-package maturity, production readiness, user aesthetic approval, or review of every bundled source |
| `candidates/` | Other bounded source packages, including unknown or mixed statuses and `technical-reviewed-static-recipe-candidate` | Promotion to a registered family or reviewed recipe |
| `batches/` | Historical discovery indexes only, linking packages by original selection group | Another source implementation or authoritative lifecycle registry |

Directory placement never updates a manifest status. `xhs08` remains a candidate. Frozen locks/provenance retain their original commit-scoped paths and URLs; those are historical identities, not current runtime entrypoints. Local active links and build inputs use only the new layout. Public family registration remains in `../catalog.json`.

Start at [design index](../Index.md), or query the committed tree from the repository root:

```sh
python3 scripts/design-navigation.py --repo . --format markdown
python3 scripts/design-navigation.py --repo . --details
```

The query is read-only and excludes uncommitted edits. Per-package contracts, rights notices and explicit external resources remain required. This directory change does not establish fresh rendering, visual/audio review, cross-platform behavior or final acceptance.
