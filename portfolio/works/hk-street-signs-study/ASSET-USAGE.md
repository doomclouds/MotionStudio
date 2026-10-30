# B04实际UI积木账单

源码通过MOTION_UI_ASSETS_ROOT导入现有资产，没有复制改名成新族。固定核对版本0947507961eb5624ddd5c1240758baefa3246fd8；运行所用模块及传递依赖 hash 在 ui-dependencies.json。

- design.print-poster.v1 | HK 6次、Pixel 9次实际drawOverprint调用 | 硬偏移字影与源作一致；未使用drawPaper，因为边框与材质职责不同。
- design.color-sections.v1 | Pixel 2次实际嵌套draw调用 | 先1/3森林，再剩余部分1/2山脊与湖泊；是画面真实背景，不是隐藏导入。
- design.typographic-focus.v1 | 未使用 | 当前字体层级受源作纵向招牌和游戏HUD限制，没有强行套通用标题分区。
- design.material-surfaces.v1 | 未使用 | 街招是发光漆面厚边框，像素界面是硬格点；现有玻璃/纸/不透明卡面规则不等于这两种材质。
- design.semantic-data.v1 | 未使用 | 价格清单和徒步信息不是该族的符号量化编码，地形也不是精确测量图。
- design.parameter-controls.v1 | 未使用 | 没有滑杆/旋钮参数调节；静态出发/地图按钮不是参数控件。
- design.expressive-type.v1 | 未使用 | 源作是单次硬错位字影，不是多层挤压或条纹切片，已用更合适的print-poster。
- design.radial-scale.v1 | 未使用 | 无径向刻度或环形读数。
- design.diagonal-field.v1 | 未使用 | 无斜向场构图需求，不添加无关背景。
- design.authored-paths.v1 | 未使用 | 源像素地形由16px矩形逐列组成，直接按源数据绘制能保留硬网格，无需改造成曲线路径。

新增公共族：0。仅案例实现：招牌垂直布局、局部辉光alpha层、16px地形数据、HUD和硬边框。绘制成功后的调用记录与重复渲染哈希留档；调用计数不等于审美分数。
