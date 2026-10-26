# Synthetic static evidence: bounded M1 contract

This is an opt-in **index v2**, separate from the unchanged v1 video library.
The public default index stays empty and v1. Old readers reject index v2.
No private probe receipts or media ship with this extension. The temporary fixtures
in `scripts/test_static_knowledge.py` are fictional parser data, not executed probes.

## Scope and compatibility

An index has exactly `schema_version: 2`,
`capabilities: ["synthetic-static-probe-v1"]`, `scope`, `cases`, and `techniques`.
Entries have `id`, normalized relative `path`, and matching `tags`. M1 accepts only
Case v2/static-probe and v1 candidate Techniques in this envelope; mixed video/static
libraries and cross-case decision evidence are deliberately unsupported. Existing
v1 envelopes keep their existing validator, query and decision behavior.

The executable exact-field contract is `scripts/static_knowledge.py`. Unknown fields
or versions fail closed. Cases contain identity/revision/title/status/tags,
revision_note/supersedes, source, artifact, run, artifacts, observations,
technique_ids, empty feedback, and a required decision v2. `source.origin` is always
`synthetic`; `artifact.kind` is always `static-probe`. No durations, video ranges,
listening, production-transfer results, owner feedback or permission inheritance.

## Recording, not certifying, execution

A run declares `recorded-executed`, `planned`, `failed` or `inconclusive`; matching
Case statuses are `recorded-with-limits`, `planned`, `failed`, `inconclusive`.
Unavailable statuses may retain historical run facts. Receipt declarations are
`recorded-receipt`, `rerun-receipt`, or `none` (planned only). Unknown execution time
and exit code are null with explicit reasons; recorded time has its own timestamp.
Known timestamps require timezones. Nonzero exit cannot be recorded-executed.
Environment identifies runtime/backend versions and OS/architecture. Parameters
are bounded-depth finite JSON data, not executable instructions.

Artifacts identify script/input/output/result/contract files by relative filename,
SHA256, media type and provenance. Images require positive dimensions. Run variants
own disjoint output IDs and declare parameters plus reference semantics. Execution
requires script and result identities; recorded-executed variants require outputs.

Observations bind a run, variant and its outputs to a specific claim, reference
semantics, statement, scope, outcome and non-root JSON-pointer `result_locator` in
the result artifact. Locators are **declared, not dereferenced or certified**.
Methods are static-pixel-probe or code-test, always instrument-measurement.
Receipt ingestion is distinguished from direct-run (requiring rerun-receipt).
Failed/inconclusive runs cannot declare supporting or contradicting observations.

Metrics require finite value, reference value/tolerance (nullable), positive integer
sample count and explicit selection. Supported units are `8bit-channel` (0..255),
`normalized-channel`/`ratio` (0..1), `count`/`pixels` (nonnegative integers), and
`boolean` (integer 0/1). Support requires all numeric criteria pass; contradiction
requires an actual failing criterion. New units need an explicit validator change.
Code assertions additionally declare expected, actual and boolean passed; M1 supports
equality assertions, alongside numeric metrics. Measurements set assertion to null.
Semantic truth, correct sampling and claimed reference intent remain review duties.

## Decisions and reuse

Decision v2 preserves problem, alternatives, chosen option, rationale, experiment,
costs/risks, applicability, counterexample, limits and informational-only permission.
Its evidence refs bind current same-case revision, observation, run and every output
hash. A valid comparison needs distinct baseline/candidate variants, declared
parameter differences, common parameter keys and identical reference semantics.
Supporting/contradicting results require both variants' observations for the exact
claim and semantics. Contradicting/inconclusive candidate observations cannot be
hidden by omitting their refs from the selected result.

Results are only `synthetic-static-technical`. `decide` labels recorded support
explicitly and always warns that it is not independently certified execution,
video viewing, listening, production or artistic approval. Unavailable lifecycle
and contradicting results are counterevidence. Default query suppresses unavailable
static records and candidate Techniques depending on them; explicit status queries
allow inspection. Static evidence can only support candidate/inferred Techniques,
never production promotion. Links and supersedes are identity links, not permissions.

## Explicit artifact identity checks

```
python3 scripts/video_knowledge.py --root PATH validate
python3 scripts/video_knowledge.py --root PATH query --method static-pixel-probe
python3 scripts/video_knowledge.py --root PATH decide --text 'edge'
python3 scripts/video_knowledge.py --root PATH verify-artifacts --artifact-root AUTHORIZED_ROOT
```

Only the last command reads artifact files. It uses no-follow directory/file opens,
rejects symlinks and nonregular files, hashes in chunks, detects concurrent metadata
changes, and enforces configurable per-file/total byte budgets. It reports checked,
missing, mismatch or blocked per artifact, and stale on failed identity checks.
Verification is read-only and does not automatically mutate record lifecycle.
A caller must treat a failed report as unavailable evidence and review/new-run the
record before reuse. `decide` always reports artifact verification as not checked.
Hash matches prove byte identity only, never that scripts generated outputs.
No command executes probes, fetches URLs or authorizes publication.

## Deliberate M1 limits

No private Iris conversion is included here. No cross-case decisions, video/static
mixing, credential detector for arbitrary parameter text, parameter-unit registry,
receipt-content verification, signing, database, or automatic stale-state writes.
Source/receipt authenticity, rights, parameter meanings/units and artistic/audio
acceptance need separate review. Synthetic fixtures cannot establish any of them.
