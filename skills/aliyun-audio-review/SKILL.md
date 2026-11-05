---
name: aliyun-audio-review
description: 使用阿里云 Qwen3.8 Omni 实际音频输入审核人声、配乐、环境声和音效，保留声音观察、计费和覆盖证据；用于阿里云音频审核，不把转写或波形当听审。
---

# 阿里云音频审核

复用已经实现的 `audio_review.py` 与 `qwen3.8-omni-flash` 原生音频输入，不新建第二个审核客户端。

先读[阿里云媒体调用合同](../../scripts/ALIYUN-MEDIA.md)，它是端点、官方来源、价格/区域、权限、安全配置、完整 live 命令与失败停点的唯一正文。本入口不是自动代理调度，也不默认批准上传、付费或接受协议。

## 定位与执行

从真实仓库根执行以下 dry-run；核 commit、输入目标、已锁定事项与许可。便携安装读[安装和路径](../ALIYUN-SKILLS.md)，命令从相邻 `motion-film-director/` 根执行，将 `scripts/` 换成 `runtime/review-tools/`。单复制本目录不能运行。

```sh
python3 scripts/audio_review.py --audio /authorized/selected.wav
```

本地 PCM16 WAV，每段≤20秒、最多3段。绑定源 hash、声道、范围与原片时间映射；最终影片要从最终编码提取，不能只审混音前母带。

默认不读私有配置、不联网、不生成假成功回执。确需 live 时严格依共享合同核北京工作空间与模型权限、当天价格、明确传输/费用授权及新私有输出目录。key 仅走既有安全配置，不接收聊天 key；无配置/邀测/预算时报告确切阻断，继续许可内本地准备。

## 判断与交付

模型听觉观察与 LUFS/峰值/解码指标分列；本实现未启用空间多声道能力，立体声定位不能当已验。留不确定性、掩蔽/失真/可懂度证据和修订，不能仅凭模型意见签署交付。

视听观察按[现有审核规程](../motion-film-director/references/audiovisual-review-sop.md)，人声/音乐处理按[声音制作工艺](../motion-film-director/references/sound-craft.md)，编辑混音按[Audio Core](../../engine/motion-audio-core/README.md)。不重复建立验收 schema，也不循环委托其他 Skill。

交接保留输入/输出身份、模型与地区、实际调用状态、usage/费用、覆盖/未知、权利范围、问题裁决与复验。模拟/离线测试不能说真实服务可用，模型意见不等于人听过。真实媒体/台词/回执只留授权私有项目；未验听感、同步或用户接受须明确列出。
