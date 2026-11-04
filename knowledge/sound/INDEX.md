# 声音书架 · Sound

这是与设计、运动协作的声音知识入口，不登记第二套素材元数据。声音文件/生成代码及每资产合同在 [Sound Elements](../../engine/sound-elements/README.md)，[资产目录](../../engine/sound-elements/INDEX.md) 从每个目录的 `asset.json` 生成。先读条目用途和反例，再试用；`candidate / NOT_LISTENED` 不是质量推荐。

## 按职责找声音

| 职责 | 分类与阅读 |
|---|---|
| 状态发生、一次确认 | SFX / ui-feedback、confirmation；检查频率、语义、音高冲突，不为所有动作加声 |
| 焦点穿行或转场 | SFX / transition；对齐能量峰值，避免只对齐文件起点 |
| 物体落定或强调 | SFX / impact；低频重量与配乐低频不能互相掩蔽 |
| 连续材质、空间和环境 | SFX / texture、ambience；短材质联想可从资产目录查询，环境实录仍为空位；不把滤波噪声候选伪装成拟真实录 |
| 叙事底床 | BGM / pulse-bed、ambient-bed、rhythmic、melodic、stinger；目前只有低密度脉冲生成候选，其他类别空位 |
| 旁白和角色表演 | voice / narration、performance；目前空位，声音身份、表演与取得权利需另核 |

分类对应合同 `kind/category`，情绪标签只表明设计目标。模型阅读后按内容推理，不要求运行 query，查询也不等于自动推荐。合成器原理不能替代作品研究，更不能替代优秀配乐的实际筛选和听审。先查核心合同支持/拒绝边界，再写调用；指南提到的处理手法不代表引擎已实现。授权素材、音轨使用/同步权利与成片接受分别确认，不由库的许可代替。

## 按工作阶段阅读

- [声音导演](../../skills/motion-film-director/references/sound-direction.md)：brief、实际参考听审、AB选择、反馈和职责交接。
- [声音设计](../../skills/motion-film-director/references/sound.md)：音乐/事件/静默关系。
- [寻找新音效](../../skills/motion-film-director/references/sfx-sourcing.md)：外部原作者资料、逐项核权、私有候选采集；旧 SFX 工具保持空的公开来源种子，不复制已保留资产事实。
- [Audio Core](../../engine/motion-audio-core/README.md) 和 [Timeline Core](../../engine/motion-timeline-core/README.md)：执行支持范围、源裁剪、显式增益和混音，不自动 ducking 或 loop。
- [视听审查](../../skills/motion-film-director/references/audiovisual-review-sop.md)：技术、实际听审、同步与用户决定分开。

## 既有资源审计边界

当前公开源码没有已分发音频二进制。可实际保留的是本库原创生成代码与未听审的设计合同，不凭“本地曾经存在”搬入私人音轨。

[Tessel 既有声音来源](../../portfolio/works/tessel/CREDITS.md) 和 [固定资源锁](../../portfolio/works/tessel/resources.lock.json) 已声明原作者代码生成的 MIT soundtrack，并保留许可、固定提交、hash与外置准备入口；它是一条音乐+全部 SFX 的影片混音，不是干净 BGM，也没有新听审。沿原作品准备流程恢复，不复制其锁或在本库再造授权记录。便携包不含作品集，缺此材料不代表已恢复音轨。其他作品的原始混音、品牌系统提示音、未知网络音乐一律不由仓库 MIT 自动授权。

[Favorite52 既有声音来源](../../portfolio/works/favorite52/CREDITS.md) 记录了另一条路线：现成曲目剪辑与程序音效混合，而非提取参考影片原声。曲目身份、许可声明和具体限制以该作品 CREDITS 为准，不在书架复制授权清单。旧记录描述截取、滤波、淡入出、增益自动化，以及多谐波、滑音、滤波噪声和包络合成；当前恢复入口保留的是最终混合 AAC，未恢复完整分轨/合成配方，因此这些是历史制作记录，不是这里已复现或听审的配方。不能仅凭最终混音就声称已有可独立复用的“干净 BGM/SFX”，也不能把原曲许可扩大成整体混音的分发许可。

这两种来源说明不同复用层级：合法整轨恢复用于保留既有版本；独立曲目与独立 SFX 用于重新编排；原创生成代码用于可重建的新候选。先确认拿到哪一层，再沿既有资产合同保留精确输入、生成入口、时间线和许可，不以成片存在推断分轨齐全，也不以历史好评替新声音验收。

源码辅助制作还须核[缺失声部是否改变混音行为](../design/studies/material-logic-from-code.md#复现依赖的行为而不只核文件存在)：旁白缺失可能同时让人声驱动的ducking失效；重合成、沿用混音与独立声音资产不能互称，脚本退出也不替代实际峰值检查或听审。

希望沉淀“不错的 BGM”，还需逐件获得可授权源、实际听审同条件候选、核独立分发/同步条件并说明适用与反例。现在没有这个证据，所以不填虚构曲目、评分或听审结果。

## 界面与视觉时间的交叉问题

| 本次问题 | 原文件 |
|---|---|
| 音频界面的场景、通道、样本与波形怎样保持同版本 | [通道场景的受控内容](../design/static-ui-reference-study.md#通道场景排队的是受控内容不是一个名称)：仅有限界面状态模型；请求时冻结内容，提交前查过期，不是实时调度、播放、录音或听审证据。 |

字幕区间另读[设计配方书架](../design/library/recipes.md)及原契约；静态区间模型不自动转录，也不证明与音频时钟集成。

## 原作者思路：按问题找听审对象

以下只是一手文字/讲座转录的来源导航，不是本库完成的听审记录，也不授予品牌录音的下载、复用或分发权；实际研究仍走声音导演的版本、时段、音频输入与对照证据。交互声音不能直接等同影片配乐，触觉描述也不等同听觉观察。

| 要研究的选择 | 原作者资料与定位 | 待实际验证的迁移问题 |
|---|---|---|
| 确认为什么不应过度庆祝；声、触、动画如何共同表达动作 | [Apple WWDC19：Designing Audio-Haptic Experiences](https://developer.apple.com/videos/play/wwdc2019/810/)，Causality / Apple Pay 候选比较 | 同一落定动作换表达力度后，是否仍清楚而不抢焦点；不复制声标 |
| 状态递进如何形成张力与解决；高频动作何时应退让或静默 | [Google：Good Vibrations](https://design.google/library/ux-sound-haptic-material-design)，Guided Frame / Pixel camera shutter / Silence | 用声音让状态可辨，而非每个动作独立响一下；配乐段落需要另找完整成品对照 |
| 重复短反馈、语音轮次边界和同家族声音怎样协作 | [Samsung One UI：Sound](https://developer.samsung.com/one-ui/sound-and-haptic/sound.html)，Clear and immediate auditory feedback / A harmoniously articulated hearing experience / Sound identity | 区分输入与删除、开始与结束；放入全段后是否产生疲劳或语义混淆 |

来源文字核对：2026-11-03；未下载或实际听审其中音频。作者的设计目标不是本项目效果证据；有新任务时重新核来源、适用与授权，不把此处导航计作已调用素材。

[配色与配器的共同段落](../design/studies/indexed-story-systems.md#用共同段落组织配色和配器)研究逐层退出、确认音与主题的关系，以及声部静默和总混音静默的区别；它是方法而非新增音频资产或听审结论。

[连续地图的声音职责](../design/studies/continuous-map-story.md#用声部退出建立尺度变化)区分声部退出、混音静默与采样依赖；立体声滤波须明确时间轴，冲激反例只证明数值行为，不代替实际听审，也不新增声音资产。

[界面与声音的共同时间表](../design/studies/phase-and-interface-story.md#让共同时间表真正被两边消费)区分共享数据与实际事件覆盖、节奏齐奏与同音，以及统计对齐与实际合听；沿用整片混音不等于拥有独立声部，也不新增已听审音频资产。
