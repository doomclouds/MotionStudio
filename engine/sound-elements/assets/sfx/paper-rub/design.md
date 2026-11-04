# 纸质摩擦联想

由 [asset.json](asset.json) 生成；修改事实后同步本页，不建立第二套事实。

ID: paper-rub · version 1 · sfx / texture · candidate

## 意图与使用

以短摩擦颗粒支持纸面、卡片或轻质表面移动；不是转场风声。

适用：画面确有纸面或卡片运动时稀疏使用，延续动作而不宣告成功。

反例：仅有文字切换、硬质撞击、长距离穿越或需完全写实的录音场景。

混音：固定 recipe：seed=1977；LCG 1664525/1013904223/2^32；450/2500Hz双单极低通之差；0.4+0.6×sin²(2π×41t)调制（幅度周期82Hz）；正弦平方包络；幅度0.3；3ms端点保护。不是精确声学纸张模型。

情绪意图：tactile, restrained

## 来源与调用

[文件或生成器](../../../synth.py) · recipe: paper-rub · MotionStudio contributors

Original bounded procedural synthesis; no recordings, samples, borrowed melody or brand audio. Parameters and deterministic seed are stated in mix_notes. This standard-library recipe is a portable derivation, not a byte-identical copy of an earlier numerical-library draft.

0.24s · PCM16 stereo 48kHz · one-shot。时长依据：recipe。

从库根调用：`python3 sound.py render --id paper-rub --output /authorized/new-output`；私有库加 `--library /authorized/library`。输出必须在源码/输入库外且不存在。

## 权利与验收

[许可](../../../LICENSE)：MIT；使用 allowed；独立分发 allowed。

Retain the MIT copyright and permission notice with the source and generated asset redistribution. No trademark, voice or endorsement rights implied.

Original source and synthesis without third-party samples.

技术 RUN_REQUIRED · 听审 NOT_LISTENED · 声画 NOT_RUN · 用户 NOT_RUN

NOT_LISTENED: no timbre, pleasantness, material realism, mix suitability, seam or owner approval. Render receipts and Audio Core checks only establish technical execution. Do not classify it as accepted because an authored cue consumed it.
