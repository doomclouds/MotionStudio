---
name: soundtrack-production
description: 为已定影片或独立音乐任务选用、编排、制作和混合配乐，保留音乐结构、来源权利、cue、分轨与可复验输出；复用 MotionStudio 声音资产和 Audio Core，不把审核 API 当作曲服务，也不承担旁白生成。
---

# 配乐生产 · 可复用仓库流程

直接“配乐/换曲/改音乐”任务从这里开始；先区分音乐、旁白与音效，不把整条参考混音当干净 BGM。输入为实际画面/时长/段落及锁定事项、音乐目标、合法来源和预算约束；输出为可编辑 cue/时间线、真实声源/必要 stems、master、最终混音及分门状态。纯音乐任务无需反向制作影片。

本页只组织现有能力：声音方向与参考选择读[声音导演工作流](../motion-film-director/references/sound-direction.md)，作曲/编排/混音决策读[声音制作工艺](../motion-film-director/references/sound-craft.md)，来源与生成合同读[Sound Elements](../../engine/sound-elements/README.md)，实际编辑边界读 [Audio Core](../../engine/motion-audio-core/README.md)。不建立第二个资产库、音频引擎或验收 schema。

## 确认能力，再选来源

先定位真实仓库根和 commit，核已有 Node 24+、FFmpeg/ffprobe；声音候选生成器只需 Python 3.10+。以下均为仓库路径，不意味着宿主自动注册。单独复制本 Skill 不含依赖；[四目录组合包](../MEDIA-SKILLS.md)提供一份共享 Motion runtime/正文与三个可发现入口。便携模式从相邻 `motion-film-director/` 根按该安装说明的精确命令执行，仓库示例不直接当包内路径。

- **授权已有音乐**：核真实文件、出处、同步/改编/商用和分发范围；“可下载/免版税/代码 MIT”不等于完整音乐授权。保留词曲、录音、表演、采样及服务条款的适用边界。只有参考整混音就如实标记，不能叫作独立配乐或假装已拆 stems。
- **本地可运行候选**：从[声音书架](../../knowledge/sound/INDEX.md)进入[资产目录](../../engine/sound-elements/INDEX.md)，读单件 `asset.json` 与反例再选择。已有脉冲底床只用于有限节拍试排，状态仍为 candidate / NOT_LISTENED，不应默认冒充成熟原创配乐。
- **新作曲/外部生成**：本仓库没有已实现的阿里云音乐生成适配器，`DASHSCOPE_API_KEY` 只说明可配置已有审核客户端，不能据此推断任何模型能生成音乐。确需外部服务时先核官方模型、地区、端点、真实输出能力、条款/权利、费用与安全配置，取得相应授权后再执行；未知时给出音乐 brief/cue 设计并说明阻断，继续已许可的本地工作。不用臆造 API、默认付费或读取聊天里的 key。

## 制作闭环

1. 从目标和已锁画面提取段落/转折/留白，不按每个画面动作机械打点。先决定主次、音乐身份和发展，再写 cue：片内起止、源内入出点、段落意图、动机/音区/密度、增益/尾音及需要让位的对白或事件。具体编排工艺沿正文，不强制固定调式/BPM/乐器。
2. 有实际听审能力时先听合法参考，描述可迁移关系和反例；缺能力可做明确技术草案，不冒称参考分析完成。参考不授予仿用素材或生成同声线的权限。
3. 制作/取得真实声源后，绑定文件 hash、格式、来源/权利与生成或编辑参数；需要外部处理就核确有工具支持，不能把文档提到的 EQ、压缩、sidechain、time-stretch 当已内置。按 Audio Core 合同显式裁剪、摆位、重复、gain/fade、线性幅度自动化与路由，预算不足不自动分段或改变声道。
4. 保留必要声部并渲染 master；按 Motion 时间线约定封装影片后重测实际编码。循环边界、音乐发展、主次、片尾、重编码伪影和原声让位须实际合听；只改音量或生成新波形不能称完成配乐改善。
5. 用[音频审核](../audio-review/SKILL.md)复听，再按[视频审核](../video-review/SKILL.md)合看同版成片。同画面/同窗口比较，明确采用、撤回或未验；用户只认可局部就保留局部，不替其他区间签字。

## 可直接复用的离线路径

从实际仓库根运行，替换为授权项目内全新目录；先阅读候选合同，不默认选它作为最终方案：

```sh
python3 engine/sound-elements/sound.py query --kind bgm
python3 engine/sound-elements/sound.py render --id quiet-pulse-bed --output /authorized/new-bed
node engine/motion-audio-core/scripts/audio.mjs validate --timeline /authorized/new-bed/timeline.json
node engine/motion-audio-core/scripts/audio.mjs render --timeline /authorized/new-bed/timeline.json --source-root /authorized/new-bed --work /authorized/new-mix --aac
```

这些步骤无网络、下载或凭据需求；生成器、Audio Core 的时长/源/图预算仍各自生效。技术回执只证明实际调用与输入/输出身份，不证明音乐好听或适合该片。真实素材、WAV、混音和回执留授权私有目录，不随 Skill 发布。

## 自描述与交接

在项目既有决定卡/时间线保留音乐目标、段落/cue、采用/弃用理由、来源与许可、实际工具版本/命令、源与最终文件 hash、源→片内时间映射、处理参数、必要 stems/master、重建条件及技术/听审/同步/用户接受各自状态。可独立复用的资产才按现有 `asset.json` 合同沉淀；项目完成不自动授权公开素材或扩库。已定任务完成或需要外部权限时收口，不把技能建设变成无限作曲实验。
