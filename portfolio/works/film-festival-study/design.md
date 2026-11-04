# 影展志 · 强色信息角色

来源：https://github.com/alchaincyf/huashu-design/blob/4fc7bfdbd5ec3fa2d43ce7a6433de60976a5e4b1/assets/style-specimens/web/02-neo-brutalism.html

## 设计逻辑
紫色大卡先发出宣言，黄色给今日热门与行动，品红强调入围规模，白色时间表提供扫描效率，青色承载评审人物故事。色彩分工不是随机撞色；贴纸式标题、硬边和偏移影让独立影展带有直接、不端着的气质。

## 重建方式
完整重建五区版式、文字层级与条纹照片占位。print-poster的drawPaper实际绘制选场次CTA边框与硬影。中文重黑体、Space Grotesk数字标签与Fraunces/中文宋体说明形成角色对照；未把源截图贴进画面。

## 边界与残差
这是Huashu影展设计样例，票价、52部、17位首次执导、候补人数、影片和日期均未经核实。条纹框是原作明确的剧照占位，未完成摄影、选图或版权清理；不称为真实剧照。正文、字距和JPEG栅格残差保留，无售票交互/响应式/视频验证。

## 迁移、反例与组合研究

先为信息分配角色，再给颜色；主张、行动、规模、时间表、人物不能只因色块好看就同权重。适合有强编辑主张的文化内容，不适合密集金融数据或低刺激阅读。迁移时先替换并核实文案角色，再调空间和字重，最后检查色彩职责；照片位必须保持占位说明直到取得真实授权素材。

[场景](design/scene.mjs)每次绘制调用一次 print-poster.drawPaper，承担选场次 CTA 的硬边纸签和偏移阴影。[festival-role-recipe.json](design/festival-role-recipe.json)保留颜色、内容角色及参数，不是自动编排引擎。其余主卡仍为专用几何，公共族新增0，不为数量目标强套其他族。

[recipe.ordered-focus.v1](../../../engine/design-elements/recipes/reviewed/b06/docs/ordered-focus.md)将本例作为设计目的参考，不是代码来源或原作实际调用。该组合以两份合成内容通过有限静态技术/视觉复核，不计新族，也不是用户对新作品的审美验收。

## 当前身份、入口与验证边界

当前为 **1.0.2 candidate / NOT_RUN**，publication为not-published，当前权利状态NOT_REVIEWED。共享模块路径与依赖身份变化后未复渲或重新接受；历史1.0.0的收藏、恢复、PARTIAL视觉范围及权利记录仅绑定work.json的history。cover.jpg仅为historical-preview，不能证明本候选已通过。

完整固定场景为[design/scene.mjs](design/scene.mjs)，1200×750；恢复命令与外置字体准备见[README](README.md)。实际运行模块及传递依赖身份见[ui-dependencies.json](ui-dependencies.json)，调用来源commit见[work.json](work.json)。历史依赖核对不能替代当前模块身份。

本页合并既有设计推理、保留判断与实际使用说明；本次仅核文档、清单及本库场景，不重新读取外部原作源码、观看封面、渲染或听审。早期设计记录中的封面观察和调用/重复渲染结果属于当时记录，不提升当前NOT_RUN。原作归属见[CREDITS](CREDITS.md)，许可文件独立保留于LICENSES；来源URL只保留来源身份，不声明当前可达或重新授权。

换文案、数据、字体或画幅后须重新检查阅读顺序、事实、字形溢出及层次；修改字符须同步字体字符集与哈希。固定静态学习不推定浏览器、响应式、交互、Motion或跨内容迁移通过；公开族的参数合同和代码测试另行审核。静态作品收录数、调用数不是审美分数或可调用积木数。
