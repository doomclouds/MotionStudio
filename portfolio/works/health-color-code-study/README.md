# 健康数据颜色编码 · 固定尺寸静态复刻

用户同意收藏，完整源码保留；非原创案例。1200×750，非响应式/交互 app。

## 干净复现
1. 从 font-inputs.json 的官方来源合法取得 originalInputs 到外置目录；必须精确 SHA 版本，脚本拒绝错版，不自动下载。
2. `python prepare-fonts.py --font-dir /external/fonts`（fontTools 4.61.1）；先验原源，再确定性子集/实例化/更名，再验派生。
3. `HEALTH_COLOR_FONT_DIR=/external/fonts node engine/motion-render-core/scripts/render.mjs --scene ABS/portfolio/works/health-color-code-study/design/scene.mjs --work /tmp/health-color-code-study-render --frames 0`

运行时同时验证原源和派生字体 SHA，无字体或错哈希失败，不使用系统回退。环境版本与依赖锁见 locks。外置资源不是仓库资产。

已审原帧 SHA256：`80f9ea0a51bea21f3d3ca4a6b2e5a6185735fddf8dc866e6a718756f1fbf3e0a`。独立移目录、重制字体后重渲染字节一致。封面由该帧生成，不代替实现。唯一仓库图像为 cover.jpg。

真实使用 design.material-surfaces.v1，用于两设备底层与右大浮卡三处。标准 engine/design-elements/material-surfaces.mjs 须 SHA256 70bf1fcfa89bfbf911f5cf735b1b08e8ae7f360e43bd43a8c831efef579696eb；运行时强校验，禁止静默换版。圆环、分期柱列及微型示意折线仍为案例代码。

## 验证范围
全图与局部独立视觉审查；静态 Native 单帧复现。未测试浏览器、交互、视频。剩余阴影、细字与曲线栅格差异见 DESIGN-REASONING.md。健康数据与HRV曲线为源UI示意，非医学结论；源三环弧长与标签比例存在不一致，具体量化和已修字体别名缺陷在设计分析中披露。
