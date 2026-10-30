# tide · 深色命令面板

固定1200×750静态完整案例，用户已收藏。

1. 按font-inputs.json取得精确原字体；装fonttools==4.61.1，执行 `python prepare-fonts.py --font-dir /absolute/fonts`，原源与派生SHA均fail-closed。
2. 设置 `COMMAND_FONT_DIR=/absolute/fonts`。设置 `MOTION_UI_ASSETS_ROOT=/absolute/MotionStudio/engine/design-elements`，依赖及SHA见ui-dependencies.json。
3. 用仓库Native入口 `node engine/motion-render-core/scripts/render.mjs --scene ABS/design/scene.mjs --work /absolute/output --frames 0`。

修改文案须同步charset、重建字体和SHA，再做画面/字形审查。没有上游截图、字体二进制或报告；唯一封面为自产渲染。字体来源/许可见entry和LICENSES，方法/代码关联见DESIGN-RETENTION.md；不是浏览器、响应式、教学执行或视频验证。

保留可执行案例配方自检：设置上述字体/UI env及 `MOTION_ENGINE_ROOT=/absolute/engine/motion-render-core`，运行 `node test-command-rows.mjs`；原帧、12行两宽度/两选中与10拒绝均核，不执行真实命令。
