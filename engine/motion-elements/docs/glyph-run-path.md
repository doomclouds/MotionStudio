# 显式字格沿三次路径排布（experimental）

场景：预印文字沿同一条带路绕弯行进，进入平直段形成标签。此机制负责把**显式测量的字格推进量**变为各字格的基线中心和朝向；曲线求值由`cubic-path`承担。不是把颜色、tracking或偏移分别算多个机制。

已具有一支真实有声候选的调用与限定帧证据；保持experimental。技术测试不等于常速观看、听审或用户艺术认可。

## 接口与最小例子

```js
import {compileCubicPath} from '../lib/foundations/geometry/cubic-path.mjs';
import {layoutGlyphRunOnPath} from '../lib/foundations/typography/glyph-run-path.mjs';

const path = compileCubicPath({
  segments: [{p0:{x:0,y:0},p1:{x:100,y:0},p2:{x:200,y:0},p3:{x:300,y:0}}],
  tolerance: .01,
});
const run = layoutGlyphRunOnPath(path, {
  glyphs: [{glyphId:'letter-0',advance:32},{glyphId:'letter-1',advance:28}],
  startDistance: 20,
  tracking: 4,
  normalOffset: -10,
});
```

`plan`必须来自**同一canonical模块实例**的`compileCubicPath`。先验证品牌再读取计划元数据，普通对象、拷贝计划、polyline计划或另一独立模块实例的计划不能冒充。

所有输入字段必填，无隐式fit、字体查询、自动播放、随机状态或绘制回调。

| 字段 | 合同 |
|---|---|
| `glyphs` | 同realm普通密集Array，1..256项；不允许稀疏、子类、未知自有字段 |
| 每项`glyphId` | 唯一`[a-zA-Z0-9_-]{1,64}`，是身份，不是文本内容；重复字母仍应使用不同ID |
| 每项`advance` | 0.001..16384有限数；调用者已测量/准备的字格推进量，不含此API的tracking |
| `startDistance` | 0..`plan.totalLength`，当前路径编译距离域内的左端位置 |
| `tracking` | 0..16384，**仅相邻字格之间**的间隔；末尾不另加一份 |
| `normalOffset` | −16384..16384；沿切线左法线`(-ty,tx)`偏移。在屏幕向下为+y、从左往右的水平路线上，负值在上方 |

对象须为当前realm的plain或null-prototype对象；已知字段可以非枚举，未知symbol/非枚举字段同样拒绝。数据不被修改，返回结果递归冻结。

## 字距、锚点与画法

第i字格中心距离为 `startDistance + 前面字格advance总和 + i*tracking + advance[i]/2`。每个中心都真实调用当前路径采样，不按字符数量等距、不用控制点参数t替代路程。用对应progress调用时仍有普通IEEE乘除舍入；距离依赖cubic模块的近似弧长表，不是精确弧长排版。

返回 `{startDistance,endDistance,span,tracking,normalOffset,glyphs}`。`glyphs`保持输入顺序，每项包含：
- `glyphId, advance, distance`：身份、原推进量和请求的中心距离；
- `pathPosition`：路径中心点；`position`：施加法线偏移后的基线中心；
- `unitTangent, normal, angle`：单位方向、左法线和弧度；
- `segmentIndex, parameter`：实际cubic段与局部参数。

调用者可以`translate(position)`、`rotate(angle)`后，从local `x=-advance/2,y=0`绘制该字格的内容，再恢复Canvas状态。字体大小/字体资源、文字到glyph的映射、测量和Canvas样式由调用者负责；API本身不读取字体或Canvas。正交法线偏移是中心点的几何平移，不会扭曲字形。

## 范围与失败是显式的

- 整个advance run必须容纳在路径内；`span <= plan.totalLength - startDistance` 是canonical **IEEE浮点**边界。无epsilon、裁切、折返、负tracking或自动缩小。
- 这不是exact-real装箱判定：长度100、span70、start`30.000000000000007`时浮点减法仍得到70，允许；start`30.000000000000014`的余量更小则拒绝。不得据此推断任意精确有理输入的边界承诺。
- 任何中心切线未定义则整次调用拒绝，不借用上一字/上一帧方向。端点、接缝和近驻点的切线语义继承cubic模块；尖角附近角度可跳变，没有自动平滑或避让。
- 长度改变时，调用者须显式更新startDistance/advances/tracking，不能期待API把超长文字挤入。法线偏移后的点可能超出原cubic输入坐标域，不保证可直接再当新的路径控制点。
- 返回跨度是字格advance范围，**不是字形轮廓包围盒**。斜体、重音、上/下伸部与字形overhang可能超出它；不检测字间重叠、山脊遮挡或画框裁切。

## 排版与复用边界

这不是完整shaping引擎、Unicode分词、连字、双向文本、行断开、kerning求解或glyph outline变形。调用者若需这些，应先用其合法可用字体/排版系统形成显式字格数据；不能把逐Unicode码点切开再声称支持全部语言。空格可以作为有advance但不绘墨的字格；它仍参与真实排布。

可复用已存在的opacity/关键帧改变显示节拍，已有matrix/Canvas状态适配器施加父变换；这些是旧项。曲线控制点插值、地图造型、文字内容、字体许可与声音均是作品编排，不再算新基础机制或新配方。

测试覆盖水平/竖直/反向路径、真实弯曲路径、法线、字距、非法/资源边界、驻点拒绝、深冻与输入隔离、乱序及新Node状态、Native字形绘制一致性。不能由此宣称作品设计通过或跨平台字体像素相同。


## 实际作品覆盖与复现范围

9.5秒候选在570帧实际调用布局570次，提交9字格/次；完整字词并非全程可见：
供带外壳、画外及工具会遮挡。保守整词屏幕墨迹边界窗口为f198–569，工具段仍有有意遮挡；
不能把边界落在屏幕内说成逐像素无遮挡。弯曲/可读段经限定编码帧检查，未做全片常速观看。
调用方提前使用实际字体测量advance，路径/字格算法不读取字体；本片不证明其他语言、
连字、负tracking、重叠检测或任意字形overhang的通用支持。

原模块与实际validator依赖的字节匹配冻结影片，后续公共index导出只由工程测试证明同一对象，
不是影片曾import该index。媒体、字体、参数/源hash回执保留私有交付；本指南上方合成输入可离线重放状态。
旧motion.transform与withMotion服务工具/相机；编排、声音与画面造型不另计机制。

纯布局不接收reducedMotion字段；调用者可保持原时间区间而固定终态路径与起点，
或使用已有opacity节拍，但仍须另验可读性。常速NOT_DONE、听审NOT_LISTENED、
用户艺术PENDING_USER、通用生产迁移NOT_RUN；作品实际调用不是风格背书。

目录中的两步合成例子：`compileCubicPath(entry.exampleSetup.path)`生成品牌计划后，
再`layoutGlyphRunOnPath(plan,entry.example)`。`exampleSetup`只是静态元数据，
query/CLI不执行它、不加载API或外部文件；不存在任意字符串执行入口。
