# 友好金融三屏 · 固定静态复刻

已获收藏同意，1200×750，完整入口design/scene.mjs。设计推理见DESIGN-RETENTION.md与design/DESIGN-REASONING.md。

## 离线恢复
按font-inputs.json的来源及精确SHA合法提供外置原字体。执行`python prepare-fonts.py --font-dir /external/fonts`，要求fontTools 4.61.1；不联网下载。脚本先核原源，再生成更名派生，最后核派生SHA。

`FINTECH_FONT_DIR=/external/fonts node engine/motion-render-core/scripts/render.mjs --scene ABS/portfolio/works/friendly-fintech-study/design/scene.mjs --work /tmp/friendly-fintech-study-render --frames 0`

运行入口同时核原源与派生，不允许系统字体回退；改文案必须同步font-charset.txt并重新生成和审查。已审原帧SHA `0b84476429d6e14445ffa9d95750cb762ccbefa11b38d0c94aaa8151b62f1184`。恢复验证与可视证据身份分别记录，不把封面当全套报告。

## 使用与边界
环图38/20/14/14/14合100，图例前三仅72，余28未标注。预算条仅原CSS宽无目标分母；余额、预算和已花不能据此凑成同一账本。卡软影为案例代码，非公共材质族能力。

真实公共资产依赖见retention.json；0新公共族。仅Native固定静态验证，未测试浏览器/交互/响应式/视频/音频或真实业务正确性。可视报告及独审私有归档，字体和参考图不随源码分发。
