# 从 UI 设计知识到 MotionStudio 成片

## 先选设计关系，再选运动机制

1. 先用[内容决策指南](CONTENT-DECISIONS.md)明确受众、信息任务与取舍，再在 [INDEX](INDEX.md) 按信息密度、内容角色和使用场景选卡；读反例与未验项。不以“某品牌风格”授权复用其资产，不让已有 demo 的皮肤决定影片。
2. 用[静态合同](../../references/static-ui-reference-study.md)固定状态、画幅、数据、token 来源及布局。忠实复刻与原创改编分开 brief。先确保 UI 文案和数据可读；静帧通过不等于运动通过。
3. 进入[导演 Skill](../../SKILL.md)：[脚本](../../references/script.md)定义观众要看懂什么；[美术](../../references/art.md)保留信息层级/功能色；[动作](../../references/motion.md)定义对象身份、动作因果与接触；[声音](../../references/sound.md)独立设计 cue。不从静态控件图推断真实交互或声音能力。
4. 读[积木使用合同](../../references/motion-elements.md)，再查询现有 catalog，按限制挑机制。这里不维护第二份参数表或引擎副本。
5. 项目负责对象/数据/布局、时间映射、层序与读时；积木仅执行其已声明机制。先测风险最小例，再接回镜头与片内回归；不要求为目录收录阻塞成片。
6. 按[引擎入口](../../references/engine-use.md)渲染，执行[有引导自审](../../references/guided-self-review.md)与[交付流程](../../references/delivery-workflow.md)。实际连续观看、声音听审、用户接受和公开授权分开，不拿索引/测试通过代替。

## 精确导航，而非声称已完成迁移

| 设计意图 | 可查的现有 ID | caller 仍须决定/验证 |
|---|---|---|
| 数据卡片布局与焦点接力 | `composition.grid`, `composition.constraint-stack`, `recipe.focus-handoff` | 响应式不是自动提供；配方有固定画幅/时长限制，核读时 |
| 同一对象从总览到局部 | `motion.transform`, `motion.keyframe-track`, `recipe.layout-handoff` | 稳定身份、transform 单写入、交接层序，不能暗换内容 |
| 模块顺序呈现，保持功能色 | `motion.stagger`, `reveal.local-geometry` | 错峰不自行绘制；局部揭示不是实际控件交互 |
| 波形/曲线作为解释图形 | `geometry.polyline-trail`, `geometry.cubic-path`, `geometry.sampled-band` | 明确数据与几何语义；不提供合成器 DSP、任意 morph 或声学准确性 |
| 切换信息场景 | `transition.push`, `transition.rect-wipe`, `transition.iris-reveal` | A/B 生命周期、透明合成、安全区与读时 |

这些是**待按项目验证的检索入口**，不是两例已调用它们的记录。当前基线 catalog 为 60 个非 recipe 条目＋7 个 recipe（共 67）；数目随版本变化，以实际 catalog 为准，不把配方再算作基础积木。

仓库根目录：

```sh
node engine/motion-elements/scripts/query-catalog.mjs list --limit 100
node engine/motion-elements/scripts/query-catalog.mjs show --id composition.grid
node engine/motion-elements/scripts/query-catalog.mjs show --id recipe.layout-handoff
```

可移植 Skill 根目录把 `engine/` 换成 `runtime/`。源实现唯一位于仓库 `engine/motion-elements/`，打包器生成 `runtime/motion-elements/`；详情以 catalog、包 README、docs 与验证器为准。静态设计卡不登记到 motion catalog，不自动修改任何项目，也未实现自动选风格、自动配积木、自动导演或艺术评分。
