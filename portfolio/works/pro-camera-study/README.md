# 专业相机 · 参数控制三屏

完整1200×750静态Native工程；用户已同意收录。非官方Huashu设计标本复刻，不是原创构图、运营品牌或真实产品。设计逻辑见design/DESIGN-REASONING.md。

## 离线复现

按font-inputs.json中固定SHA合法自备原字体到仓库外目录。安装锁定依赖与fonttools 4.61.1后：
```sh
python prepare-fonts.py --font-dir /ABS/EXTERNAL_FONTS
PRO_CAMERA_FONT_DIR=/ABS/EXTERNAL_FONTS node /ABS/ENGINE/scripts/render.mjs --scene /ABS/WORK/design/scene.mjs --work /ABS/OUTPUT --frames 0
```
ENGINE为MotionStudio的engine/motion-render-core；Node与Canvas版本见locks。只在独立Node进程中运行本作品。缺失或错误字体明确拒绝，不联网、不静默替代。修改文案需同步font-charset.txt并重备字体、校验输出SHA；这会成为新版本而不再等同已审帧。

## 来源与边界

https://github.com/alchaincyf/huashu-design/blob/4fc7bfdbd5ec3fa2d43ce7a6433de60976a5e4b1/assets/style-specimens/app/05-pro-camera.html

取景区忠实保留渐变占位，非真实照片；高频斜纹JPEG晕彩和手机阴影近似，非可拍照App。 无imagegen、来源截图贴图；唯一cover.jpg来自完整Native重建。已审PNG SHA-256：`f51057a88f0c170ded0e0b639b7fc1bcda6797168a76bd466ead16ee2cb3d292`。未验证浏览器、交互、响应式、音视频。外置资源条件下的本机重现不保证跨系统像素一致。
