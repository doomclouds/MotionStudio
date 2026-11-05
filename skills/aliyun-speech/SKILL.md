---
name: aliyun-speech
description: 使用阿里云 Qwen TTS Flash 生成配音与旁白，核台词、音色、语言、费用、私有下载及实际听审；不承诺精确时长、声线克隆或未支持的语速情感参数。
---

# 阿里云配音与旁白

执行 `aliyun_audio_generation.py tts`，调用 `qwen3-tts-flash`，一条合法台词可用于旁白或角色 take；表演指导继续复用声音导演正文。

先读[阿里云媒体调用合同](../../scripts/ALIYUN-MEDIA.md)，它是端点、官方来源、价格/区域、权限、安全配置、完整 live 命令与失败停点的唯一正文。本入口不是自动代理调度，也不默认批准上传、付费或接受协议。

## 定位与执行

从真实仓库根执行以下 dry-run；核 commit、输入目标、已锁定事项与许可。便携安装读[安装和路径](../ALIYUN-SKILLS.md)，命令从相邻 `motion-film-director/` 根执行，将 `scripts/` 换成 `runtime/review-tools/`。单复制本目录不能运行。

```sh
python3 scripts/aliyun_audio_generation.py tts --input-file /authorized/narration.txt --voice Cherry --language Chinese
```

文本1–600字符，置于私有 UTF-8 文件；不把台词/key 放命令行。首批核实音色 Cherry/Serena/Ethan/Chelsie，语言见 --help。普通 flash 只支持本适配器明确发送的 text/voice/language_type，不附加未核的情感、速度、音高、时长或克隆参数。

默认不读私有配置、不联网、不生成假成功回执。确需 live 时严格依共享合同核北京工作空间与模型权限、当天价格、明确传输/费用授权及新私有输出目录。key 仅走既有安全配置，不接收聊天 key；无配置/邀测/预算时报告确切阻断，继续许可内本地准备。

## 判断与交付

live 必须有文本传输许可、当天价格复核与 --max-cost-cny，按报价拒绝超限；不自动拆文本多次调用。结果人工/原生音频模型实际听审人名读法、漏字、停连、情绪、失真，再以 cue/剪辑对齐并复听最终编码。默认音色不是具体真人仿声授权。

视听观察按[现有审核规程](../motion-film-director/references/audiovisual-review-sop.md)，人声/音乐处理按[声音制作工艺](../motion-film-director/references/sound-craft.md)，编辑混音按[Audio Core](../../engine/motion-audio-core/README.md)。不重复建立验收 schema，也不循环委托其他 Skill。

交接保留输入/输出身份、模型与地区、实际调用状态、usage/费用、覆盖/未知、权利范围、问题裁决与复验。模拟/离线测试不能说真实服务可用，模型意见不等于人听过。真实媒体/台词/回执只留授权私有项目；未验听感、同步或用户接受须明确列出。
