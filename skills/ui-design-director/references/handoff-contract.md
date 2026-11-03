# DesignHandoff v0.2

模板是项目内部记录，不要求用户逐项填写。`delivery_status=draft` 可以缺少尚未确定的信息；`static_candidate` 表示已有带 hash 的实际静态产物，但不表示通过。没有字段叫“自动验收成功”。

每个对象具有稳定 id、父对象、边界、锚点、层序、可编辑源；命名状态说明哪些内容变了、根据什么事实/示意假设。资产记录来源、授权状态、字体身份、裁切和 hash。数据保持同源，特别是控件数值、图例与图形，未知不得造作真实能力。

`must_keep` 锁定内容/品牌/几何关系而非无限冻结所有像素；`motion_questions` 提供要解释的状态变化及风险，不替 Motion 编排时间线。Motion 消费方填写 `motion_receipt`：采用设计版本、对象映射、偏离、理由、待复验范围；该回执可以尚不存在。

每条当前 evidence 均须提供非空字符串 `scope`（范围），不论结果是否 pass、是否被 gate 引用；空白、对象、数组或缺字段都无效。还须绑定产物 id/hash、观察方法、结果和评审者。模板默认无证据，各门为 `not_assessed`；发布权限为 `not_granted`。静态技术、静态视觉、owner 接受、motion 观看分别记录。修改文字、字体、布局或素材后更新版本/hash，旧证据移入 history_evidence 并对受影响范围标为 stale，保留原版本；gates 只能引用当前 evidence，不可引用历史。

最低使用要求：draft 可交接明确的待解决问题；static_candidate 必须有实际产物标识和 SHA-256，但验证器只检查形状与引用，不查文件真假。任何 pass 都需引用对应 scope、同版 hash 的 pass 证据；owner 接受必须绑定用户反馈，motion 门必须有实际连续视频观察（不拿静帧代替）。权限 granted 必须有明确授权记录。JSON 结构正确不认证上述记录真实性。

未知/失败：依赖缺失、来源未知、无法观看或用户未接受如实保留。UI 导演返回静态候选后停止自己的静态委托，不擅自启动渲染视频、发布、更新注册表或原作品。

条目最小形状（示例仅说明结构，不是已有对象或事实）：

```json
{"id":"knob","parent":null,"bounds":{"x":0,"y":0,"width":100,"height":100},"anchor":{"x":50,"y":50},"z_order":1,"editable_source":"项目内实际代码路径或明确不可编辑说明"}
```

状态条目包含 `id`、`basis: verified|illustrative|unknown`、`description`、`object_ids`；artifact 包含 `id`、`sha256`、`media_type: image|video|document`。Motion 观看门仅可引用声明为 video 的产物，媒体类型仍须执行方实际核对，验证器不嗅探字节。

`static_candidate` 还须包含 primary_message、内容 provenance_note、至少一个对象与命名状态，以及 image 产物的 locator。assets 可为空（纯代码/文字作品没有外部资产），并非必须编造素材记录；外部素材存在时仍须如实登记。locator 仅被检查为非空声明，是否可读及 hash 是否属实须另验。视觉 pass 必须有 actual_image_viewing 且绑定 image；数值检查不替代实看。reviewer 是身份说明字符串，不能用布尔值。发布授权 granted 须提供 `{by, reference, scope}` 字符串记录，仍不认证授权真假。


## 输入支持域与可视边界

当交付可调用组件/配方或数据驱动实现时，声明真正支持的画幅、行数、数值/标签域、状态、必要关系和已验范围；一次固定画幅夹具的行数、槽位、整数或业务状态限制不扩为通用 UI 规则。输入超出布局硬上限时显式拒绝，或转入另行设计且重新验证的布局，不静默丢值、截断数量或缩到不可读来保持通过。

数据合法性与视觉容纳分别验证：合法变体核派生关系；有效边界值实际渲染检查；边界外输入按当前合同处理。字符长度限制不能替代指定字体/字形的像素宽度与实际输出检查。换字体、画幅或缩入视频后重验目标观看尺度；静态间隔不证明常速成片可读。

## 可重建交接

用户要求可编辑源码、接续制作或可迁移交付时，按三导演共用 [可重建交接](../../motion-film-director/references/rebuild-handoff.md) 在项目说明中给出明确根、实际输入、完整命令、校验与例外。现有依赖 locator 或结构校验不保证路径可迁移；交接记录引用该说明，不新增未经校验的 schema 字段冒称支持。

## 实际依赖与身份范围

交付身份应覆盖本次结果实际依赖的 renderer、canonical 数据、校验/派生模型、实际导入的设计模块、字体及运行时，逐项记录可解析来源、版本或 hash、作用和获取条件。新增模块改变验证/派生行为时不能只保留入口源码 hash。可用锁文件或固定源码快照表示传递依赖，不必在正文重复每个文件；明确未锁定部分，不将一次补齐模块身份称为完整依赖审计或跨机器恢复通过。

视觉输出字节未变时，只可复用绑定同字节、同观察范围和任务前提的视觉观察；依赖/恢复证据仍须更新，不因此声称代码环境完全未变或复用全部验收门。v0.2 会检查下列依赖/支持域声明的结构与部分引用，但仍不审计实际依赖闭包、执行覆盖或文件身份。


## 当前机器合同：单一 v0.2

验证器只接受 `schema_version: "0.2"`，不保留 v0.1 校验路径。现行模板已更新；历史记录保留原文，不自动重写、补造来源或提升状态。使用旧记录开展新工作时，逐项核对后另存当前版本，保留原版本关联；仅替换版本号不算迁移完成。此变更不修改媒体、作品锁或历史证据。

空 `assets: []`、`tokens: {}`、`implementation.dependencies: []`、`support_domain: null` 和 `motion_receipt: null` 可以表示尚未记录或没有相关内容；不能据此宣称交接完整、无外部依赖或验证通过。默认模板的各验收门仍未评估。

### 资产、token 与实现声明

|字段|结构要求|不证明什么|
|---|---|---|
|`assets[]`|唯一非空 `id`；`kind` 为 font/image/audio/data/other；非空 `locator`、`source`；`rights` 对象。可选 `sha256`、`font_identity`、`crop`、`object_ids`、`notes`|文件存在、素材身份或实际消费|
|`assets[].rights`|`status` 为 unknown/declared_permission/not_permitted；可选非空 `reference`、`scope`；declared_permission 必须同时有二者|授权真实性或影片发布权限；不改变顶层 publish_permission|
|`assets[].crop`|可选像素坐标 `{x,y,width,height}`，均为有限数，尺寸为正|裁切处于实际图像内或渲染正确|
|`tokens`|以非空 token ID 为 key；值为 `{value, role?, unit?}`，value 为非空字符串、布尔或有限数|颜色/字级可用性与实际实现采用|
|`implementation`|必须有 `family_ids`、`recipe_ids`、`caller_responsibilities`（非空字符串列表，可为空）、`dependencies`（列表）、`support_domain`（对象或 null）|库中登记存在、调用成功或全部依赖已列出|
|`implementation.dependencies[]`|唯一 `id`、`kind`、`locator`；kind 为 renderer/data/model/design-module/font/runtime/other；至少声明 `sha256` 或非空 `version`；可选 acquisition、notes|本机安装、文件读取、依赖恢复或完整传递闭包|
|`implementation.support_domain`|非空 description；tested_scope、untested_scope 为非空字符串列表（列表可为空）|真实运行过这些范围或业务约束正确|

资产/依赖的 sha256 若提供，必须为64位小写十六进制；这里只检查声明格式。`object_ids` 引用本交接对象；implementation 可选的 `asset_ids`、`token_ids`、`object_ids` 也只引用本记录 ID，`notes` 为可选非空字符串。family_ids/recipe_ids 是外部身份声明，不自动查询 catalog。引用列表禁止重复；这里只为新定义的这些子结构拒绝未知字段，不能把未定义的自有字段当成已验证内容。

### Motion 消费回执

`motion_receipt` 必须存在。尚未有消费回执时用 null；有回执时必须提供：

- `design_version`：等于本交接的当前设计版本；`consumer`：非空消费者身份声明，不认证其身份。
- `object_map`：`{object_id, motion_object_id}` 列表。UI object_id 必须已存在，Motion ID 只作非空声明；允许明确的拆分/组合映射，但不允许重复的同一对。
- `adopted_artifacts`：`{artifact_id, sha256}` 列表；引用当前 artifact，并与其声明 hash 相等。它绑定声明，不读实际媒体，也不证明采用或可见。
- `used_asset_ids`、`used_token_ids`：当前记录内的 ID 列表。
- `deviations`：`{scope, reason, object_ids}` 列表；scope/reason 非空，对象引用有效。
- `revalidation_scope`：待复验范围字符串列表；可选 `notes`。这里没有可自动批准的状态字段。

这些列表可为空，含义只是未声明任何项，不表示覆盖所有对象。回执不能为 static_visual、motion_viewing、owner_acceptance 或 publish_permission 代签，也不能替代已有 evidence/hash/版本门。

最小回执形状示例（需替换为当前真实记录，示例不代表已发生采用）：

```json
{
  "design_version": "draft-1",
  "consumer": "声明的 Motion 执行者",
  "object_map": [],
  "adopted_artifacts": [],
  "used_asset_ids": [],
  "used_token_ids": [],
  "deviations": [],
  "revalidation_scope": ["待实际观看、听审及声画复验"]
}
```

验证命令仍为 `python3 skills/ui-design-director/scripts/validate_handoff.py <交接.json>`。它只读所传 JSON，不打开 locator、不安装依赖、不联网、不执行对象代码，也不启动或调度 Motion；结果有效仅代表这个记录符合所检查的结构/引用约束。


### 向空证据模板添加记录

主模板继续保持 `evidence: []`，不为满足字段校验编造观察。追加当前 evidence 时，使用以下形状并替换真实身份/范围；示例仅演示字段，不是已完成观察。自定义 scope 可以描述局部范围；要支持 gate 的 pass，仍须与该 gate 的 scope 精确对应并满足原有方法/hash/版本要求。

```json
{
  "id": "review-pending",
  "artifact_id": "填写本交接已有产物ID",
  "artifact_sha256": "填写该产物当前64位小写SHA256",
  "design_version": "填写当前设计版本",
  "scope": "static_visual",
  "result": "not_assessed",
  "method": "planned_image_review_not_performed",
  "reviewer": "填写拟执行者声明"
}
```
