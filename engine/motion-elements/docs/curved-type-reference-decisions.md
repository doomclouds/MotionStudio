# 曲线路程与沿路径字格：官方参考与原创实现边界

本批从真实图文场景出发，不引入浏览器、SVG DOM、第三方排版runtime或新npm依赖。下列参考被实际阅读并固定版本；实现为原创，不移植其源码。许可核验不等于新作品的字体、地图图像、音乐或商标许可，它们需由作品另行记录。

## Paper.js：曲线参数不是路程

固定提交[`fcdc9eb2e11965a5ee680923db210f77ce78239b`](https://github.com/paperjs/paper.js/tree/fcdc9eb2e11965a5ee680923db210f77ce78239b)。

- [`Curve.js`](https://github.com/paperjs/paper.js/blob/fcdc9eb2e11965a5ee680923db210f77ce78239b/src/path/Curve.js)，blob `a13b771d29ae593ced26b19e7bf9ba2c5998266e`：曲线长度/按长度定位/归一化切线与导数幅值分开，提醒不能把线性t当作匀速行进。
- [`Numerical.js`](https://github.com/paperjs/paper.js/blob/fcdc9eb2e11965a5ee680923db210f77ce78239b/src/util/Numerical.js)，blob `beb58dce20f2400ed5523794ca69443abd8b1d65`：本固定版本具有Gauss–Kronrod自适应积分、七点Gauss快速路径及Newton/二分求根；本批不复制该数值实现。
- [`PointText.js`](https://github.com/paperjs/paper.js/blob/fcdc9eb2e11965a5ee680923db210f77ce78239b/src/text/PointText.js)，blob `1263858a8d2e09294f24dad1371eb5a1277a6928`：文本锚点与测量/布局是不同责任；其段落布局不是本批的字格沿路径实现，也不能据此宣称Paper提供了本接口。
- [官方Curve文档](https://paperjs.org/reference/curve/)明确把长度看作近似；[PointText文档](https://paperjs.org/reference/pointtext/)用于核对文本锚点语义，不能扩大为完整文字沿路径能力。
- 固定[`LICENSE.txt`](https://github.com/paperjs/paper.js/blob/fcdc9eb2e11965a5ee680923db210f77ce78239b/LICENSE.txt)，blob `84e905d812d93807dbcc0e370b5706ecca0fe4dc`，MIT。未复制代码或其资产。

本库选择有界de Casteljau细分与距离表，另外约束参数到弦线性插值偏差，避免直线但参数速度不匀的反例。输出切线来自当前cubic，而不是上一帧轨迹；精度诊断只按公开的IEEE/近似合同解读，不冒充严格实数误差证明。

## Anime.js：位置、转角与路径距离分开

固定提交[`01b81be1df6843ccfe0a71c0699a746bf740dd77`](https://github.com/juliangarnier/anime/tree/01b81be1df6843ccfe0a71c0699a746bf740dd77)。

[`src/svg/motionpath.js`](https://github.com/juliangarnier/anime/blob/01b81be1df6843ccfe0a71c0699a746bf740dd77/src/svg/motionpath.js)，blob `cb77c652b3a1fb26d8e91948b17356a286535525`，把位置和朝向映射到SVG几何的长度接口，并根据offset选择边界处理；转角由相邻长度点估计。其SVG DOM/getCTM依赖不适合本库的无浏览器求值链，本批不引入它。

对应原创选择：显式传入cubic坐标，位置与解析切线同次求值；没有隐式wrap/clamp或自动读DOM变换。字格的advance/tracking及法线偏移由调用者显式给出，遇到范围溢出或未定义中心切线拒绝，不让前一帧决定结果。固定[`LICENSE.md`](https://github.com/juliangarnier/anime/blob/01b81be1df6843ccfe0a71c0699a746bf740dd77/LICENSE.md)为MIT（blob `f999fa58ebdda6d8d0f3ae581ebdfe821f09603a`）；仅参考职责划分，未拷贝实现。

## 与既有积木去重

- 既有`geometry.polyline-trail`输入显式折线顶点，本批处理作者提供的cubic handles及其距离近似/解析方向；不把更多折线点或颜色方向算新项。
- 字格排布处理不同advance、字距、身份与基线中心的关系，不只是给一颗运动点换文字内容；字体shaping、outline变形、避碰、自动fit均不包含。
- 作品中的控制点插值、路线裁切显示、颜色/透明度/镜头与音频cue属于编排或复用旧项，不分拆成新增机制。
- 本批不需要Matter.js积分物理、Three.js真3D、React播放栈或Remotion渲染链；不借这些库名暗示已经接入。
