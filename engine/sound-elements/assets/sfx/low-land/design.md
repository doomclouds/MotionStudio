# 低频落点

由 [asset.json](asset.json) 生成；修改事实后同步本页，不建立第二套事实。

ID: low-land · version 1 · sfx / impact · candidate

## 意图与使用

给主要物体一次落定提供低频重量。

适用：少量主要事件，需检查小扬声器和低频遮蔽。

反例：拟真脚步、爆炸、所有UI元素逐一撞击。

混音：对齐落定而非动画开始；与BGM低频冲突时退让或静默。

情绪意图：grounded, brief

## 来源与调用

[文件或生成器](../../../synth.py) · recipe: low-land · MotionStudio contributors

Original procedural source; no external recording, samples or reference melody.

0.35s · PCM16 stereo 48kHz · one-shot。时长依据：recipe。

从库根调用：`python3 sound.py render --id low-land --output /authorized/new-output`；私有库加 `--library /authorized/library`。输出必须在源码/输入库外且不存在。

## 权利与验收

[许可](../../../LICENSE)：MIT；使用 allowed；独立分发 allowed。

Retain the MIT copyright and permission notice with the source and generated asset redistribution. No trademark, voice or endorsement rights implied.

Original source and synthesis without third-party samples.

技术 RUN_REQUIRED · 听审 NOT_LISTENED · 声画 NOT_RUN · 用户 NOT_RUN

Technical checks are per-output receipts. No listening, pleasantness, reference-match or film acceptance is asserted.
