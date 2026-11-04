# 新旺唱片：纵横街招里的品牌密度

https://github.com/alchaincyf/huashu-design/blob/4fc7bfdbd5ec3fa2d43ce7a6433de60976a5e4b1/assets/style-specimens/east/06-hk-street-signs.jpg

## 设计逻辑
左侧巨大红底竖招牌先建立店名，右上蓝底横招牌说明唱片/卡式带，二手回收、营业时间、版本与价目分别挂在不同尺寸招牌上。它不是平铺彩色卡片，而是街道上多个信息层的竞争与秩序。

红黄蓝绿并置，但底部墙面和黑板暗下来保留夜景。黄色二手竖牌压住红招牌边缘，形成空间叠层；大宋体蓝牌与粗黑体竖牌区分招牌个性。霓虹外晕只服务牌体与红字营业牌，正文仍清楚。

## 实现
传统中文Noto Sans/Serif TC与Archivo Black按各自职责绘制。硬字影直接调用既有drawOverprint；发光使用代码自产alpha模糊，替代不可靠的原生shadowBlur效果。没有把源截图贴到墙上。黄牌文字对照bbox下移3px，其他牌体位置不动。

## 边界
这是Huashu街招设计样例，不代表真实唱片店、现行营业时间或商品报价。候选比源JPEG稍干净锐利，外晕弥散、细小字号和抗锯齿仍有差异；不为模仿压缩噪声过度泛光。

## 迁移、反例与实际复用

街巷商业的年代感来自信息竞争与方向差异。先给每块牌不同职责和远近，再检查最小字号；不适合所有内容都以招牌竞争。红黄蓝绿不能平均发光，暗墙和黑板须留给次要信息。传统中文字形不是历史招牌考据。

[场景](design/scene.mjs)每次绘制有6次 print-poster.drawOverprint 硬字影调用。发光属于案例自产alpha遮罩，不是位图贴图或新公共霓虹族。纵向招牌、局部辉光和黑板虚线属于案例实现，公共族新增0。

未强套 typographic-focus（纵向招牌不等于通用标题分区）、material-surfaces（发光漆面不是玻璃/纸卡）、semantic-data（价目不是符号量化编码）、parameter-controls（无滑杆旋钮）、expressive-type（单次硬错位不是多层挤压/条纹）、radial-scale 或 diagonal-field（无相应结构需求）。color-sections与16px地形属于像素徒步案例，不计本例调用。

## 当前身份、入口与验证边界

当前为 **1.0.2 candidate / NOT_RUN**，publication为not-published，当前权利状态NOT_REVIEWED。共享模块路径与依赖身份变化后未复渲或重新接受；历史1.0.0的收藏、恢复、PARTIAL视觉范围及权利记录仅绑定work.json的history。cover.jpg仅为historical-preview，不能证明本候选已通过。

完整固定场景为[design/scene.mjs](design/scene.mjs)，1200×750；恢复命令与外置字体准备见[README](README.md)。实际运行模块及传递依赖身份见[ui-dependencies.json](ui-dependencies.json)，调用来源commit见[work.json](work.json)。旧B04账单所记0947507961eb5624ddd5c1240758baefa3246fd8属于历史依赖核对，不是当前依赖身份。

本页合并既有设计推理、保留判断与实际使用说明；本次仅核文档、清单及本库场景，不重新读取外部原作源码、观看封面、渲染或听审。早期设计记录中的封面观察和调用/重复渲染结果属于当时记录，不提升当前NOT_RUN。原作归属见[CREDITS](CREDITS.md)，许可文件独立保留于LICENSES；来源URL只保留来源身份，不声明当前可达或重新授权。

换文案、数据、字体或画幅后须重新检查阅读顺序、事实、字形溢出及层次；修改字符须同步字体字符集与哈希。固定静态学习不推定浏览器、响应式、交互、Motion或跨内容迁移通过；公开族的参数合同和代码测试另行审核。静态作品收录数、调用数不是审美分数或可调用积木数。

固定样例来源：https://github.com/alchaincyf/huashu-design/blob/4fc7bfdbd5ec3fa2d43ce7a6433de60976a5e4b1/assets/style-specimens/east/06-hk-street-signs.html。上文JPG为旧设计推理所记图像引用，两者均为来源记录，本次未访问。
