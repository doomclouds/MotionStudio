# 天文台夜观 · 环形信息图

完整1200×750固定静态Native工程，用户已同意收藏。Huashu样张非官方复刻，非杉浦康平本人作品或真实天文资料。设计逻辑见design/DESIGN-ANALYSIS.md；沉淀入口DESIGN-RETENTION.md与retention.json。

## 离线复现
按font-inputs.json官方来源及固定SHA合法自备原字体，使用fonttools4.61.1与locks中的Native版本：
```sh
python prepare-fonts.py --source-dir /ABS/ORIGINAL_FONTS --output-dir /ABS/PREPARED_FONTS
MANDALA_FONT_DIR=/ABS/PREPARED_FONTS MOTION_ENGINE_ROOT=/ABS/ENGINE node verify.mjs
MANDALA_FONT_DIR=/ABS/PREPARED_FONTS node /ABS/ENGINE/scripts/render.mjs --scene /ABS/WORK/design/scene.mjs --work /ABS/OUTPUT --frames 0
MOTION_ENGINE_ROOT=/ABS/ENGINE node tests/orbit-labels.test.mjs
```
ENGINE为MotionStudio的engine/motion-render-core。原源/派生双SHA验错即停，不联网或回退系统字体。字体别名Mandala*隔离。改字须更新字符集和字体锁并再审。

原帧SHA256：`daaf7ef86616f78ebea7439eff7f0b6f23dc93eb71c4f1807f4fa30bb883a25b`。

## 真实实现与边界
diagram.json是源SVG几何/文字的结构化移植，由Native逐个圆、线、路径、裁剪与文本绘制，不是SVG或截图图像层。公共设计族调用0；只使用shared状态工具本地快照，固定源与SHA在module-snapshots.json。orbit-labels为本例真实调用24标签的候选，不增加公共族计数；不自动布局/避碰或计算天文。

日期/星期/月龄/能见性/星点都未核查，时间点间隔非分钟比例，不能用作真实观测安排。标题0.8px同色补墨与基线+2是作者依独审问题选择的Native校准，不等于源CSS。旋转小字与JPEG边缘仍有残差。

唯一图片cover为自渲染。报告容器已从私有Library取回核对，独审原文已在仅所有者Page读回核验；运行回执仍为本地记录。曼荼罗报告的原尺寸嵌图精确像素绑定尚未建立，不推定版本错误。仅静态验收，无浏览器、交互、响应式、视频或声音验证。
