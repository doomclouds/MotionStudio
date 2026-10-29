# 容器内固定标题：能停住，也能在分区结束时离开

**Experimental。已有真实候选影片调用，技术与艺术状态分开，详见末节。** 本次只新增一个纵向区间约束：标题随内容滚动、到达指定位置后停住、不能越过其所属内容分区的末端。滚动参数动画、裁切、列表布局、同ID卡片交接仍是既有能力，不另计基础机制或配方。

## 场景与效果

适用于长列表的分区标题、章节标签或需要留在本分区内的说明卡。
下一个分区进入时，前一标题被所属分区末端带走，而非永远贴在画面上。
每个标题独立求解；多个标题是否重叠取决于调用方给出的分区、尺寸、绘制顺序和clip。
这不是浏览器布局、完整CSS sticky实现、碰撞求解、惯性滚动或自动分区排版。

## 严格API和坐标合同

```js
import {stickyIntervalLayout} from '../lib/sticky-interval.mjs';
const heading = stickyIntervalLayout({
  itemId:'chapter-a',
  rect:{x:20,y:100,width:180,height:30},
  container:{start:80,end:400},
  scrollOffset:200,
  pinY:10
});
// heading.phase === 'pinned'
// heading.rect === {x:20,y:10,width:180,height:30}
```

输入rect是未滚动的**内容坐标**，container.start/end是同一纵向内容坐标的分区边界。
正scrollOffset表示内容向上移动；pinY是视窗本地坐标中的固定位置。
输出rect是**最终视窗本地矩形**，可直接绘制；不要再减一次scrollOffset。
x不随纵滚改变。视窗在影片中的位置、父矩阵和裁切由调用方明确应用。
本函数不接收viewport高度，因此不会限制滚动范围或判断固定位置是否在可视区内。

所有字段必填，无默认值；未知字段和Symbol会拒绝。
各对象沿用现有validator：只接受本realm的普通对象或null-prototype对象，不接受数组、类实例或跨realm普通对象。

| 输入 | 约束 |
|---|---|
| itemId | 1..64 ASCII字母、数字、下划线或短横线 |
| rect.x/y | 有限−1e6..1e6 |
| rect.width/height | 有限0.001..1e6 |
| container.start/end | 有限−1e6..1e6，end严格大于start |
| scrollOffset、pinY | 有限−1e6..1e6；负值明确支持，不自动钳制 |

先计算 `lastY = container.end - rect.height`，再要求 `container.start <= rect.y <= lastY`。
这是纵向包含约束；width与分区无横向包含关系。字段单独合法不保证组合合法，失败会抛错，不修正输入或借用上一帧。
派生输出和阈值可以超出输入坐标域，不承诺直接作为其他API的新输入仍然合法。

返回与输入隔离的深冻结对象：

```js
{
  itemId,
  phase:'normal' | 'pinned' | 'released',
  rect:{x,y,width,height}, // 最终视窗本地矩形
  naturalY,              // rect输入y - scrollOffset
  shiftY,                // 最终y - naturalY
  thresholds:{pin,release} // scrollOffset的两个分界
}
```

## 分段合同与精度

```text
lastY   = container.end - rect.height
pin     = rect.y - pinY
release = lastY - pinY
naturalY = rect.y - scrollOffset

scrollOffset < pin     → normal，最终y = naturalY
scrollOffset > release → released，最终y = lastY - scrollOffset
其他情况               → pinned，最终y = pinY
```

两个边界的等号均属于pinned。pin与release相等时，只有一个固定瞬间；这不是错误。
如果原始分区间距在浮点减法后收缩成相同阈值，也遵守这个规则。
normal输出保持naturalY；pinned输出保持输入pinY，不用另一种代数展开增加抖动。
released使用上述lastY再减scrollOffset，不改成`end-scrollOffset-height`的另一舍入顺序。

运算为IEEE浮点，不是精确实数或完整CSS规范一致性证明；不使用epsilon扩大包含域或吸附边界。
例如`.3-.2`略小于`.1`，以y=.1、height=.2、end=.3提交时会拒绝；应按实际坐标合同生成可容纳的矩形。
即使`y+height===end`，`end-height`仍可能略小于y，因此不以相加结果替代上述包含检查。
这是避免合法输入出现倒置pin/release区间的明确选择，而非自动尺寸修复。
极端坐标和近阈值的消减会丢失有效位。shiftY是最终y减naturalY的实际浮点差，可能出现微小负数，不能据它推断精确实数意义的负位移或用严格非负断言替代phase。
测试保留一个恰在pin阈值、pinned位置精确为pinY但shiftY约−5.82e−11的回归；没有钳成零改变结果。
不承诺全域误差界或跨平台像素完全相同。

## 时间、绘制与复用

本函数没有时钟、range、cache、回调、DOM监听或前一帧方向。
调用方从绝对帧/时间产生scrollOffset，随机seek、逆序和重复求值不依赖播放历史。
减少动态时可以使用静态scrollOffset并保留影片时段，但这本身不是舒适度或无障碍验收。

```js
ctx.save();
try {
  // 调用方先设置外层视窗位置和clip；本函数不裁切。
  const {rect} = stickyIntervalLayout(spec);
  drawHeading(ctx, rect); // 由调用方实现，实际消费最终矩形
} finally { ctx.restore(); }
```

多个标题逐一调用，身份由itemId及调用方数据维持；函数不按ID排序，也不自动记住上一标题。
输出不是旧layout-handoff要求的translation-layout记录；不要把这个带phase的对象直接传进该配方。
同卡片从列表进入详情仍应使用既有交接合同，不因此新增另一个“sticky transition”。

## 工程复现与待验范围

```sh
node --test engine/motion-elements/test/sticky-interval.test.mjs
node --test engine/motion-elements/test/*.test.mjs
```

测试覆盖三阶段、两个边界、单点固定区间、相邻分区替换、负滚动与负pin、声明域极值、非法字段/类型/包含、深冻结和状态隔离。
7000组样本使用独立的内容空间clamp几何对照；另有逆序/重复/独立Node结果及Native绘制像素复现。
Native夹具只证明正确的调用方clip/save/restore用法，不代表新增绘图adapter自动保证状态。
候选工程测试不能替代真实影片中的实际调用、用户艺术认可、常速连续观看或听审。
下节记录一支冻结作品的实际输入/输出与绘制消费，不扩大到其他参数或艺术认可。

## 真实作品覆盖与独立质量门

一支12.5秒、1080p60、750帧有声原创演出列表候选中，两分区标题在f0–494实际各求值/绘制一次，共990次。
第一标题normal在f0–128、pinned在f129–275、released在f276–494；但released矩形在视窗内的几何只到f323。
之后仍求值/绘制但已离屏，不把这些帧算成可见释放效果；文字本身可能早于整个标题背景完全离开。
第二标题由normal进入pinned接替前标题。该片仅覆盖正常正向纵滚；负滚动/负pin、单点区间和数值极值只有工程测试。

真实输入与返回phase/rect按帧记录，源代码核对绘制确实消费这些rect；这是项目内实际调用证据，不是外部独立参数拦截。
旧motion.transform控制滚动和光标，motion.opacity控制文字出现；旧layout-handoff承担同一海报到票据的shared身份交接，
旧local-geometry reveal承担视窗clip和票据向右展开。新条目只有本区间约束，不把这些旧能力、美术海报、按钮背景、字体或声音再计数。
本片没有真实购票、DOM事件或浏览器滚动行为。handoff的enter/exit分支也未因此新增验证。

新solver和实际导入依赖与冻结影片字节一致。影片直接导入模块；制作存档中保留的旧index没有被场景导入，
不能据此声称公共index或整个包与影片存档同字节。公共导出另有测试，后续目录/指导接入不修改历史manifest。

最终版本补做9个真实编码sticky阶段帧审，覆盖进入/固定/释放/后一标题接替；另有4个海报交接与结尾帧审。
不把旧版本的审查直接改称最终版本通过；旧报告身份澄清及最终新增回执独立保留。
全解码、全帧几何、22代表帧逆序/重复/新进程PNG、导航保护区及海报交接首帧像素检查通过，声音可在新进程重建。
以上是限定数值/像素/编码检查，不是全片常速观看或听审：NOT_DONE、NOT_LISTENED、通用生产迁移NOT_RUN保留。
用户对本UI作品有限认可（LIMITED_ACCEPTANCE_NOT_STYLE_ENDORSEMENT），不记为否决，也不扩称优秀风格范例。

公开合成例只复现API合同；完整影片、制作、美术参数、音源和调用/哈希回执留在私有交付，不假称本源包可单独重制原片。
复用应先核固定源码/素材身份，再重建状态、代表Native帧与声音，完整编码后审查实际遮挡、身份连续性及视听。
官方参考与许可取舍见[ui-scroll-reference-decisions.md](ui-scroll-reference-decisions.md)。
