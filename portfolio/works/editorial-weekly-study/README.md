# 城市周报 · 编辑式粗野主义

固定1200×750静态完整案例，用户已收藏。

1. 按font-inputs.json取得精确原字体；装fonttools==4.61.1，执行 `python prepare-fonts.py --font-dir /absolute/fonts`，原源与派生SHA均fail-closed。
2. 设置 `EDITORIAL_FONT_DIR=/absolute/fonts`。无公共UI模块依赖。
3. 用仓库Native入口 `node engine/motion-render-core/scripts/render.mjs --scene ABS/design/scene.mjs --work /absolute/output --frames 0`。

修改文案须同步charset、重建字体和SHA，再做画面/字形审查。没有上游截图、字体二进制或报告；唯一封面为自产渲染。字体来源/许可见entry和LICENSES，方法/代码关联见DESIGN-RETENTION.md；不是浏览器、响应式、教学执行或视频验证。
