# 唱片销量图形统计 · 完整静态复刻
已获收藏同意，源码发布仅含工程与自产封面，不含字体及私有报告。固定1200×750，仅Native静帧验证。

## 恢复
按font-inputs.json取得精确原字体至外置目录；不自动下载。
`python prepare-fonts.py --font-dir /external/fonts`（fontTools4.61.1）验证原源、确定性子集实例化及内部更名、验证派生SHA。
`VINYL_ISOTYPE_FONT_DIR=/external/fonts node engine/motion-render-core/scripts/render.mjs --scene ABS/portfolio/works/vinyl-isotype-study/design/scene.mjs --work /tmp/vinyl-isotype-study-render --frames 0`
`node portfolio/works/vinyl-isotype-study/tests/recipe.test.mjs`
运行时再次验原源和派生SHA，缺失/错误即失败。无公共UI族依赖。

原帧PNG SHA `b3c693eb6448da6175d8d4dd82e5b996ef7306995e6cbd0b3644a1ad338e533b`。公开树唯一图像cover.jpg来自自渲染，不含原图/字体/报告/验证输出。来源、许可见CREDITS与LICENSES；语义范围及残差见设计卡。未浏览器、响应式、交互、Motion、事实账本验证。
