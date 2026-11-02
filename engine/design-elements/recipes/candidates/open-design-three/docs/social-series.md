# 连续叙事卡配方
方法：品牌位置、编号、标题基线不动；景别/色调承担章节变化。主句不做长文容器，景观是情绪隐喻不是数据。适合品牌预告、旅行章节、创作日志；不适合监控表、金融走势、密集教程。

`drawSeries(ctx,{x,y,size,gap,cards},{createCanvas})`实际调用原Social快照`drawCard`。2–4卡，size160–500；gap12–100；坐标±16384；文本采用原快照测量上限。仅dawn/forest/ridge三景观，未通用化无限背景。字体别名CarouselSerif/Italic/Mono须外部注册并锁hash。

全序列先离屏绘制，末卡溢出也不会留下前几卡在caller画布。drawImage合成保留当前path/transform/styles；调用者仍须默认alpha/filter/shadow/composite，clip和变换有意作用于最终合成。离屏需要内存，不是无限尺寸。

与已有typographic-focus/material-surfaces/authored-paths为方法关联，不存在runtime import。若将来支持任意背景，先评估是否改用material-surfaces内容槽，不另建近义表面族。新例工作室日志和户外叙事，仍同一视觉体系，不能谎称两种风格。

稀疏数组与undefined卡在绘前拒绝，不以数组length冒报成功卡数。

独立可视复核残差：合成页上排卡片下方约y=392可见整齐的横向阴影截断带，来源离屏阴影边界；尚未修复。此页仅为接口/内容重组证据，不是成熟品牌画面，不应获新作品审美通过或作为优质示例直接出片。原三作品的已审画面不受此次候选影响。
