# 显式候选锚点标签布局（experimental）

照片、地图或图表上的短注释可以关联一个锚点，但文字框不应盖住主体或前面的标签。本机制接收调用者**已测量的框、保护区和有限候选偏移**，按优先级试放；不能放下时明确报告失败。

这是一个静态布局机制，不测字、不识别主体、不生成候选或引导线，不承诺全局最多放置数、连续动画避碰或艺术质量。图片、文字、字号与保护区由作品负责；颜色/方向不是新机制。

## API 与合成例子

```js
import {placeAnchoredLabels} from '../lib/foundations/layout/anchored-labels.mjs';
const state = placeAnchoredLabels({
  labels: [{
    itemId:'note-a', anchor:{x:120,y:80}, width:76,height:24,priority:10,
    offsets:[{x:8,y:-12},{x:-84,y:-12}],
  }],
  obstacles:[{x:120,y:50,width:100,height:60}],
  viewport:{x:0,y:0,width:300,height:180},
  clearance:4,
});
// state.placements[0].candidateIndex === 1
// state.items contains standard translation-layout items for drawing/handoff.
```

所有字段必填，无隐藏默认值。输入记录支持当前realm普通plain或null-prototype对象；必填字段为自有data property，已知字段可以不可枚举。未知自有string/Symbol/不可枚举字段、accessor、class和跨realm记录拒绝。数组为当前realm普通稠密Array，索引必须是可枚举data property；空洞、额外字段、子类、TypedArray及跨realm数组拒绝。此校验不是针对恶意Proxy的安全沙箱。

| 输入 | 合同 |
|---|---|
| `labels` | 0..128项，每项恰含`itemId,anchor,width,height,priority,offsets` |
| `itemId` | 唯一ASCII `[a-zA-Z0-9_-]{1,64}` |
| `anchor`, `offsets`每项 | `{x,y}`，有限±1e6；offset为标签**左上角**相对anchor的位置 |
| 标签`width,height` | 调用者测量的轴对齐框，有限`.001..10000`；不包括未声明的阴影/边框 |
| `priority` | 有限number，±1e6；越大越先放，不自动改变绘图层级 |
| `offsets` | 每标签1..16个候选，顺序即调用者偏好；允许重复候选，不会自动去重 |
| `obstacles` | 0..128个`{x,y,width,height}`；位置±1e6，尺寸`.001..1e6`；可在视口外或重复 |
| `viewport` | 同障碍框数值域；所有成功标签框必须完整包含其中 |
| `clearance` | 有限`0..10000`，用于标签与保护框/已放标签之间的轴对齐间距；**不是视口内边距** |

所有坐标属于同一调用者空间；父变换、clip和相机不在本函数中。输入整体先校验，任一非法项使整次调用抛错，不返回已完成的部分布局。

## 选择规则

1. 按priority降序处理；同优先级按itemId的ASCII词典序，不用locale或源索引决定冲突胜者。
2. 候选框左上角为anchor＋offset；尺寸不变。按给定顺序选第一个完整在viewport内、且不与obstacles或此前成功标签冲突的候选。
3. 无候选成功则报告unplaced，不挤压、不移动别人、不隐藏失败，也不回溯尝试更好的全局组合。

两框先计算每轴有向间距，例如：
`gapX = max(b.x-(a.x+a.width), a.x-(b.x+b.width))`，y轴同理。只有`gapX < clearance && gapY < clearance`时冲突。clearance为0时，恰好接边/接角允许；间距恰等于请求值也允许。正clearance是矩形轴对齐保护区，不是欧氏圆形距离。viewport比较独立，不给它隐式增加clearance。

高优先标签的第一个位置可能挡住只能放在那里的低优先标签，即使高优先标签还有另一位置可同时容纳两者；**不会回溯优化最多标签数**。仅改变输入数组排列，不改变同一ID/几何集合的选择结果，但输出顺序与zIndex仍按本次输入排列。

## 输出与组合

```text
{
 items:[{itemId,rect,matrix,zIndex,geometryBounds}],
 placements:[{itemId,status,candidateIndex,anchor}],
 placedCount,unplacedCount
}
```

- `placements`含所有输入标签，按源顺序；status为`placed`或`unplaced`。candidateIndex是0基候选索引，失败时为null；anchor是输入点的副本，不被改动。
- `items`仅含成功标签，按源顺序，zIndex保留原源索引（中间失败时可有间隙）。rect从`{x:0,y:0}`开始；matrix平移至成功框；geometryBounds由既有transformBounds计算。
- 全结果深冻结，输入未冻结也未修改。无计划品牌、时钟、随机数、历史缓存或全局状态；同输入独立求值。
- 可送入既有layout-handoff，跨快照失败/成功可作为退出/进入。全部失败会给空items；旧empty→empty handoff仍拒绝。
- 引导线端点、文字基线、pins、过渡与可见性都由调用者绘制。框不重叠不等于字体墨迹/阴影/线条不重叠；静态端点合法不保证handoff中间合法。

## IEEE 与资源限制

所有包含/间距判断都针对实际IEEE number和上述计算顺序，没有epsilon、吸附或整数化。比如`.1+.2`可能越过请求为`.3`的边界；这是候选不适配，不会悄悄修改用户尺寸。−0可随复制保留，矩阵/JSON/旧handoff可能规范化成＋0，不承诺跨这些接口逐位相同。尺寸最小值配合较大坐标时，派生bounds宽高会有消减误差；只将它称几何框，不当作可见像素或精确实数保证。

anchor与offset各在±1e6，成功矩阵平移可超过±1e6，但仍位于允许viewport的派生域内；保持既有矩阵/translation-layout范围，不要求把输出反喂受限输入。`clearance`不包括原始图片主体识别误差。

最多128标签×16候选×(128障碍＋此前标签)的有界检查，未放置标签不阻挡后续标签。无无限迭代或记忆历史。这个上限不是实时帧率或长期Native内存承诺。

## 测试与实际作品门

运行：`node --test engine/motion-elements/test/anchored-labels.test.mjs`。
专测包含优先级与ASCII tie、first-fit非最优反例、边缘/精确clearance/IEEE边界、unplaced与空输入、严格data字段和数组拒绝、深冻隔离、2500个独立BigInt框决策场景、最大资源、最小/最大几何接旧handoff，以及Native乱序/新Node哈希。

实际8.4秒/504帧有声候选从真实墙面输出派生anchors/保护框，仅初始化调用1次；实际候选失败包含主体保护冲突和先放标签冲突，成功矩阵直接供263次标签文字绘制（261次正Native alpha）。任一标签正alpha共98帧，三标签同时正alpha76帧、同时全不透明49帧；不能把这些数字当舒适阅读或全部像素可见证明。小字和读时风险仍由作品评审保留。37代表原PNG/37新Node及68编码节点限定审、盒子/墨迹/矩阵检查通过，两个新runtime与实际10文件依赖闭包字节一致。引导线未被此算法保护或路由。

实际素材、参数/帧/hash回执私有保存，不进入公开库。常速NOT_DONE、听审NOT_LISTENED、用户艺术PENDING_USER、通用迁移NOT_RUN；技术/限定帧通过不是风格认可。

## 官方研究与许可

实际读取20库中的Paper.js [Rectangle文档](https://paperjs.org/reference/rectangle/)以及固定v0.12.18 commit [`c1d88390d2c86901db152827fe778c3e39cfb073`的Rectangle源码](https://github.com/paperjs/paper.js/blob/c1d88390d2c86901db152827fe778c3e39cfb073/src/basic/Rectangle.js)，核对矩形包含、内域相交及接边不相交的概念。Paper的可选epsilon不是本接口的默认精度修补；本接口clearance是调用者明确的布局距离。Paper Rectangle不是完整标签自动排版器，不将本算法归于Paper。

该版本[MIT许可](https://github.com/paperjs/paper.js/blob/c1d88390d2c86901db152827fe778c3e39cfb073/LICENSE.txt)已核查（Jürg Lehni与Jonathan Puckey）。当前模块为原创有限优先级first-fit组合，没有复制Paper源码、类型系统、可变对象或绘图runtime，没有引入新依赖。公共例子是合成数据，不含影片的真实保护区/字体或素材。
