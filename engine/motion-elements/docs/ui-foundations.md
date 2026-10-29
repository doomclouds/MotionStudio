# UI 布局与同身份交接：使用指导（experimental）

本批是 **3 个基础机制＋1 个配方**，不是4个基础机制。没有新增渲染器、
浏览器、依赖或播放时钟。工程验证、作品的实际使用、连续视听检查与用户艺术认可
分别记录；不要把技术通过写成“成熟效果”或“作品已认可”。

## 1. 先看要解决什么画面问题

| 画面需求 | 新 API / 稳定 ID | 适用场景 | 不提供什么 |
| --- | --- | --- | --- |
| 星期列、迷你日历格子整齐排列 | `gridLayout` / `composition.grid` | 固定尺寸、逐行排列的二维格子 | 日期运算、事件起止时间映射、冲突排期 |
| 优先项、标签、卡片按实际大小逐个排开 | `constraintStackLayout` / `composition.constraint-stack` | 单轴、固定顺序、每项尺寸不同的堆叠 | 自动换行、排序、文字测量、避障 |
| 文本计数或数值在明确时刻等待、改变、再等待 | `sampleKeyframeTrack` / `motion.keyframe-track` | 可直接跳时的多段标量关键帧 | 弹簧、自动节奏、任意曲线、内部播放状态 |
| 同一批卡片从旧位置交接到新位置 | `compileLayoutHandoff` / `recipe.layout-handoff` | 身份不变的平移与尺寸变化，新增/移除项淡变 | 物理碰撞、自动决定日历槽位、任意仿射插值 |

配方实际复用原有 `sampleMotion` 的 **motion.transform / motion.opacity**，
以及共享 rational 时间、curve、lerp 与几何 bounds。辅助函数不另计基础机制；
颜色、方向和快慢变体不重复计数。新 API 是直接函数接口，不扩展旧
`sampleMotion` 的 type dispatch。

## 2. 两种布局：参数与输出

从 `lib/structured-layouts.mjs` 导入。

### gridLayout

```js
gridLayout({itemIds:['mon','tue','wed'],width:120,height:58,columns:3,gap:0});
```

- `itemIds`：1..128个不重复ID，遵循已有 `[a-zA-Z0-9_-]{1,64}` 合同。
- `width/height`：每个格子的局部尺寸，0.001..10000。
- `columns`：1..128整数，可以大于实际项数；按行优先排列。
- `gap`：水平和垂直间距，0..10000局部单位。
- 起点固定为(0,0)，不会自动缩放到视口；调用者显式设置父变换。

### constraintStackLayout

```js
constraintStackLayout({
  items:[{itemId:'work',width:224,height:16},{itemId:'focus',width:224,height:28}],
  axis:'y',gap:12,
});
```

- `items`：1..128项，每项是`{itemId,width,height}`；ID/尺寸限制同上。
- `axis`：`x`或`y`；每项位置累加前项在该轴的实际尺寸及gap。
- `gap`：0..10000；不改变输入顺序，另一轴起点保持0。

两者都返回深冻结、与输入隔离的数组：
`{itemId,rect,matrix,zIndex,geometryBounds}`。
rect是局部`{x:0,y:0,width,height}`；matrix是`[1,0,0,1,x,y]`；
zIndex按输入顺序。geometryBounds不含描边、阴影、光晕或滤镜外溢。

空/稀疏数组、重复ID、额外对象或数组字段、显式null、非有限值和越界数值
均拒绝，不悄悄删项或猜默认值。布局只计算空间，不自动动画；
reduced-motion由调用者或明确配方处理。重新计算布局不会改掉已经画出的帧。

## 3. 关键帧轨道：明确等待与变化

从`lib/keyframe-track.mjs`导入；`T`为既有`rational`函数。

```js
const spec = {
  range: {start: T(1), end: T(5)},
  params: {knots: [
    {at: 0,    value: 0,   interpolation: 'hold'},
    {at: 0.25, value: 20,  interpolation: 'linear'},
    {at: 0.75, value: 100, interpolation: 'hold'},
    {at: 1,    value: 100, interpolation: 'linear'},
  ]},
};
const state = sampleKeyframeTrack(spec, T(3));
// {phase:'active', progress:0.5, value:60, segment:1}
```

- 时间使用字符串整数有理数；start≥0，end>start，end≤24小时。
- 2..256个连续数组节点；at严格递增，首尾精确为0和1。
- value为±1e9内有限数；interpolation只允许linear或hold。
- interpolation描述**离开该节点**后的区间；最后一个字段仍必填以保持结构一致，
  但没有离开终点的区间。
- 精确内部节点选择其后区间；达到/超过end返回最后精确值；start前返回首值。
  hold允许有意跳变，不是平滑ease。
- 区间选择按rational时间与数字节点的规范十进制表示精确比较，避免极近边界时
  浮点进度提前触发hold；线性区间先计算精确局部差和宽度，再转换为浮点比例，
  不从全局浮点progress相减，以免极近节点丢失区间内进度。

context只接受`{reducedMotion:boolean}`。为true时value取终值、segment取最后区间
索引`knots.length-2`，但phase/progress仍来自原项目时间。调用者应判断该策略是否
适合对应属性：承载信息的计数或逐字内容不一定应跳到终值。不据此宣称无障碍审查通过。

## 4. 可直接运行的布局交接

仓库根目录，使用已有Node 24+：

```sh
node --input-type=module <<'JS'
import {rational as T} from './engine/motion-elements/lib/time.mjs';
import {gridLayout, constraintStackLayout} from './engine/motion-elements/lib/structured-layouts.mjs';
import {compileLayoutHandoff, sampleLayoutHandoff} from './engine/motion-elements/lib/recipes/layout-handoff.mjs';
const from = constraintStackLayout({
  items: ['brief','draft','review'].map(itemId => ({itemId,width:120,height:32})),
  axis:'y', gap:8,
});
const to = gridLayout({itemIds:['review','brief','draft'],width:120,height:32,columns:3,gap:12});
const plan = compileLayoutHandoff({from,to,range:{start:T(0),end:T(2)}});
console.log(JSON.stringify(sampleLayoutHandoff(plan,T(1)),null,2));
JS
```

详见[同身份布局交接](layout-handoff.md)。配方只接受平移矩阵、显式一致的bounds，
联合身份不超过128项；层序固定为to顺序＋退出项。位置与rect尺寸都可以变化。
内容文字重排、宽高比保持与遮挡顺序由调用者负责；若开头必须保留原重叠顺序，
不要直接使用这个固定target-first层序策略。

Canvas绘制时遍历items，save→应用matrix和opacity→按rect绘内容→finally restore。
配方只返回状态，不执行绘制回调、不管理离屏画布、不冻结源像素。
文字、阴影和图形都应来自同一采样状态，不能再加另一个递增时钟。

## 5. 工程复现与真实作品证据

```sh
node --test engine/motion-elements/test/structured-layouts.test.mjs \
  engine/motion-elements/test/keyframe-track.test.mjs \
  engine/motion-elements/test/layout-handoff.test.mjs
```

合成测试检查正常/边界/非法输入、身份、尺寸、精确节点、normal/reduced策略、
输出隔离、逆序seek、独立进程复现和Native像素一致。测试通过不是影片审查。

实际委托影片、媒体hash、逐项调用回执、参考对照与用户反馈留在私有production目录，
不进入本公共源码仓库。交付必须附版本绑定回执，写清每个ID/API的真实调用帧区间、参数、
源码hash、输出hash和复现命令。参考影片不能验证我们的实现；
静态画廊或源码里存在函数也不能证明实际作品用过它。

若影片制作后修复边界，保留原冻结制作hash；另附实际参数/时间的新旧输出等价回执
及代表帧核对，明确它是修复版回归证据，不将原影片改称由修复版全长重渲。

覆盖范围应据实记录：例如只用了shared布局移动，不等于影片验证过enter/exit淡变。
显式调用方时间重映射也必须记录；本配方smoothstep不是任意上游cubic Bézier曲线的
原生实现，不能把调用方的逆映射误记成库已支持该曲线。

存在音轨、峰值测量或时间点回执均不等于真实听审；没听就写`NOT_LISTENED`。
本批工程测试不能证明艺术认可或跨平台字体/像素一致。
