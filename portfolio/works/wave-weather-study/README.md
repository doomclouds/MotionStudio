# 今天的浪 · 玩味错位天气海报

Complete fixed-frame Native Canvas study. [Pinned original](https://github.com/alchaincyf/huashu-design/blob/4fc7bfdbd5ec3fa2d43ce7a6433de60976a5e4b1/assets/style-specimens/east/10-hattori-playful-offset.html). 非官方复刻；Hattori只是样例风格标签，不代表服部一成官方作品；浪高/潮汐/温度均为未经核实的样例文案，不用于冲浪或出海决策。

![Code-rendered preview](cover.jpg)

Complete editable source: `design/scene.mjs`. [Design reasoning](design.md) explains content, brand, composition, type, color and remaining limits. Only this rebuilt cover is bundled; no source screenshot, bitmap font or generated artwork.

## Restore and render

Use the existing MotionStudio Native core and its lock. Obtain licensed original inputs named NotoSansSC-variable.ttf, ZCOOLKuaiLe-Regular.ttf into an external directory, matching `font-inputs.json` SHA identities; family URLs and actual terms are in `work.json`/`LICENSES`. Preparation verifies original inputs before writing; it verifies output font identities after derivation, and the render entry checks the same output hashes. Noto subsets use deterministic metadata. Use the pinned fonttools version in locks/runtime.json when preparing.

Run from the MotionStudio repository root after preparing the existing [Native core dependencies](../../../engine/motion-render-core/README.md). Replace the external directory values below with absolute paths outside the repository; the font directory contains the licensed original inputs and receives the prepared fonts. These commands do not download fonts or install dependencies. The family URLs identify the source family, not a guarantee that its current files match the required SHA.

```sh
WAVE_FONT_DIR=/absolute/external-fonts
WAVE_WORK_DIR=/absolute/new-output
python3 portfolio/works/wave-weather-study/prepare-fonts.py --font-dir "$WAVE_FONT_DIR"
WAVE_FONT_DIR="$WAVE_FONT_DIR" node engine/motion-render-core/scripts/render.mjs --scene portfolio/works/wave-weather-study/design/scene.mjs --work "$WAVE_WORK_DIR" --frames 0
```

All fonts and generated files remain outside Git. Missing/wrong fonts fail closed. To change Chinese copy, extend font-charset.txt, reprepare and deliberately update output identities and visual regression; the existing identity contract intentionally does not silently accept changed fonts.

## Evidence and limits

Full frame and critical details were visually reviewed; user elected to retain the work. Complete entrypoints reproduced the retained Native frame. Visual status remains PARTIAL: JPEG/antialiasing and small text residuals remain. Static only: no browser, responsive, interaction, audio or Motion validation. Source claims and interface values are examples, not verified facts.

设计意图、场景结构、复用与验证边界见[design.md](design.md)。
