# 菜市场，是城市最后一间客厅
1200×750固定Native静态工程，已获用户收藏。非COLLINS官方作品，源是Huashu风格样张；87摊位等不构成真实调研。
## 离线复现
合法自备font-inputs.json原字体，fonttools4.61.1及locks指定Native版本。
```sh
python prepare-fonts.py --source-dir /ABS/ORIGINAL_FONTS --output-dir /ABS/PREPARED_FONTS
LIVINGROOM_FONT_DIR=/ABS/PREPARED_FONTS MOTION_ENGINE_ROOT=/ABS/ENGINE node verify.mjs
LIVINGROOM_FONT_DIR=/ABS/PREPARED_FONTS node /ABS/ENGINE/scripts/render.mjs --scene /ABS/WORK/design/scene.mjs --work /ABS/OUTPUT --frames 0
```
ENGINE为MotionStudio engine/motion-render-core。原源与派生双SHA，缺失/不符即停，无字体回退。唯一图片cover是自渲染，未附参考图、字体二进制或私有报告。
## 实际实现
公共族调用0；shared是本地状态工具快照，不是实时引擎导入。emphasis-tile是单次真实调用的案例候选，仅advance宽度预算检查，不保证墨迹/描边/旋转后边界/垂直净距，不自动断行或处理邻字流。完整设计与边界见DESIGN-RETENTION.md。
Native标题0.7px补墨与基线+4、正文550为局部校准，非原CSS等价；静态审看不包含浏览器/交互/响应式/视频。报告HTML及最终全批独审原文已核验私有持久归档；原生运行回执仍为本地证据。报告原尺寸嵌图精确绑定未建立，不推定版本错误。
原帧SHA256：`2bc3ee03eecf178187e1dc261353973cf90f430ab731aef6e2f32650263dd543`。
