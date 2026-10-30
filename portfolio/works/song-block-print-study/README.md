# 候風錄 · 宋刻版式

用户已收藏；完整固定尺寸静态复刻，不代表响应式网页、可玩游戏或视频。

1. 按 font-inputs.json 获取哈希吻合的外置原字体，装 fonttools==4.61.1，然后 `python prepare-fonts.py --font-dir /absolute/fonts`。派生字体亦逐一锁定 SHA；修改文案须同步 charset 并重建/复核哈希。
2. 设置 `SONG_FONT_DIR=/absolute/fonts`，`MOTION_UI_ASSETS_ROOT=/absolute/MotionStudio/engine/design-elements`。UI 依赖版本与所有传递依赖 SHA 见 ui-dependencies.json；不符则拒绝加载。
3. 使用仓库 Native 渲染器 `node engine/motion-render-core/scripts/render.mjs --scene ABS/design/scene.mjs --work /absolute/output --frames 0`。

运行依赖已发布 UI 积木，不复制模块为新的真源。素材为代码绘制与外置字体，没有上游截图、字体二进制、生成图或视频。唯一封面来自本作品自渲染 PNG。字体原源链接和许可见 entry.json / LICENSES；设计逻辑、残差与示例数据边界见 DESIGN-REASONING.md。

宋刻派生字名 Song400 是早期别名，实际锁定wght550；此为实图校准，不宣称源CSS使用550。所有外部字体均有原源与输出身份锁定。
