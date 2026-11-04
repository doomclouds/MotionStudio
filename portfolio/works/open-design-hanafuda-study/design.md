# 花札年份卡：设计、场景与受限复用

## 内容意图与阅读顺序

这是1024×576的历史叙事样例静帧，不是整套幻灯片或可播放应用。深色背景中放置米纸色1280×720逻辑画布，按8/15缩放；大年份与说明承担“起点”，右侧花札像素图案提供具体对象，顶部章节/录制标记和底部时间条提供节目式语境。纸色、近黑字和花札红强调形成有限色彩分工，注册角标与稀疏点纹是场景装饰，不是数据编码。

[design/scene.mjs](design/scene.mjs)用文字、路径和矩形绘制，不铺上游截图。年份使用展示字体，说明用斜体，元信息/时间条用等宽体，日文另有字体路由。截图中花札浮动的某一相位只保留为固定坐标，不构成动画实现。

[render.mjs](render.mjs)显式输出faithful和readable-revision两个版本：原布局保留年份/说明碰撞；修订移动年份和说明并重排行稿。这是同一作品的阅读修订，不是第二件作品，也不说明自动排版已经解决冲突。不要将样例史实、品牌名称或REC标记当作核验记录。

## 实现、资源与来源

恢复/测试命令见[README](README.md)，字体字节见[font-lock.json](font-lock.json)，外置资源约束由[resources.cjs](resources.cjs)执行。[CREDITS](CREDITS.md)保留固定OpenDesign来源、Apache/MIT声明边界和OFL通知；字体、原截图及私有报告均不随代码提供。当前接受/公开范围以[work.json](work.json)为准，本次仅整合文档，没有重新渲染或补做审美接受。

适合单个历史节点、节目章节或展示卡。换内容须重测年份/注释/图案的关系和时间条标签宽度；不适合直接转为自动年表、历史事实数据库或任意语言长文排版。局部可组合实现和已知反例如下，保留其有限技术范围。

## Local helpers and limits
Two bounded LOCAL candidate helpers are consumed by the main scene and a separate synthetic transfer:
1. design/pixel-card.mjs drawPixelMotif(ctx,{x,y,scale,rects}): authored 24×32 rect palette; validates every cell and total count before drawing, bounded scale 0.125≤scale≤64, integer cell geometry, |x|/|y|≤8192, ≤4096 rects. No image decoding, auto-detection, arbitrary grid support, or claim of new public primitive.
2. design/timeline.mjs drawTimeline(ctx,{x,y,width,height,items,font,Path2D}): static clipped timeline strip, ≤64 items, 0≤item.x≤width, |x|/|y|≤8192, 1≤width≤4096, 1≤height≤256, ≤160 characters/label. Authored positions are caller responsibility; no automatic layout/collision solution or animation.
Both save/restore Canvas transform/clip and explicitly restore fillStyle/font/letterSpacing because this backend exposes cached style properties across restore.
Pixel preflight rejection tests assert no mutation. Timeline text fit is not guaranteed; caller must supply typography and positions. Fixed background/type/registration belong to this particular scene, not a new family.
Do not turn source caption overlap into a rule. The revision demonstrates one hand-authored resolution. Main year body is not a generalized auto-fitting title API.

After independent review: timeline takes the caller-backend Path2D constructor and builds isolated clip/dot paths without beginPath, preserving the current caller path. Path-preservation pixels tested. Domain guards reject 1e20 origins/items and Number.MIN_VALUE scales/extents; pixel cells must be positive integer extents. The caller still owns its existing transform, canvas allocation, font availability, and text fit; no guarantee is made for a singular/overflowing preexisting caller transform.

Sparse-item fix: Array.from densifies the entire items array and snapshots object label/x before any drawing. Holes, null, undefined, primitives, arrays and invalid properties are rejected. Nine negative cases assert zero pixel/style/current-path pollution (36 checks).


## Approved collection scope (2026-10-30)
Owner approved the ten static examples: “挺不错的，沉淀积木，然后推送，继续任务”. This permits retaining this static study and source assets, not trademark endorsement, fact verification or motion acceptance. Original screenshots and fonts remain outside this source tree. Local helper code is retained, not promoted to a new public family.
