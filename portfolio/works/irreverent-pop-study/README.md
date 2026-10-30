# 反叛流行 · AI写的，别像AI

完整1200×750静态Native工程，用户已同意收录。Huashu设计标本非官方复刻，不是原创品牌或真实模型产品。设计逻辑见design/DESIGN-ANALYSIS.md。

## 离线复现
按font-inputs.json来源与固定SHA合法自备原字体，安装锁定Native运行时及fonttools4.61.1：
```sh
python prepare-fonts.py --source-dir /ABS/ORIGINAL_FONTS --output-dir /ABS/PREPARED_FONTS
POP_FONT_DIR=/ABS/PREPARED_FONTS MOTION_ENGINE_ROOT=/ABS/ENGINE node verify.mjs
POP_FONT_DIR=/ABS/PREPARED_FONTS node /ABS/ENGINE/scripts/render.mjs --scene /ABS/WORK/design/scene.mjs --work /ABS/OUTPUT --frames 0
```
ENGINE是MotionStudio的engine/motion-render-core，运行时锁见locks。源字体与派生字体SHA均验证；缺失/错配拒绝，不联网、不静默替代。独立Node进程执行。修改文案需同步字体字符集、派生锁及重新审看，不再等同原帧。

原帧SHA256：`8e82b77a44b217f999f97fcef75050167fba7c82c87739d898314680d5d585a3`。

## 来源和限制
https://github.com/alchaincyf/huashu-design/blob/4fc7bfdbd5ec3fa2d43ce7a6433de60976a5e4b1/assets/style-specimens/ppt/07-irreverent-pop.html

37、63%、12,408、2.1、58%、日期和“禁用”声明为未经核验的源例文，不代表GPT/OpenAI产品性能；VISITOR也是装饰编号。中文标点/栅格仍有残差。全画面可编辑，未用imagegen/源截图贴图。

实际调用本地design/material-surfaces.mjs的paper分支两次生成窗口底板/硬影，再叠标题栏/旋转/文案。它与shared.mjs是MotionStudio UI源码0947507的本地原样快照，不是运行时从引擎导入；文件SHA及固定源见module-snapshots.json。不把共享状态工具计为设计族。

只有自渲染cover.jpg随源码保留；字体外置，许可保留。仅Native静态复现与人工视觉复核，未验证浏览器、交互、响应式或音视频，不保证跨系统像素一致。
