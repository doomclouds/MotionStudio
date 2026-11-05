# 阿里云媒体模型：可执行合同

核对日期：2026-11-05。四个任务入口是 `aliyun-video-review`、`aliyun-audio-review`、`aliyun-music`、`aliyun-speech`。它们调用真实阿里云 API 形状，不把本地合成器包装成云模型。当前适配器只支持北京；模型还有其他区域不代表本实现可跨区。本文所有命令中的路径、Workspace ID、hash、当天日期须替换为实际值。

## 已核能力与价格

- **视频/音频审核**：`qwen3.8-omni-flash` 接收视频、音频、图片、文本，输出文本。北京普通输入 ¥0.8/百万 tokens，缓存命中 ¥0.1/百万，文本输出 ¥2.7/百万；预留不用缓存折扣或免费额度。音频 7 tokens/秒，不足 1 秒按 1 秒。它不是音乐/TTS 生成模型。
- **配乐**：`fun-music-v1`，北京邀测，纯器乐 `is_instrumental=true`，输入免费、输出 ¥0.002/秒、180 RPM。已核 `fun-music-preview` 价格 ¥0.005/秒，但未实现其路由。标准同步 API 返回 WAV URL，不是任务轮询。无已核可设置的时长/总时长上限，不能给出调用前总价上限。
- **配音/旁白**：选择仍受支持且协议明确的 `qwen3-tts-flash`，不是宣称它是最新或最强型号。北京 ¥0.8/万字符、180 RPM，文本 1–600 字符；本实现只开放 Cherry/Serena/Ethan/Chelsie 四个核实音色与 CLI 列出的语言。普通 flash 请求只发 text/voice/language_type，不编造 instructions、音高、语速、情感、采样率或精确时长参数。新一代 qwen-audio-3.1-tts 等模型不自动替换。

单价与配额会变；各 live 入口要求当天复核价格，快照超过 7 天拒绝执行。更新常量前必须重查官方源，不能只改日期绕门。速率数字是官方模型额度信息，不是当前账户已获额度或并发许可。

## 端点、开通与凭据

推荐显式 `--workspace-id WORKSPACE_ID`。北京工作空间固定 HTTPS 域名为 `{WorkspaceId}.cn-beijing.maas.aliyuncs.com`：
- 审核：`/compatible-mode/v1/chat/completions`。
- TTS：`/api/v1/services/aigc/multimodal-generation/generation`。
- FunMusic：`/api/v1/services/audio/music/generation`。

音乐必须显式 Workspace ID；TTS 可省略而用已核 `dashscope.aliyuncs.com` 兼容域名；原音频/稀疏 AV 审核保留旧北京兼容默认域名，新原生视频入口要求 Workspace ID。无任意 URL/模型覆写，无跨区回退、重定向或自动重试。账户需开通相应百炼服务、北京工作空间/模型权限及可用额度；FunMusic 另需邀测开通。API key 存在不证明这些权限已获，也不是控制台 AccessKey ID/Secret 的替代用法。

唯一私有配置沿 `AUDIO-REVIEW.md`：源码仓库根 `.env`，便携包 `motion-film-director/.env`，只读取其中 `DASHSCOPE_API_KEY`。不搜索 home/cwd、不从聊天读取、不接收 key 参数、不打印或复制凭据，不自动保存到其他位置。安全配置由用户另行完成，旧泄露 key 应撤销。只分发空 `.env.example`；测试/打包不读取真实配置。禁止用有权限的测试当配置检查，dry-run 不读 `.env`。

## 视频审核：真实 MP4 输入

```sh
python3 scripts/aliyun_video_review.py /authorized/clip.mp4 --expected-sha256 ACTUAL_SHA256
```

默认冻结/完整解码本地字节并输出 dry-run；无网络、配置读取或输出目录。当前本地边界：单 MP4 ≤7 MB、≤20 秒、≤655360 画面像素、1 视频流与至多 1 音轨，流起点必须为零。可加 `--brief-file /authorized/brief.txt`，≤4000 UTF-8 bytes。长片须由操作者明确选段并记录原片映射，不能把窗口审核当全片已看。

live 在上述命令追加：

```sh
--live --workspace-id WORKSPACE_ID --consent-upload --pricing-confirmed-on YYYY-MM-DD --budget-cny 0.10 --output /authorized/video-review-new
```

只在用户已批准具体 MP4/brief 向阿里云北京传输、用途及费用时执行。请求使用 `video_url` 的 Base64 MP4，包含真实内嵌音轨；不是抽帧冒称视频。但服务内部仍会采样（官方默认 2 fps、最多 2048 帧等边界），不能证明每帧看过、常速连续观看或帧级声画同步。实现采用 40,000 输入+4,096 输出 token 的 ¥0.0430592 保守预留，预算≤¥0.10；这不是服务端硬性账单上限，费用按 usage 核对，超预留即停。

原 `audiovisual_review.py prepare/call` 仍用于可追溯音轨+稀疏帧路线，明确其非原生视频/非连续视觉范围；不删除已验证合同，也不默认做两次付费调用。

## 音频审核：实际声音输入

```sh
python3 scripts/audio_review.py --audio /authorized/selected.wav
```

PCM16 WAV，每段≤20秒、最多3个显式片段，默认 dry-run；不是转写或波形评价。原生声音请求由已存在并回归验证的 `audio_review.py` 发起。live 追加 `--live --workspace-id WORKSPACE_ID --consent-upload --pricing-confirmed-on YYYY-MM-DD --budget-cny 0.10 --output /authorized/output/audio-review-new`。原音频工具保留路径必须含 `output` 目录段的限制；主动选择仓库外私有目录并先核目录/文件权限，不把旧工具默认输出留在源码内。源自成片时保留实际解码、流选择、hash 与原片时间映射，切段不自动证明全片连续性。模型可评人声、音乐、环境、音效，但本适配器没有开启 `use_multichannel` 空间音频能力，不把立体声定位当已验。

## 配音与旁白：可运行 TTS

台词放在用户授权的私有 UTF-8 文件，不作为 shell 参数；同一接口用于旁白、角色配音和试听 take，不自动模仿具体真人。

```sh
python3 scripts/aliyun_audio_generation.py tts --input-file /authorized/narration.txt --voice Cherry --language Chinese
```

live 追加 `--live --workspace-id WORKSPACE_ID --consent-transmit --pricing-confirmed-on YYYY-MM-DD --max-cost-cny 0.10 --output /authorized/tts-new`，只在用户批准该文本、接收方和费用后。单次文本不超过600字符，不自动分段多次计费。按 UTF-8 字节数×单价做偏保守本地报价，返回 usage.characters 核实际费用；本地预算不是服务端硬上限。台词、人名读法、停连、口气和表演仍需实际听审；精确对齐通过后续 cue/剪辑与复听，不声称 API 能指定时长/同步口型。

## 配乐：可运行但不能预先封顶的 FunMusic

```sh
python3 scripts/aliyun_audio_generation.py music --workspace-id WORKSPACE_ID --input-file /authorized/music-brief.txt
```

输入 1–2000 字符，写原创器乐的叙事意图、发展、乐器/密度和留白；不暗示能精确指定输出秒数、BPM、seed、stems 或参考音频。只实现同步纯器乐 WAV，不支持歌词歌曲、流式或异步任务。

**有用户硬预算时，停止在 dry-run，不能擅自提交**。任何音乐 `--max-cost-cny` 都在 POST 前拒绝。服务未给时长上限，输出后停止/裁剪不能撤销已发生费用。若用户明确允许未知总价且无硬预算，手动操作者可在核邀测与条款后追加 `--live --consent-transmit --pricing-confirmed-on YYYY-MM-DD --operator-accept-unbounded-cost --output /authorized/music-new`。这不是默认自动助手可自行勾选的授权；需要明确说明 ¥0.002/秒、总价调用前未知及接收方。预算未解时继续本地 brief/cue 工作，不改服务绕开。

## 下载、重试与输出

生成响应 audio.url 有效期通常24小时。只接受官方示例精确主机 `dashscope-result-bj.oss-cn-beijing.aliyuncs.com`，HTTP 仅升级 HTTPS，不回退，不跟重定向，下载不带 API Authorization；其他合法主机若未来出现也先拒绝再复核。最多50MiB，核 WAV 容器/PCM/长度及音乐元数据，FFmpeg 可用时全解码。相应只读 usage、request_id、hash 与技术元数据，不落盘 prompt、key、签名 URL 或远端错误正文。

新原生视频/生成适配器的 live 强制使用仓库/安装目录外全新私有会话目录，预请求 reservation 与不可复用目录阻止同会话重试。原生视频的 `reservation.json`/`report.json` 与生成的 `reservation.json`、`output.wav`、`receipt.json`/`failure.json` 仅私有保存，目录700/文件600。超时、失败、取消、响应无效后可能已计费；保留不确定状态，不能换目录重试来绕过。查账户账单并取得新的明确许可后才能决定后续动作。无 key 是 SKIPPED，不是成功。

原音频与稀疏 AV 审核客户端的输出/ledger、权限行为与 schema 保持既有合同，不享有上述新适配器的全部自动路径/权限保证；使用者须主动选仓库外私有位置。原生视频和生成回执是工具执行证据，不是新增作品验收 schema。模型审查完成、生成成功、完整解码、实际听过、声音好听、画面连贯、同步、权利和用户接受分别报告。没有真实服务调用就写“离线/模拟已验，真实服务未验”。

## 权利与闭环

确认服务协议与素材/台词的传输、生成、使用范围；新接受协议前向用户披露。阿里云服务条款不保证输出独占或无侵权，不能仅凭生成成功承诺商用安全。参考的词曲、录音、真人声音与克隆分别有权利边界。本实现不做声音复刻、持久音色注册或受限内容绕过。模型体验页面的商业/分享限制不能未经核实外推为所有付费 API 的统一许可。

生成声源保持原始 hash/回执，在现有 Audio Core 时间线安排 trim/gain/fade/cue、必要混音/封装；不伪造 stems。用真实声音模型/真人听审最终编码，再进行声画合看与修订。参考价值、技术结果、模型意见和用户艺术接受分开。所有私有台词、媒体、参考、回执留用户项目，不随 Skill 发布。

## 官方来源（上述快照核对，不是永久保证）

- Qwen3.8 Omni： https://help.aliyun.com/zh/model-studio/qwen3-8-omni-flash
- Omni API/原生视频与音频： https://help.aliyun.com/zh/model-studio/qwen-omni
- Chat Completions： https://help.aliyun.com/zh/model-studio/qwen-api-via-openai-chat-completions
- FunMusic API： https://help.aliyun.com/zh/model-studio/fun-music-api
- FunMusic 能力/邀测： https://help.aliyun.com/zh/model-studio/fun-music
- FunMusic v1： https://help.aliyun.com/zh/model-studio/fun-music-v1
- TTS API： https://help.aliyun.com/zh/model-studio/qwen-tts-api
- TTS Flash： https://help.aliyun.com/zh/model-studio/qwen3-tts-flash
- 音色： https://help.aliyun.com/zh/model-studio/qwen-tts-voice-list
- 区域与权限： https://help.aliyun.com/zh/model-studio/regions/
- 模型价格： https://help.aliyun.com/zh/model-studio/model-pricing
- 限流： https://help.aliyun.com/zh/model-studio/rate-limit
- 服务协议： https://terms.alicdn.com/legal-agreement/terms/common_platform_service/20230728213935489/20230728213935489.html
- 服务须知： https://help.aliyun.com/zh/model-studio/bailian-service-notes
