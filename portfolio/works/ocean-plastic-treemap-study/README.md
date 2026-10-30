# 海里的塑料 · 固定尺寸静态复刻

用户同意收藏，完整源码保留；非原创案例。1200×750，非响应式/交互 app。

## 干净复现
1. 从 font-inputs.json 的官方来源合法取得 originalInputs 到外置目录；必须精确 SHA 版本，脚本拒绝错版，不自动下载。
2. `python prepare-fonts.py --font-dir /external/fonts`（fontTools 4.61.1）；先验原源，再确定性子集/实例化/更名，再验派生。
3. `OCEAN_PLASTIC_FONT_DIR=/external/fonts node engine/motion-render-core/scripts/render.mjs --scene ABS/portfolio/works/ocean-plastic-treemap-study/design/scene.mjs --work /tmp/ocean-plastic-treemap-study-render --frames 0`

运行时同时验证原源和派生字体 SHA，无字体或错哈希失败，不使用系统回退。环境版本与依赖锁见 locks。外置资源不是仓库资产。

已审原帧 SHA256：`a614d478589c76d363945fc3ae6c33817d49bd3fb1942f20b919d2e4524ae886`。独立移目录、重制字体后重渲染字节一致。封面由该帧生成，不代替实现。唯一仓库图像为 cover.jpg。

未强套semantic-data点径图；该源是treemap。24子项与397合计成立，但头栏与间隙导致子块并非全图严格相同面积比例。机构与吨数均为未经验证的源设计例文。

## 验证范围
全图与局部独立视觉审查；静态 Native 单帧复现。未测试浏览器、交互、视频。剩余字体、边框与JPEG栅格差异见 DESIGN-REASONING.md。子块固定标题栏/间隙导致可见面积并非全图同一比例；吨数与机构仅源例文，不作已验证环境研究。
