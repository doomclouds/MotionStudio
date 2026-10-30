# ui-003-print-poster · 内容驱动的印刷招贴

版本1；分类brand-posters；公开方法卡与合成运行例；另有明确获准保留的[完整静态作品工程](https://github.com/doomclouds/MotionStudio/tree/dev/portfolio/works/vinyl-study)，不公开私人个案反馈或对照报告。

## 来源与设计逻辑

参考 [Huashu Design 黑胶商店样例](https://github.com/alchaincyf/huashu-design/blob/4fc7bfdbd5ec3fa2d43ce7a6433de60976a5e4b1/assets/style-specimens/web/03-memphis-maximalism.jpg)。它是设计样例，不是实际店铺官网。以下是观察归纳，不代表作者原话；链接不转授素材权利。

模拟唱片文化通过实体纸感、粗宋体叠印、旋转票签和硬影协同表达。标题宣言→唱片实体→价格构成三个焦点；说明卡片退居次级，地址/营业时间保持可读。红、蓝、黄有各自职责，米色/黑色连接画面；原作橄榄色承担平衡而非默认主题。

## 适用与反例

适用于有明确文化态度、一个主物和少量行动信息的活动/零售招贴。先决定内容意义，再选择主物及文字声音。不要把唱片换成不相关光球；不要用统一柔影卡片消除印刷语法；不能给每个信息相同视觉重量，也不要随机倾斜所有元素。密集数据、严肃医疗信息及长文阅读不是此配方的默认适用任务。

## 可调用实现

稳定实现ID `design.print-poster.v1`：[代码与接口](https://github.com/doomclouds/MotionStudio/tree/dev/engine/design-elements)，代码真源`engine/design-elements/print-poster.mjs`。

- `drawPaper`：纸签的有意角度、厚边、硬影。尺寸/位置/角度/色彩由调用者传入。
- `drawOverprint`：用硬偏移组织强调而非柔光；字体由调用者提供，实测溢出直接拒绝。
- `drawPoster`＋两份合成recipes：同一静态结构，切换听音活动与印刷工作坊；对应主物随内容改变，不是仅换字。合成例不是第二个验收作品，不宣称复刻原图。

印刷语法是协同方法，不等于以上两个小函数已经捕获全部审美。制作时仍须全幅检查三焦点、字形气质、色彩职责及主物相关性，再看局部。

## 证据与边界

公开运行测试覆盖两种配方像素不同、每种重复确定、非法尺寸/非有限值/文字溢出/未知主物拒绝。它只证明接口能运行，不替代完整视觉判断。公开实现不含原图、品牌标识、上游字体、截图纹理或生产场景；合成例运行不依赖上游资产文件；引用链接不转授素材权利。原作JPEG颗粒、字体栅格化、唱片细纹/影边不应被粗暴当作模型审美分数。

仅固定画幅Native静态。尚未验证动效、响应式、交互、自动排版或换场景后的审美提升。用于Motion时先锁定静态关系，再另做读时、焦点交接和连续观看验证，不把静态通过推定为视频通过。

[分类](../categories/brand-posters/INDEX.md) · [总索引](../INDEX.md)
