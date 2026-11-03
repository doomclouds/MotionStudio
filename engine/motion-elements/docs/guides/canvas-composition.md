# 矩阵、转场与 Canvas 组合边界

[返回入口](../../README.md) · [目录与公共 API](../registered-foundations.md)

本页保存对应机制的详细合同、合成示例和已有证据限定。历史批次数量不是当前目录数，已有测试描述不代表本次重新运行或艺术通过。代码片段中相对导入以本页所在目录为基准；shell 命令按各段注明的工作目录运行。

## 矩阵、锚点与组合

Canvas 六元矩阵使用列向量；`multiply(A,B)` 表示先应用 B，再应用 A。局部 transform 顺序固定为：

`T(position) · T(origin) · R(rotation radians) · S(scaleX,scaleY) · T(-origin)`。

`sampleMotion` 可选 context `{reducedMotion,parentMatrix}`；世界矩阵为 parent × local。`transformPoint` 和 `transformBounds` 使用同一矩阵。geometryBounds 仅为几何矩形的轴对齐包围盒，不含描边、阴影、光晕或 shader 外溢；没有把它冒充 visualBounds。负 scale 是显式镜像，零 scale 允许消失；本版不提供 inverse 或奇异矩阵求逆。

组合需要明确：先在一个 transform 内写位移/尺度/旋转，或显式 `multiply` 构建层次。`composeMotionStates([{channel:'transform',state}, {channel:'opacity',state}])` 仅允许一个 transform writer 和一个 opacity writer；同属性竞争默认报错，不靠数组顺序静默覆盖。所有状态为深冻结输出；调用者的输入不被修改。

## 转场与 Canvas 适配

`sampleTransition(spec, at, {reducedMotion:false})` 返回含 viewport 的类型专属状态：push/rect-wipe/iris 使用 layers，linear-mask 使用 polygon/revealProgress；不要假定所有类型都含固定两层数组。`drawTransition(ctx,state,{outgoing, incoming})` 依次调用两个同步绘制回调，局部视口原点为 (0,0)。本版不编译多场景时长、scene-local 时间映射、音频淡入淡出或完整视频剪辑时间线；由项目显式提供各场景内容/时间。不是对现有 audio timeline 的隐式扩展。

- push 为避免 Native Canvas 两个独立抗锯齿边缘露底，位移使用 **nearest integer local pixel**，两层共享同一个整数边界；宽高必须正整数。Canvas 父变换必须非零整数轴向 scale、整数 translation，无 rotation/shear；不符合时拒绝。可见 1 像素步进是声明过的首版取舍，不能宣称任意亚像素仿射下无缝。
- rect-wipe 始终在 A 上覆盖 B，不让两个半透明边缘相互拼接。方向表示揭示边界的移动方向。
- 两场景需自行填满视口，或有意提供透明内容；库不生成背景替内容遮盖错误。
- adapter 使用 save / try / finally / restore，隔离 transform、alpha、clip、style 等绘制状态。Canvas 当前 path 不在 save/restore 状态内，回调应自行 beginPath；不要依赖调用前后的当前路径保持。
- 回调必须同步，不允许 AsyncFunction 或返回 thenable。此约定不是安全沙箱，也无法撤销普通函数自行启动的异步副作用。不要在 draw 中注册延时绘制。

## Reduced motion

开启后不改变任何范围、进度或 cue 时间：transform 使用终态布局，squash/shake 静止；opacity 仍按原时间；双场景转场改为中点静态切换。recipe 保持错峰时间与透明度，仅停止空间运动。不声称该策略替代无障碍可用性审查。

## 单品英雄镜头缩入多卡场：保持同一绘制对象

适用：单品收口后需要显露一个更大的产品/内容集合，且英雄画面必须成为其中一张卡；不是将任意全屏截图缩小的通用转场。

- 把英雄镜头写成局部视口绘制函数，以一个稳定卡片身份放进调用者拥有的世界布局。转场前后的内容、局部时钟、文字与内层运动一致；若需要定格，在交接前明确进入 hold，不在缩放时偷偷重置动画。
- 父级视图变换（二维相机类比）从英雄卡充满视口的变换开始，再统一缩放、旋转、平移整个场。邻卡预先位于世界空间，随视口边界露出，不靠分批切入截图冒充镜头拉远。卡片数量、尺寸、位置由项目决定，不新增机制或目录项。
- 卡片内裁切与父级视图变换分工：clip 在局部视口，父矩阵只施加一次；卡片回调不得 resetTransform/clearRect 整个主画布。相同绘制函数支持独立镜头与嵌入卡片，不读取上一帧画布。
- 交接验两类证据：交界前后帧的主体内容/颜色是否跳变；至少两个独立世界锚是否共同受同一矩阵控制。数学坐标记录不冒称像素追踪，低帧差也不证明对象身份与审美成立。检查任意跳时、逆序和终态。
- 缩小后文字不必全部可读，但主焦点、明暗块节奏和留读目的必须成立。若卡墙只是炫技、缺少需要显露的集合，直接停留英雄镜头更合适。

限制：这里只给调用者的组合方法，不提供自动布局、遮挡避让、3D透视、深度或相机 API；连续观看/听审/艺术接受仍需逐片执行。现役 transform 与 Canvas 组合已足够，不因此增加基础机制计数。
