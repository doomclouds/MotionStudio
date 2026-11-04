# MotionStudio · 单一作品合同

本文件是作品保留与准入的唯一规范性 Markdown 入口。作品清单见自动生成的 [统一索引](INDEX.md)；每件作品唯一机器真源为 `works/<id>/work.json`，合同为 `motionstudio.work/1`。不读取旧格式，不保留旧 CLI、wrapper、双写或兼容分支。

## 同一结构，不抹平作品差异

- `kind=static|video`：静态只存画幅/入口，封面frame=null，不编造帧率、音频或听审；视频保留各自有理帧率、帧数、音频合同与听审/同步维度。
- `resources[].kind`说明资源类型；与`fetch|generate|provide`获取方式独立。无法从来源合同确认类型时明确unclassified，不猜MIME。原许可、来源链接、hash、说明逐值保留。
- `lifecycle=retained`保留原作品版本、公开范围和接受声明；静态检查不等于本次重新渲染、观看、听审或授权。
- `lifecycle=candidate`是新版本待复验，当前verification=NOT_RUN、publication=not-published，不具有当前acceptance；原接受/权利/封面绑定在history。历史预览不能冒充新版本输出。

Tessel和Favorite52的帧率、音频、PARTIAL、NOT_LISTENED及NUMERIC_ONLY保持各自原值。三件共享模块指导路径变化的作品（pixel-hiking-study、film-festival-study、hk-street-signs-study）以新依赖身份作为候选，旧接受不转授。候选可能通过源码安全检查，但不能据此标为准入通过。

## 日常只用一个入口

从仓库根：

```sh
python3 portfolio/work.py inspect
python3 portfolio/work.py admit-check
python3 portfolio/work.py inspect --work-id friendly-fintech-study
python3 portfolio/work.py admit-check --work-id friendly-fintech-study --source-repo /path/to/local/repository
python3 portfolio/work.py query --kind video
python3 portfolio/work.py query --text 品牌
python3 portfolio/work.py query --family design.print-poster.v1
python3 portfolio/work.py index --write
python3 portfolio/work.py index --check
python3 portfolio/work.py verify-source --work-id friendly-fintech-study
# 可显式指定另一个已在本机的完整 Git 仓库，不联网补取：
python3 portfolio/work.py verify-source --work-id friendly-fintech-study --source-repo /path/to/local/repository
```

`inspect`先检查本地源码、文件身份、JPEG/路径/URL安全、runtime锁、资源许可范围及记录的接受门，再对Design资产声明调用唯一的严格历史源验证。固定依赖绑定work里的sourceCommit与历史catalog，不要求与当前catalog路径或字节相同。`admit-check`判断本地门与固定源身份是否支持已保留作品的静态准入，待复验候选返回非通过；它不执行真实渲染、感知评审或法律批准。query是字面检索，不评分；族来源与实际调用分开。索引覆盖静态与视频，候选明确分列。query/index不再调用inspect；发现不替代inspect/admit-check，也不执行其验源门。

Python代码只依赖标准库；历史源验证还需要本机Git命令与相应对象，缺失时明确BLOCKED。query/index不需要Git。schema检查仅实现本合同使用的严格子集，未知关键词/类型/pattern拒绝；不是完整通用JSON Schema引擎。制作流程提供真实参数、已有锁、源码清单及事实；不要为填模板虚构版本、资源、许可、审核人或通过状态。没有自动制作/自动审美接受功能。

## 记录发现与单件历史验源

`query/index`从当前公开work清单及其本地文件读取，继续严格校验schema、文件清单、hash和无符号链接；不读历史Git对象、不执行作品、不验证当前catalog实现与冻结依赖相同。完整源码归档没有`.git`或浅克隆缺历史对象时仍可检索全部作品及生成索引；缺失/篡改本地作品文件仍报错，不伪称清单完整。族筛选与导航读取随包当前catalog。

公开索引的`lifecycle`和`visual`保留原值，`statusScope=RECORDED`明确它们是已记录事实；每行`sourceVerification=NOT_RUN`、`recoveryAvailability=NOT_CHECKED`。已保留版本使用列表示作品声明过该稳定family ID，不表示使用最新版实现，也不自动转授历史验收到新版依赖。索引不会因一次验源结果而写回work或隐式升级状态。

`verify-source`必须用`--work-id`选择一件作品，只核该件现有文件清单和其`assetUsage`固定历史依赖。`--source-repo`可指定现有本机Git源码，缺省用`--repo`；必须是精确的Git工作树根，不接受bare库或partial clone。浅克隆仅在固定对象确实存在时可验源，否则BLOCKED；发现仍可用。不会自动fetch、执行scene、安装依赖或回退当前catalog。历史catalog、module SHA、相对import闭包、依赖锁及vendored snapshot必须分别匹配固定commit；直接动态import、无法识别的ESM依赖语法、越界路径和符号链接拒绝。分析器只支持保守静态ESM子集：import/export关键词必须对应真实词法token，注释、字符串、regex或模板中包含这些文案也会拒绝；复杂模板插值与hashbang不支持。它不是通用JavaScript解析器或执行安全审查；不会证明任意运行时反射、计算属性或字符串求值无法另行加载代码。源码出处身份检查不会授予版权许可。

- `PASSED`仅代表该件声明的Design源身份检查通过；恢复资源、runtime、渲染和新验收仍未检查。无Design依赖为`NOT_APPLICABLE`，不是全作品源验证通过。
- 历史commit或Git源不可用为`BLOCKED`（退出码2）；只阻断选定作品的源验证及依赖它的恢复，不影响其他作品发现，不改变retained/candidate。
- 已有源与记录的hash、历史catalog、锁或闭包不符为`FAILED`（退出码3），不得用缺源、当前catalog或旧验收掩盖。
- 成功与不适用退出码0。输出不保留私人证据，不更改作品文件、接受声明或生成索引；`inspect/admit-check`复用同一历史身份验源，再结合本地安全/准入门，不能拿query的结果代替。

本合同回归入口为`python3 -m unittest discover -s portfolio -p 'test_work*.py'`；其中真实历史对象夹具缺失会明确skip，该skip不是验源通过，合成Git安全负例和离线发现测试仍运行。

本次仅实现发现/验源分层，**不提供自动历史恢复命令**。需要恢复时应另行明确选择单件、验证源后写入新的仓库外隔离目录：现有作品版本的文件清单与其依赖commit是不同身份，不得假设依赖commit含该作品版本。静态相对import可能需要repo形状的隔离树；动态根锁可显式指向历史依赖；vendored字节必须按自身锁核验。缺字体、素材或runtime时仍须报告BLOCKED/NOT_RUN，不用代用品冒充历史锁。此合同自身不迁移族或改写作品；后续canonical目录调整不会重写冻结作品依赖。

## inspect/admit-check的冻结身份与状态

`inspect/admit-check --work-id <id>`只读取选定作品，其他作品的缺源或坏清单不阻断它；不指定ID时汇总全部作品。`--source-repo`支持与`verify-source`相同的显式本机Git来源，默认`--repo`；没有自动取源或当前实现fallback。查询参数`--text/--kind/--family`只用于query，不会被准入命令静默忽略。

本地安全违规仍拒绝。`local_checks=PASSED`仅代表本地静态门完成；历史源缺失时`static_checks/status=BLOCKED`、`admissible=false`，源身份错误时为`FAILED`。原`lifecycle=retained`及接受声明不变：这里的false表示本次不能证明静态准入条件，不撤销已记录接受，也不创建候选版本。没有Design声明时`sourceVerification=NOT_APPLICABLE`，不伪称完整源通过。

历史源通过后，已保留记录可满足静态准入；candidate仍返回`admissible=false`，不能继承历史接受。`inspect`在本地/源静态门通过时退出0，`admit-check`还要求retained；候选或源错误退出3，缺源退出2（全量同时存在源错误与缺源时错误优先）。任何成功均不证明字体/资源可得、源码可直接在当前树运行、完整恢复、渲染或新验收。

移动当前族后，旧冻结作品仍按原commit/路径/hash验源，不在当前树留下旧入口。静态相对import的历史作品可能因此无法直接在当前检出运行；应按上节单件隔离恢复原则另行处理，不能用保持静态接受事实来掩盖这个运行限制。

## 外部引用是参数，不是可达性保证

外部资源和报告引用保留原值/含义。不下载、不探测可达，不要求全部外部材料存在作为本次结构整理或最终发布门；source_url不是自动下载URL，也不授予许可。需要真实制作时，素材使用仍必须合法并按其原合同提供。

公开work/索引的`reviewArtifacts=NOT_INCLUDED`只表示不携入私人审查材料，不表示材料缺失或已经审查。私人记录身份、报告指纹和存储信息不进入新公开投影；原始完整记录保留在固定Git历史。不得增加强制ledger、外部可用性字段或新用户私密档案。

## 源码保留与验证边界

源码、运行/资源锁、署名和各级LICENSE/NOTICE/RIGHTS保持各自约束。仅既有允许的封面可入库；不新增字体、原图、音轨、成片、私有报告或额外媒体许可。代码和清单通过不等于法律许可。

作品完成、明确保留、技术恢复、视觉、实际听审、同步与权利范围分开。PARTIAL、NOT_LISTENED、NUMERIC_ONLY、NOT_RUN不得互相替代或自动升为PASSED。最终验证按用户授权另行执行，不能把这里的静态检查说成最终验收。

## 一次性切换记录

本次起点及作品新身份见 [MIGRATION.json](MIGRATION.json)。旧元数据及私人原字段留Git历史；未重写历史。当前活动树不保留旧解析器或一次性迁移脚本。新work是唯一运行真源；history是事实绑定，不是旧格式运行fallback。原始外置制作目录/素材不因整理而删除或改动。
