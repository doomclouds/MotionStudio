# 声音书架 · Sound

这是与设计、运动协作的声音知识入口，不登记第二套素材元数据。声音文件/生成代码及每资产合同在 [Sound Elements](../../engine/sound-elements/README.md)，[资产目录](../../engine/sound-elements/INDEX.md) 从每个目录的 `asset.json` 生成。先读条目用途和反例，再试用；`candidate / NOT_LISTENED` 不是质量推荐。

## 按职责找声音

| 职责 | 分类与阅读 |
|---|---|
| 状态发生、一次确认 | SFX / ui-feedback、confirmation；检查频率、语义、音高冲突，不为所有动作加声 |
| 焦点穿行或转场 | SFX / transition；对齐能量峰值，避免只对齐文件起点 |
| 物体落定或强调 | SFX / impact；低频重量与配乐低频不能互相掩蔽 |
| 连续材质、空间和环境 | SFX / texture、ambience；目前空位，不把白噪声候选伪装成拟真实录 |
| 叙事底床 | BGM / pulse-bed、ambient-bed、rhythmic、melodic、stinger；目前只有低密度脉冲生成候选，其他类别空位 |
| 旁白和角色表演 | voice / narration、performance；目前空位，声音身份、表演与取得权利需另核 |

分类对应合同 `kind/category`，情绪标签只表明设计目标。模型阅读后按内容推理，不要求运行 query，查询也不等于自动推荐。合成器原理不能替代作品研究，更不能替代优秀配乐的实际筛选和听审。

## 按工作阶段阅读

- [声音导演](../../skills/motion-film-director/references/sound-direction.md)：brief、实际参考听审、AB选择、反馈和职责交接。
- [声音设计](../../skills/motion-film-director/references/sound.md)：音乐/事件/静默关系。
- [寻找新音效](../../skills/motion-film-director/references/sfx-sourcing.md)：外部原作者资料、逐项核权、私有候选采集；旧 SFX 工具保持空的公开来源种子，不复制已保留资产事实。
- [Audio Core](../../engine/motion-audio-core/README.md) 和 [Timeline Core](../../engine/motion-timeline-core/README.md)：执行支持范围、源裁剪、显式增益和混音，不自动 ducking 或 loop。
- [视听审查](../../skills/motion-film-director/references/audiovisual-review-sop.md)：技术、实际听审、同步与用户决定分开。
- [既有领域资料](../design/library/sound.md)：原作者声音设计资料及与视觉界面的交叉导航，不重复收藏资产。

## 既有资源审计边界

当前公开源码没有已分发音频二进制。可实际保留的是本库原创生成代码与未听审的设计合同，不凭“本地曾经存在”搬入私人音轨。

[Tessel 既有声音来源](../../portfolio/works/tessel/CREDITS.md) 和 [固定资源锁](../../portfolio/works/tessel/resources.lock.json) 已声明原作者代码生成的 MIT soundtrack，并保留许可、固定提交、hash与外置准备入口；它是一条音乐+全部 SFX 的影片混音，不是干净 BGM，也没有新听审。沿原作品准备流程恢复，不复制其锁或在本库再造授权记录。便携包不含作品集，缺此材料不代表已恢复音轨。其他作品的原始混音、品牌系统提示音、未知网络音乐一律不由仓库 MIT 自动授权。

希望沉淀“不错的 BGM”，还需逐件获得可授权源、实际听审同条件候选、核独立分发/同步条件并说明适用与反例。现在没有这个证据，所以不填虚构曲目、评分或听审结果。
