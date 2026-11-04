# 制作批次与限定调用证据

本页从原模块长 README 迁出，保留各批当时的调用范围、修复桥接、反馈及未验项；不是当前成片验收记录，也不新增私有证据。数量、旧路径或“本次”均指对应历史批次，不提供旧入口兼容。当前使用合同从 [README](../../README.md) 与 catalog guidance 进入，历史影片源码／锁／媒体未改。

最初注册阶段为10项；随后路径、局部揭示、片块、两配方、Iris及轮廓形变阶段依次达到11、12、13、14、15、16、17条。这些历史总数不作为当前60基础＋7配方的统计入口。

首批不包括任意 path morph、文字拆字碎裂、网格扭曲、粒子物理、布料、自动节奏创作、完整 NLE、实时 GPU 预览或自动美学判分。后续按真实制作缺口扩展，而不是凑数量。

## UI 首批：3 个基础机制＋1 个配方

新增 `composition.grid`、`composition.constraint-stack`、`motion.keyframe-track`，
以及组合配方 `recipe.layout-handoff`；配方不算基础机制。
完整中文用法、参数边界、反例与可执行示例见 [UI 使用指导](../ui-foundations.md)
和 [布局交接配方](../layout-handoff.md)。该批公共入口为 `lib/index.mjs`；下文记录该批接入时的范围。

本批已在一支私有有声验证候选中实际调用，代码身份与调用回执经独立复核。
验证视频、参考资源、实际参数/帧段、媒体 hash 和用户反馈留在私有交付，不进 Git。
影片制作后边界修复保留原冻结源码身份，另以逐调用状态和代表帧等价回执绑定修复版；
不将原片冒称为修复版全长重渲。
覆盖范围必须分别看：grid/stack 使用了布局坐标，keyframe 使用 hold 分支；
handoff 只在影片中覆盖 shared 身份的位置/尺寸交接，未覆盖 enter/exit fade。
原时间曲线由调用方显式重映射，不代表库新增任意 Bézier 支持。

已完成工程与解码帧检查；常速连续观看 `NOT_DONE`，听审 `NOT_LISTENED`，
用户艺术接受 `PENDING_USER`。实际调用证据不是风格推荐或原创生产迁移通过，
更不等于 100 项目标已经完成。静态布局重算不自动动画，不用整体平移冒充角色表演。


## 数据关系批：2 个基础机制＋1 个配方

`composition.layered-dag` 把分支/汇合关系排成前后阶段；
`composition.weighted-flow` 按统一量纲分配两端流带端口；
`recipe.flow-handoff` 在固定拓扑上交接内部守恒的权重快照。
不是 grid 方向变体，不把旧 sampled-band 包络或辅助数学函数重新计数。
见[使用指导与限制](../data-flow.md)及[20 库官方实现对照与许可决定](../data-flow-reference-decisions.md)。

本批在 14 秒有声原创作品《订单流动》中真实调用，同一批 100 单为合成演示数据，
不代表业务性能提升。原冻结库源码与影片源码 hash 匹配，初始化与可见消费区间分开记录。
影片后微量守恒校验修复由逐帧状态及代表 Native 帧等价回执另行绑定，不冒称全片修复版重渲。
真实调用、全帧数值守恒、抽样乱序/新进程像素、最终解码帧经核查；
常速连续观看 `NOT_DONE`、听审 `NOT_LISTENED`、用户对此交付有限接受，但不认可其为设计范例（`LIMITED_ACCEPTANCE_NOT_STYLE_ENDORSEMENT`）。
这不构成优秀作品、默认风格推荐或普遍生产迁移认可；技术状态不因此改判失效。
影片不覆盖空/非法图、极端数值、恒零链路或 reduced-motion 的视觉接受；这些不能靠一支片泛化。
媒体、逐帧回执、完整项目与用户反馈仍留私有交付；仓库只包含可运行合成数据示例和测试。


## 图文批：2 个像素机制，无新配方

`raster.matte` 以连续像素覆盖将纹理限制在清晰字形中；`raster.displacement-map` 用二维位移图弯曲纹理，
而非整体移动文字或重数已有条带错位。alpha/luma、滤波、方向、颜色均为参数，不增加数量。
快照、字节复制和显式Canvas输出是配套helper，不算元素。
见[接口、资源边界与复现指导](../raster-effects.md)和[官方源码/许可对照](../raster-reference-decisions.md)。

两项已被12秒有声原创图文候选的实际画面消费：matte覆盖alpha/invert:false；
位移覆盖正scale、bilinear/clamp和opaque map alpha。新算子、adapter与index源码匹配影片冻结字节；
目录/查询新增raster分类和指导属于影片后的元数据接入，不冒称全包同字节或全片重渲。
实际调用回执、原生代表帧和解码检查不替代常速观看、听审或用户认可；
常速`NOT_DONE`、听审`NOT_LISTENED`分开保留；用户对本交付有限接受，视觉设计不作风格范例
（`LIMITED_ACCEPTANCE_NOT_STYLE_ENDORSEMENT`），不是优秀设计或通用艺术通过。
首轮整片中断、仅GC未解决Native资源压力；调用方采用有界独立scratch池和事件循环yield/GC后完成。
这只是指定Native版本/该场景的资源实测，不是跨后端实时或无限长循环保证。
媒体、完整制作项目和哈希回执不进公开仓库；目录小输入与单测可离线复现数值/像素合同。


## 角色动作批：1 个二维两连杆机制

`geometry.two-link-ik` / `solveTwoLinkIK` 在固定两段长度上将末端放到明确目标，
不可达时作显式内/外投影；不是整体平移，也不是把父矩阵换个名字重新计数。
只新增1基础，无新配方。见[严格合同与使用指导](../../lib/foundations/geometry/two-link-ik/README.md)、
[Paper.js/Matter.js官方实现与许可取舍](../character-reference-decisions.md)。

一支14秒有声原创角色候选真实消费了两臂求解结果；覆盖固定长度、正常可达、两侧bend，
未覆盖投影/fallback/奇点的作品效果。旧polyline、finite-settle及矩阵辅助继续复用；
支撑脚编排、物体轨迹、手部美术、相机与声音不另算机制。
数值target误差为0也不能证明画出的手掌恰在该时刻接触；本片曾发现视觉早贴，
通过修改项目手型/接近时序并审查最终编码邻帧闭合，未修改冻结IK求解器。

求解器及实际导入依赖字节匹配原冻结影片；目录、测试与指导为后续源包接入，不篡改历史清单。
工程与限定解码邻帧检查通过，常速NOT_DONE、听审NOT_LISTENED；用户对该角色作品的视觉设计否定，
记录REJECTED_NOT_STYLE_REFERENCE，不作为成功风格范例。这不等于IK技术失效；保持experimental，不写成物理抓取或通用迁移通过。媒体、制作源码与实际艺术参数留私有交付。

## 镜头与跨场景批：1 个校准平面视差机制

`composition.plane-parallax` / `planeParallaxLayout` 用明确深度、相机和viewport连接已对齐画稿的近远差速及推进缩放。
零相机时各层保持同一构图；它不是把独立平移换名，也不是任意XYZ或真正3D相机。
只新增1基础，无新配方；图层数量、父矩阵、clip、原图生成与位移纹理均不重复计数。
见[使用合同/实际覆盖](../../lib/foundations/layout/plane-parallax/README.md)、[Three.js/OGL源码及许可取舍](../parallax-reference-decisions.md)。

一支14秒有声原创候选在840帧实际求值，每帧四层matrix均用于绘图，主体与水面共享深度。
固定校准、同宽高比viewport与正常near距离有本片调用证据；其他分支仅工程测试，不扩大作品覆盖。
实际导入源字节与影片一致，index导出只作公共API测试；元数据接入不改历史manifest。
全解码/seek/状态与限定编码静帧核查通过，常速NOT_DONE、听审NOT_LISTENED、通用迁移NOT_RUN。
用户对本海岸作品及逼真动态水面给出正面反馈（POSITIVE_FEEDBACK_SCENE_SPECIFIC），不扩称听审、全部参数或通用风格认可。
完整制作、画稿、音源、影片及私有回执不进该源包，不将合成海景说成真实观测或流体模拟。

## 产品UI滚动批：1 个容器内sticky区间机制

`composition.sticky-interval` / `stickyIntervalLayout`让分区标题自由滚入、到指定位置保留、随所属分区末端退出。
只新增1基础，无新配方；旧滚动motion、clip与同ID海报到票据的handoff继续复用，不换名称重复计数。
见[坐标/数值/实际覆盖指南](../../lib/foundations/layout/sticky-interval/README.md)、[Anime.js源码与MIT、CSS工作草案取舍](../ui-scroll-reference-decisions.md)。

一支12.5秒有声原创候选中，两标题合计990次成功求值/矩形绘制；normal/pinned/released实际出现。
离开视窗后的持续计算不扩称可见验证。最终版本有9个编码sticky阶段帧和4个交接/结尾帧独评，未套用旧版本结论。
全帧几何/代表Native/解码技术通过；常速NOT_DONE、听审NOT_LISTENED、通用迁移NOT_RUN。
用户有限认可本UI作品（LIMITED_ACCEPTANCE_NOT_STYLE_ENDORSEMENT），不是被否决，也不是风格范例背书。
solver及实际导入依赖与影片一致，但存档未使用的旧index不等于当前公共index；只声称对应真实导入范围，不声称全包同版。
媒体、制作和实际美术参数不进该源包；本机制不是完整CSS、惯性、自动碰撞或真实购票。


## 弯曲图文批：2 个基础机制，无新配方

`geometry.cubic-path` 给控制柄路线提供近似距离寻址与解析切线；
`composition.glyph-run-path` 将显式字格advance排成同一路线上的基线中心/朝向。
不是折线改色，也不把编译、采样、字体测量、路径绘制缓存或辅助函数另算机制。
新实现直接放在职责目录`foundations/geometry`及`foundations/typography`，旧路径与作品锁不动。
见[曲线严格合同](../../lib/foundations/geometry/cubic-path/README.md)、[字格布局与画法](../../lib/foundations/typography/glyph-run-path/README.md)、
[Paper.js/Anime.js固定源码与许可取舍](../curved-type-reference-decisions.md)。

一支9.5秒有声原创候选实际使用两项：初始化3次编译；公路径采样分别用于绘图缓存、
直接绘制和相机辅助；570次字格布局/绘制提交不等于全程完整可见。
旧motion.transform与withMotion继续复用；供带、障碍、切刀/打孔、取景与声音是作品编排，
不是新机制、自动导航或物理模拟。API/实际依赖与影片冻结字节一致，公共index接入独立测试。
逐帧状态、独立数值oracle、代表Native重建及限定编码帧检查已有证据；
常速NOT_DONE、听审NOT_LISTENED、用户艺术PENDING_USER、通用迁移NOT_RUN。
作品媒体、完整制作、实际艺术参数、字体和私有回执不进Git；这里的可运行输入为合成例子。


## UI尺寸换行批：1 个基础机制，无新配方

`composition.flow-wrap` / `flowWrapLayout`保持项目顺序，依据各自width/height在明确容器宽度里换行。
它补充等尺寸grid和单轴stack，不按颜色、间距、方向或快照个数增加条目。
新实现直接位于`lib/foundations/layout/flow-wrap.mjs`；见[尺寸、IEEE边界、组合与官方参考指南](../../lib/foundations/layout/flow-wrap/README.md)。

7.6秒、60fps有声候选真实执行2次初始化布局，六项从2行变3行；旧layout-handoff两段编排消费端点，
456帧绘制提交不等于每帧重新排版或全程可见。项目中间腾行快照与UI抽屉时序不另算机制/配方，
静态算法不提供连续避碰保证。实际求值模块/依赖与影片冻版一致，公共index为后续接入。
全帧状态/代表Native重建已有工程证据；最终版本32个编码帧限定独评无阻断，不由几何断言替代，
也不复用旧长版本的帧数或媒体回执。
常速NOT_DONE、听审NOT_LISTENED、用户艺术PENDING_USER、通用迁移NOT_RUN；保持experimental。
媒体、真实美术/字体参数、生成图层及私有回执不随公共源包发布。


## 纸面折叠批：1 个刚性凸平面铰链机制，无新配方

`geometry.hinged-panel` 在 authored XYZ 中绕明确折线旋转平面，允许父×子组合；
印刷点使用同一 sampled matrix。它是可被Canvas投影绘制的几何，不是纯二维旋转或通用三维引擎。
新实现位于 `lib/foundations/geometry/hinged-panel.mjs`；见[严格输入、画法、父子坐标与入库前官方核验](../../lib/foundations/geometry/hinged-panel/README.md)。

10.8秒有声候选中8计划、648帧/5184次面片求值、136752辅助点变换均真实供绘制。
背面/遮挡提交不等同于可见；摄影机、海水、灯光、船及旧stagger/opacity不再计数。
入库前修复未知own字段/必填继承/异常数组，新增128层范围；原视频/原冻结runtime/manifest未改。
648帧实际状态/绘图路径与24代表Native及新进程比较建立修复版等价，不称源码同字节或重新编码全片。
用户对整组三片给出正面反馈，不推断单片或音频细节独立验收；
常速NOT_DONE、听审NOT_LISTENED、单项艺术PENDING_USER、通用迁移NOT_RUN。
影片媒体、字体、私有实际参数及回执不进公共源包；保持experimental。


## 悬线与排期批：2 基础＋1 配方

- `geometry.catenary`：由支持端点、固定输入长度和重力方向求静态悬链线，按弧长地址取点/切线。[使用/数值范围/原影片桥接](../../lib/foundations/geometry/catenary/README.md)。不是动态绳索或电传播模拟。
- `composition.interval-lanes`：固定半开区间按重叠分配最少互换轨道；显式改时后重算端点快照。[使用/最少性/投影限制](../../lib/foundations/layout/interval-lanes/README.md)。不自动改时间。
- `recipe.staged-layout-handoff`：明确中间布局和连续时段，组合旧handoff为先横移再收轨等交互。[调用/阶段/reduced规则](../../lib/recipes/staged-layout-handoff/README.md)。这是配方，不计基础，也不自动避碰或生成waypoint。

分别有8.5秒和8秒有声候选、实际调用/绘图回执与限定独立解码帧审。
悬链线修复了原型人为taut阈值；原视频/原冻结源码不改，510帧数值＋13代表Native/新进程桥接不冒称新片重编码或状态逐位相等。
排期片两次初始化端点、480次配方采样；313帧提交1252卡片绘图、312帧正Native alpha，不把采样次数当持续可见次数。
运行时experimental；常速NOT_DONE、听审NOT_LISTENED、用户艺术PENDING_USER、跨场景迁移NOT_RUN。媒体/字体/图像/私有实际参数与回执不进入公开库。


## 显式标量场等值轮廓：1 基础

`geometry.iso-contour` 将规则标量网格按固定NW-SE两三角线性域提取为折线，真实作品中轮廓可合并、分裂并围出孔洞；不是预定点对应的polygon morph，也不是流体物理。详见[合同、填充前提、数值边界与复现](../../lib/foundations/geometry/iso-contour/README.md)。

10.4秒有声候选实际调用1次grid compile、624次extraction，624帧分别fill/clip/outline消费471572顶点。公共硬化版降低样本上限并补IEEE塌缩段诊断；原影片和原冻结源码不改，624帧完整状态与真实绘图几何精确桥接、22代表原PNG及22新Node一致，不冒称新片重编码或全帧像素相等。

仍experimental；独立限定编码节点审通过不升级常速NOT_DONE、听审NOT_LISTENED、用户艺术PENDING_USER或通用迁移NOT_RUN。影片参数、媒体、字体、私有回执不进入公开库。


## 图片变纸卡与摄影墙：4 基础，2 支独立验证作品

- [邻域卷积](../../lib/foundations/raster/convolution/README.md)：显式非负归一核的blur/unsharp是一个机制，不是两个滤镜条目；sRGB/alpha/边界与64M采样预算明确。
- [四角图像投影](../../lib/foundations/raster/projective-raster/README.md)：一张图用单一homography映射到凸四边形，同平面点映射只是helper；无真正3D/抗锯齿或自动前后面切换。
- [不等高砌列](../../lib/foundations/layout/masonry/README.md)：已测高项目按源序落入最短列；不是等格grid、逐行flow-wrap或全局优化。
- [有限候选锚点标签](../../lib/foundations/layout/anchored-labels/README.md)：按优先级尝试避开保护框及已有标签，无位可用明确报告；不测字、不识别焦点、不自动路由引导线。

9秒有声纸卡候选实际验证前两项，8.4秒有声摄影墙候选验证后两项。前者公共输入硬化版有540帧实际状态/像素buffer/绘图记录及22代表PNG+22新Node桥接，原影片不改；后者两个runtime与实际10文件闭包同字节。静态初始化、缓存绘制、正alpha与可见像素严格区分；摄影标签三项全不透明仅49帧，不能凭技术合格宣称舒适阅读。旧staged交接复用不新增配方。

全部experimental；限定编码帧审不升级常速NOT_DONE、听审NOT_LISTENED、用户艺术PENDING_USER、通用迁移NOT_RUN。图片/字体/声音/私有参数与回执不进公开库。

## 印刷覆盖与二维柔性响应

新增四个独立 experimental 基础：覆盖率网屏、矩形覆盖率形态学、二维加权仿射蒙皮、解析阻尼响应。前两项用于 AFTER RAIN，后两项用于 ROOM FOR TWO；未新增配方。见[公共集成与影片证据](../print-rig-integration.md)。技术通过不代表用户接受或听审通过。
