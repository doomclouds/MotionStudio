# 声音

[返回总索引](INDEX.md)。先决定声音为什么存在，再读实际能力；不因为画面有动态就机械添加音效。模型可以比较并选择声音职责，但评价听感必须实际听到。

| 本次问题 | 原文件 |
|---|---|
| 怎样先听参考、拆声画关系、制作分轨并让用户感受后回流 | [声音导演工作流](../../../skills/motion-film-director/references/sound-direction.md) |
| 音乐、事件声、静默怎样支撑结构与动作 | [声音设计指导](../../../skills/motion-film-director/references/sound.md) |
| 需要合法的声音候选，怎样比较并保留来源 | [声音寻源与比较](../../../skills/motion-film-director/references/sfx-sourcing.md) |
| 旁白、音乐和事件声怎样裁剪、移动、暂停/续播、分声部 | [Timeline Core](../../../engine/motion-timeline-core/README.md) |
| 混音、增益、淡变与显式自动化怎么执行 | [Audio Core能力与API](../../../engine/motion-audio-core/README.md) |
| 怎样核对实际输出的声音与画面关系 | [视听审查流程](../../../skills/motion-film-director/references/audiovisual-review-sop.md) |

先查核心README的支持/拒绝边界，再写调用；指南中提到的处理手法不等于引擎已经实现。显式gain自动化不能说成自动ducking，技术测量不能说成听审。授权素材、音轨使用/同步权利与成片接受分别确认，不由库的许可代替。

字幕是视觉时间信息时，另读[配方书架的字幕区间](recipes.md)和其原契约；该模型不自动转录，静态候选不证明已经与音频时钟集成。

## 原作者思路：按问题找听审对象

以下只是一手文字/讲座转录的来源导航，不是本库完成的听审记录，也不授予品牌录音的下载、复用或分发权；实际研究仍走声音导演的版本、时段、音频输入与对照证据。交互声音不能直接等同影片配乐，触觉描述也不等同听觉观察。

| 要研究的选择 | 原作者资料与定位 | 待实际验证的迁移问题 |
|---|---|---|
| 确认为什么不应过度庆祝；声、触、动画如何共同表达动作 | [Apple WWDC19：Designing Audio-Haptic Experiences](https://developer.apple.com/videos/play/wwdc2019/810/)，Causality / Apple Pay 候选比较 | 同一落定动作换表达力度后，是否仍清楚而不抢焦点；不复制声标 |
| 状态递进如何形成张力与解决；高频动作何时应退让或静默 | [Google：Good Vibrations](https://design.google/library/ux-sound-haptic-material-design)，Guided Frame / Pixel camera shutter / Silence | 用声音让状态可辨，而非每个动作独立响一下；配乐段落需要另找完整成品对照 |
| 重复短反馈、语音轮次边界和同家族声音怎样协作 | [Samsung One UI：Sound](https://developer.samsung.com/one-ui/sound-and-haptic/sound.html)，Clear and immediate auditory feedback / A harmoniously articulated hearing experience / Sound identity | 区分输入与删除、开始与结束；放入全段后是否产生疲劳或语义混淆 |

来源文字核对：2026-11-03；未下载或实际听审其中音频。作者的设计目标不是本项目效果证据；有新任务时重新核来源、适用与授权，不把此处导航计作已调用素材。
