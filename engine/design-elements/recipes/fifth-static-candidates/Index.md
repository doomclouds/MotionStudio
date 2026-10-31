# 第五组：三项受限静态配方候选

这是**发现与案例选择索引**，不是正式族注册表，也不是完整应用/品牌作品的发布清单。三项新增受限候选，**公共设计族增量 0、正式配方注册增量 0、portfolio 作品增量 0**；既有 14 族 `catalog.json` 与 dispatcher 不变。新合成内容的技术/独立复核不替代用户逐项审美确认，不自动扩展为动画、交互或产品实现。

| 内容目的 / 受限候选 | 文字指导与契约 | 可调用代码与两份新内容 | 许可证与来源边界 |
|---|---|---|---|
| 材质场：连续数值变化的静态抽象底面，而非统计地图 | [设计指导](../scalar-field-candidate/DESIGN-GUIDE.md) · [契约](../scalar-field-candidate/CONTRACT.md) · [运行](../scalar-field-candidate/README.md) | [fieldTile / place](../scalar-field-candidate/index.mjs) · [ember-sequence / tidal-map](../scalar-field-candidate/examples.mjs) | [MIT及Graphite MIT/Apache归属](../scalar-field-candidate/CREDITS.md)；不含Graphite专有品牌/图标、原图或采样几何；无需字体 |
| 文件格网＋同源摘要：显式项目的静态窗口与选中可见性 | [设计指导](../file-grid-candidate/DESIGN-GUIDE.md) · [契约](../file-grid-candidate/CONTRACT.md) · [运行](../file-grid-candidate/README.md) | [fileGridTile / paneSummaryTile](../file-grid-candidate/file-tiles.mjs) · [field-study / edition-desk](../file-grid-candidate/examples/compositions.mjs) | [MIT / OpenMTP来源 / 外置Inter OFL](../file-grid-candidate/CREDITS.md)；第三方CC BY图标未用，几何符号新写，无设备或文件系统访问 |
| 索引色像素层：已写好的调色板/索引数据转RGBA | [设计指导](../indexed-pixel-layer-candidate/DESIGN-GUIDE.md) · [契约](../indexed-pixel-layer-candidate/CONTRACT.md) · [运行](../indexed-pixel-layer-candidate/README.md) | [renderIndexedPixels / createPixelLayer](../indexed-pixel-layer-candidate/index.cjs) · [signal-quilt / weave-folio](../indexed-pixel-layer-candidate/examples.cjs) | [MIT / Pixelorama来源](../indexed-pixel-layer-candidate/CREDITS.md)；全新小模型，无原作品生成图、图像派生索引模型、字体或图标 |

## 选用与不选用

1. 先确定内容目的。需要材料气氛时选标量场，且把可读正文放在独立平静表面；不能把程序等高线标成测量结论。
2. 需要可解释的文件选择状态时选格网与同一个handle导出的摘要。示例是虚构数据，不读取真实目录，不连接手机，不执行传输。若需要真实交互，另做产品层。
3. 已有许可明确的索引色小模型时选像素层。它不负责图像生成/量化、对象分割或像素编辑器；宿主自行提供并许可文字。
4. 一项配方的两种示例验证不同内容/布局复用，不计两件新增收藏作品，也不证明更广泛的可用性或用户认可。原完整研究作品未迁移成这些API。

## 可复现与保留边界

三包只保留57个UTF-8源码/指导/测试/许可文本。Native Canvas锁定0.1.100并外装；格网另外从固定官方URL恢复Inter/OFL，在仓库外派生和使用字体。所有PNG、报告、原图、运行二进制、安装缓存、私有审计/Library标识均不在此源投影。包内提取时的冻结candidate状态不因本索引而自动晋升；正式注册和审美确认仍是独立门槛。

设计出处并不等于所有上游视觉资产获许可，也不等于复制其应用。各包的CREDITS/完整LICENSE优先；本组不含GPL的Surge静态研究或其任何源码/素材。调用与边界测试见各包README；输出必须写到调用者的新外部目录。
