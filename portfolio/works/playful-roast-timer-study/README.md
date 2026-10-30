# 烘焙计时 · 固定尺寸静态复刻

用户同意收藏，完整源码保留；非原创案例。1200×750，非响应式/交互 app。

## 干净复现
1. 从 font-inputs.json 的官方来源合法取得 originalInputs 到外置目录；必须精确 SHA 版本，脚本拒绝错版，不自动下载。
2. `python prepare-fonts.py --font-dir /external/fonts`（fontTools 4.61.1）；先验原源，再确定性子集/实例化/更名，再验派生。
3. `PLAYFUL_ROAST_FONT_DIR=/external/fonts node engine/motion-render-core/scripts/render.mjs --scene ABS/portfolio/works/playful-roast-timer-study/design/scene.mjs --work /tmp/playful-roast-timer-study-render --frames 0`

运行时同时验证原源和派生字体 SHA，无字体或错哈希失败，不使用系统回退。环境版本与依赖锁见 locks。外置资源不是仓库资产。

已审原帧 SHA256：`7f72a28d0f8f17e263a02bb6bf9af728d77c1cf1c957e66d650a9f62f7ccc60a`。独立移目录、重制字体后重渲染字节一致。封面由该帧生成，不代替实现。唯一仓库图像为 cover.jpg。

真实使用 design.material-surfaces.v1，仅用于三设备底层。标准 engine/design-elements/material-surfaces.mjs 须 SHA256 70bf1fcfa89bfbf911f5cf735b1b08e8ae7f360e43bd43a8c831efef579696eb；运行时强校验，禁止静默换版。圆盘与温度管仍为案例代码。

## 验证范围
全图与局部独立视觉审查；静态 Native 单帧复现。未测试浏览器、交互、视频。剩余纸纹/字体栅格或2D高光差异见 DESIGN-REASONING.md。烘焙例文参数非推荐工艺或实测。
