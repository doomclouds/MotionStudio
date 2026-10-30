# 山行 · 展开书衣

固定1200×750静态完整案例，用户已收藏。

1. 按font-inputs.json取得精确原字体；装fonttools==4.61.1，执行 `python prepare-fonts.py --font-dir /absolute/fonts`，原源与派生SHA均fail-closed。
2. 设置 `JACKET_FONT_DIR=/absolute/fonts`。设置 `MOTION_UI_ASSETS_ROOT=/absolute/MotionStudio/engine/design-elements`，依赖及SHA见ui-dependencies.json。
3. 用仓库Native入口 `node engine/motion-render-core/scripts/render.mjs --scene ABS/design/scene.mjs --work /absolute/output --frames 0`。

修改文案须同步charset、重建字体和SHA，再做画面/字形审查。没有上游截图、字体二进制或报告；唯一封面为自产渲染。字体来源/许可见entry和LICENSES，方法/代码关联见DESIGN-RETENTION.md；不是浏览器、响应式、教学执行或视频验证。

## 文楷六字恢复
文楷不是Google Fonts变量字体。本作品使用固定镜像5个WOFF2子集，保留六字并改内部名EJKai，来源见font-inputs。完整命令：`python prepare-fonts.py --font-dir /absolute/fonts --webfont-python /absolute/python-with-brotli`。主解释器fonttools4.61.1；webfont解释器fonttools4.57.0+Brotli，缺失或输出SHA不符即拒绝，不回退宋体。所有原源文件均外置；原图/字体二进制不进目录。
