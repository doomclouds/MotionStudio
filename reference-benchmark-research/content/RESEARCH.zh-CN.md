# MotionStudio：内容、叙事与声画语义评价研究

核实日期：2026-10-26。范围：已发表主论文、作者项目页；这是评估设计研究，不是对现有视频的实测。未修改视频，未调用付费 API，未运行这些论文的模型。

## 结论先行

不要把“像素接近”“声画同时发生”“故事讲清楚”“复刻意图一致”合成未经标定的总分。建议在低层对齐/差分报告旁增加**可选的事件证据审查**：

**具体片段 → 可见/可听事实 → 目标差异 → 多个原因假设 → 最小修改 → 同条件复验。**

复刻模式以原片实际事件和经确认的原作意图为参照；原创模式以版本化创意简报、观众应理解的关键问题和风格约束为参照。原片本身不是作者意图的完整证据；没有作者说明时只能写“意图假设”。脚本、时间线、提示词和设计文档均属计划，不证明渲染画面已发生。

## 已核实论文及转化方式

下表中“可用设计”是我们的工程转化建议，不是论文已验证 MotionStudio 的效果。

| 已发表论文 | 主来源支持的内容 | 可用设计 | 不该声称 |
|---|---|---|---|
| Vicol 等，**MovieGraphs: Towards Understanding Human-Centric Situations From Videos**，CVPR 2018 | 用有时间定位的图表达人物、属性、关系、互动、主题和动机；部分属性明确是推断性的 | 对每个叙事节点记录角色、互动、动机假设及依据；检查铺垫和回报 | 图中“动机”不是实测心理状态；不能自动证明观众感受或作者意图 |
| Sadhu 等，**Visual Semantic Role Labeling for Video Understanding**（VidSitu），CVPR 2021 | 事件由动词和语义角色构成，跨事件实体共指，附事件关系 | “谁→对什么→做了什么→前后状态”；同一物体跨镜保持 ID；对短动作按实际事件边界细分 | 论文的两秒采样不适合原样用于毫秒级打击反馈；动作识别不等于评价好坏 |
| Li、Niu、Zhang，**From Representation to Reasoning: Towards Both Evidence and Commonsense Reasoning for Video Question-Answering**（Causal-VidQA），CVPR 2022 | 区分描述、解释、预测、反事实四类问题，常识推理需回答和理由 | 将“发生什么”与“为什么/可能怎样”分表；用反事实问题找出缺失的因果线索 | 在剪辑视频上答对常识问题不是干预实验，不能从先后直接推因果 |
| Grunde-McLaughlin、Krishna、Agrawala，**AGQA: A Benchmark for Compositional Spatio-Temporal Reasoning**，CVPR 2021 | 基于时空图构造组合问题；拆分不同推理能力，并警示语言偏差 | 逐问核查对象、关系、动作、先后、持续时间、组合；设置“仅读简报”对照防止模型猜答案 | 单个 QA 正确率不等于作品质量；用同一模型生成答案再自评不是独立证据 |
| Huang 等，**MovieNet: A Holistic Dataset for Movie Understanding**，ECCV 2020 | 多模态电影数据，场景边界、角色身份、动作/地点、电影风格等标注 | 镜头—场景—故事层级；剪辑连续性和风格检查独立于动作检查 | 电影训练域不能直接覆盖像素画、抽象形状、UI 动效 |
| Wu 等，**Exploring Video Quality Assessment on User Generated Contents from Aesthetic and Technical Perspectives**（DOVER），ICCV 2023 | 分析 UGC 技术/审美质量并构建分解评估器 | 技术损伤、审美选择两栏分开；可选辅助诊断，不纳入语义因果判定 | DOVER 不是故事理解、原作忠实度、音画适配或创意简报完成度评分 |
| Tian 等，**Audio-Visual Event Localization in Unconstrained Videos**，ECCV 2018 | AVE 将声画事件定义为片段中同时可听和可见的事件，研究时域定位及跨模态关联 | 逐事件记录声音来源、可见动作和各自时间窗，核查事件语义是否配对 | 强关联不证明艺术上合适；旁白、画外音、配乐和预示性声音不应按“无可见声源”扣分 |
| Geng 等，**Dense-Localizing Audio-Visual Events in Untrimmed Videos: A Large-Scale Benchmark and Baseline**，CVPR 2023 | 面向未裁剪视频内多次、可重叠声画事件的密集定位 | 同一时间允许多事件、多音轨关联；别把整段最强音当唯一音效 | 事件类别命中不等于节奏、力度、材质或情绪配合正确 |

### 主来源（按上表顺序）

1. [MovieGraphs / CVF](https://openaccess.thecvf.com/content_cvpr_2018/html/Vicol_MovieGraphs_Towards_Understanding_CVPR_2018_paper.html)
2. [VidSitu 正式论文 / CVF](https://openaccess.thecvf.com/content/CVPR2021/html/Sadhu_Visual_Semantic_Role_Labeling_for_Video_Understanding_CVPR_2021_paper.html)；[作者项目页](https://vidsitu.org/)。注意 CVF HTML 摘要写 27K，PDF/项目页写 29K；本方案不依赖这一规模数字。
3. [Causal-VidQA 正式论文 / CVF PDF](https://openaccess.thecvf.com/content/CVPR2022/papers/Li_From_Representation_to_Reasoning_Towards_Both_Evidence_and_Commonsense_Reasoning_CVPR_2022_paper.pdf)
4. [AGQA 正式论文 / CVF PDF](https://openaccess.thecvf.com/content/CVPR2021/papers/Grunde-McLaughlin_AGQA_A_Benchmark_for_Compositional_Spatio-Temporal_Reasoning_CVPR_2021_paper.pdf)
5. [MovieNet / ECVA](https://www.ecva.net/papers/eccv_2020/papers_ECCV/html/2710_ECCV_2020_paper.php)
6. [DOVER 正式论文 / CVF PDF](https://openaccess.thecvf.com/content/ICCV2023/papers/Wu_Exploring_Video_Quality_Assessment_on_User_Generated_Contents_from_Aesthetic_ICCV_2023_paper.pdf)；[官方实现说明](https://vqassessment.github.io/DOVER/)
7. [AVE / CVF](https://openaccess.thecvf.com/content_ECCV_2018/html/Yapeng_Tian_Audio-Visual_Event_Localization_ECCV_2018_paper.html)
8. [Dense AVE / CVF](https://openaccess.thecvf.com/content/CVPR2023/html/Geng_Dense-Localizing_Audio-Visual_Events_in_Untrimmed_Videos_A_Large-Scale_Benchmark_and_CVPR_2023_paper.html)

## 内容审查维度：从问题到建议

| 维度 | 必须定位的证据 | 复刻问题 | 原创问题 | 典型可试修改 |
|---|---|---|---|---|
| 实体/角色连续性 | 跨镜实体、遮挡前后帧 | 主体或作用对象是否换错？ | 观众能否认出持续行动的主体？ | 保留轮廓/颜色锚点、增加过渡镜头 |
| 动作与状态变化 | 预备、接触、结果帧 | 原片动作结果是否缺失？ | 结果是否可辨、是否支持目标？ | 增加接触停顿、清晰结果状态 |
| 时序与因果可读性 | 事件时间窗、作用机制线索 | 原片“铺垫→触发→后果”是否保留？ | 观众凭什么判断谁造成变化？ | 降低同时竞争事件，补充触发线索 |
| 叙事与信息分配 | 关键线索首次出现/持续时长 | 观众是否更早或更晚知道答案？ | 核心信息在预定时机可理解吗？ | 延长关键线索、重排揭示顺序 |
| 视觉注意/风格 | 主次对比、空间位置、运动强度 | 注意中心是否偏离原片？ | 注意资源是否服务简报？ | 减少背景抢动、提高关键物对比 |
| 声画事件语义 | 声音类型/来源、视觉动作/材质 | 对上的只是节拍还是同一种事件？ | 声音是实景、风格化、预示还是旁白？ | 换音色/包络、减少歧义来源 |
| 观众理解 | 不透露简报的自由复述与定位依据 | 是否理解同一关键关系？ | 是否理解简报要求、是否误读？ | 根据误读类型改线索而非只增响度 |

## 执行协议

1. **锁定目标与版本**：记录视频 hash、fps、时长、音轨、目标播放设备、简报版本和复刻允许变化。不要在看到结果后悄悄改成功标准。
2. **分开取证与目标**：观察表仅使用帧/音频/人工观测；意图与计划放 targets；模型输出标 `model_inference`，需人工复核。无法判断写 `unknown`。
3. **事件级对齐**：低层时间对齐后，仍保留原始时间轴；镜头或事件插删时使用局部映射，不把强行对齐后的巧合当对应。登记漏事件、多事件、持续时间变化。
4. **观察再解释**：先写可核实事实，再写与目标的差异；原因至少考虑替代解释，例如“停顿太短”也可能实际是“关键颜色对比不足”。相继发生只填 `before/after`；因果假设另填 `hypothesized_causes` 并给机制、反证和置信理由。
5. **开修改单**：每项建议含所改参数、预计影响、可能副作用、复验方式。先动一个变量。建议不是授权，不改视频。
6. **盲测观众理解**：先自由复述，再问不诱导的问题；之后才展示意图或原片。保留逐人原话、时间定位和不确定回答，不用模型代替真实受众。小样本是形成性反馈，不能宣称统计普遍性。
7. **改后复验**：复用相同窗口与问题；版本标签隐藏、呈现顺序平衡；记录改善、未变、退化或不确定，同时检查邻近镜头、声音和风格的回归。若只改节奏，不能据此宣称剧情理解已改善。

## 像素/抽象动效的特殊边界

- 写实视频识别器可能把像素锯齿、有限帧率、故意拖影、抽象变形当缺陷。必须先列风格白名单，再谈异常。
- 人体动作/脸部情绪识别在无脸形状上无适用依据；把实体记为 shape_1、particle_group_2，不硬套“人/愤怒/攻击”。
- 原创抽象动画可用“膨胀→接触→分裂”的状态语言；“碰撞导致分裂”仍需机制或创作目标支持。
- CLIP/视频语言模型的文本相似度仅能作候选检索；可遗漏数量、否定、先后、细小动作和声源。未经本域人工标注集校准，不发布总质量分或百分比忠实度。
- 低层分数差但风格正确、低层分数好但关键事件缺失，都应允许出现在报告中；不能用平均分掩盖致命缺失。

## 最小可落地交付与可选集成

本目录的 `content-review.schema.json` 是独立、可选的结构契约；不要求现有低层工具安装模型、下载权重或增加依赖。`example.synthetic.json` 是**完全虚构的教学示例，不是任何现有视频实测**。

建议当前报告只预留 `content_review: {status: "not_run", artifact: null}`；下一阶段由人工逐事件填写，再考虑本地模型辅助候选。报告必须区分未运行、无证据、不适用和通过。计算漏事件率等统计时，先定义人工核准的事件集合及匹配规则，公开分子/分母；不生成伪造的 0–100 综合分。

## 研究验证：能否真的补足通用模型的设计不足

这是待验证的研究假设，不承诺行业突破或被任何公司采用。先比较“只有通用模型建议”的基线与“事件证据链约束建议”的流程，固定模型版本/提示/输入预算，避免把算力差异当方法收益。

- **冻结输入**：预先归档原片/简报/素材、视频与音轨 hash、生成配置、评估问题、目标受众和成功规则；版本间只修改登记的变量。
- **基线与修改后 A/B**：评审看不到方案名称或修改目标；随机/平衡顺序；复刻的“原片意图保持”和原创的“简报理解/体验”分别判断，不能用复刻像素相似度替代原创质量。
- **消融**：至少保留基线、仅美术、仅时序、仅声音、联合修改；分别看理解、风格一致性、声画契合与低层质量。有资源限制时先进行单变量形成性试验，不伪称完整因子实验。
- **泛化留出**：将未参与提示词/阈值/规则调整的片段或整部作品锁为留出集；优先按作品切分，避免同一作品近邻镜头泄漏。像素、抽象、写实分别报告，不只给混合平均。
- **保留失败与分歧**：包括无改善、退步、未检出差异、模型误识别、不同观众解读；登记中止/排除原因；不只精选成功案例。人工审查成本、修改次数也应记录。
- **置信与歧义**：观众原话与审查者解释分开；“不知道”“有两个解释”是有效结果；`confidence` 必须附依据，不能把语言模型自信当校准概率。多人意见不一致时先报告分歧，不强制多数票化为真相。
- **效果归因**：仅时间先后、A/B 更喜欢某版或模型答对均不足以证明真实世界因果；实验可支持某修改在指定条件下改善理解，但范围限于所测受众/作品/协议。
- **停止条件**：当前阶段交付研究与 schema；后续必须取得真实片段和已确认简报、预注册对照协议后才进入实测。没有观众数据的条目保持 `not_tested`，改后未跑保持 `not_run`。

## Schema 使用注意

`content-review.schema.json` 用 JSON Schema Draft 2020-12 验证形状；已用 Python jsonschema 检查 schema 本身及示例。接入时还需语义校验：所有 ID 唯一且引用存在；end_s ≥ start_s；时间窗不越过对应视频时长；observed 事件必须有真实 visual/audio/audiovisual 观察证据而不能只引用 planned/brief/synthetic；因果关系必须有机制与替代解释；reviewed 不得表示未验证事件已经成立。示例以 synthetic provenance 明确隔离，禁止计入真实指标。

## 通用迭代原则：复杂度不是质量

事件数量、时长、角色姿态和动态部件数量，都不能直接用作质量提升指标。目标应由创意简报、可理解的信息和期望体验共同确定。

- 修改建议应允许删减、静音、减少并发动作或回退基线；新增内容应有明确作用。
- 不等长版本先按创作目标和叙事单元比较，记录插入、删除和持续时间变化；不以强行拉伸或 DTW 隐藏节奏差异。
- 实测时先锁定输入身份和评估问题，再进行正常速度观看、局部检查及适当受众测试。没有执行的评估保留为未运行。

以上是可复用方法原则，不包含任何真实委托、影片版本或观众反馈记录。
