# Swiss International · 单张首片（非整套演示）

## 参考与来源核对
实际看了完整2000×1194库存截图deck-swiss-international.png。它含HTML Everything编辑器宿主，本次经授权只复刻完整蓝色第一张幻灯片。原样裁切坐标[398,189,1922,1047]，得到1524×858，存reference/slide-crop.png；不移除或篡改参考中的宿主覆盖。
原crop右上Present、右下页数残片遮住极小蓝底区域；成品不画宿主控件，依据固定源码蓝底重建被遮角。因此不是原crop像素完全相同，也不是完整编辑器界面。
找到与截图内容对应的固定源：nexu-io/open-design commit12d970eacc8971150e3c76470d2a9afe16dc2ed1，skills/deck-swiss-international/example.html。注意plugins/_official/examples同名文件是另一份10页Board Pre-read，不用它冒充此截图源码。当前匹配HTML只有首片和KPI示例两页，S01/22仅源文案，不等于实现22页；本次只交首片。

## 设计方法
强单色国际克莱因蓝#002FA7与纸白#fafaf8形成高对比品牌识别。Inter Tight900三行巨字占主叙事位置，不依赖卡片/图片装饰；紧字距、低行距与左对齐共同形成海报式密度。四周48逻辑单位留边、页首三段技术元信息、页尾细线/坐标三段作为稳定框架。ASCII纹理仅低透明度出现在右上，不能抢大字。
首片是品牌宣言，不是统计图；75/17/0、Berlin坐标/日期是源示例文案，未验证模板数、agent适配、成本或真实办公地点，也不是本项目能力承诺。截图OPEN DESIGN与HTML OPENDESIGN空格差按视觉参考保留。

## 独立实现与字体
Native在1524×858实际像素绘制，使用推定1280×720逻辑坐标映射；不是运行原浏览器或把参考整图贴底。标题字号106与手动基线依据源码规则及可见截图校准；具体宿主iframe视口未实测。
Inter Tight900/400、NotoSansSC400、JetBrainsMono500分别提供巨字/中英正文/技术元信息。初版放大低分辨率画布较糊，改实际输出像素下矢量文字绘制；中文句号错误分到拉丁字体曾出现缺字，分段改含CJK标点后恢复。字库原源/派生hash与OFL通知保留，源代码Apache2.0。无图片素材、无imagegen、无3D。

## 可组合代码与范围
design/title-block.mjs提供受限drawTitleBlock：已定稿的1–6行、font/size/leading/maxWidth/color/tracking输入，绘制前先测完所有行advance width，任何溢出都不画。主首片真实调用一次；两个不同文本、两行/三行、正反蓝白技术重组实用同一入口。不把它们计为完整新作品。
这是本地案例配方，不是公共新族，公共新族0。它不自动排版、不调字号、不保证字体已注册、字形墨迹和描边净距，也不保证垂直高度。caller应负责字形外伸、页边与对比度。其只暂存明确的文本样式字段，不隔离caller shadow/filter/alpha/clip；不用beginPath不会主动清当前路径。非法输入/超宽拒绝具备绘前不变保证，不泛化为任意绘制事务库。

## 实看结论与残差
独审实看主标题字形/三行落点、蓝底/留白贴合，无主要视觉阻断。右上ASCII原作更细密竖纹，Native字形栅格偏方格/横带；保留为字体栅格残差，不用贴原截图掩盖。小字字距与中文标点栅格亦微差；宿主控件缺席是明确范围决定，不是遗漏。


## Approved collection scope (2026-10-30)
Owner approved the ten static examples: “挺不错的，沉淀积木，然后推送，继续任务”. This permits retaining this static study and source assets, not trademark endorsement, fact verification or motion acceptance. Original screenshots and fonts remain outside this source tree. Local helper code is retained, not promoted to a new public family.
