# 非谐波共振点声

由 [asset.json](asset.json) 生成；修改事实后同步本页，不建立第二套事实。

ID: resonant-tap · version 1 · sfx / impact · candidate

## 意图与使用

以短非谐波余韵标记立体表面/图形面的切换，不把每次切换都做低频撞击。

适用：有明确结构或表面变化的动作节点；可以是抽象配合，不声称真实金属碰撞。

反例：成功提示、和声收束、角色动作未发生、连续快速镜头或需要实录材质。

混音：固定 recipe：420/913/1647Hz；相对幅度0.8/0.35/0.15；衰减12/16/24每秒；总幅度0.3；3ms端点保护；无随机数，seed不适用。须试听余韵是否遮蔽旋律。

情绪意图：tactile, restrained

## 来源与调用

[文件或生成器](../../../synth.py) · recipe: resonant-tap · MotionStudio contributors

Original bounded procedural synthesis; no recordings, samples, borrowed melody or brand audio. Parameters and deterministic seed are stated in mix_notes. This standard-library recipe is a portable derivation, not a byte-identical copy of an earlier numerical-library draft.

0.48s · PCM16 stereo 48kHz · one-shot。时长依据：recipe。

从库根调用：`python3 sound.py render --id resonant-tap --output /authorized/new-output`；私有库加 `--library /authorized/library`。输出必须在源码/输入库外且不存在。

## 权利与验收

[许可](../../../LICENSE)：MIT；使用 allowed；独立分发 allowed。

Retain the MIT copyright and permission notice with the source and generated asset redistribution. No trademark, voice or endorsement rights implied.

Original source and synthesis without third-party samples.

技术 RUN_REQUIRED · 听审 NOT_LISTENED · 声画 NOT_RUN · 用户 NOT_RUN

NOT_LISTENED: no timbre, pleasantness, material realism, mix suitability, seam or owner approval. Render receipts and Audio Core checks only establish technical execution. Do not classify it as accepted because an authored cue consumed it.
