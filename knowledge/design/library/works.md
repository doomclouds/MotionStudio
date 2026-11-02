# 作品与方法

[返回总索引](INDEX.md)。要理解完整表达不能只读积木API；要确定API也不能只凭作品外观。模型沿下面两条书架按需阅读、比较，自己形成采用/舍弃理由，而不是让目录替代判断。

## 完整作品：看组合语境

[作品总索引](../../../portfolio/INDEX.md) → 选择相关静态/视频对象 → 该作品 `work.json`、README、其design所指decisionCard与sourceAnalysis → 需要时看源码和有权限的实际输出。[作品合同](../../../portfolio/README.md)解释当前/历史状态、资源与证据边界。这里不再抄一份作品名单或成熟度表。

- 内容/构图关系从作品说明进入；实际调用看 `design.assetUsage` 及本版代码，不能仅由外观推断。
- 来源启发看UI catalog的 `sourceCases` 及各族guidance，和实际调用分开读。[既有覆盖表](../../../engine/design-elements/CASE-COVERAGE.md)已区分这两种关系，无须新增关系账本。
- 原记录有调用/接受声明也不代表本次已执行、重看或听审。候选与未验状态不升级；需要参考输出但没有访问权时，保留观察缺口。

## 从具体表达难题找现成设计卡

下面是按问题选读的少量入口，不是成功榜单或另一份作品清单；先读卡中的适用与反例，再按需读同目录源码。静态研究不证明交互、运动或新内容迁移成立，当前状态仍以该作品 `work.json` 为准。

| 需要解决的问题 | 既有设计卡与阅读重点 |
|---|---|
| 能否用对象自身结构讲主题，而不是添加装饰？ | [汉字解构](../../../portfolio/works/hanzi-poster-study/DESIGN-RETENTION.md)：完整对象与局部强调保持对应；部件必须有内容意义，不套用固定笔画数。 |
| 品牌要有玩味，又不能让关键读数失序？ | [今天的浪](../../../portfolio/works/wave-weather-study/DESIGN-RETENTION.md)：表现文字与纸签可错位，数值和信息行仍保持阅读秩序；非物理波浪或真实预报。 |
| 配色怎样成为内容线索，而非随意换肤？ | [节气行](../../../portfolio/works/solar-terms-study/DESIGN-RETENTION.md)：当季颜色连接标题、路线与选中项；顺序、身份和选中强调不冒充数量编码。 |

## 方法：看适用与反例

| 问题 | 原分类与方法入口 |
|---|---|
| 数据密度、容器、状态层级 | [数据界面分类](../categories/data-interfaces/INDEX.md) |
| 功能色、控件关系、显示值 | [仪器界面分类](../categories/instrument-interfaces/INDEX.md) |
| 主物、品牌态度与印刷语法 | [品牌招贴分类](../categories/brand-posters/INDEX.md) |
| 怎样从内容决定表达和视觉取舍 | [内容决策](../CONTENT-DECISIONS.md)、[设计指南](../DESIGN-GUIDE.md) |
| 怎样研究参考并验证迁移 | [静态参考研究合同](../static-ui-reference-study.md)、[参考到组合与再创作](../reference-to-composition.md) |

方法卡不是作品全集，源码不是实际观感。优秀与否要对应本次目标给出可定位优点和缺陷；从参考提取关系而非照搬资产。库内不够时，按授权研究外部可靠来源，不把新例子的计划或相似度当已验证结论。
