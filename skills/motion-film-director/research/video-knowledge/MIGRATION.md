# 显式一次性迁移：旧知识库到 schema 3

运行入口 `scripts/video_knowledge.py` 只接受当前 schema 3，不做旧版本识别后的运行时回退，也不跟随旧 `legacy` 路径槽。视频与静态探针是两种独立证据类型，不是新旧能力替代。当前公开空库、模板与合成计划示例直接使用新合同；**没有读取、转换或证明任何旧私有库已完成迁移**。

## 旧 → 新映射

| 一次性转换输入 | 新合同 |
|---|---|
| index v1 的视频 Case/Technique | index/card schema 3；`evidence_type: video` |
| index v2 + `synthetic-static-probe-v1` 的静态 Case/候选 Technique | 同一 index/card schema 3；`evidence_type: static-probe` |
| 已存在且可完整表达的 video decision v1 / static decision v2 | 对应类型的 `decision.schema_version: 3` 与 `record_state: recorded`，保留记录内容 |
| 缺少 decision 的旧Case | 机械标记为 `schema_version: 3, record_state: not-recorded, reason: ...`；不生成方案、实验或结果 |
| 空 `legacy` / 已确认的旧 capabilities 字段 | 移除旧索引字段；原始字节保留在历史快照 |
| 非空 `legacy`、未知字段/版本/能力 | **停止，不自动补写、不丢弃、不隐式降格** |

旧 video source 未声明 origin 时，转换工具显式补为旧合同的 external-reference 类型，并由新合同验证 HTTPS 来源等条件；不会编造来源、hash、观察或执行结果。类型转换不授予许可，旧记录声称的执行/听审仍只是声明。

## 维护者操作

先得到旧库的明确读取授权与精确路径。只对获准的旧库运行下列命令；不要寻找未知私有库，不用公开默认库为空推定真实库为空。

从 Skill 根运行（仓库根请在脚本前加 `skills/motion-film-director/`）：

```sh
# 默认 dry-run；不写 NEW 或其历史目录，只在临时目录核对新合同。
python3 scripts/migrate_video_knowledge.py \
  --source /authorized/old-library --destination /authorized/new-library

# 审阅 dry-run 后显式应用；目标与同名历史目录均须不存在。
python3 scripts/migrate_video_knowledge.py \
  --source /authorized/old-library --destination /authorized/new-library --apply

python3 scripts/video_knowledge.py --root /authorized/new-library validate
```

NEW 的父目录必须已存在；源、目标和历史目录不能相同或互相嵌套。工具离线运行，不执行卡片内容、探针或来源链接，也不读取 legacy 外部目标或 artifact 文件。只有独立明确的 `verify-artifacts --artifact-root` 操作读取获准的静态素材根。

- `NEW/` 仅保存新索引和现役卡片。
- `NEW.migration-history/original/` 保留源库原始文件字节。
- `NEW.migration-history/migration.json` 记录旧/新路径及 hash，并明确列出仅保留历史的 Markdown；历史不是自动发布或复用许可。
- 源始终不变。目标已存在、symlink、逃逸路径、源在迁移中改变或新合同不通过均停止。应用失败会清理未完成目标，历史保留 incomplete 状态；不得把中断记录当作完成，重试前由维护者核查，不覆盖或删除原历史。

未知字段必须由维护者逐项确认其语义与无损去向；需要扩展合同时先实施明确字段与测试，再迁移。禁止简单删除未知字段来使转换通过。非空 legacy 条目须先逐项盘点来源、权利、用途及新结构归属；工具不会访问其目标或决定删除。缺少 decision 的既有观察仍保留并可query；转换器仅加准确的not-recorded原因，不编造决策。只有维护者确实掌握真实问题、选择、限制和证据时，才可另行记录完整decision；不能用空模板补成已执行决策。

转换器拒绝未索引 JSON，包括旧模板等非现役文件。维护者可在获准的**新位置**准备仅含现役库的输入快照并明确记录每个排除文件的历史去向；原库及其模板必须保留，不能原地删文件以绕过检查。未确认映射的条目应阻断迁移，而非被排除后假称整库完成。

## 切换与回滚

核对迁移清单、原始与目标 hash、稳定 ID、关联、未知字段处置及新合同验证后，才把指定消费者的 `--root` 切到新库。结构核对不能代替真实感知、来源、权利或用户接受。静态 hash 检查只证明字节身份，不证明运行过脚本。

旧源和历史快照保持原样；删除/公开/归档源需独立授权。“不保兼容”只指现役运行入口，不授权清理历史。需回滚时显式选择原工具版本和保留的旧源，不向当前运行入口加入兼容层，也不逆向覆盖已产生的新记录。
