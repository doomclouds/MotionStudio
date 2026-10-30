# AI记忆系统 · 纵向案例设计
1080×1920固定Native静态工程，用户已同意收藏。Huashu风格样张，非Pentagram/Claude官方资料，不是本助手的记忆系统实测。
## 离线还原
按font-inputs.json合法自备固定SHA原字体；fonttools4.61.1及locks指定版本。
```sh
python prepare-fonts.py --source-dir /ABS/ORIGINAL_FONTS --output-dir /ABS/PREPARED_FONTS
MEMORY_CASE_FONT_DIR=/ABS/PREPARED_FONTS MOTION_ENGINE_ROOT=/ABS/ENGINE node verify.mjs
MEMORY_CASE_FONT_DIR=/ABS/PREPARED_FONTS node /ABS/ENGINE/scripts/render.mjs --scene /ABS/WORK/design/scene.mjs --work /ABS/OUTPUT --frames 0
node tests/ratio.test.mjs
```
ENGINE为MotionStudio engine/motion-render-core。原源与派生双SHA，字体缺失/不符即停，无系统字体回退。唯一cover自渲染，不附第三方原图/字体二进制/私有报告。
## 边界
源未附Helvetica，NimbusSans和NotoSansSC是明示替代，字形/字距非像素等价。93→22算术舍入可核，2.3x/0loss无实证。源视口1920裁切保留，HTML视口外文案保存在content元数据。固定静态，未浏览器/响应式/交互/视频测试。
公共设计族0；ratio-audit真实检查有限数、范围与舍入，非绘图族，更不验证真实大小/性能/无损。设计与沉淀详见DESIGN-RETENTION.md。报告HTML与独审原文已核私有持久归档，运行回执仍为本地记录；长图原尺寸嵌图精确绑定未建立不推错版。
原帧SHA256：`1663b84601d6d98cf235d594467ba402abb3c5c2a20b8075a249461e7c63bb41`。
