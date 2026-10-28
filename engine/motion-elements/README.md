# Motion Elements — 可组合动效基础库

第一阶段包含 **10 个机制**，而不是 10 套影片模板。数字不同、方向相反、快慢不同均是参数变体，不重复计算新元素。当前全部标记 `experimental`：数值与 Native 像素测试不等于审美验收，也不等于已经在原创成片中复用通过。

## 五层与边界

- `lib/math.mjs`、`matrix.mjs`、`time.mjs`：插值、曲线、稳定随机、矩阵和共享时间适配。这些辅助函数不算元素。
- `lib/motions.mjs`、`stagger.mjs`：transform、opacity、anchored-squash、shake、stagger。
- `lib/transitions.mjs`：push、rect-wipe，明确 outgoing / incoming 两个画面。
- `lib/layouts.mjs`：offset-cards、split-panels。布局只给位置、矩阵、层序，不暗藏动画时钟。
- `lib/recipes.mjs`：offset-reassembly，只组合已有动作和布局，不另造求值器。
- `adapters/canvas.mjs`：把纯状态应用到同步 Canvas 回调。核心不加载浏览器、DOM、GSAP 或 Motion Canvas。
- `catalog.json`：稳定 ID、版本、可执行输入、适用条件、反例、验证状态与知识链接。参数校验以运行时代码为唯一权威，不存在另一个放宽校验的 JSON 执行入口。

需要已有 Node 24+。纯状态核心仅依赖同级 `motion-timeline-core` 的有理数函数，无新 npm 依赖；原生预览/像素测试使用已安装的 `@napi-rs/canvas`，完整示例导出需要 FFmpeg。不会自动下载或安装。

## 最小调用

```js
import {
  rational as T, framesToTime, sampleMotion, withMotion,
} from './lib/index.mjs';

const move = {
  type: 'motion.transform', version: 1,
  range: {start: T(0), end: T(2)},
  curve: {type: 'smoothstep'},
  params: {
    from: {x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0},
    to: {x: 120, y: 0, scaleX: 1.2, scaleY: 1.2, rotation: 0},
    origin: {x: 50, y: 50},
  },
};
const at = framesToTime(15, {n: 30, d: 1});
const state = sampleMotion(move, at, {reducedMotion: false});
withMotion(ctx, state, c => c.fillRect(0, 0, 100, 100));
```

`sampleMotion` 输出 `{matrix, opacity, phase, progress}`。每次求值只依赖输入，不递增内部播放状态，不使用 `Math.random()`；顺序、倒序和跳时应相同。范围是 `[start,end)`，到数学 `end` 可以取得终态，但帧渲染器通常不渲染项目结束帧；需要终态停留时显式留出 hold，不把 N 帧映射成 N−1。

时间用 timeline-core 的 `{n:'integer',d:'positive integer'}`。先有理数比较边界，进入内部才转为浮点进度。范围要求 start ≥ 0、duration > 0、end ≤ 24 小时；不支持零时长动作或负项目起点。`framesToTime` 为共享函数，调用者提供有效正帧率。

曲线：`{type:'linear'}`、`{type:'smoothstep'}` 或 `{type:'cubic-bezier',values:[x1,y1,x2,y2]}`。Bezier 按 x 反求参数；本版控制值均在 0..1 且 x1 ≤ x2，不支持 overshoot 曲线。

未知字段、显式 null、NaN、非法枚举、重复 ID、负间距/错误范围等拒绝，不做静默降级。

## API 与参数

`catalog.json` 给出每个元素可执行示例，包括所有必需字段。名称和函数：

| 元素 ID | API | 主要参数 |
| --- | --- | --- |
| motion.transform | sampleMotion | 完整 from/to `{x,y,scaleX,scaleY,rotation}`，可选 origin |
| motion.opacity | sampleMotion | from/to 在 0..1 |
| motion.anchored-squash | sampleMotion | amount 0..0.8、axis x/y、origin |
| motion.shake | sampleMotion | amplitudeX/Y、rotation、frequencyHz、seed、elementId，可选 origin |
| motion.stagger | compileStagger | itemIds、start、duration、step；三时间均为 Time |
| transition.push | sampleTransition | width、height、direction left/right/up/down |
| transition.rect-wipe | sampleTransition | width、height、direction left/right/up/down |
| composition.offset-cards | offsetCards | itemIds、origin、card、offset，可选 rotationStep、zOrder |
| composition.split-panels | splitPanels | itemIds、viewport、axis，可选 gap |
| recipe.offset-reassembly | sampleOffsetReassembly | 卡片布局参数、Time step、travel |

所有 motion/transition/recipe spec 都有 `type,version:1,range,params` 和可选 curve；layout 与 stagger 直接接受表中参数。stagger 表示错峰启动，不是串行等待，返回稳定 itemId 和绝对 range。recipe 的整体 range 保持不变，每个卡片动画时长 = 总长 − 最后卡片延迟；不足正时长则拒绝。

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

## 可视化与测试

在仓库根目录：

```sh
node --test engine/motion-elements/test/*.test.mjs
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/elements-gallery-new
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/elements-still-new --frame 43
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/elements-reduced-new --reduced-motion
```

`--out` 必须是父目录已存在、目标目录尚不存在的新目录。默认输出 `motion-elements-gallery.mp4` 和 `render.json`：8 秒、1280×720、30fps、240 帧、无音轨。示例展览 **显式每 4 秒重复** 便于观察；库内部没有自动循环。`--frame 0..239` 只输出指定帧 PNG，可用于暂停检查。媒体是生成产物，不提交 Git。

示例通过 `examples/gallery-fonts.mjs` 在常见 Linux 系统字体目录寻找 DejaVu Sans 或 Liberation Sans，显式注册 regular/bold 到专用字体族；不下载、不附带字体，不含私有机器路径。若找不到会打印警告并使用平台 sans-serif fallback，此时字体外观不保证。CLI 的 `render.json`（单帧则为 stdout）记录实际字体文件名和 SHA-256；跨机器比较像素时必须同时核对这些字体哈希。通用 native renderer 的源码 fingerprint 不包含系统字体字节，不能仅凭该 fingerprint 声称跨机器像素一致。

gallery 源文件为 `examples/gallery-scene.mjs`，同时符合 native renderer 的 createScene 接口；无私有角色、品牌、参考媒体或生产数据。展示只是说明机制，不冒称“发布会级模板”。测试覆盖数值边界、固定种子、乱序状态/像素、Canvas 异常恢复、双场景首尾及像素接缝。实际常速完整观看、美术认可、声音体验、跨平台浮点/字体像素一致均需另外验证。

## 从复刻中收录

1. 在项目中描述动词、动作因果、适用范围与反例；先检索 catalog，避免换参数就复制一份函数。
2. 提取不含私有内容的纯参数机制，提供至少三个参数变体、正常与 reduced-motion 示例，以及未知参数/边界/乱序回归。
3. 新机制先进入 experimental；其技术证据、关键帧与完整播放审查分别记录，不混为“通过”。
4. 在不同内容/尺寸/背景下验证，记录真实迁移 Case，再考虑 stable。知识库 Case / Technique 是证据与选择指导，catalog 是实现索引；knowledgeLinks 只填已存在、可核对的条目，不伪造成功经验。

首批不包括任意 path morph、文字拆字碎裂、网格扭曲、粒子物理、布料、自动节奏创作、完整 NLE、实时 GPU 预览或自动美学判分。后续按真实制作缺口扩展，而不是凑数量。

## 阶段 2：局部弧长路径与空间拖尾

新增一个机制 `geometry.polyline-trail`（experimental），不是把采样函数数量算成多个效果：

```js
import {compilePolyline,samplePath,sampleTrail} from './lib/index.mjs';
const path=compilePolyline({points:[{x:0,y:0},{x:120,y:0},{x:120,y:80}]});
const head=samplePath(path,0.1);
const trail=sampleTrail(path,{headProgress:0.1,length:45,samples:16});
// head: {position,unitTangent,distance,segmentIndex}
// trail: {tailDistance,headDistance,points:[same shape as head]}
```

- compile 只计算一次累计弧长，复制并深冻结输入；2..1024 个点，坐标各在 ±1e9 内。相邻重复、长度低于最小正常浮点数（2.2250738585072014e-308）、累计长度无法增加的段一律拒绝。只接收当前模块实例编译结果；序列化后应从 points 重新 compile，不接受伪造缓存。
- progress 必须在 [0,1]，不自动 clamp；按局部累计弧长分配，不按段数等分。精确顶点选出发段，末端选入射段；尖角方向可能跳变，不宣称平滑朝向。
- length 是有限非负**局部空间弧长**，不是秒、屏幕像素或比例；samples 是 2..256 整数。严格区间为 [max(0,headDistance-length),headDistance]。即使起步 headProgress<0.2，任何点都不能领先头部。length=0 返回重复头部点。
- points 为固定数量的等弧长采样；用直线相连跨越尖角时可能近似切角，不是保留全部顶点的精确路径裁剪。增加 samples 可降低近似误差，不承诺消除所有尖角误差。
- 路径函数不读时钟、不保存上一帧。外层通过已有 rational 时间与 sampleMotion 的 progress 驱动；换时间曲线就改变速度。非均匀父缩放后不保证屏幕等速，朝向和父矩阵由调用者显式处理。
- reduced-motion 在示例层选择静态终态，同时保留原时间范围；数学采样 API 不接收未实现的 reducedMotion 字段。
- 本轮没有 Bézier、粒子模拟、碰撞、平滑拐弯、时间历史拖尾或 finite-settle 新曲线。旧 primitive 结果不变。

两类合成内容在同一 8 秒、非正方形画布 demo：四段电路路径，以及旋转父坐标下的三个流程节点。使用相同函数，不含私有素材。

```sh
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/path-demo-new --demo path
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/path-still-new --demo path --frame 43
```

CLI 默认仍是原十宫格 `--demo gallery`；path demo 保持现有输出文件名 `motion-elements-gallery.mp4`，render.json 的 demo 字段区分内容。技术测试与合成展示不代表真实生产迁移或艺术认可，须另记证据。

## 阶段 3：有限落定残差与对象局部几何揭示

### Foundation：sampleFiniteSettle

```js
const {residual,derivative}=sampleFiniteSettle(u,{
  amplitude:0.3, oscillations:2, decay:3
});
```

u∈[0,1]；amplitude∈[-1,1]、oscillations∈[1,4]、decay∈[0,8]，所有字段必填，未知字段拒绝。这是 foundation，不另凑 catalog 效果数量。

令 E=sin(πu)² exp(-decay·u)，ω=2π·oscillations：
residual=amplitude·E·sin(ωu)；
derivative=amplitude·exp(-decay·u)·[(πsin(2πu)−decay·sin(πu)²)sin(ωu)+sin(πu)²·ωcos(ωu)]。
两个端点残差和导数显式为0，符合解析极限，不是末帧截断。

residual 是有符号残差，**不是 0→1 progress，也不是物理弹簧**；不能直接注入 opacity、mask progress 或受限 ease/lerp。abs(residual)≤abs(amplitude)，amplitude 只是系数，不是实际峰值。derivative 对 u 求导，若位移尺度 L、时长 D>0，物理时间速度为 L·derivative/D。基础轨迹本身若端点不静止，相加后仍不静止；示例基础使用 smoothstep。

reduced-motion 在组合层把残差设0，保留基础轨迹/时段；没有低层空选项。角色示例通过脚底 pivot 与面积保持 scale 实现回弹，不把角色推入地面。尺度最终应>0。低FPS仍可能混叠：演示3秒2周期，在24/30/60fps至少每周期36帧；更短时段应减少周期或不用该效果，不修改数学定义迁就帧数。

### Reveal：withLocalReveal

```js
withLocalReveal(ctx,{
  bounds:{x:0,y:0,width:240,height:140},
  progress:0.6, radius:12, direction:'left-to-right'
},drawContent,{Path2D:canvasApi.Path2D});
```

新增一个 catalog 机制 `reveal.local-geometry`，总计12。最后参数必须显式注入后端 Path2D（Native 或浏览器），要求支持 roundRect/rect 与 ctx.clip(path)；不自动下载或切换后端。方向只接受 left-to-right/right-to-left/top-to-bottom/bottom-to-top。bounds x/y 限±1e6，width/height 为(0,1e6]；radius∈[0,min(width,height)/2]，progress∈[0,1]，均不静默clamp。

调用者拥有局部矩阵，API 不接收或重复施加矩阵。可见域=固定圆角边界∩方向条带，不将条带重新圆角。progress=0 不调用内容；progress=1 仍完整clip。用两个独立 Path2D，不修改调用者 current path；save/finally restore 保绘图状态。**内容callback自己修改current path或外部对象不在回滚保证内**。仅同步callback：AsyncFunction/thenable拒绝，不是能撤销恶意异步副作用的沙箱。

这只是几何裁切，不是字形alpha mask、署名扫光、滤镜、任意SVG或多边形morph。透明孔洞仍透明。reduced模式在示例层按原时段中点cut，无低层另一个时钟。

四格合成片分别展示：到位卡片、脚底锚定几何角色、非均匀父缩放和旋转下的图表窗口、两方向透明图标展示框；各机制两种内容。显式每4秒重复一次，8秒无声；当前只作技术展示，艺术/重量感/常速审看与真实迁移证据另计。

```sh
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/settle-reveal-new --demo settle-reveal
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/settle-reveal-still-new --demo settle-reveal --frame 43
```

## 阶段 4：固定片块分散 / 全局时间反射重组

一个机制 `fragment.fixed-tiles`，catalog 总计13。反向只是同轨迹倒放配方，不另算一种物理。先由调用者完整绘制一张 raster，再编译固定身份：

```js
const plan=compileTileScatter({
 sourceRect:{x:0,y:0,width:641,height:359},columns:8,rows:5,
 seed:'demo',instanceId:'card',
 range:{start:rational(0),end:rational(3)},step:rational(1,50),
 displacement:{x:85,y:60},maxRotation:0.18
});
const state=sampleTileScatter(plan,at,{direction:'in'}); // out 或 in，必填
drawTileScatter(ctx,sourceSnapshot,plan,state);
```

sourceRect x/y 是非负安全整数，右/下边界也必须为安全整数。width/height 各1..8192，总面积≤16,777,216；行列正整数且不超过对应像素尺寸，总片数≤256。位移各0..1e4局部长度，旋转0..π弧度。seed/instanceId 遵循现有 seededUnit 验证。range 共用 rational Time，step≥0，整段扣除(N−1)·step 后每片时长必须>0。使用同一 shared timing/rational 实现，不修改旧 compileStagger 的128项上限。

按 floor(i·width/columns) 的整数边界分片，非整除余边完整保留。每片 tileId=row:r/col:c、sourceRect、homeRect、center固定；home从(0,0)开始，不另设目标拉伸。dx/dy/rotation 分离随机通道，只由seed、instanceId、tile索引决定。plan深冻结；state与plan品牌绑定，伪造/序列化对象须重新compile，不能跨模块实例冒充。

每片 progress=smoothstep(local u)，围绕其home中心旋转，不重复加片原点。`in` 先反射**完整全局时间** start+end−at，再计算同一stagger，包含顺序；并非只对局部q做1−q。所有q精确0才atHome，每个matrix严格单位矩阵；禁止阈值提前归位。atHome只将同一个source完整裁切域绘制一次，避免分片边界重采样缝；其它时刻逐片固定row-major绘制，不扩大UV、不补宽、不alpha隐藏错误。整体绘制不替代tile身份/矩阵正确性测试。

**sourceSnapshot 是调用约定，不是自动冻结像素的容器。** adapter将plan绑定首次有效source对象，换对象显式拒绝；每次检查crop位于实际source尺寸内。但同一个Canvas的像素仍可被调用者修改，库不clone、不逐帧hash、不自动验证像素内容。调用者必须预绘完成并在整个机制期间不再改source像素；否则确定性和同源重建保证不成立。冻结JS对象不能冻结Canvas像素。本轮未提供私有offscreen捕获API。

调用者设置父矩阵；adapter save/transform/drawImage/finally restore，不修改current path。精确home在同source、同ctx状态/父变换、同Canvas后端下与整图基线逐像素一致。**运动期不承诺任意父变换下逐片无缝**：旋转/缩放/透明边缘可能产生采样缝或混色；即使非常接近home也不提前snap。连续坐标不等于像素差连续，末端切换整图的观感需要慢放审查。

两类合成输入均内存绘制：非整除641×359棋盘/细线/透明孔/半透明块，以及整张文本卡快照（不解析字形）。8秒展示前4秒out、后4秒in；首1.5秒身份debug，之后干净画面。reduced模式整图中点出现/消失，保留区间，不伪装为碎片运动。

```sh
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/tiles-study-new --demo tiles
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/tiles-still-new --demo tiles --frame 224
```

没有任意形状碎裂、glyph shaping、物理碰撞、内容自动抓取、motion blur或音效。技术验证/邻帧检查/常速艺术审看/真实迁移分别记录，不能互相冒充。

## 离线目录查询（metadata，不执行动作）

当前目录为 **13 个 experimental 机制**。先缩小候选，再读适用条件/反例；不是检索命中即推荐，也不是艺术评分：

```sh
# 仓库根目录运行；也可用脚本绝对路径从任意 cwd 调用
node engine/motion-elements/scripts/query-catalog.mjs list --limit 100
node engine/motion-elements/scripts/query-catalog.mjs find --text '重组' --status experimental
node engine/motion-elements/scripts/query-catalog.mjs find --tag trail --kind geometry
node engine/motion-elements/scripts/query-catalog.mjs show --id fragment.fixed-tiles
```

纯模块独立于绘制/动画 exports，无 I/O：

```js
import {queryCatalog} from './engine/motion-elements/lib/catalog-query.mjs';
// catalog 是调用者已解析的仓库 catalog.json；不接受路径或远程地址。
const selection = queryCatalog(catalog, {tag:'重组', limit:10});
```

- `list` 可用 kind/status/text/tag/limit；`find` 额外要求 text 或 tag；`show` 只接受精确 `--id`，不存在即 `total:0, results:[]`，不猜 ID、不自动替代。
- kind 仅 motion/transition/composition/recipe/geometry/reveal/fragment；当前 status 仅 experimental。所有过滤条件 AND。一个 tag 作规范化后的完整标签匹配；多个标签/重复参数拒绝，不偷偷改为 OR。
- text 为 NFC、首尾去空白、小写化后的 **literal substring**，无分词、正则、向量/AI/置信度。搜索字段限 id/summary/api/tags/applicability/counterexamples；英文与中文均可，但不自动翻译或展开同义词。反例也可能命中，`reasons.fields` 明确指出；证据/knowledgeLinks/示例参数不参与全文匹配。
- id 不做规范化，必须是小写 canonical ID；kind/status 也要求精确。text 1..256、tag 1..64、id 1..128 UTF-16 units（规范化前），空白或控制字符拒绝。limit 默认20、整数1..100；CLI 仅普通十进制，不接受01/1e1等形式。最多13个命令参数，未知/重复/缺值/非法枚举均退出2且仅stderr报错。
- 按 ID Unicode code-unit 升序稳定排序（不是相关度排行），`total` 是过滤后的总数、`truncated` 表示受 limit 截断。无匹配是正常退出0。结果保留每条完整 example、applicability、counterexamples、evidence、knowledgeLinks 与匹配原因，深复制且不改输入。
- `example` 是既有 API 的完整参数输入；需要 Canvas/context 的 API 仍须调用者按上文提供环境，不是自动运行脚本。查询**不执行 example、不动态 import entry、不访问证据或私有 knowledgeLinks、不联网、不调用动作、不改知识库**。CLI 只读相对脚本固定位置的 catalog.json；只向 stdout 输出 JSON，不提供 --catalog/--out 等路径入口，不创建文件。若重定向由调用者自行保证目标是新文件。
- 标签为通用机制描述，不含用户/影片私有信息；标签增加不代表技术/艺术/迁移验收升级。foundation（例如 finite-settle）仍非独立机制，不为查询凑数。schemaVersion 1 原字段保持兼容，仅 additive tags。

`test/catalog-query.test.mjs` 覆盖合成中英文、字面匹配/反例、无匹配、边界、CLI错误、真实13条与不变性；Node 24 permission 模式只授权 CLI/查询模块/catalog 三个文件读取，实际运行成功，不需要动画入口或任何私有链接读取权限。

## 配方 A：信息 / 焦点接力（固定 7 秒）

`recipe.focus-handoff` 是现有 transform、offset-cards、stagger 与 local-reveal 的组合配方，不是新基础动作或 NLE；目录现在14条。首版只做此配方，不包含片块回归署名配方。

```js
const plan=compileFocusHandoff({
 type:'recipe.focus-handoff',version:1,
 cardIds:['draft','structure','output'],selectedId:'structure',
 detailId:'detail',nextId:'next',start:rational(0),
 travel:{x:0,y:55},rotationStep:0.03,focusScale:1.6
});
const state=sampleFocusHandoff(plan,at,{
 reducedMotion:false,parentMatrix:[1,0,0,1,0,0]
});
```

固定1920×1080设计空间、640×360局部卡片；正好3个唯一cardIds，selectedId必须存在，detailId/nextId与卡片ID互不重复。ID遵循现有64字符规则。start≥0且start+7≤24h。travel各轴±100以内，rotationStep±0.04以内（三张最大旋转±0.08），focusScale1.3..1.6。所有字段必填，未知字段拒绝。plan深冻结，仅真实编译对象可采样。首版不开放任意时长或额外曲线，避免压缩阅读hold。

时间以start为零点：0–0.70入口；0.70–1.50选择停留；1.50–2.35选中卡放大归正、其它短退场；2.35–3.65详情阅读；3.65–4.35下一内容接管；4.35–7.00下一内容阅读。返回 cueTimes 为绝对rational，phase在边界切换；矩阵连续。选中卡从第一帧起最高z=3，绝不途中跳层。每张卡每时刻只有一个 transform track，其opacity独立；入口末态精确继承到focus from。

state.layers 持久保留三张卡的 itemId/zIndex/matrix/opacity/rect/geometryBounds。父矩阵只允许正等比缩放与平移，不支持旋转、非均匀缩放或把任意拉伸叫响应式。geometryBounds为当前父变换后的几何AABB，不含阴影或内容溢出。焦点中心固定(960,500)，内容接管期间同一框不动。

**内容绑定是调用者职责，不在callback里暗换图。** 每层 content 明确给出：
- baseId：短标签与thumbnail绑定；
- detailId、detailReveal：选中卡在原布局额外揭示短详情，不能整卡突然重排；
- nextId、nextReveal：下一内容的方向揭示进度；
- drawPrevious：nextReveal精确1时为false，否则旧内容仍完整保底。

调用者按z排序、通过withMotion绘制，每个base只画一次；next使用withLocalReveal覆盖同一个640×360圆角框。next必须绘制完整不透明卡片背景，再绘新内容；**不能只透明画新文字或两份正文alpha交叉淡化**。配方返回状态而不接管Canvas/内容source。详情/下一内容标题必须简短，字宽与安全区由caller验证；这不是自动排版器，不能仅凭输入长度宣称可读。合成demo使用measureText，溢出直接报错，不偷偷缩成小字。未选卡标签需放在不被重叠覆盖的安全区；demo第1张左对齐、第2/3张右对齐。

reduced模式入口保留三卡可见；focus中点1.925s切焦点布局，handoff中点4s切内容，阶段和阅读时长不变。不是对整段缩时，也不声称已经通过舒适度/无障碍体验评审。

两内容合成demo：数据摘要选中中卡，图文卡选中第一卡，并排展示各自等比设计空间。7秒无循环、静音，输出210帧；其余旧gallery仍保持原8秒240帧。

```sh
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/focus-handoff-new --demo focus-handoff
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/focus-detail-new --demo focus-handoff --frame 90
```

技术门验证identity/z、阶段边界、单轨连续、父bounds、明确接管状态、reduced时序和乱序像素。实际能否看懂“先选谁、随后看什么”、阅读速度与声音质量仍是分开的验收，不以静音测试伪称audio-pass。

## 配方 B：片块回归 → 署名轻揭示（固定 8 秒）

`recipe.tile-signature` 复用 fixed-tiles、transform、local-reveal，不新增底层机制；catalog 共15条，其中3个配方。输入仍为调用者的 raster 与署名内容绑定，不取私有素材：

```js
const plan=compileTileSignature({
 type:'recipe.tile-signature',version:1,
 sourceId:'source',signatureId:'signature',
 sourceRect:{x:0,y:0,width:641,height:359},grid:'8x5',
 seed:'demo',instanceId:'study',start:rational(0),
 displacement:{x:60,y:35},maxRotation:0.16
});
const state=sampleTileSignature(plan,at,{reducedMotion:false});
```

固定1920×1080设计空间；只允许整体正等比缩放+平移的 parentMatrix。source/署名ID必须不同。sourceRect继承tile整数/像素预算，另外宽高比限1.5..2以保证本配方布局；grid只接受5x3/8x5，step固定0.01秒。位移上限各0.2×宽/0.25×高、旋转≤0.35rad。每片的中心平移区间加外接圆半径做保守扫掠边界验证，必须留在设计空间 x[24,1896]、y[24,900]；不是有限帧采样冒充连续证明。即使未超过位移上限，保守安全区不通过也会拒绝，需减小位移或换网格。严格字段、时长、品牌验证与其它配方一致。

以start为零：0–1认识整图；1–2.20分散；2.20–2.55片块hold；2.55–3.75回归；3.75–4.55归位读图；4.55–5.15整图缩小上移；5.05–5.65署名揭示；5.65–8固定收尾。source初始宽900、中心(960,480)，归位读图结束才变为宽720、中心(960,420)。署名局部bounds为800×110，位置(560,710)，与源图留白不相交。署名位于独立层，不用碎片拼字。

`sampleTileSignature` 返回 phase/cueTimes/source/signature：
- source.bindingId、matrix、geometryBounds、tilePlan、tileState；
- signature.bindingId、matrix、bounds、reveal。
source.geometryBounds 仅是父变换后的完整home raster足迹，不是运动片群的动态union bounds，不能用于碎片碰撞/屏幕包围盒判断；分散安全区由编译时独立保守界限检查。
source的 matrix 在0–4.55绝对固定；在source绘制中先应用此matrix，再调用drawTileScatter。回归阶段先映射 mappedAt=tileStart+(at−returnStart)，再对**同一个tilePlan**调用 direction=in；内部只反射一次完整global time，含stagger。归位后的 tileState 保留完整身份/UV与精确单位matrix，仅整体节点开始transform。没有alpha隐藏、epsilon提前归位或换图。

sourceSnapshot固定对象身份由drawTileScatter验证；**同对象像素不可变仍由caller保证**，本配方不clone/hash像素。使用同source完整绘制为端点基线；运动期采样缝/近端点像素差风险仍继承tiles合同，不声称任意变换下每片无缝。

绘制示意（不要重复乘父矩阵）：

```js
withMotion(ctx,{matrix:state.source.matrix,opacity:1},()=>{
 drawTileScatter(ctx,sourceSnapshot,state.source.tilePlan,state.source.tileState);
});
withMotion(ctx,{matrix:state.signature.matrix,opacity:1},()=>{
 withLocalReveal(ctx,{
  bounds:state.signature.bounds,radius:0,progress:state.signature.reveal,
  direction:'left-to-right'
 },drawSignature,{Path2D:canvasApi.Path2D});
});
```

调用者验证署名字宽、安全区和内容来源，合成demo measureText溢出即报错。Path2D适配器自身不改current path，callback自行改path仍不可回滚。固定8秒，不为署名增加假循环。reduced保留完整source、不演绎碎片叙事，metadata明确 `static-source-no-fragment-narrative`；整体落定保留，署名5.35中点cut，所有阅读hold和cue不改。不宣称舒适度审核或audio-pass。

```sh
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/tile-signature-new --demo tile-signature
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/tile-signature-home-new --demo tile-signature --frame 113
```

两类内存合成内容为透明几何图与整张文本卡；8秒连续顺序，不循环填时。正反状态、父锁定、归位像素、末帧署名与邻帧检查各自验证；人工常速叙事/艺术评审与技术测试分列。

## Iris reveal：圆域 over-reveal（不是透明场景 replacement）

新增 `transition.iris-reveal` 一项，catalog共16条、配方仍3条。与现有sampleTransition/drawTransition共用体系，原push/wipe三参数调用保持不变：

```js
const state=sampleTransition({
 type:'transition.iris-reveal',version:1,
 range:{start:rational(1),end:rational(5)},curve:{type:'smoothstep'},
 params:{width:640,height:360,center:{x:210.35,y:180.65}}
},at,{reducedMotion:false});
drawTransition(ctx,state,{outgoing:drawA,incoming:drawB},{Path2D:canvasApi.Path2D});
// Caller-owned shared actor, if any, is drawn exactly once after the backgrounds.
```

width/height是局部视口尺寸，各[1,8192]，面积≤16,777,216；允许非整数。center必须位于闭视口内，包括边/角。range/curve复用现有严格rational与曲线验证，无direction/areaMode/ring/replacement字段。最大半径为center到四角的最大hypot；radius=q·maxRadius，**按半径进度而非面积进度**。state显式提供viewport、center、radius、maxRadius、revealProgress、raw progress和composition='over-reveal'，两层matrix均identity。

唯一合成语义：**A全视口持续保底，B在圆内source-over覆盖**。
- before/start：只调用A，不调用B；
- 中途：完整A，随后viewport∩circle内B；
- end/after：继续调用A+B，B只clip完整viewport，不做圆clip，避免最远角抗锯齿漏角；
- B的透明孔有意显示A。若A也透明，按source-over显示caller底层。不能声称终态等于透明B-only；
- 即使B不透明，也不自动探测并跳过A；库不会自动销毁A场景。A/B按当前时间绘制，不缓存旧帧，after仍需A有效绘制上下文。若需后续独立B场景，caller提供opaque B或显式做另一次交接。

reducedMotion按**raw progress=0.5**从A-only切到完整A+B，不按eased q中点，不改range/cue。终态同over语义，没有突然撤除A。旧push/wipe自己的行为保持不改。

Iris必须显式注入Path2D，第四参数仅接受Path2D，未知字段拒绝；旧push/wipe可省略。adapter用独立viewport/circle路径，不调用beginPath，parent由caller设置且只作用一次；非均匀父缩放时屏幕上成为椭圆，这是局部圆合同，不继承push的整数限制。每层临时设置source-over并在finally恢复caller composite、transform、alpha、clip。两个callback类型在绘制前验证，AsyncFunction/thenable拒绝；不是能撤销外部副作用的沙箱。

adapter自身不污染current path；callback自行修改path仍不在回滚保证内。callback应在提供的clip内正常绘制，不clear/reset整个canvas、破坏clip或自行改合成语义；每帧初始化由caller负责。共享actor必须从A/B背景移出，drawTransition后单独画一次；库不检测/去重角色。若需遮挡，caller显式安排独立clip。

互补clip（A圆外+B圆内）曾在Native实测出现opaque场景AA边缘漏caller底色，**不是本实现**。本实现用完整A保底，不靠装饰环遮缝。真正透明replacement的多surface方案及生命周期/显存预算未实现，不暗称具备。运动圈内实际视觉与不同backend仍需验证。

两类合成案例各有中心变化：opaque桌面→几何花园与caller单次绘制角色；红A图表上半透明B及透明孔（偏心/角点），after孔仍显示红A。示例不含私有品牌/素材，无portal装饰环；蓝色圆环是B的内容本身，不是接缝遮盖。8秒单次展示、静音。

```sh
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/iris-study-new --demo iris
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/iris-end-new --demo iris --frame 150
```

技术证据覆盖分数center/radius的opaque红A蓝B绿caller底、透明end/after基线、原始中点、四角覆盖、Path2D/parent/异常隔离与乱序。技术通过不等于复刻/艺术/声音通过。

## Registered polygon morph (experimental; visual/production validation pending)

One bounded mechanism, `geometry.registered-polygon-morph` (catalog now 17 items):

```js
const plan = compileRegisteredPolygonMorph({
  vertexIds: ['tl', 'tr', 'br', 'bl'],
  from: [{x:0,y:0},{x:240,y:0},{x:240,y:140},{x:0,y:140}],
  to: [{x:20,y:10},{x:200,y:0},{x:250,y:150},{x:0,y:120}]
});
const state = sampleRegisteredPolygonMorph(plan, .5, {direction:'forward'});
drawRegisteredPolygonMorph(ctx, state, {fill:'#e4d9bd',stroke:'#fff',lineWidth:2},
  {Path2D:canvasApi.Path2D});
```

Explicit caller-asserted correspondence only: 3..32 unique IDs, equal vertex counts,
finite local coordinates with absolute value ≤10,000. Last edge closes implicitly;
do not repeat the first point. No reordering, matching, resampling, holes, curves,
glyph/image morph, split/merge, physics or 3D. IDs do not establish semantic correctness.
Both endpoints must be simple and share signed winding (`positive`/`negative`, not
coordinate-independent clockwise labels). Plans and genuine bound sample states are
immutable; cloned/forged plans and states are rejected. `q=0/1` copies exact endpoints;
reverse(p) has the same geometry as forward(1-p). Caller supplies progress in [0,1]
from existing time/curve tools; there is no new clock or unbounded easing.

Geometry tests use one fixed normalization from the union endpoint bounds: center
origin and S=max(1,width,height). Epsilon is 1e-8 in normalized coordinates. Every
sample conservatively rejects short edges, duplicate/near vertices, near-collinear
adjacent unit directions, nonadjacent intersections/touches/distances ≤epsilon,
absolute area ≤N·epsilon, or winding changes. No epsilon override or automatic repair.
Thin mathematically valid polygons may be rejected. Errors expose stable `code`,
`reason`, and `details` containing endpoint or requested progress/direction plus relevant
vertex/edge IDs, without logging coordinates or partial state. Checks are O(N²).

**Valid endpoints, a valid grid, or all rendered frames do not prove continuous-time
topology safety. Only the requested samples are checked.** A square with target IDs
cyclically shifted two places collapses at .5 despite valid same-winding endpoints;
a scaled centered reversal can collapse at .37 while .25/.5/.75 pass. No continuous
proof or safety certification is provided; applications needing that are unsupported.

`state.bounds` is the local vertex AABB, excluding stroke/shadow. `transformBounds`
produces a conservative transformed AABB, not the exact world polygon AABB. Caller
sets the parent transform once; adapter never adds one, checks the current matrix,
or prevents external singular transforms. It uses a separate closed Path2D and
nonzero fill, preserving caller current path and restoring styles in `finally`.
No callbacks are accepted. Colors follow Canvas string semantics (including its
invalid-color behavior). Existing composite/alpha/stroke settings remain caller owned.

Two synthetic examples: a non-affine corner card and concave arrow, each also shown
under a non-singular rotated/nonuniform parent. 8-second forward → hold → reverse,
clean or ID-debug; no text is falsely warped with the polygon, no external imagery.
The gallery draws four objects per frame. Reduced motion presents the target shape.

```sh
node --test engine/motion-elements/test/registered-polygon-morph.test.mjs
node engine/motion-elements/scripts/render-gallery.mjs --demo registered-polygon-morph --out /tmp/polygon-clean-new
node engine/motion-elements/scripts/render-gallery.mjs --demo registered-polygon-morph --debug --out /tmp/polygon-debug-new
```

Technical tests cover exact endpoints and independent Native RGBA baselines, caller
path/style/exception isolation, reverse/seek/process determinism, 24/30/60fps grids,
invalid geometry and off-grid collapse. These are not artistic or production acceptance;
human playback and semantic ID-trajectory review remain pending.

## Experimental: analytic orientation field and masked slice displacement

Two mechanisms, not parameter-count variants. Audit distinction: `fragment.fixed-tiles`
scatters a raster snapshot; `reveal.local-geometry` clips one geometric window;
`motion.shake` perturbs one transform. None provides independent analytic grid
orientations or fixed bilateral horizontal strip displacement.

### `field.attractor-orientation`

```js
const plan = compileAttractorField({
  bounds:{x:0,y:0,width:360,height:160}, columns:18, rows:8
});
const state = sampleAttractorField(plan, {
  attractor:{x:150,y:70}, radial:1, tangential:0.4
});
```

Cell centers and `cellId=row:r/col:c` stay fixed. Positive radial points **toward**
the attractor; positive tangential rotates that direction +90° in local x/y
(Canvas y-down appears clockwise). Normalize the weighted radial and tangential
unit vectors, using scaled coefficients to handle subnormal finite inputs. Each
cell returns `position,distance,direction,angle,defined` plus its ID. Exactly at
the attractor, or with both weights zero, return `{x:0,y:0}`, angle 0 and
`defined:false`; no previous orientation is remembered. The singularity is not
continuous. Samples do not integrate particles, infer video optical flow, simulate
fluids, or report velocity. Distance is local length, not screen-space speed.

Bounds x/y within ±1e6, width/height 1e-6..1e6; each grid dimension 1..128,
at most 4096 cells. Attractor coordinates use the existing ±1e9 point contract;
weights are -1..1. Caller owns time/reduced-motion policy and applies the parent
transform **once**, while drawing local state. No seed is needed: the field is
analytic. Plans are module-branded, copied/frozen; serialized plans must recompile.

### `transition.masked-slice-displacement`

```js
const plan = compileSliceDisplacement({
  width:380,height:170,bands:11,maxOffset:55,seed:'study',instanceId:'panel',
  range:{start:rational(1),end:rational(5)},jitterCycles:3
});
const state = sampleSliceDisplacement(plan, rational(2), {reducedMotion:false});
withSliceDisplacement(ctx, state, drawLocalContent, {Path2D:canvasApi.Path2D});
```

This is a one-content distortion transition, **not** an outgoing/incoming scene
switcher. The caller authors overlap or replacement. Fixed horizontal band IDs
`band:i` partition [0,height] using integer floor boundaries. Odd bands move right,
even bands left. For normalized authored time u, envelope E=sin(πu)²; displacement
is sign × maxOffset × E × [0.75+0.25sin(2π·jitterCycles·u+seededPhase)]. There is no
frame-count random stream, hidden clock or discontinuous frame-index jitter.
`jitterCycles=0` gives a seeded constant amplitude multiplier. |offset|≤maxOffset;
endpoint offsets explicitly equal +0. Before/start and end/after return exact home.
Reduced motion returns home at every time, preserving phase/progress and range.

Width/height integer 1..8192, area ≤16,777,216, bands 2..min(height,256), maxOffset
0..8192, jitterCycles integer 0..32. Seed/instanceId use `seededUnit` limits;
range uses existing rational time validation. High cycle counts in short ranges
can alias: caller must choose duration/frame rate appropriately. Every input
rejects unknown own fields (including symbol and nonenumerable keys), null and nonfinite values. Plan/state are branded and
frozen; catalog contains only data and never executes source strings or callbacks.

Adapter requires explicit native/browser Path2D, clips strips **before** applying
their local horizontal translations, and never reapplies the parent matrix.
At exact identity it calls content once with no added clip: raster equals direct
whole-content rendering with the same incoming context. Content should be authored
within [0,width]×[0,height]; motion clips to that viewport whereas identity does not
clip out-of-bounds content. Transparent holes remain transparent. During motion,
rotated/subpixel parents may show antialiased strip seams; no arbitrary-affine
seam-free guarantee. Every draw is save/try/finally/restore: native transform,
alpha, clip and drawing styles are restored, including on exceptions. This backend's
style getters may retain stale assigned strings after restore; tests check actual
raster restoration. Adapter paths are separate Path2D objects. Callback-owned
current-path mutations, external side effects, unbalanced save/restore, reset() or
canvas resize are outside the restoration guarantee. Callbacks must be synchronous,
reentrant and balanced; they run once per band during motion and must render the
same authored content without advancing mutable animation state. AsyncFunction and
returned thenables are rejected, not sandboxed or rolled back.

`examples/field-slices-scene.mjs` has two semantic examples each: compass needles
and circulating ribbon marks; a signal chart and a complete text card. It exports
`config` and native `createGalleryScene`; render it with
`node scripts/render-gallery.mjs --out /tmp/field-slices-demo --demo field-slices`
(from `engine/motion-elements`). The example is 960×640, 180 frames / 6 seconds. Field
reduced mode freezes the authored attractor; slice reduced mode is identity.
`test/field-slices.test.mjs` covers validation, stable IDs, singularities, subnormal
weights, seek/seed determinism, bounds, native endpoint/reduced raster equality and
context restoration. Experimental technical evidence only: no artistic approval,
hearing approval, cross-backend identity, or independently validated production
transfer is claimed. No reference/media/calibration data is included.

## Experimental: linear-coordinate mask reveal

One mechanism, `transition.linear-mask`, with `band` and `sweep` parameter variants.
It fills a missing two-scene centered-band/oblique-edge reveal, not a new 3D renderer.
Existing `rect-wipe` remains appropriate for axis-aligned edge wipes; `iris-reveal`
uses a radial metric. Existing stagger + transform + finite-settle already covers
card timing/rotation; route selection can compose path/opacity and caller-owned
layer order. Those were **not** duplicated as new catalog elements.

```js
const state = sampleTransition({
  type:'transition.linear-mask', version:1,
  range:{start:rational(1),end:rational(3)}, curve:{type:'smoothstep'},
  params:{width:640,height:360,mode:'band',angle:Math.PI/2}
}, at, {reducedMotion:false});
drawTransition(ctx,state,{outgoing:drawOld,incoming:drawNew},{Path2D:canvasApi.Path2D});
// Oblique left-to-right sweep: mode:'sweep', angle:0.17.
// Reverse sweep: mode:'sweep', angle:Math.PI.
```

For local position p, s=p.x*cos(angle)+p.y*sin(angle). Let lo/hi be its extrema
at the four viewport corners. `sweep` reveals s≤lo+(hi−lo)q; `band` reveals
|s−(lo+hi)/2|≤(hi−lo)q/2. Angle is the **normal**, in radians in Canvas y-down
coordinates, not the edge angle. Thus angle π/2 yields a horizontal centered band.
Negative angles and reversed sweeps are parameter changes, not new mechanisms.
A bounded convex polygon is clipped from the viewport; no 3D points or source images.
At q=0 the incoming callback is skipped; at q=1 the exact viewport is used.
q is the existing curve applied to rational-time progress. Reduced motion uses
raw time midpoint q=0/1, preserving phase, progress and all authored timings.

Width/height finite 1..8192, area≤16,777,216 (fractional local sizes accepted);
angle ∈[−π,π], mode band/sweep, version1. Nulls/unknown fields, including symbol
and nonenumerable fields, invalid ranges and unsupported curves reject. Samples
are immutable and module-branded: serialization is for inspection, not draw-state
rehydration; resample the original spec after transport. No retained frame history.

Composition is explicitly **over-reveal**: full A stays underneath B even at end
and after; transparent B holes show A. This is not transparent replacement. Each
callback is viewport-clipped, source-over; caller alpha and parent transform remain
in effect. No second parent transform is applied. Separate Path2D preserves the
caller's current path, and save/finally/restore isolates state on errors. Callbacks
must be synchronous, reentrant, balanced, and must not reset/resize the canvas or
clear through the intended composition; caller path mutations/external async effects
cannot be undone. AsyncFunction and returned thenables reject. No arbitrary-backend
or transformed-antialiasing identity is promised; avoid declaring pixel tests an
artistic or accessibility approval.

`examples/linear-mask-study.mjs` exports `drawLinearMaskStudy(ctx,at,options)` with
neutral bars→circles, three variants, portrait/landscape and reduced-motion support.
It does not encode a film or load private assets. `test/linear-mask.test.mjs` covers
state/geometry, rational endpoints, strict validation, raw-midpoint reduction,
random-order state/native pixels, fresh-process state, independent half-plane
pixel classification, opaque-edge coverage, transparent end behavior, and callback
exception/current-path isolation. New generic code has no full-video/art/audio
review; source-project visual evidence does not automatically transfer to this API.

## Experimental: sampled band envelope

`geometry.sampled-band` is one pure geometry mechanism, not a ribbon simulator:

```js
const band = compileSampledBand({samples:[
  {x:0,y:30,halfWidth:0}, {x:60,y:10,halfWidth:12}, {x:140,y:40,halfWidth:4}
]});
drawSampledBand(ctx,band,{fill:'#527d91'},{Path2D:canvasApi.Path2D});
```

The dense array has 2..1024 `{x,y,halfWidth}` samples. x/y are finite numbers in
[-1e9,1e9], x strictly increases, and halfWidth is finite in [0,1e9]. Unknown
fields (including hidden/symbol fields), holes, negative widths, repeated or
reversed x reject. Positive width must yield representably distinct y−width < y
and y+width > y; otherwise it rejects rather than silently collapsing. These
coordinate bounds keep derived vertices and bounds finite (up to ±2e9 and 4e9
extent). Representable subnormal coordinates/widths are allowed; raster visibility
is not guaranteed for tiny shapes. No area multiplication or normalization occurs.

Output is a detached deeply frozen, module-branded `{samples,vertices,bounds,
degenerate}`. Vertices are upper edge (y−halfWidth) in sample order, then lower
edge (y+halfWidth) in reverse; closure is implicit. Segments are **straight**, not
spline reconstruction. Width means **vertical half-width**, not curve-normal
thickness. Zero endpoints and interior pinches are allowed; all-zero widths give
`degenerate:true` and draw nothing (even if center y varies). Zero x span rejects.
Serialization is inspection only; recompile samples to draw after transport.

The fill-only adapter uses a separate Path2D and nonzero fill, preserving current
path and restoring context through finally. Caller transform, alpha, compositing,
clip and explicit layer order remain in effect. Fill must be a nonempty Canvas
color string; CSS color parsing is delegated to the backend. No strokes, joins,
caps, automatic sampling, time interpolation, topology repair, morphing, physical
weaving or 3D are supplied. Caller chooses sufficient sample density.

Deduplication: `compilePolyline`/`sampleTrail` remain the path-distance tools;
registered-polygon morph has a different correspondence/topology contract and
rejects the coincident/collinear/zero-width cases this envelope intentionally allows.
Mask reveals remain viewport clips, not variable-width contour geometry.

The method was extracted from a production scene's upper-forward/lower-reverse
sampled outline and independently validated. **It was not backfilled into that
film; the existing film still uses its original project implementation.** No film
usage, artistic approval or production-transfer validation is claimed for this API.
`examples/sampled-band-study.mjs` shows neutral wave and chart uncertainty envelopes;
`test/sampled-band.test.mjs` covers reusable geometry, bounds, numerical degeneracy,
validation, native raster equivalence and adapter isolation. No generated media or
commercial assets are included.
