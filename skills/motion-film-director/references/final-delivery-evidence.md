# 完整交付证据合同（schema 1）

先按[视听审查操作规程](audiovisual-review-sop.md)完成实际观察、核证与问题裁决，再填本合同。此合同只整理真实发生的审查。下列模板刻意保留占位符和`NOT_LISTENED`，不能直接获得通过；不得为了填齐字段编造观察。媒体、原生帧、真实评审记录、模型输入/输出和签名保存在用户私有项目，不提交本源码仓库。

## packet.json：冻结本次完整候选

路径相对packet所在目录组织；不得使用绝对路径、`..`或逃出该目录的符号链接。不使用远程URL或可执行内容作为证据。

```json
{
  "schema": 1,
  "movie_sha256": "REPLACE_WITH_ACTUAL_MOVIE_SHA256",
  "target_duration_seconds": "REPLACE_WITH_AGREED_EXACT_DURATION",
  "reviews": {
    "visual": {
      "path": "visual.json",
      "sha256": "REPLACE_WITH_VISUAL_RECORD_SHA256"
    },
    "audio": {
      "path": "audio.json",
      "sha256": "REPLACE_WITH_AUDIO_RECORD_SHA256"
    },
    "av_sync": {
      "path": "av-sync.json",
      "sha256": "REPLACE_WITH_AV_RECORD_SHA256"
    }
  },
  "visual_artifacts": [
    {"path": "contact-sheet.png", "sha256": "REPLACE_WITH_IMAGE_SHA256"}
  ]
}
```

完整时长由当前委托确定，使用精确秒数字符串（可用有理数）；编码时长与该值相差超过50ms时保留阻断。不能先探测样片时长，再把该值假装成用户约定完整时长。至少一份PNG/JPEG画面证据必须同时列入视觉审查记录的`evidence`以绑定来源，且应包含原生时间/帧位置，用来定位真实观看结论；接触表本身不证明常速观看或运动通过。

## 三类记录分开，不借门通过

以尚未听审的音频记录为例：

```json
{
  "schema": 1,
  "kind": "audio",
  "movie_sha256": "REPLACE_WITH_ACTUAL_MOVIE_SHA256",
  "status": "NOT_LISTENED",
  "method": "perceptual_audio_human",
  "reviewer": "REPLACE_WITH_ACTUAL_REVIEWER",
  "reviewed_at": "REPLACE_AFTER_ACTUAL_REVIEW",
  "coverage": [],
  "observations": [],
  "issues": [],
  "limitations": ["尚未实际听审；不得作为批准最终版"],
  "evidence": []
}
```

完成真实审查后才记录观察、覆盖区间、时间和适用结论。欲满足通过门，记录必须为`passed`，有覆盖整片的区间、带时间的具体观察及可追溯证据，认证状态如实记录：未签名为`declared_not_authenticated`，不妨碍完整声明式审查满足流程门；若选择提供签名，则必须验证成功。不能将`NOT_LISTENED`改名`passed`作为工作步骤。

| kind | 允许的感知方法 | 应观察与保存的内容 |
|---|---|---|
| `visual` | `normal_speed_visual` | 全长常速画面、信息读时、动作因果、转场、结尾；观看会话或评审原文，配对应原生帧 |
| `audio` | `perceptual_audio_human`或`perceptual_audio_model` | 真正听到的声音、BGM/SFX分离、掩蔽、失真、疲劳、音乐结构与收尾；真人记录或真实音频模型请求/响应来源 |
| `av_sync` | `normal_speed_av` | 同版声画合看、关键声音对应视觉事件、提前/滞后和有意静默；具体时间窗与不确定性 |

`coverage`是`[[起点秒, 终点秒], ...]`；分段听审必须覆盖最终编码整片，不把单个短clip扩大成全长听审。`observations`每项为`{"start_s": 0, "end_s": 1, "finding": "实际观察，不是目标或计划"}`；`evidence`每项为`{"path": "真实证据文件", "sha256": "实际文件SHA-256"}`。若模型听的是抽取音频，保留从最终编码到音频的提取方法、hash和时间映射；不得拿混音前的WAV代表最终AAC。观察中的音效缺失、歧义、反例与限制均须保留。

每份记录还必须提供`issues`数组（真实无问题时可为空），不能只把未关闭缺陷藏进`limitations`。每项结构为`{"finding": "具体问题", "disposition": "pending", "rationale": "尚未修复或接受的原因"}`。`pending`等未关闭状态阻断ready；通过门只接受`resolved`或`accepted`，且须有非空`rationale`说明修复及复验证据，或谁在什么范围内接受了何种取舍。`accepted`不能由agent擅自覆盖用户否决，也不能用于豁免缺失的真实听审或完整声画审查。`limitations`记录方法能力与适用范围，`issues`记录本片具体缺陷及其处理；两者不可混淆。

音频模型必须真正接收并处理音频，文本/转写模型意见不能归入`perceptual_audio_model`。模型听审不等于真人听审；稀疏模型视频抽帧AV也不能替代完整常速声画观看，只有这类证据时仍是待审候选。仅有音频输入不证明声画同步、立体声体验或用户喜好。外部模型仍需单独授权上传和预算；本门不会自动调用。无可用听审能力时诚实保留受阻状态，继续交付待审报告，不伪造完成。

## 可选签名与信任：来源认证不是听审前置条件

首先完成真实审查，保存实际会话/原始评审证据。未签名的真人记录并不自动是假记录；完整实质证据可满足声明式审查门，但认证状态必须保留`declared_not_authenticated`，不能用手填布尔值冒称已认证听审。无需为完成影片建立PKI。

如需要额外来源认证，可在packet的对应review项加`"signature": "audio.sig"`，再通过`--trusted-review-key`独立提供可信公钥。此时签名无效或未匹配可信公钥会阻断，而不是降级忽略。审查者完成实际工作、核对原始证据和最终媒体hash后，在其自身受控环境对**原始JSON字节**作分离签名。例如使用已有Ed25519私钥：

```sh
openssl pkeyutl -sign -rawin -inkey /secure/reviewer-private.pem \
  -in audio.json -out audio.sig
```

只向交付门提供经独立渠道确认的公钥；支持多位审查者时重复`--trusted-review-key`。私钥不应进入packet、报告、媒体目录或源码；工具不创建私钥、不代签、不从packet自选信任根。更改JSON空格也改变其字节，须重新签名并更新packet hash。

**签名只证明记录由配置的可信密钥签署且未被改动，不证明该人/模型实际听过，也不证明文字为真。** 审查者身份与公钥的映射、原始会话/模型日志真实性，以及具体观察能否由声音支持，必须独立核对。不能让生产agent为自己临时造钥、签一份`listened: true`再宣称有独立听审。手工布尔值或自称`authenticated`没有认证效力；即使签名有效，虚构记录仍违反此合同。

## HTML报告与交付清单

报告至少表达：

1. 当前完整候选SHA-256、约定片长和实际片长；
2. 技术检查与视觉/听觉/同步三门各自状态、方法与未验原因；
3. 当前画面证据、时间窗观察、限制与具体修复点；
4. 原始记录与证据hash、声明式/签名式来源状态及认证边界；
5. 明确的`review_candidate`或`ready_for_owner_review`，不预填OWNER接受。

stdout结果清单绑定生成HTML的SHA-256；把成片、HTML与清单一起交付。`--report`必须指向新文件，工具拒绝覆盖已有报告或输入；每次复验使用新报告名。报告里的画面不是“报告通过”的替代证据；交付前应打开生成的HTML检查实际可读性、图片呈现与状态是否误导。若成片或证据改变，重跑检查；若报告之后被修改，清单hash失效。没有报错不等于画面/听觉审美成功，`ready_for_owner_review`也不等于OWNER已经接受。
