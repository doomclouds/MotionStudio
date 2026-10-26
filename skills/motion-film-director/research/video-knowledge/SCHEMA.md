# 卡片契约 v1

以 `scripts/video_knowledge.py` 的验证规则与 `templates/*.json` 为最小结构契约。索引路径相对本目录；card ID 全库唯一，文件 ID 与索引一致，tags 与索引一致。允许新增字段，保留未知字段，不能在验证器未支持时宣称新字段被校验。

## Case

`schema_version, kind, id, revision, title, status, tags, source, inspection, observations, interpretations, technique_ids, feedback, revision_note, supersedes`。

- source：作者、名称、公开 URL、媒体 URL、实际媒体 sha256、duration_seconds、rights、access。外部参考 origin=external-reference，URL 使用公开 HTTPS；自制样片 origin=original-production，url/media_url 为 null，以 artifact_filename 与实际 SHA256 定位，不编造公开链接。未取得媒体的新卡使用 `status=unverified`，sha256 可为 null、duration_seconds 可为 null，observations 必须为空；可以保存 `unverified_questions`，不能编造观察。
- inspection：date、methods（sampled-frames / dense-frames / continuous-muted / actual-listening / metadata-probe / source-text）、coverage、not_verified。方法仅记录实际执行。作者声称单列 `author_claims`，不能写进 observed。
- observations：局部唯一 id、range_seconds=[start,end]、claim_type=observed、statement。时间界限内的近似窗口不等于精确切点；在 inspection.time_precision 说明。
- interpretations：id、claim_type=inferred、evidence=[observation ID]、statement、alternative。
- feedback：claim_type=user-feedback、scope、result、statement。保存任务语境与意见，不保存私有聊天定位号。
- related_case_ids（可选）：同任务相关案例的稳定 ID；关联不表示替代或批准继承。
- status：unverified / observed-with-limits / tested-with-limits / superseded / withdrawn。case 的 tested 仍不意味着已全片视听或用户喜欢。

## Technique

`schema_version, kind, id, revision, title, status, tags, claim_type, hypothesis, evidence, applies_when, limits, counterexample, falsification_test, validation, rule_level, revision_note, supersedes`。

- evidence：[{case_id, observation_ids:[局部 ID]}]，可同时包含正反证案例。
- claim_type 固定 inferred；状态 hypothesis / tested-with-limits / superseded / withdrawn。
- validation.state：not-tested-in-transfer / tested-with-limits；results：[{case_id, outcome, methods, scope, unresolved_contradiction}]，outcome=supports / contradicts / inconclusive；结果只填真实已执行测试。
- rule_level：candidate / tested-in-scope / reusable-in-scope。非 candidate 需真实迁移结果和 scope；reusable 至少两个不同案例支持且无未决矛盾。数量只是最低条件，不能自动证明因果。

不使用数值 confidence 冒充测量。来源检查方法、未验项、替代解释与真实测试结果比无依据的 0.95 更重要。
