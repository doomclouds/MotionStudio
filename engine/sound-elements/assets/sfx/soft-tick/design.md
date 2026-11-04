# 轻触短点

由 [asset.json](asset.json) 生成；修改事实后同步本页，不建立第二套事实。

ID: soft-tick · version 1 · sfx / ui-feedback · candidate

## 意图与使用

让低频率状态确认拥有可定位的短起点。

适用：在状态已经真实提交时少量使用；不是每次 hover 或每个字都响。

反例：高频重复操作、需要无障碍静音或错误警报。

混音：起音与确认帧对齐；响度在实际全混音中再定。

情绪意图：restrained, precise

## 来源与调用

[文件或生成器](../../../synth.py) · recipe: soft-tick · MotionStudio contributors

Original procedural source; no external recording, samples or reference melody.

0.12s · PCM16 stereo 48kHz · one-shot。时长依据：recipe。

从库根调用：`python3 sound.py render --id soft-tick --output /authorized/new-output`；私有库加 `--library /authorized/library`。输出必须在源码/输入库外且不存在。

## 权利与验收

[许可](../../../LICENSE)：MIT；使用 allowed；独立分发 allowed。

Retain the MIT copyright and permission notice with the source and generated asset redistribution. No trademark, voice or endorsement rights implied.

Original source and synthesis without third-party samples.

技术 RUN_REQUIRED · 听审 NOT_LISTENED · 声画 NOT_RUN · 用户 NOT_RUN

Technical checks are per-output receipts. No listening, pleasantness, reference-match or film acceptance is asserted.
