# 新旺唱片：纵横街招里的品牌密度

https://github.com/alchaincyf/huashu-design/blob/4fc7bfdbd5ec3fa2d43ce7a6433de60976a5e4b1/assets/style-specimens/east/06-hk-street-signs.jpg

## 设计逻辑
左侧巨大红底竖招牌先建立店名，右上蓝底横招牌说明唱片/卡式带，二手回收、营业时间、版本与价目分别挂在不同尺寸招牌上。它不是平铺彩色卡片，而是街道上多个信息层的竞争与秩序。

红黄蓝绿并置，但底部墙面和黑板暗下来保留夜景。黄色二手竖牌压住红招牌边缘，形成空间叠层；大宋体蓝牌与粗黑体竖牌区分招牌个性。霓虹外晕只服务牌体与红字营业牌，正文仍清楚。

## 实现
传统中文Noto Sans/Serif TC与Archivo Black按各自职责绘制。硬字影直接调用既有drawOverprint；发光使用代码自产alpha模糊，替代不可靠的原生shadowBlur效果。没有把源截图贴到墙上。黄牌文字对照bbox下移3px，其他牌体位置不动。

## 边界
这是Huashu街招设计样例，不代表真实唱片店、现行营业时间或商品报价。候选比源JPEG稍干净锐利，外晕弥散、细小字号和抗锯齿仍有差异；不为模仿压缩噪声过度泛光。
