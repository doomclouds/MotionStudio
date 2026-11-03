# 幕启 · 地方剧场票务品牌首屏

1200×750完整固定画幅静态学习复刻。[固定原作](https://github.com/alchaincyf/huashu-design/blob/4fc7bfdbd5ec3fa2d43ce7a6433de60976a5e4b1/assets/style-specimens/web/14-angled-fluid-gradient.html)；详见 [来源许可](CREDITS.md) 与 [设计逻辑](design/DESIGN-ANALYSIS.md)。这不是原品牌官方网站，也不是新增的通用动效机制。

## 工程内容

- design/scene.mjs：完整画面渲染，不是简化合成fixture。
- design/content.json：可编辑内容。
- font-inputs.json、font-subset.json、prepare-fonts.py：外置字体的来源、范围和确定性准备。
- cover.jpg：已审阅代码画面的JPEG预览。

## 最小重现

使用仓库已有 engine/motion-render-core 的锁定依赖与Python fonttools 4.61.1。字体二进制不随工程入库；按 font-inputs.json 中源文件名准备官方许可字体到外部目录。准备脚本核验输入SHA，生成改名静态子集，写入给定输出目录，不下载或执行外部代码。

以下从 MotionStudio 仓库根运行，先按 [Native core 说明](../../../engine/motion-render-core/README.md)准备已有渲染依赖。把三个外置目录变量替换成仓库外的绝对路径；命令不下载字体或自动安装依赖。家族来源 URL 不保证其当前文件匹配所要求的 SHA，必须使用已核身份的原始输入。

```sh
MUQI_SOURCE_FONT_DIR=/absolute/source-fonts
MUQI_FONT_DIR=/absolute/prepared-fonts
MUQI_WORK_DIR=/absolute/new-render-dir
python3 portfolio/works/muqi-study/prepare-fonts.py --source-dir "$MUQI_SOURCE_FONT_DIR" --output-dir "$MUQI_FONT_DIR"
MUQI_FONT_DIR="$MUQI_FONT_DIR" node engine/motion-render-core/scripts/render.mjs --scene portfolio/works/muqi-study/design/scene.mjs --work "$MUQI_WORK_DIR" --frames 0
```

修改内容后需重新运行字体准备脚本，使新字符进入子集；新的文本长度还需重新检查固定画幅中的溢出。相同源字体、渲染器和固定内容的PNG可与验收画面一致。不同平台/字体版本不能保证像素相同。缺少字体目录或文件会明确失败。输出目录应在Git之外。

静态全图与局部对照已审阅，仍有字体栅格化、渐变/软影以及二维透视近似；没有浏览器、交互、响应式、视频或声音验收。像素差异不是审美分数。

![作品预览](cover.jpg)
