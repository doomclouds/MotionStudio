# 温和运动 · 暗色三屏

用户已收藏，完整1200×750静态工程。

1. 按font-inputs.json取得原字体，安装fonttools==4.61.1，执行 `python prepare-fonts.py --font-dir /absolute/fonts`；原源和派生SHA均fail-closed。
2. 设置 `GENTLE_FONT_DIR=/absolute/fonts`。设置 `MOTION_UI_ASSETS_ROOT=/absolute/MotionStudio/engine/design-elements`，精确模块版本和SHA见ui-dependencies.json。
3. 仓库Native入口：`node engine/motion-render-core/scripts/render.mjs --scene ABS/design/scene.mjs --work /absolute/output --frames 0`。

修改文案须同步font-charset并重新生成/登记字体SHA与画面审查。本工程不含源截图、字体二进制、私有报告；唯一位图cover.jpg为自渲染封面。
