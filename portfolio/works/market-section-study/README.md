# 菜市场剖面 · 固定尺寸静态复刻

用户同意收藏，完整源码保留；非原创案例。1200×750，非响应式/交互 app。

## 干净复现
1. 从 font-inputs.json 的官方来源合法取得 originalInputs 到外置目录；必须精确 SHA 版本，脚本拒绝错版，不自动下载。
2. `python prepare-fonts.py --font-dir /external/fonts`（fontTools 4.61.1）；先验原源，再确定性子集/实例化/更名，再验派生。
3. `MARKET_SECTION_FONT_DIR=/external/fonts node engine/motion-render-core/scripts/render.mjs --scene ABS/portfolio/works/market-section-study/design/scene.mjs --work /tmp/market-section-study-render --frames 0`

运行时同时验证原源和派生字体 SHA，无字体或错哈希失败，不使用系统回退。环境版本与依赖锁见 locks。外置资源不是仓库资产。

已审原帧 SHA256：`468666bd0a22eb99663830d6a77b6ae905ffac818b9fa0ba927d833166b2930c`。独立移目录、重制字体后重渲染字节一致。封面由该帧生成，不代替实现。唯一仓库图像为 cover.jpg。

未强套已有积木；剖面非统计图。源例建筑数字未核验，不是工程设计证明；保留源结构剖面与引线标注层，未补商品和人流。

## 验证范围
全图与局部独立视觉审查；静态 Native 单帧复现。未测试浏览器、交互、视频。剩余颗粒、结构细线与字体栅格差异见 DESIGN-REASONING.md。建筑面积、摊位数与节能等数字仅为来源例文，未经工程核验。
