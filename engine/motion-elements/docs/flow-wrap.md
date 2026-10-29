# 显式尺寸逐行换行（experimental）

## 场景与去重

侧栏展开后，原标签/信息卡区域变窄：由调用者准备的不同宽高决定哪些项目进入下一行。输入顺序与itemId保留，返回静态几何快照；已有layout-handoff可在两个快照间交接身份。本机制不增加新的动画时钟或配方。

既有grid使用等宽高格子，constraint-stack只有单轴排列；这里新增的是**不同尺寸项目按容器宽度逐行换行**。间距、颜色、内容和宽窄状态不是多个机制。不是masonry最短列、最佳装箱、完整CSS flexbox、自动文本排版、碰撞或响应式DOM监听。

## 最小调用

```js
import {flowWrapLayout} from '../lib/foundations/layout/flow-wrap.mjs';
import {compileLayoutHandoff, sampleLayoutHandoff}
  from '../lib/recipes/layout-handoff.mjs';
import {rational as T} from '../lib/time.mjs';

const input = {
  items: [
    {itemId:'label-a', width:96, height:32},
    {itemId:'label-b', width:72, height:48},
    {itemId:'label-c', width:120, height:32},
  ],
  width:320, columnGap:8, rowGap:12,
};
const wide = flowWrapLayout(input);
const narrow = flowWrapLayout({...input, width:180});
const plan = compileLayoutHandoff({
  from:wide.items, to:narrow.items, range:{start:T(0),end:T(1)},
});
const halfway = sampleLayoutHandoff(plan,T(1,2));
```

本例只复现合成布局/交接状态，不含字体或私有影片。调用者用合法可用的字体测量、内容边距等准备width/height；求解器不读Canvas、字体、DOM、外部文件或时钟。显示到窗口的位置和裁切由旧父矩阵/Canvas适配负责。

## 严格输入

`flowWrapLayout({items,width,columnGap,rowGap})`四字段全部必填，未知字符串/symbol/不可枚举自有字段拒绝。记录必须为当前realm的plain或null-prototype对象；已知字段不要求可枚举。这不是阻止恶意getter/Proxy副作用的安全沙箱。

| 字段 | 限制 |
|---|---|
| `items` | 当前realm普通稠密Array，0..128项；不接受附加字段、稀疏数组、Array子类或跨realm数组 |
| 每项 | 恰含`itemId,width,height` |
| `itemId` | 唯一ASCII `[a-zA-Z0-9_-]{1,64}`，稳定身份而非显示文字 |
| 每项width/height | `.001..10000`有限数，不能为0 |
| 容器`width` | `.001..10000`有限数 |
| `columnGap`,`rowGap` | `0..10000`有限数 |

任一项目宽于容器会整次拒绝，不缩小、裁切、溢出或把错误项目丢弃。非法输入不返回部分布局。空items合法，返回空items/rows、高度0、请求的容器width。
旧layout-handoff仍拒绝空到空计划；一端非空时可按其既有enter/exit合同交接。
不要因为空flow快照有效，就推断所有空快照组合也被旧配方接受。

## 算法与输出

固定输入顺序，逐行从左向右；行内top-align，不拉伸，不排序。行高是本行输入height最大值。下一行y为上一行`y + height + rowGap`。不添加末尾行距，也无首尾外边距。

输出递归冻结且不引用调用者记录：

```text
{
  items:[{itemId,rect:{x:0,y:0,width,height},matrix,zIndex,geometryBounds}],
  rows:[{itemIds,y,width,height}],
  width, height
}
```

- `items`与输入顺序相同；zIndex为0基输入索引；matrix为平移矩阵。每项形状与旧layout-handoff一致，未添加会导致旧严格接口拒绝的row/column字段。
- `rows.itemIds`表示该静态快照中每行成员；rows.width为实际占据行宽，rows.height为本行最高项，rows.y为行顶。
- 最外层width始终为请求的容器宽度，height为最后一行底部。它不是裁切窗口，画面可以另有外边距或阴影。
- geometryBounds由既有transformBounds求出，仅矩形几何，不包含文字轮廓、描边、阴影、光晕或真实visual bounds。

## IEEE边界与资源范围

非空行的候选位置明确按JavaScript左结合IEEE计算：`x = previousRowWidth + columnGap`，`right = x + nextItem.width`。`right <= containerWidth`即留在当前行，否则从x=0的新行开始。首项本身已经过`item.width <= containerWidth`检查。无epsilon、吸附或exact-real装箱承诺。

例如宽1、两项宽`.5`和`.5000000000000001`，浮点和舍入为1，因此同一行；第二项宽`.5000000000000002`则换行。极小正gap可能在加法中被舍掉。这里不声称数学实数间距、精确有理边界或所有输入的可见像素间隔成立。

几何bounds还包含坐标相加与相减；在较大行y处，最小height的派生bounds.height可与输入height有微小差别。不要把它重新当成未经误差处理的输入尺寸。旧handoff已区分输入rect与派生bounds，组合测试覆盖该情况。

最大128行时，输入域保证最后y不超过2,540,000，最终height不超过2,550,000；行内平移x不超过10,000。因此无需扩展旧矩阵/translation-only handoff数值域。该界是本固定数量/尺寸上限的派生范围，不是长时间渲染性能保证。求解仅有限单次遍历与矩形计算，没有跨调用缓存或迭代收敛。

## 快照交接不等于逐帧重新排版

将`wide.items`和`narrow.items`交给已有layout-handoff仅插值同ID项目的位置/尺寸。**插值中间帧不保证满足当时的容器宽度，也不保证项目互不遮挡**；rows元数据只描述各端点静态布局。不要把身份交接称为连续排版solver或避碰。若需要每帧真正按宽度重新换行，必须显式每帧调用本API，同时自行处理离散换行产生的视觉跳变。

纯布局没有`reducedMotion`选项。已有handoff的reducedMotion选择目标空间布局但保留时段；直接布局的调用者可固定终态快照并维持项目时间。二者的可读性和视觉效果需另验，不能靠数值测试冒称无障碍验收。

## 工程验证与作品门

测试覆盖普通/非等高/空/最大输入、严格非法结构、唯一身份、equal/相邻IEEE阈值、资源域、独立整数行分组oracle、输入隔离与深冻、乱序/新Node状态、旧handoff端点/中点/reduced兼容、Native合成矩形重复/倒序及新进程像素。

本机制已有7.6秒、60fps有声候选的实际调用与画面消费回执。只调用2次flow建立宽/窄端点，六个显式尺寸项目从2行到3行；不是把后续缓存使用算成456次flow。旧handoff编译两个计划、逐帧求值456次并用于每帧六项绘制。UI自f117全不透明，f198–264交接，f264–455为窄端点；早期开场的绘制提交不等于可见验证。

为在该场景中避免中间遮挡，项目显式先腾行再横移，中间点保留旧x、采用新y并重算geometryBounds。这是项目编排，不是第三次flow布局、自动避碰或新配方；其他宽度、项目数和内容仍需另验。几何矩形不交叠也不自动证明文字墨迹/阴影/工具不会遮挡。

实际flow/matrix/validator字节与影片冻结一致，公共index接入另测，不冒称影片曾import它。完整输入/输出、帧范围、源hash、媒体及生成图层留私有交付；上方合成例子可重放接口。最终版本32个编码帧限定独评无阻断，未沿用旧长版本的调用数或媒体身份；常速NOT_DONE、听审NOT_LISTENED、用户艺术PENDING_USER、通用迁移NOT_RUN。空/极端/非法/reduced分支只有工程测试，不把数值检查、同ID插值、字体测量或视觉设计另算新机制/艺术通过。

## 官方参考与许可边界

实际阅读React Spring固定提交[`83e476061290532ab517c4d4dfd60de21589e78e`](https://github.com/pmndrs/react-spring/tree/83e476061290532ab517c4d4dfd60de21589e78e)的[masonry示例](https://github.com/pmndrs/react-spring/blob/83e476061290532ab517c4d4dfd60de21589e78e/demo/src/sandboxes/masonry/src/App.tsx)（blob`e958f92b1e1fa753e43f0f31f10753f8d7a0a005`）与[MIT LICENSE](https://github.com/pmndrs/react-spring/blob/83e476061290532ab517c4d4dfd60de21589e78e/LICENSE)（blob`a926771a85a09870f8799e988d8f191ef00ae44a`）。其实际算法按最短列放置，不是本逐行换行算法；其中usePresenceList/稳定key、静态位置与动画责任分离是借鉴的设计原则，不声称React Spring提供本接口。

本实现为原创简单贪心行布局，没有复制该示例源码、图片或引入React/动画积分运行栈；旧handoff已经承担本项目所需的身份交接。无新增依赖、安装、远程字体或媒体。
