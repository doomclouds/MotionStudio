# 今夜观木星 · 复古未来观象台

完整1200×750静态Native工程；用户已同意收录。非官方Huashu设计标本复刻，不是原创构图、运营品牌或真实产品。设计逻辑见design/DESIGN-REASONING.md。

## 离线复现

按font-inputs.json中固定SHA合法自备原字体到仓库外目录。安装锁定依赖与fonttools 4.61.1后：
```sh
python prepare-fonts.py --font-dir /ABS/EXTERNAL_FONTS
COSMIC_FONT_DIR=/ABS/EXTERNAL_FONTS node /ABS/ENGINE/scripts/render.mjs --scene /ABS/WORK/design/scene.mjs --work /ABS/OUTPUT --frames 0
```
ENGINE为MotionStudio的engine/motion-render-core；Node与Canvas版本见locks。只在独立Node进程中运行本作品。缺失或错误字体明确拒绝，不联网、不静默替代。修改文案需同步font-charset.txt并重备字体、校验输出SHA；这会成为新版本而不再等同已审帧。

## 来源与边界

https://github.com/alchaincyf/huashu-design/blob/4fc7bfdbd5ec3fa2d43ce7a6433de60976a5e4b1/assets/style-specimens/web/07-cosmic-retro-futurism.html

中文斜体近似、字形栅格与局部字距；轨道非比例，活动日期和天文说法未事实核查，不用于真实观测指南。 无imagegen、来源截图贴图；唯一cover.jpg来自完整Native重建。已审PNG SHA-256：`a4cfef99fc86e38956777dc8bd371c87a41a4c8f1818afdd6734d7f58e884387`。未验证浏览器、交互、响应式、音视频。外置资源条件下的本机重现不保证跨系统像素一致。
