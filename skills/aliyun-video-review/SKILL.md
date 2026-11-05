---
name: aliyun-video-review
description: 使用阿里云 Qwen3.8 Omni 实际视频输入审核画面及内嵌声音，绑定 MP4 与时间范围、记录模型意见和未验项；用于阿里云视频审核，不以抽帧或指标冒充连续视听。
---

# 阿里云视频审核

原生视频适配器 `aliyun_video_review.py` 将真实 MP4（含内嵌音轨）发送给 `qwen3.8-omni-flash`。它与本地诊断、原音轨+稀疏帧路线分开。

先读[阿里云媒体调用合同](../../scripts/ALIYUN-MEDIA.md)，它是端点、官方来源、价格/区域、权限、安全配置、完整 live 命令与失败停点的唯一正文。本入口不是自动代理调度，也不默认批准上传、付费或接受协议。

## 定位与执行

从真实仓库根执行以下 dry-run；核 commit、输入目标、已锁定事项与许可。便携安装读[安装和路径](../ALIYUN-SKILLS.md)，命令从相邻 `motion-film-director/` 根执行，将 `scripts/` 换成 `runtime/review-tools/`。单复制本目录不能运行。

```sh
python3 scripts/aliyun_video_review.py /authorized/clip.mp4 --expected-sha256 ACTUAL_SHA256
```

≤20秒、≤7MB、≤655360像素、零起点，1视频流与至多1音轨。先绑定实际成片 hash 与授权范围；brief-file 会一并传输。长片选段记录原片映射，未覆盖保持未审。

默认不读私有配置、不联网、不生成假成功回执。确需 live 时严格依共享合同核北京工作空间与模型权限、当天价格、明确传输/费用授权及新私有输出目录。key 仅走既有安全配置，不接收聊天 key；无配置/邀测/预算时报告确切阻断，继续许可内本地准备。

## 判断与交付

服务会内部采样，模型不是逐帧审阅者；输出只表示模型接收了视频并提出意见，不自动通过连续视觉、实际听审、声画同步或用户接受。按所引规程裁决每条意见，修改后复验最终编码。

视听观察按[现有审核规程](../motion-film-director/references/audiovisual-review-sop.md)，人声/音乐处理按[声音制作工艺](../motion-film-director/references/sound-craft.md)，编辑混音按[Audio Core](../../engine/motion-audio-core/README.md)。不重复建立验收 schema，也不循环委托其他 Skill。

交接保留输入/输出身份、模型与地区、实际调用状态、usage/费用、覆盖/未知、权利范围、问题裁决与复验。模拟/离线测试不能说真实服务可用，模型意见不等于人听过。真实媒体/台词/回执只留授权私有项目；未验听感、同步或用户接受须明确列出。
