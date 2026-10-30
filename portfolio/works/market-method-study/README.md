# 菜市场方法论 · 从圆心向外

完整1200×750静态Native工程，用户已同意收录。Huashu设计标本的非官方复刻，不是原创构图、真实市场调查或经过验证的改造方案。设计逻辑见design/DESIGN-ANALYSIS.md。

## 离线复现

按font-inputs.json来源与固定SHA合法自备原字体，安装锁定Native运行时及fonttools4.61.1：
```sh
python prepare-fonts.py --source-dir /ABS/ORIGINAL_FONTS --output-dir /ABS/PREPARED_FONTS
MARKET_FONT_DIR=/ABS/PREPARED_FONTS MOTION_ENGINE_ROOT=/ABS/ENGINE node verify.mjs
MARKET_FONT_DIR=/ABS/PREPARED_FONTS node /ABS/ENGINE/scripts/render.mjs --scene /ABS/WORK/design/scene.mjs --work /ABS/OUTPUT --frames 0
```
ENGINE为MotionStudio的engine/motion-render-core，Node/Canvas锁见locks。缺少或错配源字体/派生字体均拒绝，不联网、不静默替代。只在独立Node进程中运行。修改内容需同步font-charset.txt、字体锁并重新审看，不再视为原已审帧。

原帧SHA256：`c13ca4e992fa022b3eb6f21a1ed9330736db7a0cdf2440ef5bfaba9e1a7367d4`。

## 来源与准确性

https://github.com/alchaincyf/huashu-design/blob/4fc7bfdbd5ec3fa2d43ce7a6433de60976a5e4b1/assets/style-specimens/ppt/13-diagrammatic-minimalism.html

偏心嵌套圆表达WHY→HOW→WHAT依赖关系，圆面积/半径不编码统计数据。市场名、两年及31%/4%只有源例文，无实证出处，不构成因果证据。保留源作WHAT与外圆上沿交叠。中文正文栅格更清细、圆边更干净；没有像素匹配源JPEG的承诺。

实际运行的是本作品design/shared.mjs本地快照，原样复制自MotionStudio提交0947507961eb5624ddd5c1240758baefa3246fd8的engine/design-elements/shared.mjs，SHA256 e36af17f96bd06eb250f27d5be53d678da7a72cb326df0ecb66155c0383d1122；不是运行时从引擎导入，只复用Canvas状态工具，不计设计族。径向量表与固定段距标题块不适配，不为复用牺牲语义。全部文字和图形可编辑，没用imagegen或截图贴图。唯一cover为自渲染。仅Native静态验证，未验证浏览器、交互、响应式或音视频；本机复现不保证跨系统像素一致。
