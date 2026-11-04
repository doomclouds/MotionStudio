# 像素徒步：把路线变成三个关卡

https://github.com/alchaincyf/huashu-design/blob/4fc7bfdbd5ec3fa2d43ce7a6433de60976a5e4b1/assets/style-specimens/web/09-pixel-side-scroller.jpg

## 设计逻辑
杉林、山脊、湖畔被组织为三关，标题和距离/爬升告诉观众每段含义，16px台阶地形建立游戏语言。HUD将体力、水量、时间放在顶端，底部对话框总结路线并给行动入口；不是随意给普通网页加像素字体。

天空蓝＋森林绿、深紫＋火山橙、湖泊青＋浅色岸线三组色彩分别承担地段身份。黄色用于关卡编号、旗标和重要外框，白黑硬字影保留可读性。绿色是原作森林与湖岸内容所需，不是默认浅绿配色。

## 实现
两次嵌套color-sections真实绘出三段背景；9处标题/里程字影直接调用drawOverprint。源SVG矩形转成可编辑terrain.json，由代码逐列绘制，不复用SVG图像或截图。按字体可用字形把下降量的Unicode负号映射为ASCII负号，避免缺字方框，不改变下降含义。

## 边界
22km、1330m爬升、水量与时刻均为源样例文案，不是实测路线、体能判断或登山建议；像素地形不是地理比例图。本次只复刻固定静态画面，不是假装已做可玩游戏。小字与原JPEG栅格化仍有细微差异。

## 迁移、反例与实际复用

适合路线或学习路径等阶段叙事：先定义阶段事件与指标，再设计各场景身份。三段横向场景显示前进，但地形变化不能盖过里程与关卡名。需要真实导航时应采用经核实地图，不能用像素山高暗示坡度。

[场景](design/scene.mjs)每次绘制以2次嵌套 color-sections.draw 形成三段背景：先1/3森林，再把剩余部分对分为山脊与湖泊；9次 print-poster.drawOverprint承担标题与里程硬字影。未使用drawPaper，边框与材质职责不同。[terrain.json](design/terrain.json)是16px矩形列序列，不是公共地理生成器。地形、HUD和硬边框属于案例实现，公共族新增0。

未强套 typographic-focus（游戏HUD不等于通用标题分区）、material-surfaces（硬网格不是玻璃/纸卡）、semantic-data（徒步例文和地形不是精确测量编码）、parameter-controls（静态出发/地图按钮不是参数控件）、expressive-type（单次硬错位不是多层挤压/条纹）、radial-scale 或 diagonal-field（无相应结构需求）。authored-paths未使用，矩形逐列保留硬格点，无需改成曲线路径。

## 当前身份、入口与验证边界

当前为 **1.0.2 candidate / NOT_RUN**，publication为not-published，当前权利状态NOT_REVIEWED。共享模块路径与依赖身份变化后未复渲或重新接受；历史1.0.0的收藏、恢复、PARTIAL视觉范围及权利记录仅绑定work.json的history。cover.jpg仅为historical-preview，不能证明本候选已通过。

完整固定场景为[design/scene.mjs](design/scene.mjs)，1200×750；恢复命令与外置字体准备见[README](README.md)。实际运行模块及传递依赖身份见[ui-dependencies.json](ui-dependencies.json)，调用来源commit见[work.json](work.json)。旧B04账单所记0947507961eb5624ddd5c1240758baefa3246fd8属于历史依赖核对，不是当前依赖身份。

本页合并既有设计推理、保留判断与实际使用说明；本次仅核文档、清单及本库场景，不重新读取外部原作源码、观看封面、渲染或听审。早期设计记录中的封面观察和调用/重复渲染结果属于当时记录，不提升当前NOT_RUN。原作归属见[CREDITS](CREDITS.md)，许可文件独立保留于LICENSES；来源URL只保留来源身份，不声明当前可达或重新授权。

换文案、数据、字体或画幅后须重新检查阅读顺序、事实、字形溢出及层次；修改字符须同步字体字符集与哈希。固定静态学习不推定浏览器、响应式、交互、Motion或跨内容迁移通过；公开族的参数合同和代码测试另行审核。静态作品收录数、调用数不是审美分数或可调用积木数。

固定样例来源：https://github.com/alchaincyf/huashu-design/blob/4fc7bfdbd5ec3fa2d43ce7a6433de60976a5e4b1/assets/style-specimens/web/09-pixel-side-scroller.html。上文JPG为旧设计推理所记图像引用，两者均为来源记录，本次未访问。
