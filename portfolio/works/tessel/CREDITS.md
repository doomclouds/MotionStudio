# 署名、许可与非官方复刻声明

## 原作

**Tessel — launch film**，**Copyright (c) 2026 Leonxlnx**。
[原作及源码](https://github.com/Leonxlnx/claude-launchvideo)；[固定版本](https://github.com/Leonxlnx/claude-launchvideo/tree/f0906e8629fa524c7cedc1ac959bf987005ee846)。作者说明全部画面与声音由代码生成。原作代码、程序背景与配乐沿用MIT，完整条款：`LICENSES/Leonxlnx-Tessel-MIT.txt`。

MotionStudio将原作的构图、文案、日程身份、视觉机制及编排移植为Native Canvas2D实现；替换的是渲染后端与适配方式，不把原作设计、品牌、音乐/SFX或代码贡献冒称为本项目原创。采用确定性平面投影与240°自适应时域采样，并不宣称与原作Remotion/Chromium或optical-flow motion blur逐像素一致。

本片是**非官方复刻版**，不是官方作品、真实产品录屏或原作者工程恢复；不代表原作者、品牌或其他权利人认可、参与或背书。

## 音乐与音效

原作者同一固定提交的 `public/audio/soundtrack.wav`，由其MIT代码合成音乐及全部SFX；不是本项目新编配乐。原始输入SHA-256：`ba6b67a9be1f2fe44d8c7d4d139dcd763214bc721b846991563ecb6a7ca0a451`。

本复现路线不变速、不替换曲目；将33秒PCM24配乐新编码为AAC320k后与源码画面合成。重新编码不等于原AAC压缩字节相同。听审和感知声画同步须针对实际复现成片执行；校验文件/样本数不替代听审。

## 字体

Geist及Geist Mono 5.3.0：**Copyright 2024 The Geist Project Authors**，SIL Open Font License 1.1。完整条款分别为 `LICENSES/geist-OFL.txt`、`LICENSES/geist-mono-OFL.txt`，恢复的外置字体缓存同时保留许可。

Geist变量字体按11个明确字重实例化，关闭时间戳改写，派生家族名为 `TesselStudyGeist{weight}`；不是替代字形。衍生字体仍受OFL，不改为MIT，不把原作者姓名用于背书。

## 唯一封面

`cover.jpg` 为MotionStudio自己最终复刻成片的整数帧480（8.000秒），只做1280×720等比缩小与无附加元数据JPEG编码；不是原作视频帧。来源成片SHA-256为 `b94edeaf23831dbacff4c20da42e8d852d974fa6d5bc7907ecc0962cb13f980f`；封面SHA-256为 `ebfaf532643c1ac096ac44a05da0c81dede735e1703e2c3230ab3073857133f8`。底层设计/标识及字体仍保留前述作者与MIT/OFL信用，不因截帧声称独占或官方身份。

## MotionStudio与运行依赖

MotionStudio自己的代码贡献遵守仓库根MIT；共享引擎的原有版权与NOTICE保持不变。Native Canvas依赖沿用其MIT，见 `engine/motion-render-core/LICENSES/napi-rs-canvas-MIT.txt`。显式安装的FontTools、Brotli、Node及FFmpeg各自保留其许可证和发行条件；此源码条目不打包这些系统/平台二进制，也不把它们全部重新许可为仓库MIT。

## 使用目的与联系

维护者以学习、研究、非商业展示为目的保留本作品集。此用途说明不缩减原MIT/OFL授权，不替代来源核验或其他必要许可。

如原作者或权利人认为相关公开内容涉及侵权，请通过 [MotionStudio GitHub Issues](https://github.com/doomclouds/MotionStudio/issues) 提交公开链接与具体问题；我们将核查并及时采取必要的下架、删除或更正。不要在公开Issue上传个人证件、私人合同或其他敏感材料。“非商业”“联系删除”都不是授权或免责保证。
