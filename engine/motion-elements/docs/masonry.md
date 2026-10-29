# 同宽最短列瀑布流（experimental）

## 适用画面及去重

摄影墙、不同长宽比卡片组成的陈列：图片按已选定列宽等比准备高度后，按源顺序逐项放到当前占据高度最小的列。同高选最左列。这里的高度来自调用者，不读图片、字体、DOM或时钟。

与grid的统一格子、flow-wrap的整行最大高度不同，本机制允许一列在其他列尚未结束时继续向下填入。只有一个基础机制；列数、尺寸、间距、图片比例或排序方式不拆成新条目。它不是多列跨栏、任意装箱、CSS兼容实现、全局最短墙高或自动艺术构图。

## 最小合成例子

```js
import {masonryLayout} from '../lib/foundations/layout/masonry.mjs';
const result = masonryLayout({
  items:[{itemId:'photo-a',height:180},{itemId:'photo-b',height:80},
         {itemId:'photo-c',height:120},{itemId:'photo-d',height:100}],
  columns:2, columnWidth:120, columnGap:16, rowGap:12,
});
// result.items are standard translation layouts for existing layout-handoff.
// result.columns[0].itemIds gives the static column membership.
```

调用者负责合法素材加载、intrinsic尺寸、裁切/等比策略、宽度变化后重算height、父矩阵和绘制。API不推断图片比例、不隐藏溢出、不输出图像。

## 严格合同

`masonryLayout({items,columns,columnWidth,columnGap,rowGap})`所有字段必填。

| 字段 | 范围 |
|---|---|
| `items` | 当前realm普通稠密Array，0..128项，无附加字段/稀疏/Array子类 |
| 每项 | 恰含`itemId,height` |
| `itemId` | 唯一ASCII `[a-zA-Z0-9_-]{1,64}` |
| `height`,`columnWidth` | `.001..10000`有限number |
| `columns` | 1..128整数 |
| `columnGap`,`rowGap` | 0..10000有限number |

对象允许当前realm的plain或null-prototype记录；未知自有字符串/symbol/不可枚举字段拒绝，已知字段可不可枚举。非法项整次拒绝，无部分布局或静默默认。getter/Proxy并非安全沙箱。

## 放置及输出

输入顺序不排序。每次比较各列当前**占据高度**，只有严格更小才替换候选，因此相等时选择最左列。空列高度0。选中非空列时，项目y=`column.height + rowGap`，空列首项y=0；放入后该列height=`y + item.height`，不包含尾部gap。列x=`columnIndex*(columnWidth+columnGap)`。

```text
{
  items:[{itemId,rect:{x:0,y:0,width,height},matrix,zIndex,geometryBounds}],
  columns:[{itemIds,x,width,height}],
  columnCount,width,height
}
```

- items/zIndex保持源顺序，局部rect.width统一为columnWidth，matrix只做列x/项目y平移。精确沿用旧translation-layout字段，不添加会使严格handoff拒绝的column字段。
- columns数组长度始终等于请求列数，索引即列号；itemIds按该列插入顺序。列width为请求宽度，height为该列已占据底部。
- 外层width=`最后列x + columnWidth`，包含所有请求列和列间空隙，即使某些列未被占用；height为最大列height。
- 空items仍保留全部空列/总width，所有列height和总height为0。单列无需额外算法，columnGap在总width中不产生首尾空白。
- 返回递归冻结、与输入记录脱离；geometryBounds由已有transformBounds计算，仅矩形几何，不含阴影、描边或实际画面墨迹。

## 顺序、精度与资源

这是源顺序确定的贪心快照，**不是输入排列不变**。增删、重排或修改高度可能影响后续所有列归属；不保证身份永远留在原列，也不保证总height全局最优。例如双列、无行距、高度2/2/3按该顺序得到高5，另一划分可得到4。

比较、加法、乘法均按IEEE number执行，无epsilon或像素吸附。同高指实际存储数相等；数学上接近的高度可以因舍入改变后续列归属。极小正gap可能在较大高度的加法中消失。geometryBounds相减还可能产生微小尺寸消减，不能把派生bounds当精确原尺寸。

每个局部rect保留合法输入尺寸；最多128项/128列时，x≤2,540,000、总width≤2,550,000；单列最多128项时最终height≤2,550,000。均处于既有矩阵与translation-only handoff范围，无需改共享数值域。最多128×128次列比较，无历史缓存、随机或不受限循环；这些边界不是长期Native内存或实时渲染保证。

## 与旧动画组合

将两个`result.items`交给已有layout-handoff可做同ID交接；这不让中间帧自动满足瞬时masonry布局、无重叠或不越界。columns元数据只描述对应静态快照。空→空仍被旧handoff拒绝。

本函数没有reducedMotion字段。调用者可保留项目原时段并固定终态布局，或沿用旧handoff的reduced-motion空间策略；仍须另验可读性。相机、图片出现节拍、裁切和作品美术不计为新增机制。

## 实际参考、原理与许可

1. 实际阅读20库中Anime.js固定提交[`01b81be1df6843ccfe0a71c0699a746bf740dd77`](https://github.com/juliangarnier/anime/tree/01b81be1df6843ccfe0a71c0699a746bf740dd77)的[`src/utils/stagger.js`](https://github.com/juliangarnier/anime/blob/01b81be1df6843ccfe0a71c0699a746bf740dd77/src/utils/stagger.js)和[MIT LICENSE.md](https://github.com/juliangarnier/anime/blob/01b81be1df6843ccfe0a71c0699a746bf740dd77/LICENSE.md)。该版本按grid索引或已存在的位置计算距离/错峰值，auto-grid可读取已有DOM/对象位置；它不根据卡片高度生成最短列布局。本库不复制它，也不把stagger误称masonry。
2. 实际阅读Desandro Masonry固定提交[`3b0883cf4a4a046896719b9cf282ea74be7ffecd`](https://github.com/desandro/masonry/tree/3b0883cf4a4a046896719b9cf282ea74be7ffecd)的[`masonry.js`](https://github.com/desandro/masonry/blob/3b0883cf4a4a046896719b9cf282ea74be7ffecd/masonry.js)（blob`8de73d1ed6d039fd16941237fde05fac6eed95dc`）：其上方位置策略选择最低列组，支持DOM尺寸、跨列宽、stamp及浏览器布局。这些更宽能力不在本合同内。本实现只取“当前最短列”原理，原创显式数据/有界单列项目算法，不移植代码或依赖。
3. 该Masonry固定仓库根目录**没有LICENSE文件**（初次该路径返回404）；源码头、[package.json](https://github.com/desandro/masonry/blob/3b0883cf4a4a046896719b9cf282ea74be7ffecd/package.json)及[README](https://github.com/desandro/masonry/blob/3b0883cf4a4a046896719b9cf282ea74be7ffecd/README.md)标明MIT，README链接的[MIT许可正文](https://desandro.mit-license.org/)已阅读。外部许可页面是活页面，不冒称固定提交内存在同字节LICENSE。

无安装、新runtime依赖、远程图片或第三方源码复制；原理研究不授予影片图片/音乐使用权。

## 验证门

测试覆盖不同高度/同高最左/空列/单列、严格非法输入、边界数值、深冻隔离、源顺序与确定性、独立BigInt小域穷举贪心oracle、列内矩形间隔、128项×128列数上限、旧handoff组合、Native重复/逆序及新Node像素。

目录以experimental登记，实际作品source/hash、调用/消费帧与指导已分别绑定。数学和合成Native检查不等于完整常速观看、听审、用户艺术认可或通用迁移。

## 实际作品与状态

8.4秒/504帧有声候选只在图片完整加载后调用1次布局；结果作为既有staged handoff端点，后者1次compile/504次sample不新增配方。145帧静态墙面包含全部六图且框不重叠。独立Native重放核对2911次照片提交、2904正alpha、2617在屏正alpha，不能称每次都是新的layout求解或持续可见。37代表原PNG/37新Node和68编码节点限定检查通过；两个新模块与实际10文件runtime闭包均同字节。媒体、参数与hash回执私有保留。

未知字段严格拒绝不意味着getter安全沙箱：此接口沿用既有validator，已知字段getter可能被读取。确定性承诺以稳定data记录为前提；调用者不能用getter/Proxy改变读取值或副作用来替代输入数据。

常速NOT_DONE、听审NOT_LISTENED、用户艺术PENDING_USER、通用迁移NOT_RUN；工程与限定帧审不是摄影风格认可。
