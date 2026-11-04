# 低密度脉冲底床

由 [asset.json](asset.json) 生成；修改事实后同步本页，不建立第二套事实。

ID: quiet-pulse-bed · version 1 · bgm / pulse-bed · candidate

## 意图与使用

用简单周期底床支持节拍试排，保留旁白空间。

适用：60 BPM、8拍的原创技术候选，可测试显式循环。

反例：完整歌曲、已听审优质配乐、需要自然演奏或强情感起伏。

混音：A/E音高的简单双音；周期边界技术连续不等于音乐上无缝或悦耳。

情绪意图：steady, minimal

## 来源与调用

[文件或生成器](../../../synth.py) · recipe: quiet-pulse-bed · MotionStudio contributors

Original procedural source; no external recording, samples or reference melody.

8s · PCM16 stereo 48kHz · explicit-repeat。时长依据：recipe。

从库根调用：`python3 sound.py render --id quiet-pulse-bed --output /authorized/new-output`；私有库加 `--library /authorized/library`。输出必须在源码/输入库外且不存在。

## 权利与验收

[许可](../../../LICENSE)：MIT；使用 allowed；独立分发 allowed。

Retain the MIT copyright and permission notice with the source and generated asset redistribution. No trademark, voice or endorsement rights implied.

Original source and synthesis without third-party samples.

技术 RUN_REQUIRED · 听审 NOT_LISTENED · 声画 NOT_RUN · 用户 NOT_RUN

Technical checks are per-output receipts. No listening, pleasantness, reference-match or film acceptance is asserted.
