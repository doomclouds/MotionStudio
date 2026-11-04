# 空气穿行

由 [asset.json](asset.json) 生成；修改事实后同步本页，不建立第二套事实。

ID: air-pass · version 1 · sfx / transition · candidate

## 意图与使用

以噪声能量包络支持跨区域移动。

适用：大对象跨屏或遮罩交接的技术试音。

反例：密集字幕、每次切镜、要求真实风声的环境记录。

混音：中段能量峰值对齐运动峰值；白噪声未经EQ，不承诺柔和。

情绪意图：light, moving

## 来源与调用

[文件或生成器](../../../synth.py) · recipe: air-pass · MotionStudio contributors

Original procedural source; no external recording, samples or reference melody.

0.6s · PCM16 stereo 48kHz · one-shot。时长依据：recipe。

从库根调用：`python3 sound.py render --id air-pass --output /authorized/new-output`；私有库加 `--library /authorized/library`。输出必须在源码/输入库外且不存在。

## 权利与验收

[许可](../../../LICENSE)：MIT；使用 allowed；独立分发 allowed。

Retain the MIT copyright and permission notice with the source and generated asset redistribution. No trademark, voice or endorsement rights implied.

Original source and synthesis without third-party samples.

技术 RUN_REQUIRED · 听审 NOT_LISTENED · 声画 NOT_RUN · 用户 NOT_RUN

Technical checks are per-output receipts. No listening, pleasantness, reference-match or film acceptance is asserted.
