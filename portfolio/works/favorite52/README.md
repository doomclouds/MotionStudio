# Favorite52 · 52 秒非官方复刻

![本作品唯一封面](cover.jpg)

**已收录关键代码，资源外置（`source-release`），不是无需自备素材的完整下载包。** 原作参考 [AlchainHust / huashu](https://x.com/AlchainHust/status/2113208707668729984)；本作品为 MotionStudio 的学习研究、非商业复刻，不是原作者工程、官方版本或品牌背书。原作者及各权利人权益保留，详见 [CREDITS](CREDITS.md)。

本条目保留全部绘制、编排和 10 段连续编码/合成代码。没有遗漏图标/音轨依赖，也没有悄悄换图标、换字体或静音：**13 个字体、1 个图标、1 张照片、1 条实际混合 AAC 共 16 项**完整记入 [`resources.lock.json`](resources.lock.json)，包含精确相对路径、字节数、SHA-256、来源和许可边界。它们不随 Git 分发。

## 最便捷的原样恢复

需要已合法持有的 `Claude-Crab-Favorite52-NativeV2-Recovery-20261027.zip`。它是用户已有私人备份，不是公共下载；脚本只按固定 hash 读取其中 16 项资源，不解包/执行其他文件、不读取私人历史。

```sh
# 在仓库根目录；Node 24.22.1、Python 3.12.14、FFmpeg/ffprobe 7.1.5-0+deb13u1，Linux x86_64。
# 使用仓库的真实 npm 锁，不安装浏览器、GSAP、React、FontTools 或视频处理 Python 包。
npm ci --ignore-scripts --prefix engine/motion-render-core

python3 -B portfolio/works/favorite52/prepare.py \
  --cache /tmp/favorite52-resources \
  --recovery-zip /path/to/Claude-Crab-Favorite52-NativeV2-Recovery-20261027.zip

python3 -B portfolio/works/favorite52/render.py \
  --cache /tmp/favorite52-resources --work /tmp/favorite52-new-render
```

输出 `/tmp/favorite52-new-render/output/favorite52-source/favorite52-source.mp4`：1920×1080、30 fps、1560 帧、52 秒，48 kHz 双声道，保持原备份 AAC 包。输出工作目录必须全新且在仓库外。保持专用目录、单个写入进程；路径防护不等于针对恶意并发文件系统的 OS 沙箱。

也可不用 ZIP，直接指向自己已合法持有的旧工程 `assets/`：

```sh
python3 -B portfolio/works/favorite52/prepare.py --cache /tmp/favorite52-resources \
  --seed-assets /path/to/old-project/assets
python3 -B portfolio/works/favorite52/render.py --cache /tmp/favorite52-resources --check
```

准备器**默认且始终离线**；没有外网下载或登录抓取。缺文件、hash 不符、符号链接、错误 ZIP、缓存漂移均明确失败，报出全部缺项及来源。SHA 仅验证身份，不赋予使用或传播许可。准备器不会删除/改写旧工程或备份。

## 没有私人备份怎么办

- **图标** `claude-duet-official.svg`： [Claude Duet 官方说明](https://claude.com/resources/articles/claude-duet)及页面的[图标链接](https://assets.claude.com/9273e22b909074c1c2d42ca3514a239623f8af40.svg)。没有查到开放分发许可，本条目不提供 SVG 字节、不自动下载；请自行确认使用权并提供 hash 匹配文件。
- **完整声音** `original-v4-audio.m4a`：只有私人备份含实际混合成品，没有公开 exact-mix 链接或完整合成配方。[Kevin MacLeod 的 Bit Shift](https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN1600045)是其中 CC BY 4.0 音乐来源；[官方 MP3](https://incompetech.com/music/royalty-free/mp3-royaltyfree/Bit%20Shift.mp3)不是这条 52 秒 AAC，也不是原 X 视频原声。不能用下载全曲冒充完整恢复。
- **照片**： [Commons 原图及 CC BY 2.0](https://commons.wikimedia.org/wiki/File:Dario_Amodei_at_TechCrunch_Disrupt_2023_01.jpg)，[实际原图](https://upload.wikimedia.org/wikipedia/commons/d/da/Dario_Amodei_at_TechCrunch_Disrupt_2023_01.jpg)已重新下载并与清单 hash 相同。保留摄影署名与修改说明。
- **13 个字体**：逐文件官方家族来源、内嵌版本、hash、版权及许可见资源清单和 `LICENSES/`。不同版本、转换/子集和 CJK 集合 face2 会改变结果；当前同名字体不能替代。未验证全部精确官方下载链，不能把本机现有包或 apt latest 当成固定恢复。

可按清单逐项合法取得再使用 `--seed-assets`。**若无法取得匹配的 SVG 或混音，当前原样入口明确无法完成，不会把它称为全自动复现。** 合法替代图形/重新合成声音应作为另一个有差异的新版本；这里不覆盖用户最爱的原版。

## 验证边界

私人原恢复工程已完成独立 1560 帧全长重渲、全流解码、AAC 包/PCM 一致，最终 MP4 与喜欢的备份逐字节相同（SHA-256 `5f1b3e4307d8ca2d75dbdc97e75570ef198285c8fb9b61730167da1e15be9b95`）。公开源码入口也已在新 checkout、真实重新 `npm ci`、全新外置资源缓存中完成 **1560 帧全长重渲**：全部逐帧 RGBA hash、最终 MP4 字节、AAC 包/PCM 与备份一致；耗时约 171 秒，10 段反向 seek、帧数/尺寸/fps/时长及全流解码通过。旧源码只做路径映射、资源外置和非运行元数据裁减；未换场景/图标/音轨，不读原视频。

用户的保留/上传决定不是逐项艺术或听觉审核：`visual: PARTIAL`、`listened: NOT_LISTENED`、`av_sync: NUMERIC_ONLY`。数值同步和包相等不是实际听审。本机测试不是全新 OS 或跨平台字节一致保证；runtime 锁声明已测平台/版本，npm 包锁负责实际依赖完整性。

唯一封面来自自制完成片整数帧 450（15 秒），1280×720，多语言卡片；不是原视频截图，不含外置 SVG 或人物照片。保留原作构图来源和字体/Emoji 声明。

## 权利联系

本作品集学习研究、非商业使用；非官方复刻，不暗示认可。原作者/权利人可通过 [GitHub Issues](https://github.com/doomclouds/MotionStudio/issues)提出权利通知/下架请求。我们将及时核查，必要时暂停展示并删除/下架相关公开内容；请勿在公开 Issue 提交私人合同、身份证件或联系方式。非商业和联系删除声明不是授权，不改变上游 MIT/OFL/CC 条款，也不能清除第三方权利。
