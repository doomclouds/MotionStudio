# 科研图版 · 固定静态复刻

已获收藏同意，1200×750，完整入口design/scene.mjs。设计推理见DESIGN-RETENTION.md与design/DESIGN-REASONING.md。

## 离线恢复
按font-inputs.json的来源及精确SHA合法提供外置原字体。执行`python prepare-fonts.py --font-dir /external/fonts`，要求fontTools 4.61.1；不联网下载。脚本先核原源，再生成更名派生，最后核派生SHA。

`SCIENCE_FONT_DIR=/external/fonts node engine/motion-render-core/scripts/render.mjs --scene ABS/portfolio/works/scientific-figure-study/design/scene.mjs --work /tmp/scientific-figure-study-render --frames 0`

运行入口同时核原源与派生，不允许系统字体回退；改文案必须同步font-charset.txt并重新生成和审查。已审原帧SHA `976bee22089d8c6111009fef07e56a2510e1c6fcb5694ae6f0837c25c01e16b4`。恢复验证与可视证据身份分别记录，不把封面当全套报告。

## 使用与边界
60显示点相关r=-0.6371253865752605，与原标注-0.41不符；虚线不是该样本OLS。n/SE/P/盲评/Bonferroni无原实验背书，a/c纵轴从78截断；只核图形编码，不提供科学结论。

真实公共资产依赖见retention.json；0新公共族。仅Native固定静态验证，未测试浏览器/交互/响应式/视频/音频或真实业务正确性。可视报告及独审私有归档，字体和参考图不随源码分发。
