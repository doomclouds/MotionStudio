# Meridian：用黑白对分连接品牌主张与产品证据

https://github.com/alchaincyf/huashu-design/blob/4fc7bfdbd5ec3fa2d43ce7a6433de60976a5e4b1/assets/showcases/website-saas/saas-pentagram.png

## 内容与品牌
左侧讲“把数据变成决策”，右侧展示产品分析界面。黑白对切既划分角色，又让品牌文案与产品证据同时出现；不是把整个网页随意染黑。红色decisions、CTA、选中时间、重点柱和提示建立视觉连接。

## 构图与信息层级
导航占一条稳定横带，正文保持大留白，标题三行形成第一焦点；3x与两组次指标是第二层证据。右侧先给三项KPI，再给主图，最后给细分市场和提示。图表留有大空场，不能为了填满而堆更多卡片。

## 字体与实现
原CSS指定Helvetica Neue/Arial，并非其head里加载的Inter或Space Grotesk。本机以明确许可的Liberation Sans兼容替代，复刻尺寸、行距、字距与主次；保留替代字形和局部字距残差。导航几何图标、按钮、柱图及文字全为代码绘制。

## 归属与事实边界
它是Huashu的SaaS设计样例，文件名含pentagram不代表Pentagram官方作品，也不是Meridian实际产品。3x、50%、99.9%、营收/用户数与客户名均为样例内容；Stripe、Notion等列名不构成真实客户关系或背书。页面的AI能力与商业承诺未验证。

## 原作风险与残差
暗色图表的小字号标签使用低对比灰色，这是来源可读性风险，忠实复刻不意味着通过无障碍审查。标题说“not dashboards”而展示图仍是dashboard样式，属于原样例表达张力，不可当作产品价值实证。字体替代造成少量字形、基线和字距差异；未增加真实数据、交互或视频。

## 迁移判断与真实复用边界

本例以锋利、直接的企业软件叙述组织左右职责，左侧CTA接续三行标题与主次指标。迁移时品牌主张旁须有支持它的产品证据，强调色跨文案、状态、图表应保持同义；不能只换口号却保留无关仪表盘。

公共设计族实际调用0。黑白分区可启发color-sections，但原场景并非该族调用。

## 来源、实现与恢复入口

[固定来源](https://github.com/alchaincyf/huashu-design/blob/4fc7bfdbd5ec3fa2d43ce7a6433de60976a5e4b1/assets/showcases/website-saas/saas-pentagram.html)；原作归属和权利范围见[CREDITS.md](CREDITS.md)及[work.json](work.json)，不是原创构图声明，链接也不保证当前可达或转授权利。

完整固定场景见[design/scene.mjs](design/scene.mjs)，声明画幅为1200×750；运行命令、字体与依赖要求见[README](README.md)。本页把原设计分析与保留卡中的互补判断合并为单一正文，不保留平行入口。既有设计卡记录曾结合自渲染封面检查宏观关系；本次归并未重新实看或渲染，历史验证范围不提升。

先按内容任务选择完整案例，再取可迁移判断，不把全部视觉关系拆成小零件。换文案、数据、字体或画幅后须重渲染，复核阅读顺序及事实边界。当前只支持已记录的固定静态学习，不推定浏览器、响应式、交互、Motion或跨内容迁移通过。公开族新增、参数契约与代码测试须另行审核，作品收录数不等于可调用积木数。公开work.json保留当前接受范围与文件身份，不包含私人恢复回执或独审原文。
