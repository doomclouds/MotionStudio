---
name: aliyun-music
description: 使用阿里云 FunMusic v1 生成纯器乐配乐，核北京邀测、提示词、输出下载、价格与来源权利，并接入 MotionStudio 混音和审核；不把本地脉冲底床当云作曲。
---

# 阿里云配乐生成

执行 `aliyun_audio_generation.py music`，调用 `fun-music-v1` 同步纯器乐 WAV 接口。当前北京邀测；没有权限就明确阻断，不换模型猜接口。

先读[阿里云媒体调用合同](../../scripts/ALIYUN-MEDIA.md)，它是端点、官方来源、价格/区域、权限、安全配置、完整 live 命令与失败停点的唯一正文。本入口不是自动代理调度，也不默认批准上传、付费或接受协议。

## 定位与执行

从真实仓库根执行以下 dry-run；核 commit、输入目标、已锁定事项与许可。便携安装读[安装和路径](../ALIYUN-SKILLS.md)，命令从相邻 `motion-film-director/` 根执行，将 `scripts/` 换成 `runtime/review-tools/`。单复制本目录不能运行。

```sh
python3 scripts/aliyun_audio_generation.py music --workspace-id WORKSPACE_ID --input-file /authorized/music-brief.txt
```

brief 为1–2000字符，写原创音乐的叙事、发展、密度和对白让位，不复制受限词曲。API 没有已核时长控制或总价上界：有硬预算就只做 dry-run；任何 --max-cost-cny 都拒绝 POST。

默认不读私有配置、不联网、不生成假成功回执。确需 live 时严格依共享合同核北京工作空间与模型权限、当天价格、明确传输/费用授权及新私有输出目录。key 仅走既有安全配置，不接收聊天 key；无配置/邀测/预算时报告确切阻断，继续许可内本地准备。

## 判断与交付

只有用户明确接受按¥0.002/输出秒且总价未知，手动操作者才能依共享合同执行 unbounded-cost 路线；助手不能从“做配乐”推断同意无限费用。成功不代表听感或许可通过；保留原始声源/usage/hash，按 Audio Core 编排、裁剪、混音后复听，不伪造分轨。

视听观察按[现有审核规程](../motion-film-director/references/audiovisual-review-sop.md)，人声/音乐处理按[声音制作工艺](../motion-film-director/references/sound-craft.md)，编辑混音按[Audio Core](../../engine/motion-audio-core/README.md)。不重复建立验收 schema，也不循环委托其他 Skill。

交接保留输入/输出身份、模型与地区、实际调用状态、usage/费用、覆盖/未知、权利范围、问题裁决与复验。模拟/离线测试不能说真实服务可用，模型意见不等于人听过。真实媒体/台词/回执只留授权私有项目；未验听感、同步或用户接受须明确列出。
