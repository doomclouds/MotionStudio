# 落定双音

由 [asset.json](asset.json) 生成；修改事实后同步本页，不建立第二套事实。

ID: settle-chime · version 1 · sfx / confirmation · candidate

## 意图与使用

用有音高的尾音提示段落完成而不是抢主叙事。

适用：短结尾或一次性完成提示；给尾音留空间。

反例：品牌声标、错误警报、与现有配乐和声冲突时。

混音：660/990 Hz 只是生成参数；与配乐实际合听后才能判断和声适配。

情绪意图：gentle, resolved

## 来源与调用

[文件或生成器](../../../synth.py) · recipe: settle-chime · MotionStudio contributors

Original procedural source; no external recording, samples or reference melody.

0.8s · PCM16 stereo 48kHz · one-shot。时长依据：recipe。

从库根调用：`python3 sound.py render --id settle-chime --output /authorized/new-output`；私有库加 `--library /authorized/library`。输出必须在源码/输入库外且不存在。

## 权利与验收

[许可](../../../LICENSE)：MIT；使用 allowed；独立分发 allowed。

Retain the MIT copyright and permission notice with the source and generated asset redistribution. No trademark, voice or endorsement rights implied.

Original source and synthesis without third-party samples.

技术 RUN_REQUIRED · 听审 NOT_LISTENED · 声画 NOT_RUN · 用户 NOT_RUN

Technical checks are per-output receipts. No listening, pleasantness, reference-match or film acceptance is asserted.
