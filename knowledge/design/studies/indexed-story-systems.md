# 索引、像素与状态如何承担叙事

研究 LemoLab 的 [Pixel RPG风格合同](https://github.com/lemomo-ai/lemo-opuscar/blob/bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00/styles/pixel-rpg/STYLE.md)、[样片设计说明](https://github.com/lemomo-ai/lemo-opuscar/blob/bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00/styles/pixel-rpg/DEMO.md)及同版本源码。这里总结有限方法，不把原故事、角色、音乐或字体称为本库原创。代码/文档MIT归因保留LemoLab；原片和第三方资源仍按各自许可。

## 先保留索引身份再改变颜色

两个对象即使最初显示同一RGB，也可能承担不同角色。先保留语义索引，才能让一个进入褪色映射、另一个保留原色。先转成RGB再按颜色选取，会同时选中本应变化的同色对象；最近色量化和误差扩散也不能恢复已经丢掉的身份。

保护不是永远开启：年代变化可能故意重映射全部颜色，而另一个段落才保留身份线索；整幅白闪或退黑也可以作用于这些线索。用显式保护列表与开关表达意图，不把例外偷偷写成全局规则。[双调色板模型候选](../../../engine/design-elements/recipes/candidates/protected-palette-model-candidate/README.md)仅准备索引模型，输出复用既有[像素层](../../../engine/design-elements/recipes/candidates/indexed-pixel-layer-candidate/README.md)，不新增栅格器。

## 不同动作使用各自的像素时钟

原生小画布的字形、描边、角色尺寸和抖色都以整数像素设计。最近邻整数放大保留这些关系；把位置先平滑到小数，再让输出滤镜模糊，并不是同一种表达。镜头可逐帧走整数位置，步行姿态按较低帧率切换，火焰与闪烁又用另一周期，字幕仍用项目时间。不能把全片统一降帧当成复古风格。

检查角色转身、跳跃落地、手势交接与镜头跟随各自的相位。定向空间遮罩需使用全局坐标；大画布分块计算时若每块重置坐标，色彩回归会从每块边缘重新开始，产生接缝。技术同帧重复与常速观看仍是两层证据。

## 让界面状态表达后果

存档列表、队伍成员、血量、物品与确认提示能承载变化，但先要有可追踪的状态关系：旧记录是否保留、新记录何时出现、被移除成员还有没有行动、确认提示是否对应实际改变。不能仅把普通字幕装进游戏边框，就声称系统在讲故事。

重要变化应给观众看清前后对象的机会；低色深、低对比可以表达记忆或失去，也可能损害文字。不要自动把原作的表达策略变成通用可读性标准。预编排菜单动画不是可交互产品，绘制了游标和按钮也不证明交互存在。

## 用共同段落组织配色和配器

色彩逐级减少时，声音可以依次退出和声、回声、立体声、低音或旋律，而不是只套一个降采样滤镜。回归时重新引入这些声部，让同一段落在画面和声音上有对应依据。短确认音还可取自主旋律的片段，但是否能让人听出关联，需要实际听审。

区分停止某条声部与整个混音静默：配乐归零时旁白或拟音可能仍在，回声尾巴也可能越界。先指定哪些声音允许留下，再检查最终编码的对应窗口；AAC边缘不一定保持PCM的精确零样本。共同时间表证明编排，不证明感知同步。复用现有[声音检查合同](../../../engine/motion-audio-core/README.md)，不复制一套默认响度或隐式补音策略。

## 阅读声明与实际可读分开

把全文已在数据中、文字进入画面、入场完成、全文稳定可读分别记录。稳定文本身份不随打字子串重启，但[声明框读时检查](https://github.com/lemomo-ai/lemo-opuscar/blob/bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00/core/render/readcheck.mjs#L16-L50)不检查透明度、遮挡或打字完成，不能提前计算完整阅读停留。像素[对话框](https://github.com/lemomo-ai/lemo-opuscar/blob/bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00/styles/pixel-rpg/demo/ui.js#L25-L42)先换行再逐字绘制；[字形函数](https://github.com/lemomo-ai/lemo-opuscar/blob/bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00/styles/pixel-rpg/demo/font.js#L90-L116)遇未知字符会回退问号。无需网页字体加载，不等于任意用字都齐全。

字幕由一份规范化计划同时驱动画面和SRT，使用[项目精确时间](../../../engine/motion-timeline-core/README.md)。下一句过早、片尾不足或毫秒取整成空区间应报告冲突，不能裁短后冒充满足最小读时。[SRT导出器](https://github.com/lemomo-ai/lemo-opuscar/blob/bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00/core/render/srt.py#L7-L12)会裁重叠，但不是字幕验证器。

缺数据、未检查、告警与通过分开：零项、skip、warning或退出0都不自动成为通过，[cuecheck](https://github.com/lemomo-ai/lemo-opuscar/blob/bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00/styles/dataviz/demo/tools/cuecheck.py#L14-L23)可跳过缺失key，[mux](https://github.com/lemomo-ai/lemo-opuscar/blob/bebbbe1aa92a3cb4bb6f83500e61b23a17d1aa00/core/render/mux.sh#L60-L100)可在响度未达标时正常退出。反例应含迟完成打字、短闪、反向框、重复起点字幕与缺cue。最终编码检查、目标尺寸文字检查、常速观看和实际听审分别保留结果，不互相替代。
