# 印刷覆盖机制：官方参考、去重与实现边界

两候选为原创实现，无复制外部实现代码、无新增运行依赖。数学/用途阅读与**实现后官方代码对照**按真实时间顺序区分，不倒填创作来源。

## 用途与数学材料

- [Adobe Prepress Terms](https://www.adobe.com/studio/print/pdf/prepress_terms.pdf)：实际阅读网点面积、screen ruling/angle与图像分辨率的区别，支持“覆盖→点阵”而非装饰噪点。文档/图例并未复制进源包，不将Adobe材料当本项目MIT代码。
- [Adobe Overprinting](https://helpx.adobe.com/illustrator/using/overprinting.html)：实际阅读overprint/trapping的用途；小重叠可避免错位露纸缝。本文示例不宣称复现专业印刷预览或物理墨水。
- [W3C Filter Effects Level 1, feMorphology](https://www.w3.org/TR/filter-effects-1/#feMorphologyElement)：按其Working Draft身份阅读矩形邻域max/min定义，不误称最终Recommendation。参考的是原理，候选明确只处理单通道byte mask，不宣称SVG一致性；未复制规范实现或示图。

## 用户所列库中的相关官方实现：Three.js

实际读取固定commit [`0af9729d0c143a86a1d725d6e2c3ad83301f3f34`的HalftoneShader](https://github.com/mrdoob/three.js/blob/0af9729d0c143a86a1d725d6e2c3ad83301f3f34/examples/jsm/shaders/HalftoneShader.js)及[MIT许可](https://github.com/mrdoob/three.js/blob/0af9729d0c143a86a1d725d6e2c3ad83301f3f34/LICENSE)，是在候选写出后的独立核对，不是作者原始来源。

该shader读取RGB纹理、对各通道旋转网格、从纹理中心及环绕位置采样、用幂律决定dot半径，并累计邻近dot边缘。它不是显式coverage格的方格裁切圆面积反解。候选无需纹理采样、scatter、WebGL或真实3D，不移植该shader，也不保证同样的图像。Three源码若被复制需保留MIT版权/许可；本原创实现没有复制，引用不把对方源码混入本项目许可声明。

## 与现有库的区别与不采用事项

- `raster.neighborhood-convolution`：非负邻域加权平均；morphology为非线性极值，网屏为几何面积编码。
- `raster.matte`：显式图像之间的覆盖合成；本次两个API不提供同样的图层绘图adapter。
- `raster.displacement-map`：重采样坐标；这里没有位移图。
- Canvas source-over/multiply/lighter、纸张feed、色版平移、镜头/声效属于项目绘制与旧能力，不算新增基础。
- 不为凑数引入20库的全部运行栈。Three提供有意义的对照；React状态管理、实时刚体物理、音频/转写或视频编辑器并非这两个有限覆盖算子的必要依赖。

许可核查、参考图式和性能观察都不是新增条目或艺术批准；公开源包不包含原影片、生成素材、私有参数、聊天或媒体身份。
