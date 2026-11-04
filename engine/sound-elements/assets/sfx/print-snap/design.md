# 印刷短拍

由 [asset.json](asset.json) 生成；修改事实后同步本页，不建立第二套事实。

ID: print-snap · version 1 · sfx / texture · candidate

## 意图与使用

用紧凑的宽带短拍支持图形/印刷画面的落位，区别于带音高UI轻触。

适用：图形面板或印刷图案明确切换/落定，作为一次短重音。

反例：状态确认、告警、每字输入、高频反复切换或已有密集军鼓。

混音：固定 recipe：seed=1977；LCG 1664525/1013904223/2^32；900/6000Hz双单极低通之差；exp(-55t)；幅度0.3；3ms端点保护。先与鼓组共同试听，避免叠成突兀噪声。

情绪意图：tactile, restrained

## 来源与调用

[文件或生成器](../../../synth.py) · recipe: print-snap · MotionStudio contributors

Original bounded procedural synthesis; no recordings, samples, borrowed melody or brand audio. Parameters and deterministic seed are stated in mix_notes. This standard-library recipe is a portable derivation, not a byte-identical copy of an earlier numerical-library draft.

0.12s · PCM16 stereo 48kHz · one-shot。时长依据：recipe。

从库根调用：`python3 sound.py render --id print-snap --output /authorized/new-output`；私有库加 `--library /authorized/library`。输出必须在源码/输入库外且不存在。

## 权利与验收

[许可](../../../LICENSE)：MIT；使用 allowed；独立分发 allowed。

Retain the MIT copyright and permission notice with the source and generated asset redistribution. No trademark, voice or endorsement rights implied.

Original source and synthesis without third-party samples.

技术 RUN_REQUIRED · 听审 NOT_LISTENED · 声画 NOT_RUN · 用户 NOT_RUN

NOT_LISTENED: no timbre, pleasantness, material realism, mix suitability, seam or owner approval. Render receipts and Audio Core checks only establish technical execution. Do not classify it as accepted because an authored cue consumed it.
