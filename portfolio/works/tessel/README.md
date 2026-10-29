# Tessel · 33 秒非官方 Canvas2D 复刻（可重渲染源码）

原作：[Tessel — launch film](https://github.com/Leonxlnx/claude-launchvideo)，作者 **Leonxlnx**。这不是官方作品、真实产品录屏或全新原创品牌；不代表作者/品牌背书。维护者仅用于学习、研究与非商业展示，该用途说明不重新许可或限制已有 MIT/OFL 权利。详见 `CREDITS.md` 与 `LICENSES/`。权利问题通过 [MotionStudio Issues](https://github.com/doomclouds/MotionStudio/issues) 联系。

**收录状态：全片已完成并获得明确保留/上传决定，独立完整源码恢复技术验证通过。视觉复核为 `PARTIAL`，实际听审为 `NOT_LISTENED`，声画同步为 `NUMERIC_ONLY`；用户收录决定不扩大为每项评审均通过。** 全部1980帧Native PNG逐一与最终生产场景相等（含终章两帧修正），最终音视频合同及全流解码通过；这些结果不等于全片艺术认可或实际听审通过。已认可的原8秒样片不是本目录的输入。本入口从源码绘制全部 **1980帧、1920×1080、60 fps、33秒**，包括中段；不会读取原作MP4、已编码样片、生成帧包或私人生产报告。

## 必要内容

- `src/`：22个作品源码文件，保留最终开场定点blur修复与终章1790/1920运动锚修复；仅调整共享引擎相对路径并要求显式外置资源路径。
- 仓库共享源码：13个实际使用的 Native render / motion-elements / timeline 模块；不需要浏览器、Remotion、React、3D或音频合成库。
- 外部输入共5个：两张程序背景、Geist与Geist Mono **5.3.0**字体包、作者原始PCM配乐。全部有固定来源、大小、SHA-256和完整许可；字体包只提取明确成员。
- 11个静态Geist字重在本地生成，保留OFL并改名为 `TesselStudyGeist*`。两个原始Latin WOFF2仍是明确运行依赖，不能悄悄省略。
- 音频为作者MIT合成音乐/SFX，33秒、48kHz stereo PCM24。渲染后新编码AAC320k；不是原成片AAC字节保留，也不以数值相关性代替听审。

源码仓库不带音频、字体二进制、背景PNG、MP4、帧序列、报告或安装目录。仅一张封面可在通过审核和根路径/hash白名单后加入；它来自最终自制影片而非原作帧。

图标、品牌图形与日程内容已包含在这些MIT来源的绘制/数据代码中，不需要另下图标库。旧源码注释中的 `LICENSE-TESSEL` 对应本目录的 `LICENSES/Leonxlnx-Tessel-MIT.txt`，并未省略原许可。

## 固定环境与安装

本次隔离恢复使用 Linux x86_64、Node **24.22.1**、FFmpeg/ffprobe **7.1.5**（libx264、AAC与MP4）、Python **3.12.14**。Node依赖通过真实npm lock和 `npm ci --ignore-scripts` 安装；Python锁针对CPython3.12/Linux x86_64，其他平台须另行验证，不能冒称跨平台像素一致。

以下从仓库根运行，所有占位路径均须替换为**仓库外**的新目录。安装是显式准备步骤；渲染从不安装依赖。

```sh
npm ci --prefix engine/motion-render-core --ignore-scripts --no-audit --no-fund \
  --registry=https://registry.npmjs.org --cache /outside/npm-cache
python3.12 -m venv /outside/tessel-venv
/outside/tessel-venv/bin/python -m pip --isolated install \
  --index-url https://pypi.org/simple --only-binary=:all: --require-hashes \
  -r portfolio/works/tessel/requirements-linux-cp312.lock
```

`locks/runtime.json`记录平台版本约束与13个共享源文件hash，不冒称OS安装锁。`locks/npm-package-lock.json`是仓库实际npm锁的逐字节副本；渲染预检同时核两份锁、pip锁与共享源码身份，漂移就停止，不能以更新分支的代码冒充原验证版本。

只有 `@napi-rs/canvas@0.1.100` 及其平台包、`fonttools==4.57.0`、`Brotli==1.1.0`；没有额外音频合成依赖。运行脚本强制核已验证Node/FFmpeg/Canvas版本，不使用云预装回退路径。

## 恢复资源

明确同意依照随附MIT/OFL许可下载固定来源时：

```sh
/outside/tessel-venv/bin/python portfolio/works/tessel/prepare.py \
  --cache /outside/tessel-assets --download
```

使用专用、没有其他写入者的外置缓存目录；恢复和渲染预检拒绝资源路径任意层的符号链接并核对授权根内包含关系，这不是抵御并发恶意文件系统改动的操作系统沙箱。默认离线。已有合法资源时，可把锁中五项按ID命名为 `glow-ink`、`table`、`geist`、`geist-mono`、`soundtrack`，放入外置目录，然后：

```sh
/outside/tessel-venv/bin/python portfolio/works/tessel/prepare.py \
  --cache /outside/tessel-assets --seed-cache /outside/licensed-downloads
```

复用缓存也重新核hash。缺失、404、跨主机重定向、大小/hash不符均明确失败；不会改取另一曲、替换字体、静音或执行下载代码。首次准备后离线渲染；缓存、派生字体和完整资源许可均留在仓库外。

## 全长重渲染

```sh
/outside/tessel-venv/bin/python portfolio/works/tessel/render.py \
  --assets /outside/tessel-assets --work /outside/tessel-new-render
```

最终输出 `/outside/tessel-new-render/output/tessel.mp4`。运行目录必须不存在，失败的partial不会晋升为成片。每2帧回收worker，PNG流直接进入FFmpeg，不输出帧目录；这不是任意内存上限保证。固定60fps调度和当前采样策略不可随意改动，否则需重新核Native极小滤镜问题与时域采样。

完成后检查全部帧/帧率/尺寸/色彩标签、最终音轨采样合同和全量解码，并输出外置 `reproduction.json`。技术、视觉、实际听审及艺术接受分开记录。当前重渲染使用全片CRF16与新AAC，不保证与已交付的分段压缩成片文件字节相同，也不承诺附件15MB上限；它是一条不依赖预编码成片的源码恢复路线。

本次同一Linux宿主上的新依赖/资源目录端到端验证实际耗时约114分钟，输出16,040,450字节；不是新OS、跨平台一致性或固定耗时保证。零时移音频相关性检查不替代听审；AAC解码存在128采样尾padding，不宣称PCM相等。

准备脚本还通过29项离线失败路径单元测试，另实际在线获取五项固定输入成功。可运行 `python -B -m unittest discover -s portfolio/works/tessel -p test_prepare.py`；测试中的网络失败使用mock，不冒充真实远端故障。
