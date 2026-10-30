# 茶话声 · 声音品牌完整首屏复刻

固定1200×750静态作品。非官方复刻自[Huashu Design标本](https://github.com/alchaincyf/huashu-design/blob/4fc7bfdbd5ec3fa2d43ce7a6433de60976a5e4b1/assets/style-specimens/web/08-cinematic-sound-viz.html)，不代表原作者或品牌背书，也不是经核实正在运营的录音平台。用于学习、研究和非商业展示；许可及权利人联系见[CREDITS.md](CREDITS.md)。

![完整Native重建预览](cover.jpg)

## 为什么保留

极粗中文标题、贯穿画面的蓝紫声波和近黑辅助信息共同表达“让城市茶馆开口”。[设计逻辑](design/VISUAL-REASONING.md)说明内容、品牌、构图、颜色角色与原作局限。作品保留决定不等于视频、交互或通用原创设计能力通过验收。

- `design/scene.mjs`：完整可编辑绘制，不是简化示意图。
- `design/content.json`：文字与信息内容。
- `design/waveform.json`：移植自原MIT SVG的150柱几何，不是真实音频频谱。
- 原图素材0，生成素材0，不含上游JPG/HTML。唯一封面来自本作品Native重建帧，不是上游截图。

## 外部依赖与重渲染

复用仓库现有`engine/motion-render-core`，不复制引擎或依赖安装目录。按照该引擎自己的锁文件安装依赖。字体不随本工程发布；在外部目录提供有许可的`NotoSansSC-variable.ttf`与`Sora-variable.ttf`，来源与固定输入SHA见`font-inputs.json`，OFL全文见`LICENSES/`。准备阶段需要`fonttools==4.61.1`。

```sh
python prepare-fonts.py --font-dir /absolute/external-fonts
TEA_FONT_DIR=/absolute/external-fonts node ENGINE/scripts/render.mjs --scene ABS/design/scene.mjs --work /absolute/new-output --frames 0
TEA_FONT_DIR=/absolute/external-fonts MOTION_ENGINE_ROOT=/absolute/engine/motion-render-core node verify.mjs
```

将`ABS`替换为本作品目录，`ENGINE`为仓库引擎目录。输出、字体和安装缓存必须在仓库外。准备器离线核对全部原始字体SHA后才写派生文件，改名为Tea系列；渲染器再次核验派生字体SHA。缺失、版本或hash不符都明确失败，不联网下载、替换或静默降级。`fonts.lock.json`绑定已验证的派生结果。

改变内容可能需要重新生成字体子集并更新字体锁、渲染与视觉证据，不应绕过校验使用不匹配字体。

## 已验证与残差

从仅含源码与许可的项目目录配合外部原始字体准备、重渲染，RGBA与已审阅的完整帧一致；静态时间0/999得到同一图像。独立复核看过整图和关键局部。

仍有英文标签略细、局部字距和栅格化差异、声波比源JPG锐利。原作正文与声波交叠，阅读风险保留披露；示例数字不作为真实运营证据。只验证固定画幅Native静态，不宣称浏览器、响应式、交互、声音、动效或跨内容迁移已验证。
