# 轻短电脑键盘

由 [asset.json](asset.json) 生成；修改事实后同步本页，不建立第二套事实。

ID: keyboard-soft · version 1 · sfx / ui-feedback · candidate

## 意图与使用

面向现代软件界面的轻短电脑键盘方向候选，以快速衰减的带限噪声支持真实发生的键入；不是打字机、状态提示音或特定键盘实录。现代感与自然感仅为待听审目标。

适用：实际文字输入、空格、换行或明确键按下；先用同一帧事件表驱动画面和音频，再显式选普通键0/1、空格键2、回车键3及每次增益。具体音色与节奏仍须在整段合听。

反例：占位符、光标闪烁、静态字幕、确认成功、打字机/复古机械场景、要求某硬件真实录音或没有输入事件时。不得因字符出现就推断输入法的全部物理击键。

混音：固定40ms、48kHz立体声同值。LCG 1664525/1013904223/2^32产生[-1,1)噪声；upper/lower单极低通之差为按压，另一路body单极低通为键体。0.8ms起音；按压与键体分别exp(-k*t)衰减；延迟释键0.7ms起音后exp(-330*t)；末3ms淡出且末样本为零。无正弦振子、金属共振、混响、铃声、滑音或回车滚筒声。有限variant 0/1=普通键、2=较宽空格键、3=回车键，参数(seed,upper Hz,lower Hz,body Hz,press k,body k,release s,press gain,body gain,release gain)分别为(104729,4200,1150,780,235,200,.012,.23,.23,.031)、(130363,3900,1050,820,250,210,.011,.22,.24,.029)、(155921,3300,900,490,185,155,.014,.19,.33,.036)、(196613,3900,1100,620,205,175,.013,.24,.29,.033)。只提供4个显式候选，不自动轮换、映射字符或改变cue/增益；语义角色是作者约定而不是硬件建模。停顿留静默，回车不代替提交成功声。

情绪意图：dry, restrained, modern-intent

## 来源与调用

[文件或生成器](../../../synth.py) · recipe: keyboard-soft · MotionStudio contributors

Original bounded procedural noise synthesis; no recordings, third-party samples, brand sounds or borrowed melody. Four explicitly selected authored roles, not measured hardware or acoustic realism. All fixed seeds, filters and envelopes are stated in mix_notes; original keyboard-press variants remain unchanged.

0.04s · PCM16 stereo 48kHz · one-shot。时长依据：recipe。

从库根调用：`python3 sound.py render --id keyboard-soft --output /authorized/new-output`；私有库加 `--library /authorized/library`。输出必须在源码/输入库外且不存在。

## 权利与验收

[许可](../../../LICENSE)：MIT；使用 allowed；独立分发 allowed。

Retain the MIT copyright and permission notice with the source and generated asset redistribution. No trademark, voice or endorsement rights implied.

Original source and synthesis without third-party samples.

技术 RUN_REQUIRED · 听审 NOT_LISTENED · 声画 NOT_RUN · 用户 NOT_RUN

NOT_LISTENED: modern-computer-keyboard character, physical realism, perceptual variant distinction, fatigue, mix suitability and user preference remain unverified. Deterministic samples, event coverage and encoded onset checks establish technical timing only, never listening or normal-speed A/V acceptance.
