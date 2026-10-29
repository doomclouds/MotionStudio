# 动效基础库：先找机制，再组合成镜头

基础库保存“可以执行的动作机制”，知识库保存“在哪种情况下这样做可能有效”。不要把每一部影片写成一个新特效，也不要把某次成功的参数变成所有影片的默认风格。

## 五层结构

|层|要解决的问题|首批入口|
|---|---|---|
|基础计算|给定同一时间，得到同一结果|rational Time、曲线、矩阵、带键随机；不单独计为效果|
|单元素动作|一个对象怎么变化|transform、opacity、anchored squash、shake；stagger 负责错峰编排|
|双画面转场|A 画面如何交给 B 画面|push、rect wipe|
|构图|多个对象怎样安排空间关系|offset cards、split panels|
|配方|多个机制怎样服务一个意图|offset reassembly：错位构图→错峰归位|

首批 10 个目录条目之外，第二阶段新增 1 个路径机制（`geometry.polyline-trail`）；路径采样与尾迹是同一机制的配套操作，不拆开凑数。第三阶段再加 1 个对象局部揭示机制，共 12 条；有限收敛残差是基础计算，不额外计作元素。第四阶段增加固定 raster 片块机制，共 13 条；分散与反向重组是同机制的方向，不算两个元素。其后新增焦点接力配方，共 14 条；随后加入片块归位署名配方 B，共 15 条。两者都是组合配方，不是新增 primitive。不同幅度、方向和颜色是参数变体，不是新元素；基础数学函数也不凑入动作数量。`stagger` 是编排，不伪装成能单独绘制的画面。

仓库中的实现唯一维护在 `engine/motion-elements/`。可移植 Skill 将同一源码打包为 `runtime/motion-elements/`，与 `motion-render-core`、`motion-timeline-core` 和 `motion-audio-core` 保持相邻；不要手改生成快照。静态目录为包根 `catalog.json`，公共入口为 `lib/index.mjs`，具体参数以包内 README、目录和实际验证器为准。

## 每次编码的最短路径

1. **写动词与作用层。** 是窗口进入、卡片归位、画面交接还是镜头震动？说明对象、局部/世界/屏幕坐标、接触点和预期结果。拟声词或参考作品名称不能替代机制。
2. **查目录。** 用类别、标签、输入数量与限制筛选；查看示例、参数范围、`status`、适用与禁用条件。目录项存在不等于已验证适用于当前片。
3. **先组合。** 现有动作能组合就写项目参数或配方，不复制基础函数。布局先算空间关系，动作再加时间变化，避免二者争写同一个位置。
4. **按风险隔离最小例。** 仅为新机制或尚未验证的风险，用普通卡片、文字块或几何图形验证，先不带品牌、角色或背景素材；已有适用证据可复用并做片内回归，不机械重做demo。明确同属性组合顺序，不用字段遍历顺序决定矩阵叠加。内部短测试不等于用户样片交付。
5. **接回镜头。** 锁定对象身份、层序、读时、离位/接触交接与语义 cue。视觉库不自动播放音效，不修改音乐淡入淡出；同一个 cue 可交给音频时间线，但同步还需实测与合听。
6. **验证再沉淀。** 先检技术，再常速观看；回写适用边界与反例。某次失败后补限制、修测试也是积累，不要求每次都新增模块。

影片交付与基础库收录分轨：通用化、目录收录、Gallery、Case/Technique或Skill沉淀不阻塞首个完整候选。先用满足本片需求的项目实现接回镜头并完成交付，再按实际证据与授权沉淀；不能把收录规则变成本片额外审批门。样片通过后的推进见[交付步骤](delivery-workflow.md)。

## 离线目录：先查反例再选机制

```sh
node engine/motion-elements/scripts/query-catalog.mjs list
node engine/motion-elements/scripts/query-catalog.mjs find --text 重组
node engine/motion-elements/scripts/query-catalog.mjs show --id fragment.fixed-tiles
```

解包 Skill 将 `engine/` 换成 `runtime/`。输出 JSON 包含完整条目与反例；`find` 是字面元数据匹配，反例也可能命中，不是适合度排名、语义推荐、置信度或艺术分数。多个筛选条件取交集，无匹配就返回空结果，不编造推荐。先完整读 `counterexamples`、状态与证据边界，再决定试用。查询不执行示例、不导入目录中的入口、不联网、不写案例；查询不增加机制数量；当前数量与分类以 `catalog.json` 及 `list --limit 100` / `list --kind recipe --limit 100` 的查询结果为准，不沿用历史阶段计数。

实验示例不是风格锚点，目录返回不构成默认推荐。先分开核技术证据、艺术接受和生产迁移：技术 passed 不得提升后两门；完整作品已被否决时记录该版质量不通过并退出成功范例，不能只写未验。独立 API 尚未审美验证则保留 NOT_RUN，不因来源影片失败改判数学错误。当前选材优先明确代码生成的 UI/图形与快节奏编排，细腻光影、材质和运镜主导的参考须先证明能力，不能靠增加实验配方数量补足。

## 视听事件复查：独立区间 sidecar

仓库入口 `tools/reference-benchmark/event_intervals.py`；解包 Skill 入口 `runtime/review-tools/event_intervals.py`。只打包这个标准库模块、合成示例、测试及说明，适用 Skill 根 `LICENSE`；不打包整套依赖数值库的 profile 生成工具。

```sh
python3 runtime/review-tools/event_intervals.py --help
python3 -m unittest discover -s runtime/review-tools -p test_event_intervals.py -v
```

从仓库运行时将 `runtime/review-tools/` 换成 `tools/reference-benchmark/`。详细 `evaluate` 参数和纯合成 CLI 演示见同目录 `EVENT_INTERVALS.md`；该上游说明里的仓库路径，在解包后同样替换。输出选已有临时目录下的新 JSON 文件，不覆盖输入或旧报告。

必须显式提供双方媒体、外部已有 profile、注释和证据根目录。profile 生成仍需仓库的完整 reference-benchmark 工作流；sidecar **不解码视频、不听声音、不检测事件、不生成 profile**，只核对绑定并做已声明事件的区间算术。合成演示的 bytes 故意不是媒体，不算影片证据。

成功仅 `COLLECTED_NOT_APPROVED`，时间验证仅 `BOUND_PROFILE_NOT_REDECODED`。`STALE/MISSING/BLOCKED` 是失败收据，无测量结果；未知、歧义、计划不能变成实测零值。区间差不是统计置信区间，含零不代表同步通过。先按 review actions/windows 回看原始证据，再作人工判断；算术 sidecar 不生成 HTML、不改旧 benchmark schema，不提供自动艺术评分或通过门。

## 时间、坐标和转场边界

- 渲染器给出 global frame，通过已有 timeline-core 的 `framesToTime` 转为 rational Time。不要按调用次数累加进度、使用 `Date.now()`、隐式读取全局随机数，或在片段导出时擅自从零重播。
- `sampleMotion` 接收显式动作区间和当前时间，采样与 Canvas 绘制分离。动作前/后状态、零长度拒绝与端点以包内契约为准。镜头最后一帧不一定采到数学终点；需要终态留读就安排 hold，不偷改帧分母。
- 变换使用像素、弧度与明确 pivot，父子矩阵按约定顺序组合。`anchored squash` 保住选定锚点，不证明角色肢体或材质自然。
- 转场同时涉及 A/B 内容与遮罩/层序，不等于给一个元素做淡出。A/B 回调仍必须确定性；库不能替项目保证其内部状态。回调内自行 clip 时也不能泄漏到下一幅画面。
- 现有音频 timeline 的 schema 没有因此成为视频 NLE。元素包只复用精确时间计算；场景总时长、重叠模式、scene-local 时间与音频编排仍由项目明确处理。
- 只使用实际提供的选项。未实现的任意路径 morph、真实透视、布料/碎裂物理、自动审美评分或 reduced-motion 策略不能写进交付能力；本版 reduced-motion 保持区间长度与语义时刻，使用终态布局/静止或中点切换；这不是无障碍体验审查通过的证明。

## 路径与尾迹：先统一几何，再安排时间

`compilePolyline({points})` 编译折线路径；`samplePath(path, progress)` 返回位置、单位切向、局部弧长距离与段号；`sampleTrail(path, {headProgress, length, samples})` 从同一条路径取尾迹。路径点、头部与尾迹共用几何，不再各自插值一套轨迹。

- `progress` / `headProgress` 为 `[0,1]` 的**局部累计弧长比例**，不是秒数，也不是段索引。时间如何映射为进度由时间线/曲线明确给出；只有线性进度配合线性时间，才是局部弧长匀速。
- `points` 坐标、`length` 与输出 `distance` 使用同一局部长度单位，不自带屏幕像素含义。纯旋转保留长度；父级缩放会改变屏幕距离与速度，非均匀缩放还会随方向改变比例；父变换只施加一次，不能宣称屏幕匀速或恒定像素尾长。
- 尾部距离为 `max(0, headDistance - length)`，在起步时自然缩短；不得为了保持完整尾长而让尾巴跑到头部前面。`samples` 是几何采样数量，不是帧数。
- 折点使用出段切向，终点使用入段切向；转角可瞬间变向，不保证旋转连续。等距尾迹采样点连接时可能跨过尖角；需按内容检查采样密度，不能声称精确重建每个折点。
- 这是折线位置/尾迹采样，不是贝塞尔平滑、SVG 路径解析、路径 morph、物理跟随或自动避障。编译对象只接受本模块实例创建的结果，不把序列化副本当可直接使用的路径。
- 此机制本身不读取时间或 reduced-motion 偏好；示例由场景选择终态并保留原时长。需用首尾、接近起点、折点、乱序 seek 和父变换测试，再做真实镜头连续观看。

## 有限收敛与对象局部揭示

`sampleFiniteSettle(u, {amplitude, oscillations, decay})` 输出艺术解析残差 `residual` 和相对于归一化 `u` 的导数 `derivative`；首尾两者均为零。残差可能为负，**不是 `[0,1]` 进度，更不能直接写入 opacity 或 mask progress**。把它按明确单位映射为位置/角度/尺度的偏移，并与基础曲线组合；尺度须保持业务所需的正值范围。导数不是自动换算好的每秒速度；时间映射与链式换算由调用者负责。这不是质量/阻尼/刚度物理弹簧，也不是依赖上一帧的模拟。

`withLocalReveal(ctx, spec, draw, {Path2D})` 在对象局部 `bounds` 的固定圆角矩形内，以四方向之一的揭示条带裁切同步绘制。对象 transform 由调用者先应用一次，mask 跟随该局部坐标，不自行定位或二次乘矩阵。独立 `Path2D` 建立几何边界，不改 Canvas current path；但回调自己的 `beginPath` 等操作仍由回调负责，不能冒称适配器撤销了任意回调副作用。回调抛错也恢复 clip/transform/style；异步绘制不支持。

这不是 A/B 双场景转场、字形 alpha 扫光、任意轮廓 mask 或拓扑 morph。内容的透明洞会保持透明，但几何 mask 不从内容像素自动提取边界。`progress=0` 不调用绘制，`progress=1` 仍受完整圆角边界限制；不要借完成态把边界外内容漏出来。参数、方向字符串、后端能力以实际包内 README 与验证器为准。

示例分别检查卡片位移、足底锚定形变，以及移动图表/带透明洞图标的局部揭示；合成展示不替代真实角色动作或字形阅读审查。残差和 mask API 本身不读取 reduced-motion 偏好。当前示例的 reduced-motion 仅归零残差、将揭示改为中点切换，仍保留卡片基础位移与图表平移/旋转；不能称为全面停止运动或无障碍审查通过。需要更严格静态布局时由项目另外明确策略，保留总时长。

## 固定片块：同源、同身份、全局时间反射

`compileTileScatter` 固定网格、tileId、源裁切 UV、homeRect、中心及带种子的目标；`sampleTileScatter(plan, at, {direction})` 用共享 rational 时间采样；`drawTileScatter` 接受预绘完成的 raster。文字卡先整张栅格化，再切片；这不是 glyph shaping、拆字理解或物理碎裂。

- 调用者在整个机制期间保持 source **同一对象、像素不变**。适配器绑定首次有效 source 对象并检查裁切尺寸，拒绝换对象；但不 clone、不逐帧 hash、不自动检测同一 Canvas 被重绘。冻结 JS 对象不等于冻结像素，不得宣称库自动验证全部内容。
- 非整除余边用整数边界完整分配；UV、home、tileId 不随帧改变。父矩阵由调用者施加，片围绕各自 home 中心旋转，不重复加原点。不通过扩大裁切/目标宽度或隐藏片块遮盖接缝。
- `direction:'in'` 反射完整全局时间，再计算 stagger，包含先后顺序；不是逐片局部 `1-q`。所有片精确归零时才用同 source 整图裁切绘制一次；不提前阈值 snap。终态身份、矩阵与覆盖证明仍必需，不能拿整图路径遮掩错片。
- 精确 home 与整图基线在相同 source、父变换、绘图状态和后端下可做逐像素对照；**运动中的旋转/缩放/透明边缘采样缝不保证消失**。坐标连续不等于屏幕像素差连续，归位邻帧需慢放检查。不承诺跨后端像素一致。
- 示例两类输入是非整除棋盘/细线/透明孔与整张文本卡；8 秒前半分散、后半反向重组，首 1.5 秒显示身份 debug，之后清洁画面。reduced-motion 使用整图中点出现/消失，保留时段、不执行碎片运动。debug 不替代关闭 overlay 后的图像重建验证。

## 配方 A：信息与焦点接力

`compileFocusHandoff` / `sampleFocusHandoff` 组合已有动作与局部揭示，固定 **1920×1080（16:9）设计空间、7 秒**，不是任意响应式布局或视频 NLE。三张唯一身份卡片，选中卡从入口起最高 z，不中途跳层；每张卡分段继承单一 transform writer，opacity 独立。父矩阵只支持正等比缩放和平移，不可随意拉伸/旋转。

顺序为入口→选择停留→选中卡放大归正→详情阅读→同框下一内容接管→下一内容阅读。内容由 caller 按稳定 ID 绑定；`detailReveal`、`nextReveal`、`drawPrevious` 明确交接状态，不在 callback 暗换图。下一内容必须在相同局部框内先画完整不透明背景，再以 local reveal 覆盖；不要透明文字叠印或双正文交叉淡化。短标题需实测字宽/安全区，示例溢出拒绝，不将自动缩小冒充排版。

reduced-motion 入口三卡可见，相对 start 的 1.925 秒切焦点布局、4 秒切内容，阶段与阅读 hold 保留；不是缩短总时长，也不是艺术/舒适度验收。7 秒双内容合成 demo 无循环、无声音；每个内容独立等比显示，输出 210 帧。A 与下述 B 是独立配方，不隐式串成可变时长时间线。

## 配方 B：片块归位与署名

`compileTileSignature` / `sampleTileSignature` 固定 **1920×1080、8 秒**：相对 start，0–1 秒认识整图，1–2.20 分散，2.20–2.55 停留，2.55–3.75 回归，3.75–4.55 归位阅读，4.55–5.15 整图缩小上移，5.05–5.65 署名揭示，余下固定收尾。不循环填时，也不是新 primitive。

正反阶段共用同一 tilePlan、固定身份/UV/home；返回阶段映射时间后只反射一次完整时间（含 stagger），不得再自行倒转进度。source 父节点到相对 4.55 秒前固定，归位阅读后才整体变换；应用返回 matrix 一次，再 drawTileScatter，不二次乘父矩阵。`source.geometryBounds` 只是完整 home raster 足迹，不是运动片群 union bounds。编译时另用保守扫掠界限查设计安全区，不能拿 home bounds 做碎片碰撞判断。

source 对象绑定由 tile adapter 验证，**同对象像素不变仍是 caller 责任**；不自动 clone/hash、不换图或提前 snap，采样缝限制继续有效。署名是独立层局部几何揭示，不是字形碎裂重组或 alpha 扫光；调用者核对字宽、安全区、素材来源。

reduced-motion 保留完整源图，不演碎片叙事；整体落定仍保留，署名在相对 5.35 秒切换，阅读 hold/cue 不变。双内容示例是内存几何图与整张文本卡，无私有媒体、无音轨；技术通过不等于已完成常速叙事、艺术或听觉审查。

进度界面的退镜/文字读时、共享数据源与七卡收束经验，见[进度界面短片复用笔记](progress-scene-reuse-lessons.md)。该笔记区分实际 API 复用、项目编排与待提炼候选，不新增目录条目。

## 收录规则：代码和经验各放其位

新机制先作为候选，至少提供以下内容：

- 稳定 ID、版本、类别、参数验证、默认合成示例和明确限制。
- 时间首尾与相邻帧、分数帧率、非法输入和乱序重复采样测试。
- 所有绘制状态在正常与抛错路径均恢复；必要的 anchor、边界和遮罩覆盖检查。
- 实际预览及其检查范围。静帧、密集帧、正常速度连续观看、实际听审与用户接受分别记录，不互相代替。

“可进入库”不等于“成熟稳定”。技术检查通过可支持有限的技术状态；艺术评价只能来自对应输出、方法和版本。迁移到另一种内容/尺寸/构图后再积累使用证据；没有迁移证据就保留限制，不贴普遍成功标签。

元素目录中的 `knowledgeLinks` 只链接外置 Case/Technique 的身份与版本，不复制影片素材或个案反馈。默认公开知识库为空，不用虚构生产案例填满链接；链接也不自动证明证据仍有效，更不授予媒体权限。已有知识库撤回、反证和版本检查规则继续有效。首版没有实现自动写回 Case 的接口，不宣称已经完成闭环自动化。

复刻时建议按以下判断归档：

- **已有机制，参数不同：** 保存项目使用参数，不新增底层元素。
- **已有机制的新组合：** 写配方，列出组成元素和语义检查点。
- **新的独立机制：** 先做合成候选和测试，再申请收录。
- **只是某个角色、品牌或素材特别好看：** 留在项目美术/案例里，不伪装成通用 motion 元素。
- **发现失败条件：** 增加反例、限制或回归，不删除历史证据。

## 可视化与发布

包内 `examples/gallery-scene.mjs` 与 `scripts/render-gallery.mjs` 用合成内容展示基础元素；仓库中可运行：

```sh
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/motion-gallery-new
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/motion-gallery-reduced-new --frame 43 --reduced-motion
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/motion-path-new --demo path
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/motion-settle-reveal-new --demo settle-reveal
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/motion-tiles-new --demo tiles
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/motion-focus-new --demo focus-handoff
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/motion-signature-new --demo tile-signature
```

从已解包 Skill 根目录运行时，把 `engine/` 换成 `runtime/`。父目录须存在、输出目录必须尚不存在；不把生成结果放进源包。首批总览是 8 秒无声合成 Gallery，4 秒演示显式重复一次，不把这个重复展示算成新的动作或作品。路径示例另用 8 秒画面同时展示不等长电路折线与旋转父级下的节点连线两种合成上下文，不是两个新机制。完整参数以包内 README 为准。预览视频、逐帧 PNG、检测报告和临时 HTML 输出到仓库外。Git 仅收代码、静态目录、示例源、测试及许可，不收生成帧或私人作品。

可移植构建须验证四个相邻包、目录与许可齐全，解包到新目录后运行元素测试和 Gallery；不能只检 ZIP 文件存在。旧音频入口和渲染默认保持不变。Gallery 技术成功只证明例子可运行，不证明任意影片的节奏或美学已过审。

仍需执行[动作与接触门](motion.md)、[混合美术流程](hybrid-art-workflow.md)和[有引导的自审](guided-self-review.md)。基础库降低重复编码成本，不替代导演判断。

## 已声明事件的静态可视化（按需，不默认强跑）

已有双方外部 profile、annotations、证据绑定并生成事件 receipt，需要检查复刻差异时，可用 `runtime/review-tools/event_interval_report.py render --receipt /local/receipt.json --out /local/new-report.html`；仓库入口替换为 `tools/reference-benchmark/`。详细字段与合成示例见同目录 `EVENT_INTERVAL_REPORT.md`。没有这些输入时先记录缺失，不虚构事件或把工具当自动听审。

报告是静态 HTML 内嵌 SVG，四条 lane 保留各自原始时间，不自动对齐。unknown、ambiguous、planned 各自显示，不擅选候选或补零；区间为算术包络，不是统计置信度。renderer 只读 receipt，不重新打开媒体、验证旧证据或认证听看，不提供艺术评分。HTML/SVG生成与结构测试通过，不等于完整浏览器交互、常速播放或听觉审核已完成。输入与报告保持仓库外；默认公开 KB 仍为空。

## Iris 圆形揭示：OVER 而非透明替换

`transition.iris-reveal` 按半径进度（不是面积）扩大局部圆。`drawTransition` 第四参数显式注入 `{Path2D}`；parent 由 caller 施加一次，非均匀缩放在屏幕成为椭圆。独立路径不污染 current path，callback 自己的改动不在回滚保证内。

A 始终完整保底，B 在圆内 source-over；**end/after 仍调用 A+B**，B 透明孔透出 A，不是透明 B-only replacement，不能擅自撤销 A 生命周期。终态只 clip viewport 避免角点抗锯齿漏角，不用互补圆内/圆外 clip 或装饰环遮缝。共享 hero 要从两背景移出，由 caller 在背景后单独画一次；库不自动角色去重。

适用于 Clawd 等角色连续、B 背景不透明的场景切换，但需项目自己保持角色身份与层序；不是已验证任意真实场景。reduced 在 raw progress=0.5 切 A-only→完整 A+B，保留时段，不按 eased 半径切换。真实复刻、艺术与声音验收仍独立。

合成预览：`node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/iris-new --demo iris`；portable 将 `engine/` 换成 `runtime/`。8 秒240帧720p无声，四panel展示opaque与透明OVER两类语义；不包含私有角色素材。

### 单调采样带形包络（experimental）

`compileSampledBand({samples:[{x,y,halfWidth},…]})` + `drawSampledBand` 生成
上边正序、下边反序的闭合分段直线填充轮廓，见 Motion Elements README 的
sampled band 合同与 `examples/sampled-band-study.mjs`。适合二维变宽带、图表
对称区间；半宽是竖直距离，不是法线恒宽、任意曲线 morph、织带物理或 3D。
调用方负责采样密度、时间与层序。允许零宽尖端/夹点；全零宽不绘制。
此 API 从项目方法提炼并独立验证，未回填现有成片，不能把项目成片验证算作
新 API 的生产迁移或艺术认可。沿用已有路径/拖尾、变换、错峰与 mask API，
不按颜色、层数、时长计新条目。

## UI 布局、关键帧与同身份交接

新增 grid / intrinsic-size stack / explicit scalar keyframe 三个基础机制，
以及 layout-handoff 配方。该 UI 批完成时为 21 基础＋5 配方；当前计数以目录为准，不能把配方或 helper 混为基础数。
调用参数与边界见包内 `docs/ui-foundations.md` 和 `docs/layout-handoff.md`。
验证候选的实际调用回执在私有交付，不随源码包公开；只证明明确覆盖的API分支。
原冻结影片与后续边界修复版本分别绑定：新旧等价回执不能冒充修复版全长重渲。
keyframe 的影片覆盖为 hold，handoff 为 shared 身份交接，不外推 enter/exit、
任意曲线、2.5D、失焦或自动排期。工程/解码帧检查、常速观看、听审和用户艺术接受
分别记录；当前 NOT_DONE / NOT_LISTENED / PENDING_USER 不得自动升级为 passed。


## 数据关系：把关系与数值真正映射为几何

该数据批接入时为 23 基础＋6 配方（共 29 项），全部 experimental，未到 100 基础目标。
新增 `composition.layered-dag` 用拓扑分层表示分支/汇合，
`composition.weighted-flow` 按统一数值量纲分配两端端口；
`recipe.flow-handoff` 组合旧 keyframe/smoothstep/lerp 与新加权布局，
在同一拓扑上交接内部守恒快照。曲线填充仍为旧 sampled-band，不重复计数。

适用于订单、审核、汇总等数据关系的说明；不是业务优化、流体、全局避障、
反馈环或任意拓扑形变。配方 v1 不支持 0↔正值激活/停用，需满足明确的正宽度数值裕量。
新库 API/限制/工程复现见包内 `docs/data-flow.md`；
与用户所列 20 库的需求选择、官方具体源码和许可对照见 `docs/data-flow-reference-decisions.md`。
不新增运行时依赖，不把参考阅读、方向/颜色或辅助函数变成条目。

这批有 14 秒原创有声作品的冻结源码/实际调用证据：一份 DAG 初始化结果、
加权端口的直接初始化与配方输出被实际画面消费；配方采样为 f408–839。
不要把缓存结果绘制写成每帧重新编译。微量守恒校验修复后的版本另附实际逐帧状态与 Native 代表帧等价回执，不是全长重渲。
具体参数/帧区间、SHA-256 与完整重建链留私有交付；
本源码包只含合成数据示例。静态解码/数值/像素确定性检查通过不替代常速观看或听审：
`NOT_DONE` / `NOT_LISTENED` 仍保留；用户对本交付有限接受，视觉设计不作风格范例
（`LIMITED_ACCEPTANCE_NOT_STYLE_ENDORSEMENT`）。不得据此标优秀作品、默认推荐风格或迁移通过；
技术有效性不因这一视觉评价变为失效，未覆盖分支也不得借作品升级。


## 图文：连续覆盖与局部纹理弯曲

该图文批接入时25基础＋6配方（31项），距100基础目标75项；全部experimental。
新增`raster.matte`及`raster.displacement-map`，没有新配方；模式/滤波/颜色与snapshot/adapter helper不重复计数。
在最终尺寸生成字形coverage，先位移纹理再matte，避免把低分辨率字边一起放大或扭曲。
适合受控二维图文材质，不是光学折射或物理模拟。完整参数、边界、资源与复现见`docs/raster-effects.md`；
Pixi官方shader与p5 mask具体源码/许可取舍见`docs/raster-reference-decisions.md`，不引入依赖或复制第三方实现。

12秒有声候选有实际调用与绘制回执，范围仅alpha正向覆盖及正scale/bilinear/clamp位移，map alpha为opaque。
影片没有验证luma、invert、nearest、transparent边缘或其他场景艺术效果；不能把单测外推为作品认可。
算子/adapter/index保持影片冻结字节，目录查询分类是后续元数据整合；原片清单不改写。
常速观看NOT_DONE、听审NOT_LISTENED、通用生产迁移NOT_RUN分别记录。
本交付获有限接受，视觉设计不作风格范例（LIMITED_ACCEPTANCE_NOT_STYLE_ENDORSEMENT），
不得泛化为优秀作品、风格背书或其他参数的艺术通过；原冻结清单与后续反馈分开绑定。
首轮Native资源中断与修复实验保留私有；HD循环需量测RSS、有界局部池及后端生命周期管理，
单帧像素预算或JS heap稳定都不是长片内存证明。不得拿技术成功默认推荐风格。


## 角色：两段固定长度追随明确目标

当前30基础＋6配方（36项），距离100基础目标仍有70项；数量与艺术接受分别报告。
`geometry.two-link-ik`是1个纯二维几何机制，无新配方，不是全身rig、碰撞、力学或3D。
root/target来自作品同一绝对帧状态，显式bend/fallback；用返回joint/end画骨段，不能把不可达end偷偷画到target掩盖投影。
实际手掌轮廓与IK端点不是同一个接触定义：数值误差0后仍要看真实编码邻帧是否早贴、滑动或错位。
完整参数/奇点/精度与复现见`docs/two-link-ik.md`；官方取舍见`docs/character-reference-decisions.md`。

14秒有声角色候选真实使用两臂正常可达两bend；旧路径、finite-settle和矩阵复用，不把脚步/表情/音效数成新项。
原冻结求解器及实际导入依赖保持字节一致，真实调用与限段邻帧已核；作品此前视觉早贴版本不作成功证据，最终修版单独绑定。
内外投影、fallback和奇点有工程测试，不是本片覆盖；常速NOT_DONE、听审NOT_LISTENED、迁移NOT_RUN。
该角色作品被否定，REJECTED_NOT_STYLE_REFERENCE：不要当成功风格推荐；不因此否定IK数值合同。
作品参数/媒体/私有回执不随源包分发，后续重用仍须为实际镜头验证，不默认推荐风格。

## 校准平面视差：1基础，非真正3D

`composition.plane-parallax`将零相机对齐的平行画稿映到明确viewport，近远层横移/推进遵守同一关系。
`planeParallaxLayout`不绘图、不排序、不clip，不把focalLength当独立光学变焦。
实际14秒候选840次投影/每帧四层绘制，固定校准、同宽高比与正常near距离；其余数值边界只有工程验证。
见`docs/plane-parallax.md`和`docs/parallax-reference-decisions.md`。直接模块及依赖字节绑定原片，公共index仅测试。
技术和四个编码静帧核查不等于常速观看/听审：NOT_DONE、NOT_LISTENED保留；通用迁移NOT_RUN。
用户正面反馈仅对应本海岸作品及逼真水面效果（POSITIVE_FEEDBACK_SCENE_SPECIFIC），不是所有参数或整库风格认可。
主体身份、旧位移、裁切、生成画稿与声音不拆成更多机制；实际素材/参数/私有回执不含在公共源包。

## 滚动分区内sticky：1基础，非完整CSS

`composition.sticky-interval` / `stickyIntervalLayout`接收未滚动内容rect、所属纵向区间、绝对scrollOffset和pinY，输出最终视窗本地rect及phase。
不要再减一次scrollOffset；外层位置/clip仍由旧机制负责。它不处理DOM、惯性、重叠或自动分区。
一支12.5秒候选两标题990次调用/绘制；三个phase有可见效果，离屏后的求值不算视觉覆盖。
最终版9个sticky编码帧与4个交接/结尾帧限定审查通过；常速NOT_DONE、听审NOT_LISTENED及通用迁移NOT_RUN不改变。
用户对本UI作品有限认可（LIMITED_ACCEPTANCE_NOT_STYLE_ENDORSEMENT），不误记为拒绝或优秀风格范例。
完整合同见`docs/sticky-interval.md`；官方源码/许可判断见`docs/ui-scroll-reference-decisions.md`。
真实导入solver/依赖同字节，公共index只由测试验证；旧motion/reveal/shared handoff、海报美术和声音不重复计数。


## 弯曲图文：近似距离路线＋显式字格布局（2基础）

`geometry.cubic-path`接收明确三次控制柄并编译有限精度距离表；`sampleCubicPath`返回原曲线位置与解析切线。
它与既有polyline分工，不能直接把progress当cubic参数伪称等距离，也不提供导航/碰撞。
`composition.glyph-run-path`把调用者准备的advance cells排到路径，返回基线中心/法线/朝向；
不是shaping、kerning、轮廓弯曲、自动fit或遮挡检测。先compile品牌plan，再layout，不能从JSON伪造计划。
指南为`docs/cubic-path.md`、`docs/glyph-run-path.md`；Paper.js与Anime.js固定源码/许可取舍见`docs/curved-type-reference-decisions.md`。
新代码直接位于`lib/foundations/geometry/`与`typography/`，没有修改既有作品锁或平层实现。

9.5秒有声候选真实消费两项：3次初始化编译；5785次公sample区分3297缓存构建、1918直接绘图与570相机辅助；
glyph内部采样不加到公wrapper数。570次run提交不等于全程完整可见，外壳/画外/工具遮挡需看实际画面。
两runtime与实际validator保持影片冻版字节，公共index接入另测；原生产manifest不回写。
旧motion.transform/withMotion继续复用，切刀/打孔/供带造型/声音是作品编排，无新配方。
全帧状态与限定编码帧有证据，常速NOT_DONE、听审NOT_LISTENED、用户艺术PENDING_USER、通用迁移NOT_RUN。
未验分支、字体/语言支持和风格不得由一次作品外推；真实艺术参数、字体、媒体与私有回执不进入公共包。
