# 骑行年报 · Y2K数字主视觉

1200×750完整固定画幅静态学习复刻。[固定原作](https://github.com/alchaincyf/huashu-design/blob/4fc7bfdbd5ec3fa2d43ce7a6433de60976a5e4b1/assets/style-specimens/ppt/08-y2k-inflated-wrapped.html)；详见 [来源许可](CREDITS.md) 与 [设计逻辑](design/DESIGN-ANALYSIS.md)。这不是原品牌官方网站，也不是新增的通用动效机制。

## 工程内容

- design/scene.mjs：完整画面渲染，不是简化合成fixture。
- design/content.json：可编辑内容。
- font-inputs.json、font-subset.json、prepare-fonts.py：外置字体的来源、范围和确定性准备。
- cover.jpg：已审阅代码画面的JPEG预览。

## 最小重现

使用仓库已有 engine/motion-render-core 的锁定依赖与Python fonttools 4.61.1。字体二进制不随工程入库；按 font-inputs.json 中源文件名准备官方许可字体到外部目录。准备脚本核验输入SHA，生成改名静态子集，写入给定输出目录，不下载或执行外部代码。

```sh
python prepare-fonts.py --source-dir /absolute/source-fonts --output-dir /absolute/prepared-fonts
CYCLING_FONT_DIR=/absolute/prepared-fonts node ENGINE/scripts/render.mjs --scene ABS/design/scene.mjs --work /absolute/new-render-dir --frames 0
```

修改内容后需重新运行字体准备脚本，使新字符进入子集；新的文本长度还需重新检查固定画幅中的溢出。相同源字体、渲染器和固定内容的PNG可与验收画面一致。不同平台/字体版本不能保证像素相同。缺少字体目录或文件会明确失败。输出目录应在Git之外。

静态全图与局部对照已审阅，仍有字体栅格化、渐变/软影以及二维透视近似；没有浏览器、交互、响应式、视频或声音验收。像素差异不是审美分数。

![作品预览](cover.jpg)
