# 影展志 · 强色信息角色

来源：https://github.com/alchaincyf/huashu-design/blob/4fc7bfdbd5ec3fa2d43ce7a6433de60976a5e4b1/assets/style-specimens/web/02-neo-brutalism.html

## 设计逻辑
紫色大卡先发出宣言，黄色给今日热门与行动，品红强调入围规模，白色时间表提供扫描效率，青色承载评审人物故事。色彩分工不是随机撞色；贴纸式标题、硬边和偏移影让独立影展带有直接、不端着的气质。

## 重建方式
完整重建五区版式、文字层级与条纹照片占位。print-poster的drawPaper实际绘制选场次CTA边框与硬影。中文重黑体、Space Grotesk数字标签与Fraunces/中文宋体说明形成角色对照；未把源截图贴进画面。

## 边界与残差
这是Huashu影展设计样例，票价、52部、17位首次执导、候补人数、影片和日期均未经核实。条纹框是原作明确的剧照占位，未完成摄影、选图或版权清理；不称为真实剧照。正文、字距和JPEG栅格残差保留，无售票交互/响应式/视频验证。


## 可复用判断、反例与迁移
先为信息分配角色，再给颜色；主张、行动、规模、时间表、人物不能只因色块好看就同权重。适合有强编辑主张的文化内容，不适合密集金融数据或低刺激阅读。迁移时先替换并核实文案角色，再调空间和字重，最后检查色彩职责；照片位必须保持占位说明直到取得真实授权素材。

关联代码：design/scene.mjs 调用 print-poster.drawPaper 一次绘制 CTA；design/festival-role-recipe.json 保留颜色/内容角色及实际参数，它不是自动编排引擎。主卡仍为专用几何，未创建新公共族。

## 验证与入口
用户已收藏，完整入口 design/scene.mjs，运行见 README。独立视觉审查与精确 Native 恢复范围分开记录在 retention.json。换内容必须重新检查信息顺序、事实边界和字形溢出；不能据静态通过声称 Motion 迁移完成。

## 后续组合研究

[recipe.ordered-focus.v1](../../../engine/design-elements/recipes/b06/docs/ordered-focus.md)：设计目的参考，不是代码来源或原作实际调用。组合以两份合成内容通过有限静态技术/视觉复核，不计新族，也不是用户对新作品的审美验收。
