# MotionStudio 视听交付报告规范 v1

**规范标识：`motionstudio.delivery-report`；版本：`1`。**

**适用范围：完整成片（含待审完整候选），不适用于用户样片。** 样片至少7秒，默认只交付带可听声音的视频，由用户判断方向与感觉；内部技术/画面QA仍据实执行留存，但不默认交付PNG/HTML报告或资源包。样片获准后直接推进约定全长。完整成片则交付固定PNG＋HTML，并附简短经验沉淀总结；不改变下述证据与审查要求。

本规范是可重复使用的报告合同，不是审美评分器。执行[审查操作规程](audiovisual-review-sop.md)后，将真实结果写入同一份JSON，以它生成PNG总览和HTML；不得让机器清单和可视化页面各说一套。完整JSON Schema见[report-schema.json](report-schema.json)。结构有效不证明观看、听审、证据真实或用户批准。

## 固定阅读顺序与必备栏目

1. **结论与版本**：`summary`、状态、报告生成时间、规范版本；成片路径/SHA-256、实际片长、约定片长。第一屏明确“待审候选”或“可交OWNER审阅”，不得写未经确认的“批准最终版”。
2. **技术结果**：实际帧数/全量解码等结果及方法边界。候选可以明确`not_checked`，不得为填表编造数字或通过。
3. **视觉**：真实方法、审查者、覆盖区间、时码发现、原生帧/接触表、缺陷与未验原因。
4. **听觉**：真实感知方法与全长覆盖；真人/模型分开，音频输入身份/映射及原始回执可追溯。指标和“可选模型未配置”不冒充听过。
5. **声画同步**：真实合看与事件对应、时间精度/不确定性；稀疏帧不能写成连续视频观看。
6. **问题清单**：稳定问题ID、类别、时间范围、严重度、发现、处置和依据。先列阻断/待修，再列已解决/被授权接受的取舍。
7. **修复前后对照**：适用时按相同PTS或明确事件映射配对图像，注明前后版本hash和问题ID。不适用必须给理由，不能空白暗示已复验。
8. **限制、证据与交付清单**：能力/范围限制、原始证据路径/hash、声明/可选签名的信任边界、输出PNG/HTML hash。

截图必须带时间、版本和用途，不能单靠排版漂亮冒称已视听审查。HTML应可读、可定位问题；PNG总览应有清晰状态和可辨图例。禁止不解释来源或意义的综合分数。

## 机器字段

保留交付门现有`schema: 1`，新增：

- `report_standard: "motionstudio.delivery-report"`、`report_standard_version: 1`。
- `generated_at`：带时区ISO时间；`summary`：非空、人能读懂的结果摘要。
- `movie`：`path/sha256/duration_seconds_exact`；`target_duration_seconds`为精确秒字符串，可使用有理数。
- `packet_sha256`：实际输入/证据清单的hash。手工报告也要先冻结输入清单，不拿任意占位符冒充真实hash。
- `technical`、`reviews.visual/audio/av_sync`：候选保留真实原始状态。每个review至少有`status/blockers`，有记录时保存`record`及原始记录hash/认证状态。
- `visual_artifacts`：图像`path/sha256`列表；`trust_boundary`明确声明不等于认证。
- `issues`、`known_limits`、`before_after`：见下文。
- `report`：实际生成报告的`path/sha256`；可在额外字段列PNG总览输出，但主报告hash不能缺失。

review记录沿用[证据合同](final-delivery-evidence.md)：方法、reviewer、时间、覆盖、时码观察、证据及限制。`declared_not_authenticated`是诚实的未认证声明，不是假记录标签；有效签名也不证明真的听见。JSON可附加明确扩展字段，但不得更改已有字段含义。

### 状态定义

| 状态 | 含义 |
|---|---|
| `review_candidate` | 可交付明确标注的待审材料；`blockers`必须非空。技术/视觉/听觉/AV可以如实保留未验、失败、受阻或旧版记录，不能通过结构校验洗绿。 |
| `ready_for_owner_review` | 当前证据流程门具备：技术实际通过、三类审查通过且覆盖完整、无未关闭问题、所需对照完整。仍不是艺术批准或OWNER接受。 |
| `owner_approval: not_checked` | 本报告不代替用户对该版本的真实接受；用户反馈另记。 |

`NOT_LISTENED/NOT_RUN/BLOCKED/not_reviewed/SKIPPED_NOT_CONFIGURED`是原始阶段状态，不能直接改成passed。可选模型跳过本身不阻断真人路径，但不能补齐未做的实际审查。工具执行错误属于错误结果，不伪装成格式完整的评审报告。

### 问题ID、时间与严重度

每项为：

```json
{
  "id": "AUDIO-001",
  "kind": "audio",
  "scope": "window",
  "start_s": 3,
  "end_s": 4,
  "severity": "major",
  "finding": "这里填实际发现，示例不代表本片存在问题",
  "disposition": "pending",
  "rationale": "这里填真实处置依据或尚未完成的原因"
}
```

`kind`为visual/audio/av_sync/technical；ID在同一报告中唯一，跨修订应保持同一问题的ID，不能靠换号掩盖复发。新版本的问题仍绑定其报告中的movie hash。

- `scope=window`必须有合法起止时间；`whole_film`的两个时间值为null；历史记录缺时间只能写`unspecified`和null，并在known_limits明确缺口，不能擅自扩大成整片。
- severity：`blocker`阻断目标/必需审查；`major`明确影响可读/听感/因果；`minor`局部改进；`info`提示；缺原始等级为`unclassified`，不能捏造严重度。
- disposition：`pending/resolved/accepted`。ready不能有pending；resolved和accepted仍须非空rationale，引用复验证据或实际接受者/范围；不允许自行接受用户已否决的事项。
- `known_limits`记录方法与范围局限；不能代替issues中的具体未修问题。

### 前后对照

`before_after`含`status/reason/pairs`。status为`not_applicable/included/pending`。included必须有配对；not_applicable无配对且有真实理由；pending不能进ready。未要求对照可明确“不曾要求对照，不代表没有发生修订”。修复任务不得这样绕过必需复验。

每对包含`issue_id`、`before/after`图像path/hash、`before_movie_sha256/after_movie_sha256`以及`start_s/end_s`。after必须属于当前影片；对照时间映射与提取精度另附说明。引用的issue ID必须存在。只提供旧截图或不同时刻的“更好看”图片不构成对照证据。

## 校验、写入与失效

```sh
python3 skills/motion-film-director/scripts/validate_delivery_report.py /local/report.json
```

便携包去掉`skills/motion-film-director/`前缀。校验器使用标准库，不联网、不安装依赖；CLI退出0=结构/内部一致性合规，1=不合规，2=输入错误。它核字段、版本、hash格式、时间覆盖、状态一致性、问题ID和对照版本绑定；**不会读取媒体证明感知，也不会认证声明内容**。可用通用Draft 2020-12 JSON Schema工具补做结构验证；本地校验器另有跨字段语义检查，不能省略。

生成器内部可用`validate_report(data, finalized=False)`验证尚未写出的核心报告，此时仅允许省略report产物字段；交付JSON必须用默认finalized=True。先冻结输入并记录hash，生成到同目录临时文件，完成校验后原子发布为新文件，拒绝覆盖旧版/输入；写入失败或检测到输入变化不得留下ready外观的文件。PNG/HTML生成完计算实际hash，再写交付清单，避免自引用hash。

修改成片使旧审查绑定失效；修改报告使清单hash失效。保留真实原始记录和修订关联，重新核受影响范围及完整门；旧结果可以作为历史证据，但不能当成当前通过。报告样式更新不能偷偷改变结论或删去负面观察。

## 参考任务适用性补充：已有完整比较不可遗失

新参考类报告必须声明`reference_based: true`，并提供`comparison_diagnostics`；旧v1非参考记录兼容，不据缺少标志推断“已比较”。制作者必须按当前任务真实声明适用性。`benchmark`与`motion_check`各含：

- `status`：`COLLECTED_NOT_APPROVED / NOT_RUN / BLOCKED`；非空`reason`，即使成功也说明复用/运行范围。
- `candidate_sha256`，benchmark另有`reference_sha256`；旧版本导出不得绑定当前成片。
- `artifacts`：`{role,path,sha256}`数组。benchmark采集成功必须含`full_comparison_html`和`full_comparison_overview`；motion-check成功含`motion_heatmap/spatial_change_map/motion_report`。
- `panels`：benchmark成功必须保留`stereo_waveforms/log_mel/visual_timeline/visual_metrics/block_matching`；motion-check成功保留`rgb_difference_heatmap/spatial_mean_change/contact_sheet`。
- `method_limits`：非空限制列表，明确块匹配≠dense optical flow、RGB差分≠光流、波形/谱图≠听审。未知未跑不能标成功。

校验器对声明为参考类的报告检查两条旧管线的状态、媒体绑定与必备面板/产物；缺诊断只能保持候选。交付门读取并核对所附实际产物hash，不自动重新计算、不联网、不安装依赖。完整benchmark的路径/依赖与便携可用边界见SOP G节。

### 固定格式与路径（覆盖旧PDF交付建议）

用户报告只交付项目根`output/review/overview.png`与`output/review/report.html`，影片MP4另交。不提供PDF、内部JSON或源码/完整资源ZIP，除非用户明确要求。内部JSON仍用于规范校验和证据追踪，不是第三份用户报告。

`check_final_delivery.py VIDEO --packet PACKET --project-root PROJECT`默认写这两个固定文件：overview复用已有benchmark PNG，非参考任务可复用已有PNG画面总览；不生成新的诊断计算。原有`--report`仅保留显式旧调用兼容，不作为新的用户交付约定。已有文件拒绝覆盖；需要复验时先按项目流程保留历史版本，不删除旧报告掩盖变化。
