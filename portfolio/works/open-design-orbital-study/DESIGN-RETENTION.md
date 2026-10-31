# Reach every country — 静态轨道视觉研究

## 目标与品牌
这是一幅完整 1024×576 的传播视觉，不是仪表盘，也不是实际地图。源画面通过科学仪器式线网、极小操作标注和斜衬线口号将“覆盖范围”表达为安静、精密的传播能力。Anthropic Labs、Charlotte × Vine、175 等保留为原例文案；不主张真实客户、真实语言覆盖、商标或科学数据授权。

## 构图与阅读顺序
中心512,288；最外轨道半径224.64；地球半径约115.73。四层圆环是1/.92/.8/.64比例，地球与环之间留空，避免所有线都拥到中心。左上身份、右上数量、底部口号与双端页脚构成框架。画面完整，无截取一部分扩称整页。参考原图无地名环标，未根据源中空容器虚构标签。

## 配色和排印
纸底#f3eee5、墨#1a1816、克制陶红#c0563b。红色只标中心信号和country，不用多个近似绿色来制造伪层次。地球用奶白到灰褐的体积渐变与透明墨色块；色块是抽象形状，不是国界。大面积留白让细线承担主角；脚注用IBM Plex Mono替代源平台等宽，主句用本地Cormorant Garamond600，身份用IBM Plex Mono Medium。原浏览器字体未测，不声称字形像素一致。

## 原图反推而非编造运行状态
源HTML含CSS旋转，截图的地球方位不是源码零角度。这里从已见原图拟合静态-104度；不是恢复拍摄时间、不证明运行原HTML。源尺寸按1920×1080设计比例对应1024×576参考推断，仅用固定画布绘制。主句23px与点阵透明度为视觉对齐调节，非源CSS逐值照抄。没有播放、响应式或浏览器测试。

## 可组合代码
`design/orbital-field.cjs`公开本地候选方法 `plan(options)`、`draw(ctx,options)`：几何场支持中心/半径/旋转/单一强调色，以及globe和signal两种内容。主作品实际调用；verification/two-compositions.png使用同一个draw分别绘制地球与五节点网络。不是只换颜色的重复作品。四环比例、地球线网、中心锚点是配方的骨架；字符与页脚仍归场景。0新增公共积木族，未登记远端catalog。

边界：radius40..2048，中心绝对值≤16384，rotation±360，十六进制强调色，固定两种内容。错误选项绘前拒绝，虽使用Path2D，Native0.1.100的globe分支仍替换调用者current path（signal哨兵可保留）：不保证保留，调用方必须在之后beginPath重建所需路径，保存/恢复画布变换、样式和dash；调用者须提供默认shadow/filter/globalAlpha/composite状态，当前不做这些效果的主动归一化。像素绘制不可回滚；不承诺外部异常事务性。它不自动布局任意文案，不是地理投影，也不是动效接口。

## 验证和未来迁移
已做数值/错误输入/状态隔离和重复渲染，另有原图、左右对照、透明叠合、像素差异和两内容组合图。差异图不是审美分数。独审及用户收藏尚待确认。后续motion可以参数化旋转，但须单独检验节奏、线条闪烁、字号和画外裁切，当前静态通过不自动继承到视频。


## Approved collection scope (2026-10-30)
Owner approved the ten static examples: “挺不错的，沉淀积木，然后推送，继续任务”. This permits retaining this static study and source assets, not trademark endorsement, fact verification or motion acceptance. Original screenshots and fonts remain outside this source tree. Local helper code is retained, not promoted to a new public family.
