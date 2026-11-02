# 统一知识契约 v3

唯一运行入口为 `scripts/video_knowledge.py`；索引、Case、Technique 与 Case 的 decision 均使用整数 `schema_version: 3`。索引字段恰为 `schema_version, scope, cases, techniques`，无历史路径槽或能力版本分派。索引条目恰为 `id, path, tags`，路径相对本目录，card ID 全库唯一，文件 ID 与索引一致，tags 与索引一致。

每张卡显式声明 `evidence_type: video | static-probe`。同库可容纳两种类型，但跨类型关联/证据不支持并会报错。这是同一合同中的证据类型，不是版本回退；视频的连续观察/听审与静态探针的运行/指标是独立能力，不能互相替代。本页说明 video 分支；static-probe 分支见 [STATIC-SCHEMA.md](STATIC-SCHEMA.md)。未知字段或类型必须先明确合同，不得静默忽略。所有 Case 都必须明确decision记录状态；没有真实决策记录时使用`not-recorded`及诚实原因，不得补造方案、结果或批准。有记录但未执行的计划明确`not-tested`。

公开默认库仍为空，模板与示例不是实际经验。外置旧数据仅通过显式[一次性迁移](MIGRATION.md)进入新合同；运行入口不读取旧格式，不自动修改任何库。

## Case

`schema_version, evidence_type, kind, id, revision, title, status, tags, source, inspection, observations, interpretations, technique_ids, feedback, revision_note, supersedes, decision`。

- source：作者、名称、公开 URL、媒体 URL、实际媒体 sha256、duration_seconds、rights、access。外部参考 origin=external-reference，URL 使用公开 HTTPS；自制样片 origin=original-production，url/media_url 为 null，以 artifact_filename 与实际 SHA256 定位，不编造公开链接。来源类别 `origin=synthetic` 明确标记合成示例；沿用 null URL 与 artifact_filename 结构，不冒称真实原创影片。Technique 实际迁移结果仍只接受 `original-production`，不得用 synthetic 充数。未取得媒体的新卡使用 `status=unverified`，sha256 可为 null、duration_seconds 可为 null，observations 必须为空；可以保存 `unverified_questions`，不能编造观察。
- inspection：date、methods（sampled-frames / dense-frames / continuous-muted / actual-listening / metadata-probe / source-text）、coverage、not_verified。方法仅记录实际执行。作者声称单列 `author_claims`，不能写进 observed。
- observations：局部唯一 id、range_seconds=[start,end]、claim_type=observed、statement。时间界限内的近似窗口不等于精确切点；在 inspection.time_precision 说明。
- interpretations：id、claim_type=inferred、evidence=[observation ID]、statement、alternative。
- feedback：claim_type=user-feedback、scope、result、statement。保存任务语境与意见，不保存私有聊天定位号。
- related_case_ids（可选）：同任务相关案例的稳定 ID；关联不表示替代或批准继承。
- status：unverified / observed-with-limits / tested-with-limits / superseded / withdrawn。case 的 tested 仍不意味着已全片视听或用户喜欢。

## Technique

`schema_version, evidence_type, kind, id, revision, title, status, tags, claim_type, hypothesis, evidence, applies_when, limits, counterexample, falsification_test, validation, rule_level, revision_note, supersedes`。

- evidence：[{case_id, observation_ids:[局部 ID]}]，可同时包含正反证案例。
- claim_type 固定 inferred；状态 hypothesis / tested-with-limits / superseded / withdrawn。
- validation.state：not-tested-in-transfer / tested-with-limits；results：[{case_id, outcome, methods, scope, unresolved_contradiction}]，outcome=supports / contradicts / inconclusive；结果只填真实已执行测试。
- rule_level：candidate / tested-in-scope / reusable-in-scope。非 candidate 需真实迁移结果和 scope；reusable 至少两个不同案例支持且无未决矛盾。数量只是最低条件，不能自动证明因果。

不使用数值 confidence 冒充测量。来源检查方法、未验项、替代解释与真实测试结果比无依据的 0.95 更重要。

## Required video Case decision

Every video Case requires a schema 3 decision-state object, with one of two forms:

- **No decision recorded:** exactly `schema_version: 3`,
  `record_state: "not-recorded"`, and a nonempty accurate `reason`. This is a
  record of missing decision context, **not** a fabricated decision. It contains
  no options, experiment or results. Ordinary observations remain queryable;
  `decide` excludes this record and it cannot support production promotion.
- **Decision recorded:** `schema_version: 3`, `record_state: "recorded"`, and the
  full fields below. Every object requires its listed fields. Unknown or missing
  fields fail validation. This records declared decision context, not assumed
  execution or approval. An actual unexecuted plan has outcome `not-tested`;
  executed outcomes require bound observations, hashes and provenance.

The blank Case template uses not-recorded, avoiding invented choices or results.
The separate synthetic plan example demonstrates the recorded form without
claiming real observations or execution.

| Object | Required fields |
|---|---|
| decision | schema_version, record_state, lifecycle, problem, options, chosen_option_id, rationale, experiment, bindings, evidence_refs, result, applies_when, counterexample, not_verified, permission_semantics |
| problem | symptom, goal, hard_constraints (string list), preserve (string list) |
| options[] | id, action, cost (scoped estimate or measured description), risks (string list) |
| experiment | baseline_binding, candidate_binding, variables (string list), control_validity, confounders (string list), protocol, acceptance, stop_condition, regression_scope (string list) |
| bindings[] | id, role, sha256, version, origin |
| evidence_refs[] | id, kind, case_id, case_revision, record_id, binding_id, method, provenance |
| result | outcome, evidence_ids (list), owner_feedback_refs (list) |
| owner_feedback_refs[] | case_id, case_revision, feedback_index (zero-based integer) |

- At least two distinct options, a valid chosen ID, nonempty rationale, applicability,
  counterexample, experiment protocol, acceptance and stop condition are required.
- lifecycle: `active / stale / falsified / withdrawn`; outcome:
  `not-tested / supports / contradicts / inconclusive`. Falsified requires a
  contradicting result. Supersession still uses the parent Case fields.
- control_validity: `not-assessed / valid / invalid`. Invalid controls retain
  confounders; invalid or unassessed controls allow only inconclusive executed
  results. Preserve failed trials rather than deleting their confounders.
- baseline_binding/candidate_binding may be null for a plan. Executed results need
  both bindings and result evidence. Supports/contradicts require observation
  references for both baseline and candidate; they do not prove causality.
- binding role: `baseline / candidate / source / review / timeline / audio`;
  SHA256 is 64 lowercase hex characters and version is nonempty. origin:
  `original-source / original-production / reconstruction / synthetic`. Hashes
  identify artifacts, not licenses or proof that a source generated an output.
- evidence kind: `case-observation / content-review`. Both reference an existing
  Case at its exact revision. Case observations require an existing observation ID,
  matching source-media hash, and method declared in that Case inspection.
  Content-review record IDs reference a `review` artifact binding, avoiding a
  second copy of the observation. This CLI does **not** open that artifact or
  verify external record existence/content; external refs alone cannot establish
  an executed result. Run the content-review validator separately.
- method uses existing METHODS. provenance:
  `human-observation / instrument-measurement / source-text / model-inference`.
  actual-listening requires human-observation, metadata-probe requires
  instrument-measurement, and source-text requires source-text. These are
  traceable declarations, **not verification that a human listened or that the
  declaration is true**. Model inferences must not masquerade as human listening.
- owner_feedback_refs point to existing scoped Case feedback at an exact revision;
  no copied owner quote or inferred global approval. A not-tested result cannot
  claim result evidence/feedback and must explicitly list not_verified items.
- permission_semantics must be `informational-only-not-authorization`. Rights,
  access and past permission descriptions never authorize future downloads,
  execution, publication, purchases or disclosure. No credentials or signed URLs.

`decide` returns literal-match explanations (not confidence), applicability,
counterexample, options/costs/risks, the minimum experiment, stop condition,
versioned references and unknowns. Stale/falsified/withdrawn decisions, withdrawn
or superseded Cases, contradicting results and withdrawn/stale evidence Cases
are separated into counterevidence, never positive recommendations. Unexecuted
plans remain clearly not-tested. Missing/changed referenced revisions or hashes
fail validation rather than quietly reusing the evidence. No current filesystem
artifact freshness is inferred from matching declarations. The `query`
command is a raw card lookup, not a recommendation engine.

### Dependency withdrawal and promotion consistency

Decision availability follows both `evidence_refs` and
`result.owner_feedback_refs`, including their transitive decision dependencies.
Withdrawn/superseded Cases and stale/falsified/withdrawn or contradicting decisions
cannot supply positive recommendations. Self-references and graph cycles are
visited once; a cycle is not itself proof of support or unavailability.
For free-text feedback `result`, explicit case-insensitive markers
`withdrawn`, `retracted`, `superseded`, and `stale` are unavailable. Arbitrary
prose is not interpreted as a withdrawal: update the Case status or use an
explicit marker when retracting feedback. The text alone is never authorization.

`decide` exposes the complete `result` (including result evidence IDs and
version-bound owner feedback references), `unavailable_reasons`, and
`recommendation_type`: `counterevidence`, `supported-in-recorded-scope`, or
`proposed-experiment-not-validated`. Inconclusive and unexecuted cases may suggest
a next experiment but are not validated support. Even supported-in-recorded-scope
is a statement about recorded declarations, not independent validation of truth.

For Technique promotion (`tested-in-scope` or `reusable-in-scope`), a supports
result referencing a Case must agree with that Case and its recorded decision:
active lifecycle, supports outcome, valid control, and available evidence/feedback
dependencies. Contradictory declarations fail validation rather than allowing a
promotion based only on support counts. A not-recorded decision state cannot
support production promotion; controls are never inferred or certified. Candidate hypotheses may retain contradictory
trials for analysis but cannot use those trials for promotion.
